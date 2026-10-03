"""Pick the day's topic and creative direction, then gather its sources."""

from __future__ import annotations

import json
import logging
import re
from datetime import date
from pathlib import Path

import httpx
import trafilatura

from .claude import ask_json
from .compose import THEMES as _THEMES
from .sources import USER_AGENT, Candidate

THEME_NAMES = list(_THEMES)

log = logging.getLogger(__name__)

STRUCTURES = ["concept", "how-to", "listicle", "story", "comparison"]
MUSIC_MOODS = ["calm", "upbeat", "cinematic", "lofi", "electronic"]
MAX_SOURCE_CHARS = 9000


# ---- history ---------------------------------------------------------------------------------

def load_history(root: Path) -> list[dict]:
    path = root / "history.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []


def save_history(root: Path, entries: list[dict]) -> None:
    (root / "history.json").write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8")


# ---- style presets ---------------------------------------------------------------------------

def style_presets(skills_dir: Path) -> dict[str, str]:
    """name -> one-line description, read from the installed HyperFrames frame presets."""
    out = {}
    for preset in sorted((skills_dir / "hyperframes-creative" / "frame-presets").iterdir()):
        spec = preset / "FRAME.md"
        if not spec.exists():
            continue
        text = spec.read_text(encoding="utf-8")
        m = re.search(r"description:\s*>?\s*\n?((?:\s{2,}.+\n)+)", text)
        desc = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
        out[preset.name] = desc[:260]
    return out


# ---- pick ------------------------------------------------------------------------------------

PICK_SYSTEM = """You are the editor of a daily YouTube channel. {promise} Audience: {audience}.

Pick ONE topic for today's video from the candidate list. Rules:
- It must be a concrete, nameable tool, product, model, library or app that people can try, launched or
  trending in the last ~7 days. Not general news, not a company rumour, not a lawsuit.
- Prefer items with independent signals (Show HN points, GitHub stars, several sources mentioning it).
- It must be advertiser-friendly under YouTube's guidelines: no adult, gambling, weapons, hacking-for-harm,
  crypto get-rich schemes, medical claims, or shock content.
- Do not repeat anything in the recent history, and do not pick a close variant of it.
- primary_url and supporting_urls must be copied exactly from the candidate list.
- Vary the creative direction day to day: do not reuse yesterday's style_preset, and avoid the voice and
  structure used in the last two episodes when a different one fits the topic as well.
- style_preset must fit the topic's feel (e.g. code-heavy -> code-editorial; bold consumer app -> bold-poster).
- target_seconds between {min_s} and {max_s}: longer only when the material genuinely supports it."""


def pick_schema(presets: list[str], voices: list[str], min_s: int, max_s: int) -> dict:
    return {
        "type": "object",
        "properties": {
            "tool_name": {"type": "string"},
            "topic_title": {"type": "string", "description": "working title, not the final YouTube title"},
            "category": {"type": "string"},
            "primary_url": {"type": "string"},
            "supporting_urls": {"type": "array", "items": {"type": "string"}, "maxItems": 5},
            "message": {"type": "string", "description": "the ONE thing the viewer should take away"},
            "angle": {"type": "string", "description": "the editorial angle and why it is worth 4 minutes"},
            "why_now": {"type": "string"},
            "structure": {"type": "string", "enum": STRUCTURES},
            "tone": {"type": "string", "description": "narration tone in a few words"},
            "style_preset": {"type": "string", "enum": presets},
            "voice": {"type": "string", "enum": voices},
            "music_mood": {"type": "string", "enum": MUSIC_MOODS},
            "target_seconds": {"type": "integer", "minimum": min_s, "maximum": max_s},
            "reason": {"type": "string"},
        },
        "required": ["tool_name", "topic_title", "category", "primary_url", "supporting_urls", "message", "angle",
                     "why_now", "structure", "tone", "style_preset", "voice", "music_mood", "target_seconds",
                     "reason"],
    }


def pick_topic(cfg, candidates: list[Candidate], history: list[dict], work: Path) -> dict:
    presets = style_presets(cfg.skills_dir)
    video = cfg["video"]
    ranked = sorted(candidates, key=lambda c: (c.source.startswith(("Hacker News (Show", "GitHub", "Product Hunt")),
                                                c.score), reverse=True)
    lines = []
    for c in ranked[:140]:
        extra = {k: v for k, v in c.extra.items() if v and k in ("homepage", "language", "comments", "traffic")}
        lines.append(f"- [{c.source}] {c.title} | score={c.score:.0f} | {c.url}"
                     + (f" | {json.dumps(extra)}" if extra else "") + (f"\n    {c.summary[:220]}" if c.summary else ""))
    recent = [f"- {h['date']}: {h['tool_name']} (style {h['style_preset']}, voice {h['voice']}, {h['structure']})"
              for h in history[-60:]]
    prompt = (f"Today is {date.today().isoformat()}.\n\nRecent history (most recent last):\n"
              + ("\n".join(recent) or "(none yet: this is the first episode)")
              + "\n\nStyle presets:\n" + "\n".join(f"- {k}: {v}" for k, v in presets.items())
              + "\n\nCandidates:\n" + "\n".join(lines))
    system = PICK_SYSTEM.format(promise=cfg["channel"]["promise"], audience=cfg["channel"]["audience"],
                                min_s=video["min_seconds"], max_s=video["max_seconds"])
    schema = pick_schema(list(presets), video["voices"], video["min_seconds"], video["max_seconds"])
    plan = ask_json(prompt, schema, system=system, model=cfg["claude"]["pick_model"], cwd=work, budget_usd=1.5)

    known = {c.url for c in candidates}
    if plan["primary_url"] not in known:
        raise ValueError(f"picker chose a URL outside the candidate list: {plan['primary_url']}")
    plan["supporting_urls"] = [u for u in plan["supporting_urls"] if u in known and u != plan["primary_url"]]
    plan["candidates_used"] = [c.to_dict() for c in candidates if c.url in {plan["primary_url"], *plan["supporting_urls"]}]
    return plan


