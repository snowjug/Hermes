"""Write title, description, tags, hashtags and chapters with headless Claude Code (`claude -p`).

Claude Code runs with every tool disabled and a fixed system prompt, so it only writes text.
It reuses your existing Claude Code login; no separate API key is needed.
"""

from __future__ import annotations

import json
import logging
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

TITLE_MAX = 100
DESCRIPTION_MAX_BYTES = 4900  # YouTube's hard limit is 5000 bytes
TAGS_MAX_CHARS = 450  # YouTube's hard limit is 500, counted with separators and quotes
TRANSCRIPT_MAX_CHARS = 48_000

SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "title": {"type": "string", "description": "Video title, under 70 characters when possible"},
        "description": {
            "type": "string",
            "description": "Description body without chapters, hashtags or footer; plain text with line breaks",
        },
        "tags": {"type": "array", "items": {"type": "string"}, "maxItems": 15},
        "hashtags": {"type": "array", "items": {"type": "string"}, "maxItems": 3},
        "chapters": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"start_seconds": {"type": "number"}, "title": {"type": "string"}},
                "required": ["start_seconds", "title"],
            },
        },
    },
    "required": ["title", "description", "tags", "hashtags", "chapters"],
}

SYSTEM_PROMPT = """You write YouTube metadata for one channel. You never invent facts that are not in the \
transcript or the creator's notes. Write in {language}.

Channel: {channel}

House style: {style}

Rules:
- title: what the video delivers, specific, under 70 characters, no angle brackets.
- description: 2-sentence hook first (this shows above the fold), then 1-3 short paragraphs \
summarising the content. No links, no hashtags, no chapter list, no angle brackets.
- tags: 5-15 search phrases viewers would type, most specific first, no '#'.
- hashtags: up to 3 single words or CamelCase phrases, no '#'.
- chapters: only when a transcript with timestamps is provided and the video is longer than \
3 minutes: 3-12 chapters, first at 0 seconds, each at least 10 seconds apart, titles of 2-6 words. \
Otherwise return an empty list."""


class MetadataError(RuntimeError):
    pass


def find_claude(explicit: str | None) -> str:
    if explicit:
        return explicit
    found = shutil.which("claude")
    if not found:
        raise MetadataError("`claude` CLI not found on PATH; set metadata.claude_path in config.yaml")
    # npm installs a .cmd shim; call the native binary behind it so arguments skip cmd.exe parsing.
    if found.lower().endswith((".cmd", ".ps1")):
        native = Path(found).parent / "node_modules" / "@anthropic-ai" / "claude-code" / "bin" / "claude.exe"
        if native.exists():
            return str(native)
    return found


def _mmss(seconds: float) -> str:
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02}:{s:02}" if h else f"{m}:{s:02}"


def format_transcript(transcript: dict | None) -> str:
    if not transcript or not transcript.get("segments"):
        return ""
    lines = [f"[{_mmss(s['start'])}] {s['text']}" for s in transcript["segments"]]
    text = "\n".join(lines)
    if len(text) > TRANSCRIPT_MAX_CHARS:
        head, tail = text[: int(TRANSCRIPT_MAX_CHARS * 0.75)], text[-int(TRANSCRIPT_MAX_CHARS * 0.2):]
        text = f"{head}\n[... middle of transcript omitted ...]\n{tail}"
    return text


def build_user_prompt(source_name: str, hints: dict, transcript: dict | None) -> str:
    parts = [f"Video file name: {source_name}"]
    if transcript:
        parts.append(f"Duration: {_mmss(transcript.get('duration', 0))}")
        parts.append(f"Spoken language detected: {transcript.get('language')}")
    if hints.get("notes"):
        parts.append(f"Creator's notes (trust these):\n{hints['notes']}")
    if hints.get("title"):
        parts.append(f"The creator fixed the title as: {hints['title']}")
    body = format_transcript(transcript)
    parts.append(f"Transcript:\n{body}" if body else "No transcript is available. Do not produce chapters.")
    return "\n\n".join(parts)


def call_claude(user_prompt: str, cfg: dict, cwd: Path) -> dict:
    exe = find_claude(cfg.get("claude_path"))
    system = SYSTEM_PROMPT.format(
        language=cfg.get("language") or "English",
        channel=(cfg.get("channel") or "").strip() or "(not described)",
        style=(cfg.get("style") or "").strip() or "(none)",
    )
    argv = [
        exe, "-p",
        "--output-format", "json",
        "--json-schema", json.dumps(SCHEMA),
        "--tools", "",
        "--strict-mcp-config",
        "--no-session-persistence",
        "--model", str(cfg.get("model") or "sonnet"),
        "--max-budget-usd", str(cfg.get("max_budget_usd") or 0.5),
        "--system-prompt", system,
    ]
    try:
        proc = subprocess.run(argv, input=user_prompt, capture_output=True, text=True, encoding="utf-8",
                              cwd=str(cwd), timeout=600)
    except subprocess.TimeoutExpired as exc:
        raise MetadataError("claude -p timed out after 600s") from exc
    if proc.returncode != 0:
        raise MetadataError(f"claude -p exited {proc.returncode}: {(proc.stderr or proc.stdout)[-800:]}")
    try:
        envelope = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise MetadataError(f"claude -p returned non-JSON output: {proc.stdout[-500:]}") from exc
    if envelope.get("is_error"):
        raise MetadataError(f"claude -p reported an error: {envelope.get('result')}")
    data = envelope.get("structured_output")
    if not isinstance(data, dict):
        raise MetadataError("claude -p returned no structured_output")
    log.info("metadata written by claude (cost $%.4f)", envelope.get("total_cost_usd") or 0)
    return data


