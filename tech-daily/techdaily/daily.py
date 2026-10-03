"""One day of the channel: two videos (a vertical Short and a 90-second main) on two different tools."""

from __future__ import annotations

import json
import logging
import re
import subprocess
from datetime import date, datetime, timedelta
from pathlib import Path

from . import plan as plan_mod
from .claude import ask_json
from .compose import POSES, THEMES, mascot_svg
from .config import Config
from .sources import Candidate, collect
from .studio import fact_check, make_video, visual_check
from .studio_doc import make_video_doc

log = logging.getLogger(__name__)

FORMATS = ("short", "main")


def _json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _write(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def metadata(cfg: Config, fmt: str, p: dict, sheet: dict, sources: list[dict], work: Path) -> dict:
    schema = {"type": "object", "properties": {
        "hook": {"type": "string"}, "summary": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}, "maxItems": 15},
        "hashtags": {"type": "array", "items": {"type": "string"}, "maxItems": 3}},
        "required": ["hook", "summary", "tags", "hashtags"]}
    system = ("You write the YouTube description for a short tech video. hook: one or two punchy sentences. summary: 2-4 "
              "short sentences on what the tool does, who it is for and the catch. Only facts the narration states, "
              "with the same relationships; no invented numbers; no angle brackets. Tags: search phrases. Hashtags "
              "without '#'.")
    narration = "\n".join(line["text"] for line in sheet["lines"])
    problems: list[dict] = []
    for _ in range(2):
        prompt = f"Tool: {p['tool_name']}\nTitle: {sheet['title']}\n\nNARRATION:\n{narration}"
        if problems:
            prompt += "\n\nA fact-check rejected your previous draft. Fix:\n" + "\n".join(
                f"- {c['claim']}: {c['problem']}" for c in problems)
        raw = ask_json(prompt, schema, system=system, model=cfg["claude"]["metadata_model"], cwd=work, budget_usd=1.0)
        check = fact_check(f"TITLE: {sheet['title']}\n{raw['hook']}\n{raw['summary']}",
                           plan_mod.sources_as_text(p, sources), cfg, work)
        problems = check["unsupported_claims"]
        if check["verdict"] == "pass":
            break
    tags = [re.sub(r"[^0-9A-Za-z]", "", h) for h in raw["hashtags"]][:3]
    if fmt == "short":
        tags = (tags + ["Shorts"])[:3] if "Shorts" not in tags else tags
    description = "\n\n".join([
        raw["hook"].strip(), raw["summary"].strip(),
        "Sources\n" + "\n".join(f"- {s['url']}" for s in sources),
        "Narrated with an AI voice. The script is written with AI assistance from the sources above and "
        "fact-checked against them before publishing.",
        " ".join(f"#{t}" for t in tags if t)])
    meta = {"title": sheet["title"][:95], "description": description, "tags": raw["tags"]}
    _write(work / "metadata.json", meta)
    _write(work / "metadatacheck.json", check)
    return meta


