"""Load config.yaml, fill defaults, and resolve paths relative to the project root."""

from __future__ import annotations

import copy
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import yaml

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DEFAULTS: dict[str, Any] = {
    "paths": {
        "inbox": "inbox",
        "work": "work",
        "logs": "logs",
        "browser_profile": "browser-profile",
    },
    "timezone": "UTC",
    "publish": {
        "mode": "youtube_schedule",
        "slots": ["18:00"],
        "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        "min_lead_minutes": 60,
        "upload_ahead_hours": 48,
        "visibility": "public",
        "made_for_kids": False,
        "require_approval": False,
    },
    "transcription": {
        "enabled": True,
        "model": "small",
        "language": None,
        "device": "cpu",
        "compute_type": "int8",
    },
    "metadata": {
        "claude_path": None,
        "model": "sonnet",
        "max_budget_usd": 0.5,
        "language": "English",
        "channel": "",
        "style": "",
        "default_tags": [],
        "footer": "",
    },
    "uploader": {
        "studio_url": "https://www.youtube.com/upload",
        "browser_channel": "chrome",
        "headless": False,
        "slow_mo_ms": 120,
        "step_timeout_seconds": 90,
        "upload_timeout_minutes": 90,
    },
    "retry": {"max_attempts": 3, "backoff_minutes": [10, 60, 240]},
    "notify": {"hermes_target": None},
}

VALID_MODES = {"youtube_schedule", "at_slot"}
VALID_VISIBILITY = {"public", "unlisted", "private"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".wmv", ".flv", ".mpeg", ".mpg"}


def _merge(base: dict, override: dict) -> dict:
    out = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _merge(out[key], value)
        else:
            out[key] = value
    return out


@dataclass
class Config:
    raw: dict[str, Any]
    root: Path

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.raw["timezone"])

    def path(self, name: str) -> Path:
        p = Path(self.raw["paths"][name])
        return p if p.is_absolute() else (self.root / p)

    @property
    def db_path(self) -> Path:
        return self.root / "state.db"

    @property
    def publish(self) -> dict[str, Any]:
        return self.raw["publish"]

    @property
    def transcription(self) -> dict[str, Any]:
        return self.raw["transcription"]

    @property
    def metadata(self) -> dict[str, Any]:
        return self.raw["metadata"]

    @property
    def uploader(self) -> dict[str, Any]:
        return self.raw["uploader"]

    @property
    def retry(self) -> dict[str, Any]:
        return self.raw["retry"]

    @property
    def notify(self) -> dict[str, Any]:
        return self.raw["notify"]

    def ensure_dirs(self) -> None:
        for name in ("inbox", "work", "logs", "browser_profile"):
            self.path(name).mkdir(parents=True, exist_ok=True)


def load_config(path: str | os.PathLike | None = None) -> Config:
    cfg_path = Path(path or os.environ.get("YTAUTO_CONFIG") or PROJECT_ROOT / "config.yaml").resolve()
    user = {}
    if cfg_path.exists():
        user = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    raw = _merge(DEFAULTS, user)

    mode = raw["publish"]["mode"]
    if mode not in VALID_MODES:
        raise ValueError(f"publish.mode must be one of {sorted(VALID_MODES)}, got {mode!r}")
    if raw["publish"]["visibility"] not in VALID_VISIBILITY:
        raise ValueError(f"publish.visibility must be one of {sorted(VALID_VISIBILITY)}")
    ZoneInfo(raw["timezone"])  # fail fast on a bad zone name
    return Config(raw=raw, root=cfg_path.parent)