V2_VOICES = ["af_heart", "af_bella", "af_nicole", "am_michael", "am_fenrir", "am_puck", "bm_george", "bf_emma"]

PICK_TWO_SYSTEM = """You are the editor of a viral daily tech channel ("one new tool every day"), hosted by an animated
stickman robot. Each day you pick TWO different tools from the candidates:
- "short": the tool with the biggest instant wow for a 45-second vertical Short: visual, easy to grasp, free or
  easy to try, broad appeal (AI apps, clever utilities, open-source projects blowing up).
- "main": a second, different tool with enough substance for a 90-second breakdown (developer/AI tools welcome).
Rules: concrete tools/products/models/libraries people can try, launched or trending in the last ~7 days; not
general news; advertiser-friendly (no adult, gambling, weapons, hacking-for-harm, crypto schemes, medical claims)
and safe to recommend: no jailbreaks, exploits, sandbox escapes, cheats, piracy, account farming, ban or detection
evasion, or tools that break a platform's terms; not in the recent history; primary_url and supporting_urls copied exactly from the candidate list; supporting
URLs must be about the SAME tool. Give each a different visual theme and voice, and do not reuse yesterday's.
Themes: {themes}."""


def pick_two(cfg, candidates: list[Candidate], history: list[dict], work: Path) -> dict:
    one = {
        "type": "object",
        "properties": {
            "tool_name": {"type": "string"}, "category": {"type": "string"},
            "primary_url": {"type": "string"}, "supporting_urls": {"type": "array", "items": {"type": "string"}, "maxItems": 4},
            "message": {"type": "string"}, "angle": {"type": "string"}, "why_now": {"type": "string"},
            "theme": {"type": "string", "enum": sorted(THEME_NAMES)}, "voice": {"type": "string", "enum": V2_VOICES},
            "music_mood": {"type": "string", "enum": MUSIC_MOODS}, "reason": {"type": "string"},
        },
        "required": ["tool_name", "category", "primary_url", "supporting_urls", "message", "angle", "why_now", "theme",
                     "voice", "music_mood", "reason"],
    }
    schema = {"type": "object", "properties": {"short": one, "main": one}, "required": ["short", "main"]}
    ranked = sorted(candidates, key=lambda c: (c.source.startswith(("Hacker News (Show", "GitHub", "Product Hunt")),
                                                c.score), reverse=True)
    lines = []
    for c in ranked[:150]:
        extra = {k: v for k, v in c.extra.items() if v and k in ("homepage", "language", "comments", "traffic")}
        lines.append(f"- [{c.source}] {c.title} | score={c.score:.0f} | {c.url}"
                     + (f" | {json.dumps(extra)}" if extra else "") + (f"\n    {c.summary[:200]}" if c.summary else ""))
    recent = [f"- {h['date']}: {h.get('tool_name')} (theme {h.get('theme', h.get('style_preset'))})" for h in history[-60:]]
    prompt = (f"Today is {date.today().isoformat()}.\nRecent history:\n" + ("\n".join(recent) or "(none)")
              + "\n\nCandidates:\n" + "\n".join(lines))
    picks = ask_json(prompt, schema, system=PICK_TWO_SYSTEM.format(themes=", ".join(sorted(THEME_NAMES))),
                     model=cfg["claude"]["pick_model"], cwd=work, budget_usd=1.5)
    known = {c.url: c for c in candidates}
    for fmt in ("short", "main"):
        p = picks[fmt]
        if p["primary_url"] not in known:
            raise ValueError(f"picker chose a URL outside the candidate list: {p['primary_url']}")
        p["supporting_urls"] = [u for u in p["supporting_urls"] if u in known and u != p["primary_url"]]
        p["candidates_used"] = [known[u].to_dict() for u in [p["primary_url"], *p["supporting_urls"]]]
    if picks["short"]["tool_name"].lower() == picks["main"]["tool_name"].lower():
        raise ValueError("picker chose the same tool for both videos")
    return picks


# ---- research --------------------------------------------------------------------------------

