"""The pipeline: ingest -> transcribe -> write metadata -> upload, one idempotent `tick` at a time.

Anything can trigger `tick` (Hermes cron, Windows Task Scheduler, a person). A lock file keeps
ticks from overlapping, and all state lives in SQLite, so a crashed or skipped tick loses nothing.
"""

from __future__ import annotations

import json
import logging
import shutil
import sys
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable, Iterator

import yaml

from . import metadata as metadata_mod
from . import scheduling, transcribe as transcribe_mod, uploader as uploader_mod
from .config import VIDEO_EXTENSIONS, Config
from .db import Job, Store, utcnow
from .notify import notify

log = logging.getLogger(__name__)

STABLE_AFTER = timedelta(seconds=30)  # ignore inbox files modified more recently (still copying)
LATE_GRACE = timedelta(hours=3)  # a slot missed by more than this is moved to the next free slot
PREPARE_PER_TICK = 2


class AlreadyRunning(RuntimeError):
    pass


@contextmanager
def single_instance(lock_path: Path) -> Iterator[None]:
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    fh = open(lock_path, "a+")
    try:
        if sys.platform == "win32":
            import msvcrt

            try:
                fh.seek(0)
                msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError as exc:
                raise AlreadyRunning("another ytauto tick is running") from exc
        else:
            import fcntl

            try:
                fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError as exc:
                raise AlreadyRunning("another ytauto tick is running") from exc
        yield
    finally:
        fh.close()  # closing the handle releases the lock on both platforms


def read_sidecar(video: Path) -> tuple[dict, Path | None]:
    for candidate in (video.with_suffix(".yaml"), video.with_suffix(".yml"), Path(f"{video}.yaml")):
        if candidate.exists():
            data = yaml.safe_load(candidate.read_text(encoding="utf-8")) or {}
            if not isinstance(data, dict):
                raise ValueError(f"{candidate.name} must be a mapping")
            return data, candidate
    return {}, None


