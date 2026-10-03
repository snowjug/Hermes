"""Compile a beat sheet + narration timings into a HyperFrames project (index.html + assets).

Everything visual is decided here at build time (positions, times, theme); kit/tdkit.js only replays it on
one GSAP timeline. Two canvases: "short" (1080x1920) and "main" (1920x1080).
"""

from __future__ import annotations

import html
import json
import random
import re
import shutil
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent / "kit"

THEMES = {
    "neon-night": dict(bg1="#0b0b1a", bg2="#1b0f3a", ink="#f5f3ff", muted="#a5a3c9", accent="#22e1ff", accent2="#ff3dac",
                       card="rgba(255,255,255,0.07)", cardLine="rgba(255,255,255,0.14)", capText="#ffffff",
                       display="Anton", body="Inter", caption="Montserrat", shirt="#ff3dac", skin="#ffffff", line="#f5f3ff"),
    "sunset-pop": dict(bg1="#ff6a3d", bg2="#ffb347", ink="#1d0f0a", muted="#5b2d1c", accent="#2b1055", accent2="#ffffff",
                       card="rgba(255,255,255,0.85)", cardLine="rgba(29,15,10,0.15)", capText="#ffffff",
                       display="Bebas Neue", body="Poppins", caption="Montserrat", shirt="#2b1055", skin="#fff7ec", line="#1d0f0a"),
    "cyber-yellow": dict(bg1="#0a0a0a", bg2="#1c1c1c", ink="#fafafa", muted="#9a9a9a", accent="#ffe600", accent2="#ff4d4d",
                         card="rgba(255,255,255,0.06)", cardLine="rgba(255,230,0,0.35)", capText="#ffffff",
                         display="Anton", body="Space Grotesk", caption="Montserrat", shirt="#ffe600", skin="#ffffff", line="#fafafa"),
    "mint-paper": dict(bg1="#eafff5", bg2="#c9f7e4", ink="#0c2b22", muted="#3d6b5d", accent="#00a86b", accent2="#ff5a36",
                       card="#ffffff", cardLine="rgba(12,43,34,0.12)", capText="#0c2b22",
                       display="Poppins", body="Inter", caption="Montserrat", shirt="#00a86b", skin="#ffffff", line="#0c2b22"),
    "ocean-glass": dict(bg1="#031a3a", bg2="#0a4d8c", ink="#eef6ff", muted="#9cc3e8", accent="#4dd8ff", accent2="#ffd84d",
                        card="rgba(255,255,255,0.10)", cardLine="rgba(255,255,255,0.22)", capText="#ffffff",
                        display="Montserrat", body="Inter", caption="Montserrat", shirt="#4dd8ff", skin="#ffffff", line="#eef6ff"),
    "retro-terminal": dict(bg1="#020b04", bg2="#06200e", ink="#c8ffd4", muted="#5fae74", accent="#39ff6a", accent2="#ffcf3a",
                           card="rgba(57,255,106,0.06)", cardLine="rgba(57,255,106,0.35)", capText="#e9ffee",
                           display="JetBrains Mono", body="JetBrains Mono", caption="Montserrat", shirt="#39ff6a", skin="#e9ffee", line="#c8ffd4"),
    "candy": dict(bg1="#ffd6ec", bg2="#d9c2ff", ink="#2a0f3d", muted="#6b4a85", accent="#8a2be2", accent2="#ff2e88",
                  card="#ffffff", cardLine="rgba(42,15,61,0.12)", capText="#2a0f3d",
                  display="Poppins", body="Poppins", caption="Montserrat", shirt="#ff2e88", skin="#ffffff", line="#2a0f3d"),
    "mono-bold": dict(bg1="#f4f4f0", bg2="#e6e6df", ink="#111111", muted="#555555", accent="#ff2d2d", accent2="#111111",
                      card="#ffffff", cardLine="rgba(0,0,0,0.12)", capText="#111111",
                      display="Anton", body="Inter", caption="Montserrat", shirt="#ff2d2d", skin="#ffffff", line="#111111"),
}

