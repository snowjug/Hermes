"""Make one finished video (Short or 90-second main) from a plan: script -> voice -> compose -> render -> QA."""

from __future__ import annotations

import json
import logging
import os
import re
import shutil
import subprocess
from pathlib import Path

from . import capture as capture_mod
from . import music, plan as plan_mod, voice as voice_mod
from .claude import ask_json
from .compose import THEMES, compose
from .config import Config, tool
from .script import FORMATS, sheet_text, write_sheet

log = logging.getLogger(__name__)

SPEED = {"short": 1.12, "main": 1.06}
MOOD = {"short": "upbeat", "main": "electronic"}


def _state(work: Path) -> dict:
    p = work / "state.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def _mark(work: Path, step: str, **info) -> None:
    s = _state(work)
    s[step] = info or True
    (work / "state.json").write_text(json.dumps(s, indent=2, ensure_ascii=False), encoding="utf-8")


def fact_check(text: str, source_text: str, cfg: Config, cwd: Path) -> dict:
    """source_text must be exactly what the writer saw (plan.sources_as_text), trend signals included."""
    schema = {"type": "object", "properties": {
        "verdict": {"type": "string", "enum": ["pass", "fail"]},
        "unsupported_claims": {"type": "array", "items": {"type": "object", "properties": {
            "claim": {"type": "string"}, "problem": {"type": "string"}}, "required": ["claim", "problem"]}}},
        "required": ["verdict", "unsupported_claims"]}
    system = ("You fact-check a short video script (narration plus on-screen text) against its sources. List every "
              "factual claim (numbers, features, names, comparisons, attributions, relationships between projects) "
              "the sources do not support or that misstates them. Hype wording that makes no factual claim, opinions "
              "framed as opinions, the verdict score and the call to action are fine. verdict is fail when any "
              "unsupported claim exists.")
    prompt = "SCRIPT:\n" + text + "\n\nSOURCES:\n" + source_text
    return ask_json(prompt, schema, system=system, model=cfg["claude"]["metadata_model"], cwd=cwd, budget_usd=1.5)


def _npx(cfg: Config, args: list[str], cwd: Path, timeout: int = 3600) -> subprocess.CompletedProcess:
    return subprocess.run(["npx.cmd" if os.name == "nt" else "npx", "-y", *args], cwd=str(cwd), env=cfg.env(),
                          capture_output=True, text=True, encoding="utf-8", timeout=timeout)


def site_urls(p: dict) -> dict:
    urls = [p["primary_url"], *p.get("supporting_urls", [])]
    homepages = [(c.get("extra") or {}).get("homepage") for c in p.get("candidates_used", [])]
    github = next((u for u in urls if "github.com/" in u), None)
    site = next((h for h in homepages if h), None) or next((u for u in urls if "github.com/" not in u
                                                             and "news.ycombinator" not in u
                                                             and "reddit.com" not in u), None)
    return {"site": site, "github": github}


def make_video(cfg: Config, work: Path, fmt: str, p: dict, sources: list[dict]) -> Path:
    """Produce work/final.mp4 for one format; each step resumes from state.json."""
    work.mkdir(parents=True, exist_ok=True)
    project = work / "video"
    state = _state(work)
    theme = p["theme"]

    if "capture" not in state:
        shots = capture_mod.capture(site_urls(p), project / "assets" / "shots")
        (work / "shots.json").write_text(json.dumps(shots, indent=2), encoding="utf-8")
        _mark(work, "capture", n=len(shots))
    shots = json.loads((work / "shots.json").read_text(encoding="utf-8"))

    if "script" not in _state(work):
        text = plan_mod.sources_as_text(p, sources)
        problems = None
        sheet = None
        for attempt in range(3):
            sheet = write_sheet(cfg, fmt, p, text, shots, work, problems, previous=sheet if problems else None)
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
        vo = voice_mod.synthesize(lines, p["voice"], SPEED[fmt], project / "assets" / "voice")
        (work / "voice.json").write_text(json.dumps(vo, indent=1), encoding="utf-8")
        _mark(work, "voice", seconds=round(vo[-1]["start"] + vo[-1]["duration"], 1))
    vo = json.loads((work / "voice.json").read_text(encoding="utf-8"))

    if "compose" not in _state(work):
        compose(project, fmt=fmt, sheet=sheet, voice=vo, shots=shots, theme_name=theme,
                tool_label=p["tool_name"], seed=f"{work.parent.name}-{fmt}")
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
        duration = vo[-1]["start"] + vo[-1]["duration"] + 0.6
        track = music.write_music(work / "music.wav", p.get("music_mood") or MOOD[fmt], duration + 1,
                                  seed=f"{work.parent.name}-{fmt}")
        music.mix_under_voice(render, track, work / "final.mp4", music_db=-20.0 if fmt == "short" else -22.0,
                              env=cfg.env())
        _mark(work, "finish")
    return work / "final.mp4"


def stills(cfg: Config, video: Path, out: Path, times: list[float]) -> list[Path]:
    env = cfg.env()
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    paths = []
    for i, t in enumerate(times, 1):
        pth = out / f"{i:02}-at-{t:.1f}s.png"
        subprocess.run([tool(env, "ffmpeg"), "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(video), "-frames:v", "1",
                        "-vf", "scale=540:-1", str(pth)], check=True, env=env)
        paths.append(pth)
    return paths


def visual_check(cfg: Config, work: Path, video: Path, vo: list[dict]) -> dict:
    times = [line["start"] + min(1.2, line["duration"] * 0.6) for line in vo]
    paths = stills(cfg, video, work / "qa", times)
    schema = {"type": "object", "properties": {
        "verdict": {"type": "string", "enum": ["pass", "fail"]},
        "issues": {"type": "array", "items": {"type": "object", "properties": {
            "still": {"type": "string"}, "problem": {"type": "string"}}, "required": ["still", "problem"]}}},
        "required": ["verdict", "issues"]}
    system = ("You are the last visual check before a fast-paced animated tech video is published. Use Read to open "
              "every still. Fail if any shows: text overflowing or cut off, overlapping unreadable elements, a blank "
              "stage where content is expected, broken or missing images, captions covering key content, or the "
              "mascot overlapping important text. Bold, busy, colourful designs are intended.")
    return ask_json("Stills in order:\n" + "\n".join(str(p) for p in paths), schema, system=system,
                    model=cfg["claude"]["metadata_model"], cwd=work, budget_usd=1.5, tools=["Read"])
