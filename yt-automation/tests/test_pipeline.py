import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
import yaml

from ytauto import uploader as uploader_mod
from ytauto.config import load_config
from ytauto.db import Store
from ytauto.pipeline import Pipeline

IST = ZoneInfo("Asia/Kolkata")


class Clock:
    def __init__(self, dt):
        self.dt = dt

    def __call__(self):
        return self.dt


def make(tmp_path: Path, clock: Clock, uploader=None, **publish):
    cfg_data = {
        "timezone": "Asia/Kolkata",
        "publish": {"slots": ["18:00"], "min_lead_minutes": 60, "upload_ahead_hours": 24, **publish},
        "retry": {"max_attempts": 2, "backoff_minutes": [10]},
    }
    (tmp_path / "config.yaml").write_text(yaml.safe_dump(cfg_data))
    cfg = load_config(tmp_path / "config.yaml")
    cfg.ensure_dirs()
    calls = {"transcribe": 0, "write": 0, "upload": []}

    def transcriber(video, out_dir, _cfg):
        calls["transcribe"] += 1
        data = {"language": "en", "duration": 120, "segments": [{"start": 0, "end": 2, "text": "hi"}]}
        (out_dir / "transcript.json").write_text(json.dumps(data))

    def writer(source_name, hints, transcript, _cfg, work_dir):
        calls["write"] += 1
        meta = {"title": f"Title for {source_name}", "description": "d", "tags": [], "hashtags": [], "chapters": []}
        (work_dir / "metadata.json").write_text(json.dumps(meta))
        return meta

    def default_uploader(video, meta, **kw):
        calls["upload"].append(kw)
        return "https://youtu.be/abc"

    p = Pipeline(cfg, Store(cfg.db_path), now=clock, transcriber=transcriber, writer=writer,
                 uploader=uploader or default_uploader)
    return p, calls


def drop(p: Pipeline, name: str, sidecar: dict | None = None) -> Path:
    f = p.cfg.path("inbox") / name
    f.write_bytes(b"\x00" * 10)
    old = time.time() - 120
    os.utime(f, (old, old))
    if sidecar is not None:
        f.with_suffix(".yaml").write_text(yaml.safe_dump(sidecar))
    return f


def test_full_flow_schedules_on_youtube(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 10, 0, tzinfo=IST).astimezone(timezone.utc))
    p, calls = make(tmp_path, clock)
    drop(p, "vlog.mp4")

    summary = p.tick()
    job = p.store.list()[0]
    assert calls["transcribe"] == 1 and calls["write"] == 1
    assert job.publish_at == datetime(2026, 9, 28, 18, 0, tzinfo=IST).astimezone(timezone.utc)
    # within the 24h upload-ahead window, so it uploads on the same tick with a YouTube schedule
    assert calls["upload"][0]["schedule_at"] == job.publish_at
    assert job.status == "done" and job.video_url == "https://youtu.be/abc"
    assert any("vlog.mp4" in line for line in summary)
    assert not (p.cfg.path("inbox") / "vlog.mp4").exists()


def test_sidecar_sets_time_and_hints(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 10, 0, tzinfo=IST).astimezone(timezone.utc))
    p, calls = make(tmp_path, clock)
    drop(p, "talk.mp4", {"publish_at": "2026-10-05 07:15", "notes": "conference talk", "visibility": "unlisted"})
    p.tick()
    job = p.store.list()[0]
    assert job.publish_at == datetime(2026, 10, 5, 7, 15, tzinfo=IST).astimezone(timezone.utc)
    assert job.hints == {"notes": "conference talk", "visibility": "unlisted"}
    assert (job.work_dir / "talk.yaml").exists()
    assert calls["upload"] == []  # unlisted cannot be scheduled in Studio, so it waits for the slot

    clock.dt = job.publish_at
    p.tick()
    assert calls["upload"][0]["schedule_at"] is None and calls["upload"][0]["visibility"] == "unlisted"


def test_slots_are_not_double_booked(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 10, 0, tzinfo=IST).astimezone(timezone.utc))
    p, _ = make(tmp_path, clock, upload_ahead_hours=0.1)
    for name in ("a.mp4", "b.mp4", "c.mp4"):
        drop(p, name)
    p.ingest()
    days = sorted(j.publish_at.astimezone(IST).day for j in p.store.list())
    assert days == [28, 29, 30]