POSES = {  # rotations in degrees; right arm negative = raise to the viewer's right
    "idle": dict(armL=12, foreL=8, armR=-12, foreR=-8, head=0, browL=0, browR=0),
    "talk": dict(armL=28, foreL=-40, armR=-22, foreR=30, head=2, browL=0, browR=0),
    "point": dict(armL=12, foreL=8, armR=-128, foreR=-12, head=-4, browL=0, browR=0),
    "point_left": dict(armL=112, foreL=12, armR=-14, foreR=-10, head=5, browL=0, browR=0),
    "shock": dict(armL=150, foreL=20, armR=-150, foreR=-20, head=0, browL=-14, browR=14),
    "think": dict(armL=18, foreL=10, armR=-38, foreR=-138, head=-7, browL=-8, browR=4),
    "shrug": dict(armL=62, foreL=-95, armR=-62, foreR=95, head=8, browL=-10, browR=10),
    "thumbs": dict(armL=14, foreL=8, armR=-65, foreR=-100, head=4, browL=0, browR=0),
    "celebrate": dict(armL=160, foreL=-15, armR=-160, foreR=15, head=0, browL=-6, browR=6),
    "present": dict(armL=12, foreL=8, armR=-80, foreR=-25, head=-3, browL=0, browR=0),
    "facepalm": dict(armL=14, foreL=8, armR=-30, foreR=-150, head=10, browL=10, browR=-10),
}
POSE_NAMES = sorted(POSES)
GHOST = {"bullets": "⚡", "stat": "📈", "versus": "⚔️", "code": "⌨️", "steps": "🧭", "verdict": "⭐", "quote": "💬",
         "title": "✨"}
BEAT_TYPES = ["hook", "title", "screenshot", "bullets", "stat", "versus", "code", "steps", "verdict", "cta", "quote"]

MASCOT_ORIGINS = {"armL": "165 240", "foreL": "165 318", "armR": "235 240", "foreR": "235 318", "head": "200 205",
                  "browL": "174 110", "browR": "226 110", "body": "200 400"}


def mascot_svg() -> str:
    return """<svg id="bit" viewBox="0 0 400 640" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="200" cy="622" rx="120" ry="14" fill="rgba(0,0,0,0.18)"/>
  <g id="bit-jump"><g id="bit-body">
    <g stroke="var(--m-line)" stroke-width="14" stroke-linecap="round" fill="none">
      <path d="M200 400 L162 512 L150 600"/><path d="M200 400 L240 512 L256 600"/>
    </g>
    <rect x="148" y="212" width="104" height="196" rx="46" fill="var(--m-shirt)" stroke="var(--m-line)" stroke-width="10"/>
    <text x="200" y="330" text-anchor="middle" font-family="Anton" font-size="46" fill="var(--m-shirt-ink)">&lt;/&gt;</text>
    <g id="bit-armL"><path d="M165 240 L165 318" stroke="var(--m-line)" stroke-width="14" stroke-linecap="round"/>
      <g id="bit-foreL"><path d="M165 318 L165 392" stroke="var(--m-line)" stroke-width="14" stroke-linecap="round"/>
        <circle cx="165" cy="402" r="15" fill="var(--m-skin)" stroke="var(--m-line)" stroke-width="8"/></g></g>
    <g id="bit-armR"><path d="M235 240 L235 318" stroke="var(--m-line)" stroke-width="14" stroke-linecap="round"/>
      <g id="bit-foreR"><path d="M235 318 L235 392" stroke="var(--m-line)" stroke-width="14" stroke-linecap="round"/>
        <circle cx="235" cy="402" r="15" fill="var(--m-skin)" stroke="var(--m-line)" stroke-width="8"/></g></g>
    <g id="bit-head">
      <path d="M200 70 L200 40" stroke="var(--m-line)" stroke-width="8" stroke-linecap="round"/>
      <circle id="bit-bulb" cx="200" cy="32" r="12" fill="var(--m-shirt)" stroke="var(--m-line)" stroke-width="6"/>
      <circle cx="200" cy="140" r="74" fill="var(--m-skin)" stroke="var(--m-line)" stroke-width="10"/>
      <circle cx="152" cy="168" r="11" fill="#ff8fa3" opacity="0.55"/><circle cx="248" cy="168" r="11" fill="#ff8fa3" opacity="0.55"/>
      <g id="bit-eyeL"><ellipse cx="174" cy="135" rx="10" ry="14" fill="#141414"/><circle cx="178" cy="129" r="3.5" fill="#fff"/></g>
      <g id="bit-eyeR"><ellipse cx="226" cy="135" rx="10" ry="14" fill="#141414"/><circle cx="230" cy="129" r="3.5" fill="#fff"/></g>
      <path id="bit-browL" d="M160 112 L188 108" stroke="#141414" stroke-width="6" stroke-linecap="round"/>
      <path id="bit-browR" d="M212 108 L240 112" stroke="#141414" stroke-width="6" stroke-linecap="round"/>
      <g id="bit-mouth"><ellipse cx="200" cy="178" rx="20" ry="15" fill="#3a0d12"/><ellipse cx="200" cy="186" rx="11" ry="5" fill="#ff5c7a"/></g>
    </g>
  </g></g>
  <g id="bit-fx-bang" transform="translate(300 40)"><path d="M0 0 L12 70" stroke="var(--m-accent2)" stroke-width="16" stroke-linecap="round"/><circle cx="16" cy="96" r="9" fill="var(--m-accent2)"/></g>
  <g id="bit-fx-q" transform="translate(296 128)"><text font-family="Anton" font-size="96" fill="var(--m-accent)">?</text></g>
  <g id="bit-fx-spark" transform="translate(70 60)"><path d="M0 -30 L8 -8 L30 0 L8 8 L0 30 L-8 8 L-30 0 L-8 -8 Z" fill="var(--m-accent2)"/></g>
</svg>"""