def _clean(text: str) -> str:
    return re.sub(r"[<>]", "", text or "").strip()


def _fit_title(title: str) -> str:
    title = re.sub(r"\s+", " ", _clean(title))
    if len(title) <= TITLE_MAX:
        return title
    cut = title[: TITLE_MAX + 1].rsplit(" ", 1)[0]
    return cut[:TITLE_MAX].rstrip(" -:|,")


def _fit_tags(tags: list[str]) -> list[str]:
    out, used, seen = [], 0, set()
    for tag in tags:
        tag = re.sub(r"[<>,\"#]", "", tag).strip()
        if not tag or tag.lower() in seen:
            continue
        cost = len(tag) + (2 if " " in tag else 0) + 1
        if used + cost > TAGS_MAX_CHARS:
            break
        out.append(tag)
        used += cost
        seen.add(tag.lower())
    return out


def valid_chapters(chapters: list[dict], duration: float | None) -> list[dict]:
    items = sorted(
        ({"start_seconds": float(c["start_seconds"]), "title": _clean(c["title"])} for c in chapters or []
         if c.get("title")),
        key=lambda c: c["start_seconds"],
    )
    if len(items) < 3 or items[0]["start_seconds"] != 0:
        return []
    for a, b in zip(items, items[1:]):
        if b["start_seconds"] - a["start_seconds"] < 10:
            return []
    if duration and items[-1]["start_seconds"] >= duration - 10:
        return []
    return items


def assemble(raw: dict, hints: dict, cfg: dict, duration: float | None) -> dict:
    """Validate the model output against YouTube's limits and build the final description."""
    title = _fit_title(hints.get("title") or raw.get("title", ""))
    if not title:
        raise MetadataError("empty title")
    body = _clean(hints.get("description") or raw.get("description", ""))
    chapters = valid_chapters(raw.get("chapters", []), duration)
    hashtags = [re.sub(r"[^\w]", "", h) for h in raw.get("hashtags", [])][:3]
    hashtags = [h for h in hashtags if h]
    tags = _fit_tags(list(hints.get("tags") or []) + list(raw.get("tags") or []) + list(cfg.get("default_tags") or []))

    tail_parts = []
    if chapters:
        tail_parts.append("Chapters\n" + "\n".join(f"{_mmss(c['start_seconds'])} {c['title']}" for c in chapters))
    if cfg.get("footer"):
        tail_parts.append(_clean(cfg["footer"]))
    if hashtags:
        tail_parts.append(" ".join(f"#{h}" for h in hashtags))
    tail = "\n\n".join(tail_parts)

    budget = DESCRIPTION_MAX_BYTES - len(tail.encode("utf-8")) - 4
    encoded = body.encode("utf-8")
    if len(encoded) > budget:
        body = encoded[: max(budget, 0)].decode("utf-8", errors="ignore").rsplit("\n", 1)[0].rstrip()
    description = f"{body}\n\n{tail}".strip() if tail else body

    return {
        "title": title,
        "description": description,
        "tags": tags,
        "hashtags": hashtags,
        "chapters": chapters,
    }


def fit_limits(meta: dict) -> dict:
    """Enforce YouTube's limits on metadata written elsewhere (title, description, tags)."""
    title = _fit_title(meta.get("title", ""))
    if not title:
        raise MetadataError("empty title")
    description = _clean(meta.get("description", ""))
    encoded = description.encode("utf-8")
    if len(encoded) > DESCRIPTION_MAX_BYTES:
        description = encoded[:DESCRIPTION_MAX_BYTES].decode("utf-8", errors="ignore").rsplit("\n", 1)[0]
    return {**meta, "title": title, "description": description, "tags": _fit_tags(list(meta.get("tags") or []))}


def generate(source_name: str, hints: dict, transcript: dict | None, cfg: dict, work_dir: Path) -> dict:
    prompt = build_user_prompt(source_name, hints, transcript)
    raw = call_claude(prompt, cfg, cwd=work_dir)
    meta = assemble(raw, hints, cfg, (transcript or {}).get("duration"))
    (work_dir / "metadata.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return meta