def test_upload_failure_retries_then_fails(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 17, 0, tzinfo=IST).astimezone(timezone.utc))

    def broken(*a, **kw):
        raise uploader_mod.UploadError("selector missing")

    p, _ = make(tmp_path, clock, uploader=broken, min_lead_minutes=30)
    drop(p, "x.mp4")
    p.tick()
    job = p.store.list()[0]
    assert job.status == "ready" and job.attempts == 1 and job.next_attempt_at > clock.dt

    p.tick()  # backoff not elapsed: no new attempt
    assert p.store.get(job.id).attempts == 1

    clock.dt += timedelta(minutes=11)
    p.tick()
    assert p.store.get(job.id).status == "failed"


def test_needs_login_pauses_without_burning_attempts(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 17, 0, tzinfo=IST).astimezone(timezone.utc))

    def signed_out(*a, **kw):
        raise uploader_mod.NeedsLogin("signed out")

    p, _ = make(tmp_path, clock, uploader=signed_out, min_lead_minutes=30)
    drop(p, "x.mp4")
    p.tick()
    job = p.store.list()[0]
    assert job.status == "ready" and job.attempts == 0
    assert p.needs_login_flag.exists()
    assert "uploads paused" in " ".join(p.tick())


def test_missed_slot_moves_to_next_free_slot(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 10, 0, tzinfo=IST).astimezone(timezone.utc))
    p, calls = make(tmp_path, clock, upload_ahead_hours=0.1, mode="at_slot")
    drop(p, "x.mp4")
    p.tick()
    job = p.store.list()[0]
    clock.dt = job.publish_at + timedelta(hours=5)  # PC was off through the slot
    p.tick()
    moved = p.store.get(job.id)
    assert moved.publish_at == datetime(2026, 9, 29, 18, 0, tzinfo=IST).astimezone(timezone.utc)
    assert calls["upload"] == []


def test_interrupted_upload_is_flagged_not_repeated(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 10, 0, tzinfo=IST).astimezone(timezone.utc))
    p, calls = make(tmp_path, clock, upload_ahead_hours=0.1)
    drop(p, "x.mp4")
    p.tick()
    job = p.store.list()[0]
    p.store.update(job.id, status="uploading")
    p.tick()
    assert p.store.get(job.id).status == "failed"
    assert calls["upload"] == []


def test_approval_gate(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 17, 0, tzinfo=IST).astimezone(timezone.utc))
    p, calls = make(tmp_path, clock, require_approval=True, min_lead_minutes=30)
    drop(p, "x.mp4")
    p.tick()
    job = p.store.list()[0]
    assert job.status == "ready" and calls["upload"] == []
    p.store.update(job.id, approved=True)
    p.tick()
    assert p.store.get(job.id).status == "done"


def test_supplied_metadata_skips_prep_and_passes_extras(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 10, 0, tzinfo=IST).astimezone(timezone.utc))
    p, calls = make(tmp_path, clock)
    video = tmp_path / "episode.mp4"
    video.write_bytes(b"\x00" * 10)
    thumb = tmp_path / "thumb.png"
    thumb.write_bytes(b"png")
    meta = {"title": "T" * 150, "description": "Body <b>", "tags": ["a", "a", "b"]}
    job = p.add(video, metadata=meta, thumbnail=thumb, hints={"altered_content": True})
    assert job.status == "ready"
    saved = json.loads((job.work_dir / "metadata.json").read_text())
    assert len(saved["title"]) <= 100 and saved["description"] == "Body b" and saved["tags"] == ["a", "b"]

    p.tick()
    assert calls["transcribe"] == 0 and calls["write"] == 0
    kw = calls["upload"][0]
    assert kw["thumbnail"] == job.work_dir / "thumbnail.png" and kw["altered_content"] is True


def test_hold_waits_for_approval(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 17, 0, tzinfo=IST).astimezone(timezone.utc))
    p, calls = make(tmp_path, clock, min_lead_minutes=30)
    video = tmp_path / "episode.mp4"
    video.write_bytes(b"\x00" * 10)
    p.add(video, metadata={"title": "x", "description": "y", "tags": []}, hold=True)
    p.tick()
    assert calls["upload"] == []


def test_bad_job_reference(tmp_path):
    clock = Clock(datetime(2026, 9, 28, 10, 0, tzinfo=timezone.utc))
    p, _ = make(tmp_path, clock)
    with pytest.raises(KeyError):
        p.store.get("nope")