class Pipeline:
    def __init__(
        self,
        cfg: Config,
        store: Store,
        *,
        now: Callable[[], datetime] = utcnow,
        transcriber: Callable = transcribe_mod.transcribe,
        writer: Callable = metadata_mod.generate,
        uploader: Callable = uploader_mod.upload,
    ):
        self.cfg = cfg
        self.store = store
        self.now = now
        self.transcriber = transcriber
        self.writer = writer
        self.uploader = uploader

    # ---- flags -----------------------------------------------------------------------------

    @property
    def needs_login_flag(self) -> Path:
        return self.cfg.root / "NEEDS_LOGIN"

    def set_needs_login(self, reason: str) -> None:
        first = not self.needs_login_flag.exists()
        self.needs_login_flag.write_text(reason, encoding="utf-8")
        if first:
            notify(self.cfg.notify, "YouTube needs you", f"{reason}\nUploads are paused. Run: ytauto login")

    def clear_needs_login(self) -> None:
        self.needs_login_flag.unlink(missing_ok=True)

    # ---- ingest ----------------------------------------------------------------------------

    def add(self, video: Path, *, publish_at: datetime | None = None, hints: dict | None = None,
            move: bool = False, metadata: dict | None = None, thumbnail: Path | None = None,
            hold: bool = False) -> Job:
        """Queue a video. With `metadata` (already written elsewhere, e.g. by tech-daily) the job skips
        transcription and describing and is ready to upload at its slot."""
        video = Path(video).resolve()
        if video.suffix.lower() not in VIDEO_EXTENSIONS:
            raise ValueError(f"not a supported video file: {video.name}")
        hints = dict(hints or {})
        sidecar_hints, sidecar = read_sidecar(video)
        hints = {**sidecar_hints, **hints}

        sidecar_when = hints.pop("publish_at", None)
        when = publish_at or sidecar_when
        if isinstance(when, datetime):
            when = (when if when.tzinfo else when.replace(tzinfo=self.cfg.tz)).astimezone(timezone.utc)
        elif when:
            when = scheduling.parse_when(str(when), self.cfg.tz)
        else:
            when = scheduling.next_free_slot(self.now(), self.cfg.publish, self.cfg.tz, self.store.taken_slots())

        job_id = Store.new_id(self.now())
        job_dir = self.cfg.path("work") / job_id
        job_dir.mkdir(parents=True, exist_ok=False)
        target = job_dir / video.name
        (shutil.move if move else shutil.copy2)(str(video), str(target))
        if sidecar is not None and move:
            shutil.move(str(sidecar), str(job_dir / sidecar.name))
        if thumbnail is not None:
            thumb = Path(thumbnail)
            shutil.copy2(str(thumb), str(job_dir / f"thumbnail{thumb.suffix.lower()}"))
            hints["thumbnail"] = f"thumbnail{thumb.suffix.lower()}"
        if metadata is not None:
            meta = metadata_mod.fit_limits(metadata)
            (job_dir / "metadata.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

        approved = not (hold or self.cfg.publish.get("require_approval", False))
        job = self.store.insert(job_id, video.name, str(target), when, hints, approved)
        if metadata is not None:
            job = self.store.update(job.id, status="ready", log=f"metadata supplied: {metadata['title']}")
        log.info("job %s: %s, publish at %s", job.id, video.name, self.fmt(when))
        return job

    def ingest(self) -> list[Job]:
        inbox = self.cfg.path("inbox")
        jobs = []
        cutoff = datetime.now().timestamp() - STABLE_AFTER.total_seconds()
        for f in sorted(inbox.iterdir()):
            if not f.is_file() or f.suffix.lower() not in VIDEO_EXTENSIONS:
                continue
            if f.stat().st_mtime > cutoff:
                continue  # probably still being copied in
            try:
                jobs.append(self.add(f, move=True))
            except Exception as exc:  # noqa: BLE001 - one bad file must not block the rest
                log.error("could not ingest %s: %s", f.name, exc)
        return jobs

    # ---- stages ----------------------------------------------------------------------------

    def _retry_or_fail(self, job: Job, stage: str, exc: Exception, permanent: bool = False) -> Job:
        attempts = job.attempts + 1
        max_attempts = int(self.cfg.retry["max_attempts"])
        msg = f"{stage} failed (attempt {attempts}/{max_attempts}): {exc}"
        log.error("job %s: %s", job.id, msg)
        if permanent or attempts >= max_attempts:
            job = self.store.update(job.id, status="failed", attempts=attempts, last_error=msg, log=msg)
            notify(self.cfg.notify, "YouTube upload failed",
                   f"{job.source_name}\n{msg}\nFix it, then run: ytauto retry {job.id}")
            return job
        backoff = self.cfg.retry["backoff_minutes"]
        wait = timedelta(minutes=float(backoff[min(attempts - 1, len(backoff) - 1)]))
        return self.store.update(job.id, attempts=attempts, last_error=msg,
                                 next_attempt_at=self.now() + wait, log=msg)

    def _due(self, job: Job) -> bool:
        return job.next_attempt_at is None or job.next_attempt_at <= self.now()

    def transcript_for(self, job: Job) -> dict | None:
        path = job.work_dir / "transcript.json"
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None

    def prepare(self, job: Job) -> Job:
        """Run whichever of transcription and metadata writing this job still needs."""
        if job.status == "queued":
            if self.cfg.transcription.get("enabled", True):
                try:
                    self.transcriber(Path(job.video_path), job.work_dir, self.cfg.transcription)
                except transcribe_mod.TranscriptionUnavailable as exc:
                    return self._retry_or_fail(job, "transcription", exc, permanent=True)
                except Exception as exc:  # noqa: BLE001
                    return self._retry_or_fail(job, "transcription", exc)
            job = self.store.update(job.id, status="transcribed", attempts=0, next_attempt_at=None,
                                    last_error=None, log="transcribed")

        if job.status == "transcribed":
            try:
                meta = self.writer(job.source_name, job.hints, self.transcript_for(job), self.cfg.metadata,
                                   job.work_dir)
            except Exception as exc:  # noqa: BLE001
                return self._retry_or_fail(job, "metadata", exc)
            job = self.store.update(job.id, status="ready", attempts=0, next_attempt_at=None, last_error=None,
                                    log=f"metadata ready: {meta['title']}")
            if not job.approved:
                notify(self.cfg.notify, "Video waiting for approval",
                       f"{meta['title']}\nPublishes {self.fmt(job.publish_at)}\nApprove: ytauto approve {job.id}")
        return job

    def _reslot_if_missed(self, job: Job) -> Job:
        now = self.now()
        if job.publish_at and now - job.publish_at > LATE_GRACE:
            taken = self.store.taken_slots() - {job.publish_at}
            new_at = scheduling.next_free_slot(now, self.cfg.publish, self.cfg.tz, taken)
            msg = f"missed slot {self.fmt(job.publish_at)}; moved to {self.fmt(new_at)}"
            job = self.store.update(job.id, publish_at=new_at, log=msg)
            notify(self.cfg.notify, "YouTube slot moved", f"{job.source_name}\n{msg}")
        return job

    def upload_job(self, job: Job, *, draft: bool = False, resume_draft: bool = False) -> Job:
        meta_path = job.work_dir / "metadata.json"
        if not meta_path.exists():
            raise RuntimeError(f"job {job.id} has no metadata.json yet")
        meta = json.loads(meta_path.read_text(encoding="utf-8"))  # re-read: you may have edited it

        now = self.now()
        visibility = str(job.hints.get("visibility") or self.cfg.publish["visibility"]).lower()
        made_for_kids = bool(job.hints.get("made_for_kids", self.cfg.publish["made_for_kids"]))
        schedule_at = None
        if draft:
            visibility = "private"
        elif visibility == "public" and scheduling.schedule_on_youtube(now, job.publish_at, self.cfg.publish):
            schedule_at = job.publish_at

        job = self.store.update(job.id, status="uploading", log=(
            "uploading as private draft" if draft else
            f"uploading, scheduled for {self.fmt(schedule_at)}" if schedule_at else f"uploading as {visibility}"))
        thumb = job.hints.get("thumbnail")
        warnings: list[str] = []
        try:
            url = self.uploader(
                Path(job.video_path), meta,
                cfg=self.cfg.uploader, profile_dir=self.cfg.path("browser_profile"), tz=self.cfg.tz,
                visibility=visibility, made_for_kids=made_for_kids, schedule_at=schedule_at,
                shots_dir=job.work_dir,
                thumbnail=(job.work_dir / thumb) if thumb else None,
                altered_content=bool(job.hints.get("altered_content")),
                warnings=warnings,
                **({"draft_title": meta["title"]} if resume_draft else {}),
            )
        except uploader_mod.NeedsLogin as exc:
            self.set_needs_login(str(exc))
            return self.store.update(job.id, status="ready", log=f"upload paused: {exc}")
        except Exception as exc:  # noqa: BLE001
            job = self.store.update(job.id, status="ready")
            return self._retry_or_fail(job, "upload", exc)

        when = "as a private draft" if draft else (
            f"scheduled for {self.fmt(schedule_at)}" if schedule_at else f"published ({visibility})")
        job = self.store.update(job.id, status="done", video_url=url, attempts=0, last_error=None,
                                next_attempt_at=None, log=f"uploaded {when}: {url}")
        for warning in warnings:
            self.store.log(job.id, "done", f"warning: {warning}")
        notify(self.cfg.notify, "YouTube upload done", "\n".join(
            [meta["title"], when, url] + [f"Check in Studio: {w}" for w in warnings]))
        return job

    def _upload_eligible(self, job: Job) -> bool:
        if job.status != "ready" or not job.approved or not self._due(job) or job.publish_at is None:
            return False
        publish_cfg = dict(self.cfg.publish)
        visibility = str(job.hints.get("visibility") or publish_cfg["visibility"]).lower()
        if visibility != "public":
            publish_cfg["mode"] = "at_slot"  # Studio can only schedule public videos
        return scheduling.upload_window_open(self.now(), job.publish_at, publish_cfg)

    # ---- tick ------------------------------------------------------------------------------

    def recover_interrupted(self) -> None:
        for job in self.store.list(("uploading",)):
            msg = ("previous upload was interrupted; check YouTube Studio for a leftover draft, "
                   "delete it, then run `ytauto retry`")
            self.store.update(job.id, status="failed", last_error=msg, log=msg)
            notify(self.cfg.notify, "YouTube upload interrupted", f"{job.source_name}\n{msg} {job.id}")

    def tick(self) -> list[str]:
        """One pass: ingest new files, prepare the soonest jobs, upload at most one due video."""
        summary: list[str] = []
        self.recover_interrupted()

        for job in self.ingest():
            summary.append(f"queued {job.source_name} for {self.fmt(job.publish_at)} [{job.id}]")

        pending = [j for j in self.store.list(("queued", "transcribed")) if self._due(j)]
        for job in pending[:PREPARE_PER_TICK]:
            job = self.prepare(job)
            summary.append(f"{job.status}: {job.source_name} [{job.id}]")

        if self.needs_login_flag.exists():
            summary.append("uploads paused: run `ytauto login`")
            return summary

        for job in self.store.list(("ready",)):
            job = self._reslot_if_missed(job)
            if self._upload_eligible(job):
                job = self.upload_job(job)
                summary.append(f"{job.status}: {job.source_name} {job.video_url or job.last_error or ''}".strip())
                break  # one browser session per tick keeps ticks short and predictable
        return summary

    # ---- display ---------------------------------------------------------------------------

    def fmt(self, dt: datetime | None) -> str:
        return dt.astimezone(self.cfg.tz).strftime("%a %d %b %Y %H:%M %Z") if dt else "-"


def lock_path(cfg: Config) -> Path:
    return cfg.root / ".ytauto.lock"