def esc(s: str) -> str:
    return html.escape(str(s), quote=True)


def fmt_num(v: float) -> tuple[str, int]:
    dec = 0 if float(v).is_integer() else (1 if abs(v * 10 - round(v * 10)) < 1e-6 else 2)
    return f"{v:.{dec}f}", dec


# ---------------------------------------------------------------- word lookup

def _norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def word_time(line: dict, word: str | None, default: float, after: float = 0.0) -> float:
    """Start time of the first occurrence of `word` in the line at or after `after`; default if absent."""
    if word:
        target = _norm(word.split()[0])
        for w in line["words"]:
            if w["start"] >= after - 1e-6 and target and _norm(w["w"]).startswith(target):
                return w["start"]
    return default


# ---------------------------------------------------------------- beat builders

class Builder:
    def __init__(self, fmt: str, theme: dict, shots: dict, rng: random.Random):
        self.fmt = fmt
        self.theme = theme
        self.shots = shots
        self.rng = rng
        self.sfx: list[tuple[float, str, float]] = []
        self.n = 0

    def uid(self, prefix: str) -> str:
        self.n += 1
        return f"{prefix}-{self.n}"

    def a(self, anim: str, t: float | str, **extra) -> str:
        attrs = f'data-anim="{anim}" data-at="{t if isinstance(t, str) else f"{t:.3f}"}"'
        for k, v in extra.items():
            attrs += f' data-{k}="{esc(v)}"'
        return attrs

    # Each builder returns inner HTML for the stage; t0/t1 are the beat's absolute start/end.
    def hook(self, b: dict, line: dict, t0: float, t1: float) -> str:
        raw = b.get("text") or line["text"]
        words = esc(raw)
        longest = max((len(w) for w in raw.split()), default=6)
        size = int(min(132, (900 if self.fmt == "short" else 1150) / max(longest, 1) * 1.55, 2400 / max(len(raw), 1) * 1.9))
        icon = esc(b.get("icon") or "")
        self.sfx += [(t0, "impact-bass-1", 0.55), (t0, "whoosh-cinematic", 0.35)]
        return (f'<div class="burst" {self.a("ring", t0 + 0.05)}></div>'
                f'<div class="flashfill" {self.a("flash", t0)}></div>'
                + (f'<div class="hook-icon" {self.a("drop", t0 + 0.15)}>{icon}</div>' if icon else "")
                + f'<div class="hook-text" style="font-size:{size}px" {self.a("slam", t0)}>{words}</div>')

    def title(self, b: dict, line: dict, t0: float, t1: float) -> str:
        raw = b.get("text") or ""
        name = esc(raw)
        tag = esc(b.get("label") or "")
        longest = max((len(w) for w in re.split(r"[\s]+", raw)), default=8)
        size = int(min(170 if self.fmt == "short" else 180, (1800 if self.fmt == "short" else 2600) / max(longest, 1),
                       (4200 if self.fmt == "short" else 5200) / max(len(raw), 1) * 1.6))
        self.sfx.append((t0 + 0.1, "sparkle", 0.35))
        chip = f'<div class="chip" {self.a("rise", t0 + 0.35)}>{esc(b.get("icon") or "NEW TOOL")}</div>'
        return (f'<div class="title-wrap">{chip}<div class="tool-name" style="font-size:{size}px" {self.a("pop", t0 + 0.05)}>{name}</div>'
                f'<div class="tagline" {self.a("rise", t0 + 0.5)}>{tag}</div></div>')

    def screenshot(self, b: dict, line: dict, t0: float, t1: float) -> str:
        key = b.get("shot") or "site"
        shot = self.shots.get(f"{key}-{'mobile' if self.fmt == 'short' else 'desktop'}") or self.shots.get(f"{key}-desktop") \
            or next(iter(self.shots.values()), None)
        if not shot:
            return self.bullets({"items": [{"text": b.get("label") or line["text"][:60]}]}, line, t0, t1)
        dur = max(1.0, t1 - t0)
        self.sfx.append((t0, "whoosh-short", 0.4))
        dist = max(0, int(shot["h_scaled"] - shot["frame_h"]))
        img = (f'<img class="shot-img" src="{esc(shot["file"])}" alt="" '
               + (self.a("scroll", t0 + 0.4, dist=min(dist, int(shot["frame_h"] * 0.9)), dur=dur - 0.4) if dist > 40
                  else self.a("kenburns", t0, scale=1.1, dur=dur)) + ">")
        label = esc(b.get("label") or "")
        frame_cls = "phone" if self.fmt == "short" else "browser"
        bar = ('<div class="browser-bar"><i></i><i></i><i></i><span>' + esc(shot.get("host", "")) + "</span></div>"
               if frame_cls == "browser" else '<div class="notch"></div>')
        return (f'<div class="device {frame_cls}" {self.a("whip", t0)}>{bar}<div class="viewport">{img}</div></div>'
                + (f'<div class="shot-label" {self.a("pop", t0 + 0.45)}>{label}</div>' if label else ""))

    def bullets(self, b: dict, line: dict, t0: float, t1: float) -> str:
        items = b.get("items") or []
        out, after = [], t0
        span = max(0.35, (t1 - t0) / max(len(items), 1))
        for i, it in enumerate(items[:4]):
            t = t0 + 0.12 if i == 0 else max(after + 0.35, word_time(line, it.get("cue"), t0 + i * span, after=after))
            after = t + 0.01
            self.sfx.append((t, "pop", 0.35))
            out.append(f'<div class="bullet" {self.a("pop", t)}><span class="b-icon">{esc(it.get("icon") or "✓")}</span>'
                       f'<span class="b-text">{esc(it.get("text", ""))}</span></div>')
        head = f'<div class="beat-head" {self.a("rise", t0)}>{esc(b["label"])}</div>' if b.get("label") else ""
        return f'<div class="bullets">{head}{"".join(out)}</div>'

    def stat(self, b: dict, line: dict, t0: float, t1: float) -> str:
        value = float(b.get("value") or 0)
        unit = ""
        if b.get("suffix") and b["suffix"].strip()[:1].isalpha() and len(b["suffix"].strip()) > 2:
            unit, b = b["suffix"].strip(), {**b, "suffix": ""}  # "389" big, "POINTS" underneath; "10x" stays inline
        txt, dec = fmt_num(value)
        t = t0 + 0.12
        cnt = max(0.9, min(1.8, word_time(line, b.get("cue"), t0 + 1.2) - t))
        self.sfx += [(t, "riser", 0.25), (t + cnt, "impact-bass-2", 0.4)]
        return (f'<div class="stat"><div class="stat-num" {self.a("pop count", f"{t:.3f} {t:.3f}", to=txt, dec=dec, pre=b.get("prefix", ""), suf=b.get("suffix", ""), dur=round(cnt, 2))}>'
                f'{esc(b.get("prefix", ""))}{txt}{esc(b.get("suffix", ""))}</div>'

                + (f'<div class="stat-unit" {self.a("rise", t + 0.2)}>{esc(unit)}</div>' if unit else "")
                + f'<div class="stat-label" {self.a("rise", t + 0.35)}>{esc(b.get("label", ""))}</div></div>')

    def versus(self, b: dict, line: dict, t0: float, t1: float) -> str:
        left, right = b.get("left") or {}, b.get("right") or {}
        tr = min(word_time(line, right.get("cue"), t0 + (t1 - t0) * 0.45), t0 + (t1 - t0) * 0.55)
        self.sfx += [(t0, "whoosh-short", 0.35), (tr, "whoosh", 0.4)]

        def col(side: dict, cls: str, t: float, mark: str) -> str:
            rows = "".join(f'<div class="vs-row"><span>{mark}</span>{esc(x)}</div>' for x in (side.get("items") or [])[:3])
            return (f'<div class="vs-col {cls}" {self.a("rise", t)}><div class="vs-title">{esc(side.get("title", ""))}</div>{rows}</div>')

        return (f'<div class="versus">{col(left, "old", t0 + 0.1, "✗")}'
                f'<div class="vs-badge" {self.a("stamp", tr - 0.15)}>VS</div>{col(right, "new", tr, "✓")}</div>')

    def code(self, b: dict, line: dict, t0: float, t1: float) -> str:
        cmd = b.get("command") or b.get("text") or ""
        n = max(len(cmd), 1)
        span = min(1.6, max(0.6, (t1 - t0) * 0.5))
        chars = "".join(f'<span class="ch" {self.a("show", t0 + 0.3 + span * i / n)}>{esc(c) if c != " " else "&nbsp;"}</span>'
                        for i, c in enumerate(cmd))
        self.sfx.append((t0 + 0.3, "typing", 0.35))
        label = esc(b.get("label") or "terminal")
        return (f'<div class="terminal" {self.a("rise", t0)}><div class="term-bar"><i></i><i></i><i></i><span>{label}</span></div>'
                f'<div class="term-body"><span class="prompt">$</span>{chars}<span class="caret"></span></div></div>')

    def steps(self, b: dict, line: dict, t0: float, t1: float) -> str:
        items = (b.get("items") or [])[:3]
        span = max(0.4, (t1 - t0) / max(len(items), 1))
        out, after = [], t0
        for i, it in enumerate(items):
            t = t0 + 0.12 if i == 0 else max(after + 0.35, word_time(line, it.get("cue"), t0 + i * span, after=after))
            after = t + 0.01
            self.sfx.append((t, "click", 0.35))
            out.append(f'<div class="step" {self.a("rise", t)}><div class="step-n">{i + 1}</div>'
                       f'<div class="step-t">{esc(it.get("text", ""))}</div></div>')
        return f'<div class="steps">{"".join(out)}</div>'

    def verdict(self, b: dict, line: dict, t0: float, t1: float) -> str:
        score = max(0.0, min(10.0, float(b.get("value") or 7)))
        self.sfx += [(t0 + 0.2, "riser", 0.2), (t0 + 1.1, "chime", 0.35)]
        good = esc(b.get("good_for") or "")
        skip = esc(b.get("skip_if") or "")
        return (f'<div class="verdict"><div class="v-head" {self.a("rise", t0)}>{esc(b.get("label") or "VERDICT")}</div>'
                f'<div class="meter"><div class="meter-fill" {self.a("grow", t0 + 0.2, to=score / 10, dur=0.9)}></div></div>'
                f'<div class="v-score" {self.a("pop count", f"{t0 + 0.2:.3f} {t0 + 0.2:.3f}", to=f"{score:g}", dec=0 if score.is_integer() else 1, suf="/10", dur=0.9)}>{score:g}/10</div>'
                + (f'<div class="v-line good" {self.a("rise", t0 + 1.0)}><b>✓</b>{good}</div>' if good else "")
                + (f'<div class="v-line bad" {self.a("rise", t0 + 1.5)}><b>✗</b>{skip}</div>' if skip else "") + "</div>")

    def cta(self, b: dict, line: dict, t0: float, t1: float) -> str:
        self.sfx.append((t0, "notification", 0.45))
        text = esc(b.get("text") or ("Follow for a new tool every day" if self.fmt == "short" else "Subscribe for a new tool every day"))
        return (f'<div class="cta"><div class="bell" {self.a("pop", t0)}>🔔</div><div class="bell-ring" {self.a("ring", t0 + 0.2)}></div>'
                f'<div class="cta-text" {self.a("rise", t0 + 0.15)}>{text}</div></div>')

    def quote(self, b: dict, line: dict, t0: float, t1: float) -> str:
        self.sfx.append((t0, "whoosh-short", 0.3))
        return (f'<div class="quote" {self.a("rise", t0)}><div class="q-mark">“</div><div class="q-text">{esc(b.get("text", ""))}</div>'
                f'<div class="q-src">{esc(b.get("label", ""))}</div></div>')


