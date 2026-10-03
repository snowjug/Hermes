"""SQLite job store. One row per video; an append-only events table is the audit log.

Job lifecycle:

    queued -> transcribed -> ready -> uploading -> done
    (a ready job waits there while approved = 0)
    any stage -> failed   (after retry.max_attempts; `ytauto retry` puts it back)
    any stage -> cancelled
"""

from __future__ import annotations

import json
import secrets
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

ACTIVE_STATUSES = ("queued", "transcribed", "ready", "uploading")

SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    id              TEXT PRIMARY KEY,
    source_name     TEXT NOT NULL,
    video_path      TEXT NOT NULL,
    status          TEXT NOT NULL,
    publish_at      TEXT,              -- UTC ISO-8601
    hints_json      TEXT NOT NULL DEFAULT '{}',
    approved        INTEGER NOT NULL DEFAULT 0,
    attempts        INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TEXT,              -- UTC ISO-8601; NULL = now
    last_error      TEXT,
    video_url       TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id  TEXT NOT NULL,
    ts      TEXT NOT NULL,
    status  TEXT NOT NULL,
    message TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_events_job ON events(job_id);
"""


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def to_iso(dt: datetime | None) -> str | None:
    return dt.astimezone(timezone.utc).isoformat() if dt else None


def from_iso(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


@dataclass
class Job:
    id: str
    source_name: str
    video_path: str
    status: str
    publish_at: datetime | None
    hints: dict[str, Any]
    approved: bool
    attempts: int
    next_attempt_at: datetime | None
    last_error: str | None
    video_url: str | None
    created_at: datetime
    updated_at: datetime

    @property
    def work_dir(self) -> Path:
        return Path(self.video_path).parent

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "Job":
        return cls(
            id=row["id"],
            source_name=row["source_name"],
            video_path=row["video_path"],
            status=row["status"],
            publish_at=from_iso(row["publish_at"]),
            hints=json.loads(row["hints_json"] or "{}"),
            approved=bool(row["approved"]),
            attempts=row["attempts"],
            next_attempt_at=from_iso(row["next_attempt_at"]),
            last_error=row["last_error"],
            video_url=row["video_url"],
            created_at=from_iso(row["created_at"]),
            updated_at=from_iso(row["updated_at"]),
        )


class Store:
    def __init__(self, path: Path):
        self.path = path
        self.conn = sqlite3.connect(path, timeout=30)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.executescript(SCHEMA)

    def close(self) -> None:
        self.conn.close()

    @contextmanager
    def tx(self) -> Iterator[sqlite3.Connection]:
        with self.conn:
            yield self.conn

    @staticmethod
    def new_id(now: datetime | None = None) -> str:
        return f"{(now or utcnow()).strftime('%Y%m%d')}-{secrets.token_hex(3)}"

    def insert(self, job_id: str, source_name: str, video_path: str, publish_at: datetime | None,
               hints: dict[str, Any], approved: bool) -> Job:
        now = to_iso(utcnow())
        with self.tx() as c:
            c.execute(
                "INSERT INTO jobs (id, source_name, video_path, status, publish_at, hints_json, approved,"
                " created_at, updated_at) VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?)",
                (job_id, source_name, video_path, to_iso(publish_at), json.dumps(hints), int(approved), now, now),
            )
        self.log(job_id, "queued", f"ingested {source_name}")
        return self.get(job_id)

    def get(self, job_id: str) -> Job:
        row = self.conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if row is None:
            # Allow unambiguous prefixes, e.g. the random suffix alone.
            rows = self.conn.execute(
                "SELECT * FROM jobs WHERE id LIKE ? OR id LIKE ?", (f"{job_id}%", f"%-{job_id}%")
            ).fetchall()
            if len(rows) != 1:
                raise KeyError(f"no unique job matches {job_id!r}")
            row = rows[0]
        return Job.from_row(row)

    def list(self, statuses: tuple[str, ...] | None = None) -> list[Job]:
        if statuses:
            marks = ",".join("?" * len(statuses))
            rows = self.conn.execute(
                f"SELECT * FROM jobs WHERE status IN ({marks}) ORDER BY publish_at, created_at", statuses
            ).fetchall()
        else:
            rows = self.conn.execute("SELECT * FROM jobs ORDER BY publish_at, created_at").fetchall()
        return [Job.from_row(r) for r in rows]

    def taken_slots(self) -> set[datetime]:
        rows = self.conn.execute(
            "SELECT publish_at FROM jobs WHERE publish_at IS NOT NULL AND status NOT IN ('failed', 'cancelled')"
        ).fetchall()
        return {from_iso(r["publish_at"]) for r in rows}

    def update(self, job_id: str, *, log: str | None = None, **fields: Any) -> Job:
        if "publish_at" in fields:
            fields["publish_at"] = to_iso(fields["publish_at"])
        if "next_attempt_at" in fields:
            fields["next_attempt_at"] = to_iso(fields["next_attempt_at"])
        if "hints" in fields:
            fields["hints_json"] = json.dumps(fields.pop("hints"))
        if "approved" in fields:
            fields["approved"] = int(fields["approved"])
        fields["updated_at"] = to_iso(utcnow())
        cols = ", ".join(f"{k} = ?" for k in fields)
        with self.tx() as c:
            c.execute(f"UPDATE jobs SET {cols} WHERE id = ?", (*fields.values(), job_id))
        job = self.get(job_id)
        if log:
            self.log(job_id, job.status, log)
        return job

    def log(self, job_id: str, status: str, message: str) -> None:
        with self.tx() as c:
            c.execute(
                "INSERT INTO events (job_id, ts, status, message) VALUES (?, ?, ?, ?)",
                (job_id, to_iso(utcnow()), status, message),
            )

    def events(self, job_id: str) -> list[sqlite3.Row]:
        return self.conn.execute("SELECT * FROM events WHERE job_id = ? ORDER BY id", (job_id,)).fetchall()