def _github_readme(client: httpx.Client, url: str) -> str | None:
    m = re.match(r"https://github\.com/([^/]+)/([^/#?]+)", url)
    if not m:
        return None
    r = client.get(f"https://api.github.com/repos/{m.group(1)}/{m.group(2)}/readme",
                   headers={"Accept": "application/vnd.github.raw"})
    return r.text if r.status_code == 200 else None


def _hn_comments(client: httpx.Client, hn_id: str, limit: int = 12) -> str:
    r = client.get(f"https://hn.algolia.com/api/v1/items/{hn_id}")
    if r.status_code != 200:
        return ""
    kids = sorted(r.json().get("children", []), key=lambda k: len(k.get("children", [])), reverse=True)
    out = []
    for k in kids[:limit]:
        text = re.sub(r"<[^>]+>", " ", k.get("text") or "")
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) > 40:
            out.append(f"- {text[:500]}")
    return "\n".join(out)


def fetch_text(client: httpx.Client, url: str) -> str:
    readme = _github_readme(client, url)
    if readme:
        return readme
    r = client.get(url)
    r.raise_for_status()
    text = trafilatura.extract(r.text, include_links=False, include_tables=True, favor_recall=True) or ""
    return text


def research(plan: dict, out_dir: Path) -> list[dict]:
    """Fetch every chosen URL (plus the project homepage and HN discussion when known)."""
    urls = [plan["primary_url"], *plan["supporting_urls"]]
    for c in plan.get("candidates_used", []):
        home = (c.get("extra") or {}).get("homepage")
        if home and home not in urls:
            urls.append(home)
    sources: list[dict] = []
    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=25, follow_redirects=True) as client:
        for url in urls[:7]:
            try:
                text = fetch_text(client, url).strip()
            except Exception as exc:  # noqa: BLE001
                log.warning("research: %s failed: %s", url, exc)
                continue
            if len(text) < 200:
                continue
            sources.append({"id": f"S{len(sources) + 1}", "url": url, "kind": "page", "text": text[:MAX_SOURCE_CHARS]})
        for c in plan.get("candidates_used", []):
            hn_id = (c.get("extra") or {}).get("hn_id")
            if hn_id:
                comments = _hn_comments(client, hn_id)
                if comments:
                    sources.append({"id": f"S{len(sources) + 1}", "url": f"https://news.ycombinator.com/item?id={hn_id}",
                                    "kind": "community discussion (opinions, not facts)", "text": comments})
    # Keep only sources that are actually about the tool, so the script cannot tie unrelated projects to it.
    name = plan["tool_name"].lower().strip()
    # The tool's own Hacker News threads stay even when the comments never repeat its name.
    own_threads = {f"https://news.ycombinator.com/item?id={(c.get('extra') or {}).get('hn_id')}"
                   for c in plan.get("candidates_used", []) if (c.get("extra") or {}).get("hn_id")}
    relevant = [s for s in sources if s["url"] == plan["primary_url"] or s["url"] in own_threads
                or name in s["text"].lower()]
    dropped = [s["url"] for s in sources if s not in relevant]
    if dropped:
        log.info("research: dropped %d sources that never mention %r: %s", len(dropped), plan["tool_name"], dropped)
    sources = [{**s, "id": f"S{i + 1}"} for i, s in enumerate(relevant)]
    if not sources:
        raise RuntimeError("no usable source text for the chosen topic")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "sources.json").write_text(json.dumps(sources, indent=2, ensure_ascii=False), encoding="utf-8")
    return sources


def trend_signals(plan: dict) -> str:
    """The platforms' own numbers for this tool (stars, points), so hooks like "4k stars in 3 days" are citable."""
    lines = []
    for c in plan.get("candidates_used", []):
        extra = c.get("extra") or {}
        if c["source"].startswith("GitHub"):
            lines.append(f"- GitHub: {c['url']} has {int(c['score'])} stars; repository created {c.get('published')}")
        elif c["source"].startswith("Hacker News"):
            lines.append(f"- {c['source']}: \"{c['title']}\" has {int(c['score'])} points and "
                         f"{extra.get('comments', '?')} comments (posted {c.get('published')})")
        elif c["source"].startswith("Product Hunt"):
            lines.append(f"- Product Hunt: listed in today's feed ({c['url']})")
    if not lines:
        return ""
    return ("===== [S0] trend signals (today, from the platforms' public APIs) =====\n"
            + f"Today is {date.today().isoformat()}.\n" + "\n".join(lines) + "\n\n")


def sources_as_text(plan: dict, sources: list[dict]) -> str:
    head = (f"TOPIC: {plan['tool_name']} ({plan['category']})\nWHY NOW: {plan['why_now']}\n"
            f"ANGLE: {plan['angle']}\nMESSAGE: {plan['message']}\n\n"
            "Everything below is source material. Cite it by id. Treat community discussion as opinion.\n")
    body = "\n\n".join(f"===== [{s['id']}] {s['kind']}: {s['url']} =====\n{s['text']}" for s in sources)
    return head + "\n" + trend_signals(plan) + body