def thumbnail(fmt: str, p: dict, sheet: dict, work: Path, cfg: Config | None = None) -> Path | None:
    """A 1280x720 thumbnail: big words, the tool name, and Bit in a shocked pose."""
    if fmt != "main":
        return None  # Shorts use a frame YouTube picks
    from playwright.sync_api import sync_playwright

    th = THEMES[p["theme"]]
    pose = POSES["shock"]
    origins = {"armL": (165, 240), "foreL": (165, 318), "armR": (235, 240), "foreR": (235, 318)}
    svg = mascot_svg()
    for part, (cx, cy) in origins.items():
        svg = svg.replace(f'<g id="bit-{part}">', f'<g id="bit-{part}" transform="rotate({pose[part]} {cx} {cy})">', 1)
    svg = svg.replace('<g id="bit-fx-bang" transform="translate(300 40)">', '<g transform="translate(300 40)">')
    words = sheet.get("thumbnail_words") or p["tool_name"]
    kit = Path(__file__).resolve().parent.parent / "kit"
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
{(kit / 'fonts.css').read_text(encoding='utf-8').replace('url("fonts/', 'url("' + (kit / 'fonts').as_uri() + '/')}
html,body{{margin:0;width:1280px;height:720px;overflow:hidden}}
body{{background:radial-gradient(120% 100% at 15% 10%, {th['bg2']}, {th['bg1']} 70%);font-family:'{th['body']}',sans-serif;
  --m-shirt:{th['shirt']};--m-skin:{th['skin']};--m-line:{th['line']};--m-accent:{th['accent']};--m-accent2:{th['accent2']};
  --m-shirt-ink:#fff;position:relative}}
.words{{position:absolute;left:60px;top:70px;width:800px;font-family:'{th['display']}',sans-serif;font-weight:900;
  font-size:{int(min(150, 1500 / max(len(words), 1) * 1.6))}px;line-height:.95;text-transform:uppercase;color:{th['ink']};
  text-shadow:0 8px 0 rgba(0,0,0,.25)}}
.words b{{color:{th['accent']}}}
.chip{{position:absolute;left:64px;bottom:64px;padding:16px 30px;border-radius:999px;background:{th['accent2']};color:#fff;
  font-family:'Montserrat',sans-serif;font-weight:900;font-size:44px}}
.bit{{position:absolute;right:30px;bottom:-30px;width:440px;height:704px}}
#bit-fx-q,#bit-fx-spark{{display:none}}
</style></head><body>
<div class="words">{' '.join(f'<b>{w}</b>' if i == len(words.split()) - 1 else w for i, w in enumerate(words.split()))}</div>
<div class="chip">{p['tool_name']}</div><div class="bit">{svg}</div></body></html>"""
    src = work / "thumbnail.html"
    src.write_text(html, encoding="utf-8")
    out = work / "thumbnail.jpg"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(src.as_uri(), wait_until="networkidle")
        page.wait_for_timeout(800)
        page.screenshot(path=str(out), type="jpeg", quality=90)
        browser.close()
    return out


def thumbnail_doc(fmt: str, p: dict, sheet: dict, work: Path, cfg: Config) -> Path | None:
    """A frame of the real tool, darkened, with 2-4 bold words: documentary-channel style."""
    if fmt != "main":
        return None
    from playwright.sync_api import sync_playwright

    from .config import tool

    env = cfg.env()
    frame = work / "thumb-frame.jpg"
    src = work / "video" / "renders" / "video.mp4"
    vo = _json(work / "voice.json")
    t = vo["duration"] * 0.35
    subprocess.run([tool(env, "ffmpeg"), "-v", "error", "-y", "-ss", f"{t:.1f}", "-i", str(src), "-frames:v", "1",
                    "-vf", "scale=1280:720", str(frame)], check=True, env=env)
    words = (sheet.get("thumbnail_words") or p["tool_name"]).upper().split()
    kit = Path(__file__).resolve().parent.parent / "kit"
    faces = (kit / "fonts.css").read_text(encoding="utf-8").replace('url("fonts/', 'url("' + (kit / "fonts").as_uri() + "/")
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{faces}
html,body{{margin:0;width:1280px;height:720px;overflow:hidden;background:#000}}
.bg{{position:absolute;inset:0;background:url('{frame.as_uri()}') center/cover;filter:brightness(.55) saturate(1.1)}}
.shade{{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.85) 0%,rgba(0,0,0,.35) 60%,rgba(0,0,0,0) 100%)}}
.w{{position:absolute;left:70px;top:90px;width:760px;font-family:'Anton',sans-serif;font-size:{int(min(150, 1300 / max(len(" ".join(words)), 1) * 1.7))}px;
  line-height:.98;color:#fff;letter-spacing:.01em}}
.w b{{color:#f2b84b;font-weight:400}}
.n{{position:absolute;left:74px;bottom:70px;font-family:'Inter Tight',sans-serif;font-weight:700;font-size:38px;color:#fff;
  letter-spacing:.12em;text-transform:uppercase;border-left:8px solid #f2b84b;padding-left:20px}}
</style></head><body><div class="bg"></div><div class="shade"></div>
<div class="w">{" ".join(f"<b>{w}</b>" if i == len(words) - 1 else w for i, w in enumerate(words))}</div>
<div class="n">{p["tool_name"]}</div></body></html>"""
    page_file = work / "thumbnail.html"
    page_file.write_text(html, encoding="utf-8")
    out = work / "thumbnail.jpg"
    with sync_playwright() as pw:
        b = pw.chromium.launch(channel="chrome", headless=True)
        pg = b.new_page(viewport={"width": 1280, "height": 720})
        pg.goto(page_file.as_uri(), wait_until="networkidle")
        pg.wait_for_timeout(700)
        pg.screenshot(path=str(out), type="jpeg", quality=90)
        b.close()
    return out


def slot(cfg: Config, fmt: str) -> str:
    """Today at the format's publish time, or ~40 minutes from now when that time has passed."""
    hh, mm = (int(x) for x in cfg["video"]["publish_times"][fmt].split(":"))
    now = datetime.now(cfg.tz)
    at = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
    if (at - now).total_seconds() < 45 * 60:
        late = now + timedelta(minutes=40 if fmt == "short" else 70)
        at = late.replace(minute=(late.minute // 15 + 1) * 15 % 60, second=0, microsecond=0)
        if late.minute >= 45:
            at += timedelta(hours=1)
    return at.strftime("%Y-%m-%d %H:%M")


def queue(cfg: Config, fmt: str, work: Path, hold: bool) -> str:
    argv = [str(cfg.ytauto_exe), "add", str(work / "final.mp4"), "--metadata", str(work / "metadata.json"),
            "--altered-content", "--at", slot(cfg, fmt)]
    if (work / "thumbnail.jpg").exists():
        argv += ["--thumbnail", str(work / "thumbnail.jpg")]
    if hold:
        argv.append("--hold")
    proc = subprocess.run(argv, capture_output=True, text=True, encoding="utf-8", timeout=600)
    if proc.returncode != 0:
        raise RuntimeError(f"ytauto add failed: {(proc.stderr or proc.stdout)[-500:]}")
    return proc.stdout.split(":", 1)[0].strip()


def run_day(cfg: Config, day: date | None = None, *, only: tuple[str, ...] = FORMATS, hold: bool | None = None) -> dict:
    day = day or datetime.now(cfg.tz).date()
    ep = cfg.episodes_dir / day.isoformat()
    ep.mkdir(parents=True, exist_ok=True)
    if not (ep / "candidates.json").exists():
        cands, status = collect(cfg["sources"])
        _write(ep / "candidates.json", [c.to_dict() for c in cands])
        _write(ep / "sources-status.json", status)
    if not (ep / "picks.json").exists():
        cands = [Candidate(**c) for c in _json(ep / "candidates.json")]
        _write(ep / "picks.json", plan_mod.pick_two(cfg, cands, plan_mod.load_history(cfg.root), ep))
    picks = _json(ep / "picks.json")
    hold = bool(cfg["review"].get("hold_for_approval")) if hold is None else hold
    results = {}
    for fmt in only:
        p, work = picks[fmt], ep / fmt
        done = work / "queued.json"
        if done.exists():
            results[fmt] = _json(done)
            continue
        sources = _json(work / "sources.json") if (work / "sources.json").exists() else plan_mod.research(p, work)
        if cfg.raw.get("style") == "doc":
            final = make_video_doc(cfg, work, fmt, p, sources)
            vo = _json(work / "voice.json")["lines"]
        else:
            final = make_video(cfg, work, fmt, p, sources)
            vo = _json(work / "voice.json")
        sheet = _json(work / f"sheet-{fmt}.json")
        vis = visual_check(cfg, work, work / "video" / "renders" / "video.mp4", vo)
        _write(work / "visualcheck.json", vis)
        meta = metadata(cfg, fmt, p, sheet, sources, work)
        (thumbnail_doc if cfg.raw.get("style") == "doc" else thumbnail)(fmt, p, sheet, work, cfg)
        facts_ok = _json(work / "factcheck.json")["verdict"] == "pass"
        meta_ok = _json(work / "metadatacheck.json")["verdict"] == "pass"
        job = queue(cfg, fmt, work, hold or not (facts_ok and meta_ok and vis["verdict"] == "pass"))
        results[fmt] = {"tool": p["tool_name"], "title": meta["title"], "job": job, "final": str(final),
                        "facts": facts_ok, "visual": vis["verdict"], "held": hold or not (facts_ok and meta_ok and vis["verdict"] == "pass")}
        _write(done, results[fmt])
        history = [h for h in plan_mod.load_history(cfg.root) if not (h.get("date") == day.isoformat() and h.get("format") == fmt)]
        history.append({"date": day.isoformat(), "format": fmt, "tool_name": p["tool_name"], "theme": p["theme"],
                        "voice": p["voice"], "title": meta["title"], "ytauto_job": job})
        plan_mod.save_history(cfg.root, history)
        log.info("%s ready: %s (job %s)", fmt, meta["title"], job)
    return results