# ---------------------------------------------------------------- captions

def caption_groups(lines: list[dict], emphasis: list[set[str]], max_words: int) -> list[dict]:
    groups = []
    for line, em in zip(lines, emphasis):
        words = line["words"]
        i = 0
        while i < len(words):
            chunk = words[i:i + max_words]
            # Break early after punctuation so groups read as phrases.
            for k, w in enumerate(chunk[:-1]):
                if re.search(r"[,.!?;:]$", w["w"]):
                    chunk = chunk[:k + 1]
                    break
            groups.append({"words": chunk, "em": em, "start": chunk[0]["start"], "end": chunk[-1]["end"]})
            i += len(chunk)
    # Each phrase holds a moment after its last word, but phrases never overlap on screen.
    for g in groups:
        g["show"] = max(0.0, g["start"] - 0.06)
    for a, b in zip(groups, groups[1:]):
        a["hide"] = max(a["end"], min(a["end"] + 0.35, b["show"] - 0.02))
        b["show"] = max(b["show"], a["hide"] + 0.01)
    if groups:
        groups[-1]["hide"] = groups[-1]["end"] + 0.35
    return groups


# ---------------------------------------------------------------- assembly

def compose(project: Path, *, fmt: str, sheet: dict, voice: list[dict], shots: dict, theme_name: str,
            tool_label: str, seed: str) -> Path:
    """Write project/index.html (+ copies of kit assets and voice files already in project/assets)."""
    rng = random.Random(seed)
    theme = THEMES[theme_name]
    W, H = (1080, 1920) if fmt == "short" else (1920, 1080)
    duration = round(voice[-1]["start"] + voice[-1]["duration"] + 0.6, 3)
    b = Builder(fmt, theme, shots, rng)

    # Beats: one or more per line; each lasts until the next beat starts.
    beats = []
    for i, (line, spec) in enumerate(zip(voice, sheet["lines"])):
        line_beats = spec.get("beats") or [spec.get("beat") or {"type": "bullets", "items": [{"text": line["text"][:50]}]}]
        after = line["start"]
        for j, beat in enumerate(line_beats):
            t = line["start"] if j == 0 else word_time(line, beat.get("at_word"), line["start"] + (line["duration"] * j / len(line_beats)), after)
            after = t + 0.01
            beats.append((t, beat, line))
    stage_html = []
    for k, (t0, beat, line) in enumerate(beats):
        t1 = beats[k + 1][0] if k + 1 < len(beats) else duration
        kind = beat.get("type") if beat.get("type") in BEAT_TYPES else "bullets"
        inner = getattr(b, kind)(beat, line, t0, t1)
        ghost = beat.get("icon") or GHOST.get(kind, "")
        if ghost and kind not in ("hook", "screenshot", "cta", "stat"):
            inner = (f'<div class="ghost" {b.a("pop", t0)}><span {b.a("bob", t0, dur=max(0.6, t1 - t0))}>{esc(ghost)}</span></div>'
                     + inner)
        if k > 0 and kind not in ("hook",):
            b.sfx.append((t0, rng.choice(["whoosh-short", "whoosh"]), 0.25))
        stage_html.append(f'<div id="beat-{k:02}" class="beat clip beat-{kind}" data-start="{t0:.3f}" data-duration="{max(0.1, t1 - t0):.3f}" '
                          f'data-track-index="{2 + k % 2}"><div class="beat-inner" {b.a("punch", t0)}>{inner}</div></div>')

    # Mascot poses per line, plus gesture changes on cue words.
    poses = []
    default_point = "point" if fmt == "short" else "point_left"
    for line, spec in zip(voice, sheet["lines"]):
        name = spec.get("pose") or "talk"
        name = default_point if name == "point" else name
        rot = POSES.get(name, POSES["talk"])
        entry = {"t": round(line["start"], 3), "rot": rot}
        if name in ("shock", "celebrate"):
            entry["jump"] = True
            entry["fx"] = "#bit-fx-bang" if name == "shock" else "#bit-fx-spark"
        if name == "think":
            entry["fx"] = "#bit-fx-q"
            entry["bulb"] = True
        poses.append(entry)
        # A small talking gesture mid-line keeps him alive on long lines.
        if line["duration"] > 2.6 and name in ("talk", "present", "idle"):
            mid = line["words"][len(line["words"]) // 2]["start"]
            poses.append({"t": round(mid, 3), "rot": POSES["present" if name == "talk" else "talk"], "d": 0.35, "ease": "power2.inOut"})
    poses.sort(key=lambda p: p["t"])
    blinks = [round(x, 2) for x in _blink_times(duration, rng)]
    mouth = [{"t": line["start"], "fps": 20, "v": line["env"]} for line in voice]

    # Captions.
    emph = [{_norm(w) for w in (spec.get("emphasis") or [])} for spec in sheet["lines"]]
    groups = caption_groups(voice, emph, 3 if fmt == "short" else 4)
    cap_html = []
    for g in groups:
        spans = "".join(
            f'<span class="cw{" em" if _norm(w["w"]) in g["em"] else ""}" data-s="{w["start"]:.3f}" data-e="{w["end"]:.3f}">{esc(w["w"])}</span> '
            for w in g["words"])
        cap_html.append(f'<div id="cap-{len(cap_html):03}" class="capgroup clip" data-start="{g["show"]:.3f}" '
                        f'data-duration="{max(0.15, g["hide"] - g["show"]):.3f}" data-track-index="6"><div class="capline">{spans}</div></div>')

    # Audio: narration lines + sound effects (deduplicated, capped).
    audio = []
    for i, line in enumerate(voice, 1):
        audio.append(f'<audio id="vo-{i:02}" src="assets/voice/{line["path"]}" data-start="{line["start"]:.3f}" '
                     f'data-duration="{line["duration"]:.3f}" data-track-index="10" data-volume="1"></audio>')
    used, last = set(), -9.0
    for n, (t, name, vol) in enumerate(sorted(b.sfx)):
        if t - last < 0.18 and name in ("pop", "click", "whoosh-short", "whoosh"):
            continue
        last = t
        used.add(name)
        audio.append(f'<audio id="sfx-{n:03}" src="assets/sfx/{name}.mp3" data-start="{max(0, t):.3f}" '
                     f'data-duration="{min(2.5, duration - t):.3f}" data-track-index="{11 + n % 5}" data-volume="{vol}"></audio>')

    # Assets.
    (project / "assets" / "sfx").mkdir(parents=True, exist_ok=True)
    for name in used:
        shutil.copy2(KIT / "sfx" / f"{name}.mp3", project / "assets" / "sfx" / f"{name}.mp3")
    shutil.copytree(KIT / "fonts", project / "fonts", dirs_exist_ok=True)
    shutil.copy2(KIT / "gsap.min.js", project / "gsap.min.js")

    data = {"duration": duration, "theme": {k: theme[k] for k in ("accent", "accent2", "capText")},
            "mascot": {"origins": MASCOT_ORIGINS, "poses": poses, "blinks": blinks, "mouth": mouth}}
    css = (KIT / "fonts.css").read_text(encoding="utf-8") + (KIT / "tdkit.css").read_text(encoding="utf-8")
    vars_css = (":root{" + ";".join([
        f"--bg1:{theme['bg1']}", f"--bg2:{theme['bg2']}", f"--ink:{theme['ink']}", f"--muted:{theme['muted']}",
        f"--accent:{theme['accent']}", f"--accent2:{theme['accent2']}", f"--card:{theme['card']}",
        f"--cardline:{theme['cardLine']}", f"--captext:{theme['capText']}",
        f"--f-display:'{theme['display']}'", f"--f-body:'{theme['body']}'", f"--f-caption:'{theme['caption']}'",
        f"--m-shirt:{theme['shirt']}", f"--m-skin:{theme['skin']}", f"--m-line:{theme['line']}",
        f"--m-accent:{theme['accent']}", f"--m-accent2:{theme['accent2']}",
        f"--m-shirt-ink:{'#111' if theme_name in ('cyber-yellow', 'retro-terminal', 'ocean-glass') else '#fff'}",
    ]) + "}")
    shot = shots.get("site-mobile" if fmt == "short" else "site-desktop") or shots.get("site-desktop")         or shots.get("github-mobile" if fmt == "short" else "github-desktop")
    backdrop = (f'<div class="backdrop"><img src="{esc(shot["file"])}" alt="" '
                f'{b.a("kenburns", 0, scale=1.18, y=-120, dur=duration)}></div>') if shot else ""
    progress = (f'<div class="progress"><div class="progress-fill" {b.a("grow", 0, to=1, dur=duration)}></div></div>'
                if fmt == "short" else "")
    doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width={W}, height={H}" />
<script src="gsap.min.js"></script>
<style>
{css}
{vars_css}
</style>
</head>
<body class="{fmt} theme-{theme_name}">
<div id="root" data-composition-id="main" data-start="0" data-duration="{duration}" data-width="{W}" data-height="{H}">
  <div id="bg" class="bg clip" data-start="0" data-duration="{duration}" data-track-index="0">
    <div class="bg-grad"></div><div class="bg-grid"></div>
    {backdrop}
    <div class="blob b1" {b.a("bob", 0, dur=duration)}></div><div class="blob b2" {b.a("bob", 0.6, dur=duration - 0.6)}></div>
  </div>
  <div id="topbar" class="topbar clip" data-start="0" data-duration="{duration}" data-track-index="1">
    <div class="brand" {b.a("drop", 0.2)}><span class="dot"></span>TOOL OF THE DAY</div>
    <div class="toolchip" {b.a("drop", 0.35)}>{esc(tool_label)}</div>
    {progress}
  </div>
  <div class="stage">
    {"".join(stage_html)}
  </div>
  <div id="mascot" class="mascot clip" data-start="0" data-duration="{duration}" data-track-index="5">{mascot_svg()}</div>
  <div class="captions">{"".join(cap_html)}</div>
  {"".join(audio)}
</div>
<script>window.TD_DATA = {json.dumps(data)};</script>
<script>
{(KIT / "tdkit.js").read_text(encoding="utf-8")}
</script>
</body>
</html>
"""
    out = project / "index.html"
    out.write_text(doc, encoding="utf-8")
    return out


def _blink_times(duration: float, rng: random.Random) -> list[float]:
    t, out = 1.2, []
    while t < duration - 0.3:
        out.append(t)
        t += rng.uniform(2.4, 4.2)
    return out
