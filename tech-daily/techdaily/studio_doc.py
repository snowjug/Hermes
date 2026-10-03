"""Make one documentary-style video: capture footage -> script -> fact-check -> ElevenLabs voice -> compose ->
render -> music bed. Each step resumes from state.json."""

from __future__ import annotations

import json
import logging
import re
import subprocess
from pathlib import Path

from . import capture as capture_mod
from . import music, plan as plan_mod, voice_el
from .compose_doc import compose_doc
from .config import Config, tool
from .script_doc import sheet_text, write_sheet
from .studio import _mark, _npx, _state, fact_check, site_urls

log = logging.getLogger(__name__)

DOC_THEME_FOR = {"neon-night": "slate", "cyber-yellow": "ink", "retro-terminal": "forest", "ocean-glass": "slate",
                 "sunset-pop": "ink", "candy": "paper", "mint-paper": "paper", "mono-bold": "ink"}


def _probe_duration(path: Path, env: dict) -> float:
    out = subprocess.run([tool(env, "ffprobe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                          str(path)], capture_output=True, text=True, env=env).stdout.strip()
    return float(out or 0)


def gather_assets(cfg: Config, work: Path, fmt: str, p: dict) -> dict:
    project = work / "video"
    shots_dir = project / "assets" / "shots"
    env = cfg.env()
    urls = site_urls(p)
    view = "mobile" if fmt == "short" else "desktop"
    stills = capture_mod.capture({k: v for k, v in urls.items() if v}, shots_dir)
    footage = None
    for key in ("site", "github"):
        if urls.get(key):
            f = capture_mod.record_footage(urls[key], project / "assets", view, 16, env)
            if f:
                footage = {"file": f"assets/{f.name}", "duration": _probe_duration(f, env), "source": key}
                break
    media = capture_mod.readme_media(urls.get("github"), shots_dir) if urls.get("github") else []
    pick = stills.get(f"site-{view}") or stills.get(f"github-{view}") or next(iter(stills.values()), None)
    describe_assets(cfg, work, footage, media)
    return {"footage": footage, "media": media,
            "stills": {k.split("-")[0]: {"file": v["file"], "source": v.get("host", "")} for k, v in stills.items()
                       if k.endswith(view)},
            "underlay": pick["file"] if pick else None}


def describe_assets(cfg: Config, work: Path, footage: dict | None, media: list[dict]) -> None:
    """Look at the footage and each demo image so the script can only narrate what is really on screen."""
    from .claude import ask_json

    project = work / "video"
    env = cfg.env()
    paths: list[str] = []
    if footage:
        src = project / footage["file"]
        for i, frac in enumerate((0.15, 0.5, 0.85)):
            out = work / f"footage-frame-{i}.png"
            subprocess.run([tool(env, "ffmpeg"), "-v", "error", "-y", "-ss", f"{footage['duration'] * frac:.1f}", "-i",
                            str(src), "-frames:v", "1", "-vf", "scale=720:-1", str(out)], check=True, env=env)
            paths.append(str(out))
    media_paths = []
    for m in media:
        f = project / m["file"]
        if f.suffix.lower() == ".svg":
            png = work / (f.stem + ".png")
            try:
                from playwright.sync_api import sync_playwright

                with sync_playwright() as pw:
                    b = pw.chromium.launch(channel="chrome", headless=True)
                    pg = b.new_page(viewport={"width": 1200, "height": 800})
                    pg.goto(f.resolve().as_uri())
                    pg.screenshot(path=str(png))
                    b.close()
                media_paths.append(str(png))
            except Exception:  # noqa: BLE001
                media_paths.append("")
        else:
            media_paths.append(str(f))
    if not paths and not any(media_paths):
        return
    schema = {"type": "object", "properties": {
        "footage": {"type": "string"},
        "media": {"type": "array", "items": {"type": "string"}}}, "required": ["footage", "media"]}
    prompt = ("Describe, factually and briefly (one or two sentences each), what a viewer sees. Name visible UI, "
              "headings, images or diagrams. Do not guess beyond what is visible.\n"
              f"FOOTAGE FRAMES (one screen recording, in order): {', '.join(paths) or 'none'}\n"
              f"MEDIA IMAGES (in order, describe each; empty path = say 'unavailable'): {', '.join(p or '-' for p in media_paths)}")
    try:
        d = ask_json(prompt, schema, system="You describe images precisely for a video editor. Use Read to open each image.",
                     model=cfg["claude"]["metadata_model"], cwd=work, budget_usd=1.0, tools=["Read"])
    except Exception as exc:  # noqa: BLE001
        log.warning("asset descriptions failed: %s", exc)
        return
    if footage:
        footage["description"] = d["footage"]
    for m, text in zip(media, d.get("media") or []):
        m["description"] = text


def make_video_doc(cfg: Config, work: Path, fmt: str, p: dict, sources: list[dict], *, voice_override=None) -> Path:
    work.mkdir(parents=True, exist_ok=True)
    project = work / "video"

    if "assets" not in _state(work):
        assets = gather_assets(cfg, work, fmt, p)
        (work / "assets.json").write_text(json.dumps(assets, indent=2), encoding="utf-8")
        _mark(work, "assets", footage=bool(assets["footage"]), media=len(assets["media"]))
    assets = json.loads((work / "assets.json").read_text(encoding="utf-8"))

    if "script" not in _state(work):
        text = plan_mod.sources_as_text(p, sources)
        problems, sheet, check = None, None, None
        for attempt in range(3):
            sheet = write_sheet(cfg, fmt, p, text, assets, work, problems, previous=sheet if problems else None)
            check = fact_check(sheet_text(sheet), text, cfg, work)
            (work / "factcheck.json").write_text(json.dumps(check, indent=2, ensure_ascii=False), encoding="utf-8")
            if check["verdict"] == "pass":
                break
            problems = check["unsupported_claims"]
            log.info("%s script failed fact-check (attempt %d): %d claims", fmt, attempt + 1, len(problems))
        _mark(work, "script", factcheck=check["verdict"], lines=len(sheet["lines"]))
    sheet = json.loads((work / f"sheet-{fmt}.json").read_text(encoding="utf-8"))

    if "voice" not in _state(work):
        lines = [ln["text"] for ln in sheet["lines"]]
        engine = cfg.raw.get("voice_engine", "elevenlabs")
        if voice_override:
            vo = voice_override(lines, project / "assets" / "voice")
        elif engine == "chatterbox":
            vo = chatterbox_voice(cfg, lines, project / "assets" / "voice")
        else:
            el = cfg["elevenlabs"]
            vo = voice_el.synthesize(lines, el["voices"][fmt], project / "assets" / "voice", model=el.get("model", "eleven_multilingual_v2"),
                                     stability=el.get("stability", 0.42), similarity=el.get("similarity", 0.8),
                                     style=el.get("style", 0.28), speed=el.get("speed", {}).get(fmt, 1.0))
        (work / "voice.json").write_text(json.dumps(vo, indent=1), encoding="utf-8")
        _mark(work, "voice", seconds=vo["duration"], engine="override" if voice_override else "elevenlabs")
    vo = json.loads((work / "voice.json").read_text(encoding="utf-8"))

    if "compose" not in _state(work):
        compose_doc(project, fmt=fmt, sheet=sheet, voice=vo, assets=assets,
                    theme_name=DOC_THEME_FOR.get(p.get("theme"), p.get("theme") if p.get("theme") in ("ink", "slate", "forest", "paper") else "ink"),
                    tool_label=p["tool_name"])
        if not (project / "hyperframes.json").exists():
            (project / "hyperframes.json").write_text(json.dumps({"name": f"{p['tool_name']}-{fmt}"}), encoding="utf-8")
        lint = _npx(cfg, ["hyperframes", "lint", "--json"], project, timeout=600)
        (work / "lint.json").write_text(lint.stdout or lint.stderr, encoding="utf-8")
        errors = re.findall(r'"severity"\s*:\s*"error"', lint.stdout or "")
        if errors:
            raise RuntimeError(f"{fmt}: hyperframes lint found {len(errors)} errors; see {work / 'lint.json'}")
        _mark(work, "compose")

    render = project / "renders" / "video.mp4"
    if "render" not in _state(work):
        res = _npx(cfg, ["hyperframes", "render", "--quality", "high", "--output", "renders/video.mp4"], project)
        (work / "render.log").write_text((res.stdout or "") + (res.stderr or ""), encoding="utf-8")
        if res.returncode != 0 or not render.exists():
            raise RuntimeError(f"{fmt}: render failed; see {work / 'render.log'}")
        _mark(work, "render")

    if "finish" not in _state(work):
        track = music.write_music(work / "music.wav", "cinematic" if fmt == "main" else "calm", vo["duration"] + 2,
                                  seed=f"{work.parent.name}-{fmt}")
        music.mix_under_voice(render, track, work / "final.mp4", music_db=-27.0 if fmt == "short" else -25.0, env=cfg.env())
        _mark(work, "finish")
    return work / "final.mp4"


def chatterbox_voice(cfg: Config, lines: list[str], out_dir: Path) -> dict:
    """Chatterbox (MIT, local) in its own Python 3.11 env; same result shape as voice_el.synthesize."""
    out_dir.mkdir(parents=True, exist_ok=True)
    cb = cfg.raw.get("chatterbox", {})
    lines_file = out_dir / "lines.json"
    lines_file.write_text(json.dumps(lines, ensure_ascii=False), encoding="utf-8")
    py = cfg.root / ".venv-tts" / "Scripts" / "python.exe"
    argv = [str(py), str(cfg.root / "kit" / "tts_chatterbox.py"), str(lines_file), str(out_dir),
            "--exaggeration", str(cb.get("exaggeration", 0.45)), "--cfg", str(cb.get("cfg", 0.5))]
    if cb.get("reference"):
        argv += ["--ref", str((cfg.root / cb["reference"]).resolve())]
    proc = subprocess.run(argv, capture_output=True, text=True, encoding="utf-8", timeout=3600, env=cfg.env())
    if proc.returncode != 0:
        raise RuntimeError(f"chatterbox failed: {(proc.stderr or proc.stdout)[-800:]}")
    return json.loads(proc.stdout.strip().splitlines()[-1])


def kokoro_stand_in(lines: list[str], out_dir: Path) -> dict:
    """Test-only: Kokoro lines merged into one file in the ElevenLabs result shape (never published)."""
    import numpy as np
    import soundfile as sf

    from . import voice as kvoice

    per = kvoice.synthesize(lines, "am_michael", 1.0, out_dir)
    chunks, sr = [], 24000
    for ln in per:
        a, sr = sf.read(str(out_dir / ln["path"]))
        chunks.append(a)
        chunks.append(np.zeros(int(kvoice.LINE_GAP * sr)))
    sf.write(str(out_dir / "narration.wav"), np.concatenate(chunks), sr)
    out = []
    for k, ln in enumerate(per):
        nxt = per[k + 1]["start"] if k + 1 < len(per) else ln["start"] + ln["duration"]
        out.append({"text": ln["text"], "start": ln["start"], "duration": round(nxt - ln["start"], 3), "words": ln["words"]})
    return {"path": "narration.wav", "duration": round(per[-1]["start"] + per[-1]["duration"] + 0.25, 3), "lines": out}
