"""The episode the analysis scripts work on: EPISODE=<folder in episodes/> in the environment, or the
newest episode that has an episode.json. Everything an episode makes lives in its folder:
script.json, audio/, data/, work/, out/, sfx_cues.py, scenes/, timeline.ts."""
import json, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _pick() -> Path:
    name = os.environ.get("EPISODE")
    if not name:
        eps = sorted(p.name for p in (ROOT / "episodes").iterdir() if (p / "episode.json").exists())
        name = eps[-1]
    d = ROOT / "episodes" / name
    if not (d / "episode.json").exists():
        raise SystemExit(f"no episode at {d}")
    return d


EP = _pick()
CONFIG = json.loads((EP / "episode.json").read_text(encoding="utf-8"))
for sub in ("audio", "data", "work", "out"):
    (EP / sub).mkdir(exist_ok=True)
