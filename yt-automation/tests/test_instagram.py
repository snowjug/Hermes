import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

from ytauto import uploader as uploader_mod
from ytauto.config import load_config
from ytauto.db import Store
from ytauto.instagram import build_caption
from ytauto.pipeline import Pipeline

IST = ZoneInfo("Asia/Kolkata")
META = {
    "title": "POV: The Presentation Is Due Tomorrow",
    "description": ("POV: the presentation is due tomorrow. PPT Master turns your PDF into a real PowerPoint.\n\n"
                    "Full breakdown: https://youtu.be/abc\nSource: https://github.com/hugohe3/ppt-master\n"
                    "AI voice, AI music.\n\n#PowerPoint #AI #Shorts"),
    "tags": ["ppt"],
}


class Clock:
    def __init__(self, dt):
        self.dt = dt

    def __call__(self):
        return self.dt


def make(tmp_path: Path, clock: Clock, poster):
    cfg_data = {"timezone": "Asia/Kolkata", "retry": {"max_attempts": 2, "backoff_minutes": [10]},
                "instagram": {"username": "tooladay"}}
    (tmp_path / "config.yaml").write_text(yaml.safe_dump(cfg_data))
    cfg = load_config(tmp_path / "config.yaml")
    cfg.ensure_dirs()

    def uploader(video, meta, **kw):
        return "https://youtube.com/shorts/abc"

    return Pipeline(cfg, Store(cfg.db_path), now=clock, uploader=uploader, reel_poster=poster)


def add_short(p: Pipeline, tmp_path: Path, when: datetime):
    video = tmp_path / "short.mp4"
    video.write_bytes(b"\x00" * 10)
    return p.add(video, publish_at=when, metadata=META, hints={"altered_content": True}, instagram=True)


def test_caption_drops_links_and_keeps_five_hashtags():
    meta = dict(META, description=META["description"] + " #a #b #c #d")
    caption = build_caption(meta)
    assert caption.startswith("POV: The Presentation Is Due Tomorrow\n\nPOV: the presentation is due tomorrow.")
    assert "http" not in caption and "Full breakdown" not in caption
    assert caption.endswith("#PowerPoint #AI #reels #a #b")


def test_caption_from_metadata_wins():
    assert build_caption(dict(META, instagram_caption="  Own words #x ")) == "Own words #x"


def test_reel_posts_at_publish_time_not_before(tmp_path):
    slot = datetime(2026, 10, 12, 19, 0, tzinfo=IST).astimezone(timezone.utc)
    clock = Clock(slot - timedelta(hours=2))
    calls = []

    def poster(video, caption, **kw):
        calls.append((caption, kw))
        return "https://www.instagram.com/reel/XYZ/"

    p = make(tmp_path, clock, poster)
    job = add_short(p, tmp_path, slot)
    assert p.store.reel(job.id).status == "pending"
    p.tick()  # uploads to YouTube (schedule window open) but the Reel waits for the slot
    assert calls == [] and p.store.get(job.id).status == "done"
    clock.dt = slot + timedelta(minutes=4)
    p.tick()
    reel = p.store.reel(job.id)
    assert reel.status == "done" and reel.url == "https://www.instagram.com/reel/XYZ/"
    caption, kw = calls[0]
    assert caption == (job.work_dir / "instagram_caption.txt").read_text(encoding="utf-8").strip()
    assert kw["ai_label"] is True and kw["dry_run"] is False
    p.tick()
    assert len(calls) == 1  # posted once


def test_reel_retries_then_fails(tmp_path):
    slot = datetime(2026, 10, 12, 19, 0, tzinfo=IST).astimezone(timezone.utc)
    clock = Clock(slot + timedelta(minutes=1))

    def poster(video, caption, **kw):
        raise uploader_mod.UploadError("step 'ig-share' failed")

    p = make(tmp_path, clock, poster)
    job = add_short(p, tmp_path, slot)
    p.store.update(job.id, status="done")  # YouTube side already uploaded
    p.tick()
    reel = p.store.reel(job.id)
    assert reel.status == "pending" and reel.attempts == 1 and reel.next_attempt_at == clock.dt + timedelta(minutes=10)
    p.tick()  # backing off
    assert p.store.reel(job.id).attempts == 1
    clock.dt += timedelta(minutes=11)
    p.tick()
    assert p.store.reel(job.id).status == "failed"


def test_signed_out_pauses_reels_only(tmp_path):
    slot = datetime(2026, 10, 12, 19, 0, tzinfo=IST).astimezone(timezone.utc)
    clock = Clock(slot + timedelta(minutes=1))

    def poster(video, caption, **kw):
        raise uploader_mod.NeedsLogin("Instagram is signed out")

    p = make(tmp_path, clock, poster)
    job = add_short(p, tmp_path, slot)
    p.store.update(job.id, status="done")
    p.tick()
    assert p.needs_ig_login_flag.exists() and not p.needs_login_flag.exists()
    assert p.store.reel(job.id).status == "pending"
    assert "Reels paused: run `ytauto ig-login`" in p.tick()


def test_interrupted_reel_is_not_reposted(tmp_path):
    slot = datetime(2026, 10, 12, 19, 0, tzinfo=IST).astimezone(timezone.utc)
    calls = []
    p = make(tmp_path, Clock(slot + timedelta(minutes=1)), lambda *a, **k: calls.append(a) or "u")
    job = add_short(p, tmp_path, slot)
    p.store.update(job.id, status="done")
    p.store.set_reel(job.id, status="posting")
    p.tick()
    assert p.store.reel(job.id).status == "failed" and calls == []


def test_dry_run_changes_nothing(tmp_path):
    slot = datetime(2026, 10, 12, 19, 0, tzinfo=IST).astimezone(timezone.utc)
    seen = {}

    def poster(video, caption, **kw):
        seen.update(kw)
        return "dry-run"

    p = make(tmp_path, Clock(slot - timedelta(days=1)), poster)
    job = add_short(p, tmp_path, slot)
    p.post_reel(job, dry_run=True)
    assert seen["dry_run"] is True and p.store.reel(job.id).status == "pending"
    assert json.loads((job.work_dir / "metadata.json").read_text())["title"] == META["title"]
