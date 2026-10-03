"""Config loading and the process environment every external tool runs with."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import yaml

ROOT = Path(__file__).resolve().parent.parent


@dataclass
class Config:
    raw: dict[str, Any]
    root: Path

    def __getitem__(self, key: str) -> Any:
        return self.raw[key]

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.raw.get("timezone", "UTC"))

    @property
    def episodes_dir(self) -> Path:
        return self.root / "episodes"

    @property
    def skills_dir(self) -> Path:
        return self.root / ".claude" / "skills"

    @property
    def ytauto_exe(self) -> Path:
        return (self.root / self.raw["ytauto"]["exe"]).resolve()

    def env(self) -> dict[str, str]:
        """Environment for npx/node/claude: venv Python (Kokoro) and FFmpeg first on PATH, telemetry off."""
        env = dict(os.environ)
        venv_scripts = self.root / ".venv" / ("Scripts" if os.name == "nt" else "bin")
        extra = [str(venv_scripts)]
        ffmpeg_dir = self.raw.get("tools", {}).get("ffmpeg_dir")
        if ffmpeg_dir:
            extra.append(ffmpeg_dir)
        env["PATH"] = os.pathsep.join(extra + [env.get("PATH", "")])
        env["HYPERFRAMES_PYTHON"] = str(venv_scripts / ("python.exe" if os.name == "nt" else "python"))
        env["HYPERFRAMES_NO_TELEMETRY"] = "1"
        # `hyperframes init` otherwise syncs its skills into the user's global ~/.claude/skills.
        env["HYPERFRAMES_SKIP_SKILLS"] = "1"
        # Each Kokoro process loads a ~300 MB model; parallel lines run this 16 GB laptop out of memory.
        env["HYPERFRAMES_TTS_CONCURRENCY"] = str(self.raw.get("tools", {}).get("tts_concurrency", 1))
        env["PYTHONIOENCODING"] = "utf-8"
        return env


def tool(env: dict, name: str) -> str:
    """Full path of an executable on env's PATH. Windows CreateProcess searches the parent's PATH, not
    the env passed to the child, so a bare name can fail even when env["PATH"] has it."""
    import shutil

    found = shutil.which(name, path=env.get("PATH"))
    if not found:
        raise FileNotFoundError(f"{name} not found on PATH (set tools.ffmpeg_dir in config.yaml)")
    return found


def load_config(path: str | os.PathLike | None = None) -> Config:
    cfg_path = Path(path or os.environ.get("TECHDAILY_CONFIG") or ROOT / "config.yaml").resolve()
    raw = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    return Config(raw=raw, root=cfg_path.parent)
