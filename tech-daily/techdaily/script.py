"""Beat-sheet scripts: narration lines, one visual beat per line, a mascot pose, caption emphasis."""

from __future__ import annotations

import json
from pathlib import Path

from .claude import ask_json
from .compose import BEAT_TYPES, POSE_NAMES

FORMATS = {
    "short": dict(words=(95, 125), lines=(9, 13), cta="Follow for a new tool every day.",
                  label="YouTube Short (vertical, about 45 seconds)"),
    "main": dict(words=(200, 245), lines=(16, 22), cta="Subscribe, there's a new tool every day.",
                 label="YouTube video (16:9, about 90 seconds)"),
}

ITEM = {"type": "object", "properties": {"text": {"type": "string"}, "cue": {"type": "string"}, "icon": {"type": "string"}},
        "required": ["text"]}
SIDE = {"type": "object", "properties": {"title": {"type": "string"}, "items": {"type": "array", "items": {"type": "string"}},
                                          "cue": {"type": "string"}}, "required": ["title", "items"]}
BEAT = {
    "type": "object",
    "properties": {
        "type": {"type": "string", "enum": BEAT_TYPES},
        "text": {"type": "string"}, "label": {"type": "string"}, "icon": {"type": "string"},
        "items": {"type": "array", "items": ITEM, "maxItems": 4},
        "value": {"type": "number"}, "prefix": {"type": "string"}, "suffix": {"type": "string"}, "cue": {"type": "string"},
        "left": SIDE, "right": SIDE, "command": {"type": "string"},
        "shot": {"type": "string", "enum": ["site", "github"]}, "at_word": {"type": "string"},
        "good_for": {"type": "string"}, "skip_if": {"type": "string"},
    },
    "required": ["type"],
}
SCHEMA = {
    "type": "object",
    "properties": {
        "lines": {"type": "array", "items": {"type": "object", "properties": {
            "text": {"type": "string"},
            "pose": {"type": "string", "enum": POSE_NAMES},
            "emphasis": {"type": "array", "items": {"type": "string"}, "maxItems": 2},
            "beats": {"type": "array", "items": BEAT, "minItems": 1, "maxItems": 2},
        }, "required": ["text", "pose", "emphasis", "beats"]}},
        "title": {"type": "string"},
        "thumbnail_words": {"type": "string", "description": "2-4 punchy words for the thumbnail"},
    },
    "required": ["lines", "title", "thumbnail_words"],
}

SYSTEM = """You write scripts for a faceless tech channel hosted by Bit, an animated stickman robot. Today you write
a {label}. The style is a top viral tech Short: fast, punchy, conversational, zero filler. But every fact,
number, feature and comparison must come from the SOURCES. Community comments are opinions: say "people on
Hacker News say ...". Never invent numbers, prices, users, benchmarks or features.

Structure:
1. Line 1 is the HOOK, spoken in the first 2 seconds, max 9 words: a bold, concrete payoff or curiosity gap
   about the tool ("This free tool turns any repo into docs."). No "Did you know", no "In this video", no
   questions to the viewer. Beat type hook: text = 2-5 punchy on-screen words, icon = one emoji.
2. Line 2 raises the stakes: what it replaces or why people are talking about it this week.
3. Show the tool early (title beat once, and a screenshot beat by line 3 when screenshots exist).
4. Two or three standout facts as bullets / stat / versus / code / steps beats.
5. One honest catch or limitation (pose shrug or think).
6. A verdict with a score beat (verdict: value 1-10, good_for, skip_if, each max 6 words).
7. Last line exactly: "{cta}" with a cta beat.

Rules:
- {w0}-{w1} words total, {l0}-{l1} lines, each line 5-14 words, natural spoken English with contractions.
- Write numbers the way they should be spoken; keep units ("33 milliseconds", "10x faster").
- Each line has one beat; a line of 11+ words may have a second beat with at_word = a word from that line.
- Never use the same beat type in two consecutive beats. Screenshot beats: shot = "site" or "github", only
  from the available list, label = max 5 words.
- All on-screen texts (items, labels, titles) max 5 words. Every cue / at_word must be a word that appears in
  that line's text, so the visual lands exactly when it is said.
- stat beats: value is a plain number from the sources, with prefix/suffix (e.g. suffix "ms", "x", "%").
- bullets and steps beats always carry 2-3 items (each with a cue word from the line), never just one.
- code beats only for a real install/run command that appears in the sources.
- pose: pick the emotion (hook usually shock; explaining talk or present; pointing at the screen point;
  catch shrug/think; verdict thumbs; CTA celebrate). emphasis: 1-2 key words from the line.
- title: a YouTube title under 60 characters, specific, no clickbait lies, no emojis.
"""


def write_sheet(cfg, fmt: str, plan: dict, sources_text: str, shots: dict, work: Path,
                problems: list[dict] | None = None, previous: dict | None = None) -> dict:
    f = FORMATS[fmt]
    available = sorted({k.split("-")[0] for k in shots}) or ["none"]
    system = SYSTEM.format(label=f["label"], cta=f["cta"], w0=f["words"][0], w1=f["words"][1],
                           l0=f["lines"][0], l1=f["lines"][1])
    prompt = (f"Tool: {plan['tool_name']}\nAngle: {plan['angle']}\nWhy now: {plan['why_now']}\n"
              f"Available screenshots: {', '.join(available)}\n\nSOURCES:\n{sources_text}")
    if problems:
        prompt += "\n\nA fact-check rejected these claims in your previous script:\n" + "\n".join(
            f"- {p['claim']}: {p['problem']}" for p in problems)
        if previous:
            prompt += ("\n\nPREVIOUS SCRIPT (JSON) below. Return it with the SMALLEST possible edits: change only the "
                       "lines and on-screen texts that carry the rejected claims (soften, attribute or cut them). Keep "
                       "every other line, beat and pose exactly as it is. Do not add any new claims.\n"
                       + json.dumps(previous, ensure_ascii=False))
    sheet = ask_json(prompt, SCHEMA, system=system, model=cfg["claude"]["pick_model"], cwd=work, budget_usd=2.0)
    (work / f"sheet-{fmt}.json").write_text(json.dumps(sheet, indent=2, ensure_ascii=False), encoding="utf-8")
    return sheet


def sheet_text(sheet: dict) -> str:
    """Narration plus every on-screen claim, for fact-checking."""
    out = []
    for line in sheet["lines"]:
        out.append(line["text"])
        for b in line["beats"]:
            bits = [b.get("text"), b.get("label"), b.get("command"), b.get("good_for"), b.get("skip_if")]
            bits += [i.get("text") for i in b.get("items") or []]
            if b.get("type") == "stat":
                bits.append(f"{b.get('prefix', '')}{b.get('value')}{b.get('suffix', '')}")
            for side in ("left", "right"):
                if b.get(side):
                    bits += [b[side].get("title")] + list(b[side].get("items") or [])
            on_screen = [x for x in bits if x]
            if on_screen:
                out.append("  [on screen] " + " | ".join(on_screen))
    return "\n".join(out)
