"""Documentary-style scripts (Veritasium-like): narration written for the ear, one visual beat per line."""

from __future__ import annotations

import json
from pathlib import Path

from .claude import ask_json
from .compose_doc import DOC_BEATS

FORMATS = {
    "short": dict(words=(60, 90), lines=(6, 10), label="YouTube Short (vertical, 25-35 seconds)",
                  end="Tomorrow, another one."),
    "main": dict(words=(190, 235), lines=(12, 20), label="YouTube video (16:9, about 90 seconds)",
                 end="That's today's tool. There's a new one every day."),
}

SIDE = {"type": "object", "properties": {"title": {"type": "string"}, "items": {"type": "array", "items": {"type": "string"}},
                                          "cue": {"type": "string"}}, "required": ["title", "items"]}
BEAT = {
    "type": "object",
    "properties": {
        "type": {"type": "string", "enum": DOC_BEATS},
        "text": {"type": "string"}, "label": {"type": "string"}, "sub": {"type": "string"}, "emphasis": {"type": "string"},
        "items": {"type": "array", "maxItems": 4, "items": {"type": "object", "properties": {
            "text": {"type": "string"}, "cue": {"type": "string"}}, "required": ["text"]}},
        "value": {"type": "number"}, "prefix": {"type": "string"}, "suffix": {"type": "string"}, "unit": {"type": "string"},
        "cue": {"type": "string"}, "left": SIDE, "right": SIDE, "command": {"type": "string"}, "at_word": {"type": "string"},
    },
    "required": ["type"],
}
SCHEMA = {
    "type": "object",
    "properties": {
        "lines": {"type": "array", "items": {"type": "object", "properties": {
            "text": {"type": "string"}, "beats": {"type": "array", "items": BEAT, "minItems": 1, "maxItems": 2}},
            "required": ["text", "beats"]}},
        "title": {"type": "string"},
        "thumbnail_words": {"type": "string"},
    },
    "required": ["lines", "title", "thumbnail_words"],
}

SYSTEM = """You write narration for a documentary-style tech channel in the spirit of Veritasium: curious,
clear, human, quietly confident. Today: a {label}. A real voice actor will read it, so write for the ear.

Every fact, number, feature and comparison must come from the SOURCES ([S0] holds the platform numbers:
stars, points). Community comments are opinions ("people on Hacker News point out ..."). Never invent.

Voice:
- Conversational and concrete. Mix short sentences with longer ones. Use one good analogy for how it works.
- Ask at most one rhetorical question. Use "we" and "you" naturally.
- Banned words and phrases: insane, crazy, mind-blowing, game-changer, revolutionary, exploding, secret,
  nobody is talking about, you won't believe, smash, literally, hey guys, welcome back, in this video.
- Numbers as people say them ("about four thousand stars", "thirty-three milliseconds").

Structure:
1. Cold open, first sentence, max 12 words: a concrete, surprising observation that delivers on the title
   immediately (not a question to the viewer, not a greeting).
2. The promise / stakes: why this is worth the next {secs} (main: plant an open loop, e.g. "but there's a
   catch, and we'll get to it").
3. Context: the problem it solves and why it is trending now.
4. How it works: one mental model or analogy (diagram beat with 2-4 nodes whose cues are spoken words).
5. Show it: describe what the viewer sees on the real footage of the tool.
6. The catch: one honest limitation from the sources.
7. Payoff: answer the opening; who should try it and who shouldn't.
8. Last line exactly: "{end}" with an end beat.

Rules:
- {w0}-{w1} words total, {l0}-{l1} lines; each line is one or two spoken sentences.
- Beats (on-screen visuals): footage = the real recording of the tool (use it for at least a third of the lines
  when footage is available, each with a short label like "The live view"); media = the project's own demo
  image; statement = one key idea in max 9 words (not a copy of the narration), optional emphasis word;
  diagram = how it works; number = one striking stat from the sources (value, unit, label); compare =
  before/after; code = a real install command from the sources; quote = a community opinion with label =
  where it came from; title once near the start (text = tool name, sub = one-line definition); end last.
- Never the same beat type twice in a row, except footage.
- Narration over footage or media must match what is actually visible (see Available assets). Never say
  "here's the installer" or "here it is running" unless the footage really shows that; otherwise talk about
  the idea while the footage plays, e.g. "the project's page walks through ...".
- On-screen text max 9 words. Every cue / at_word must be a word spoken in that line.
- title: YouTube title, max {tmax} characters, specific and honest, no emojis, no clickbait.
- Available assets: {assets}.
"""


def write_sheet(cfg, fmt: str, plan: dict, sources_text: str, assets: dict, work: Path,
                problems: list[dict] | None = None, previous: dict | None = None) -> dict:
    f = FORMATS[fmt]
    avail = []
    if assets.get("footage"):
        avail.append("footage = screen recording that shows ONLY this: "
                     + (assets["footage"].get("description") or "the tool's page being scrolled"))
    if assets.get("media"):
        avail.append("media images, shown in this order: " + " / ".join(
            f"({i + 1}) {m.get('description') or 'a demo image from the README'}" for i, m in enumerate(assets["media"])))
    if not avail:
        avail.append("no footage or media: use statement, diagram, number, compare, code, quote, title, end")
    system = SYSTEM.format(label=f["label"], end=f["end"], w0=f["words"][0], w1=f["words"][1], l0=f["lines"][0],
                           l1=f["lines"][1], secs="30 seconds" if fmt == "short" else "ninety seconds",
                           tmax=45 if fmt == "short" else 70, assets="; ".join(avail))
    prompt = (f"Tool: {plan['tool_name']}\nAngle: {plan['angle']}\nWhy now: {plan['why_now']}\n\nSOURCES:\n{sources_text}")
    if problems:
        prompt += "\n\nA fact-check rejected these claims:\n" + "\n".join(f"- {p['claim']}: {p['problem']}" for p in problems)
        if previous:
            prompt += ("\n\nPREVIOUS SCRIPT (JSON). Return it with the smallest possible edits: change only the lines and "
                       "on-screen texts carrying rejected claims. Keep everything else exactly.\n"
                       + json.dumps(previous, ensure_ascii=False))
    sheet = ask_json(prompt, SCHEMA, system=system, model=cfg["claude"]["pick_model"], cwd=work, budget_usd=2.0)
    (work / f"sheet-{fmt}.json").write_text(json.dumps(sheet, indent=2, ensure_ascii=False), encoding="utf-8")
    return sheet


def sheet_text(sheet: dict) -> str:
    out = []
    for line in sheet["lines"]:
        out.append(line["text"])
        for b in line["beats"]:
            bits = [b.get(k) for k in ("text", "label", "sub", "command", "unit")]
            bits += [i.get("text") for i in b.get("items") or []]
            if b.get("type") == "number":
                bits.append(f"{b.get('prefix', '')}{b.get('value')}{b.get('suffix', '')}")
            for side in ("left", "right"):
                if b.get(side):
                    bits += [b[side].get("title")] + list(b[side].get("items") or [])
            on = [x for x in bits if x]
            if on:
                out.append("  [on screen] " + " | ".join(str(x) for x in on))
    return "\n".join(out)
