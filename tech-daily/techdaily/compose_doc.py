"""Documentary-style compiler: real footage of the tool, elegant typography, self-drawing diagrams, calm
crossfades, subtle subtitles. No mascot, no sound effects. Same runtime (kit/tdkit.js) as before."""

from __future__ import annotations

import html
import json
import re
import shutil
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent / "kit"

DOC_THEMES = {
    "ink": dict(bg1="#0b0b0d", bg2="#17161a", ink="#f4efe6", muted="#a39d92", accent="#f2b84b", card="rgba(255,255,255,0.05)",
                line="rgba(244,239,230,0.18)", serif="Instrument Serif", sans="Inter Tight"),
    "slate": dict(bg1="#0a1118", bg2="#14212d", ink="#eaf2f8", muted="#8fa3b5", accent="#5cc8ff", card="rgba(255,255,255,0.05)",
                  line="rgba(234,242,248,0.18)", serif="Instrument Serif", sans="Inter Tight"),
    "forest": dict(bg1="#0b1410", bg2="#13221a", ink="#eef5ee", muted="#94ad9c", accent="#a6e36a", card="rgba(255,255,255,0.05)",
                   line="rgba(238,245,238,0.18)", serif="Fraunces", sans="Inter Tight"),
    "paper": dict(bg1="#f3efe6", bg2="#e9e3d6", ink="#1b1916", muted="#6d665b", accent="#d9541e", card="rgba(27,25,22,0.04)",
                  line="rgba(27,25,22,0.18)", serif="Instrument Serif", sans="Inter Tight"),
}
DOC_BEATS = ["footage", "media", "statement", "diagram", "number", "compare", "code", "quote", "title", "end"]


def esc(s) -> str:
    return html.escape(str(s), quote=True)


def _norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def word_time(line: dict, word: str | None, default: float, after: float = 0.0) -> float:
    if word:
        target = _norm(word.split()[0])
        for w in line["words"]:
            if w["start"] >= after - 1e-6 and target and _norm(w["w"]).startswith(target):
                return w["start"]
    return default


class Doc:
    def __init__(self, fmt: str, theme: dict, assets: dict):
        self.fmt, self.theme, self.assets = fmt, theme, assets
        self.footage_offset = 0.0
        self.video_n = 0
        self.media_i = 0

    @staticmethod
    def a(anim: str, t, **extra) -> str:
        s = f'data-anim="{anim}" data-at="{t if isinstance(t, str) else f"{t:.3f}"}"'
        for k, v in extra.items():
            s += f' data-{k}="{esc(v)}"'
        return s

    # Each renderer returns (html, extra_timed_html). Timed media must sit outside the beat clip.
    def footage(self, b, line, t0, t1):
        foot = self.assets.get("footage")
        if not foot:
            return self.media(b, line, t0, t1)
        dur = max(0.5, t1 - t0 + 0.5)
        if self.footage_offset + dur > foot["duration"] - 0.3:
            self.footage_offset = 0.0
        self.video_n += 1
        vid = (f'<div class="foot-wrap" {self.a("pushin fadeOut", f"{t0:.3f} {t1:.3f}", scale=1.07, dur=dur)}>'
               f'<video id="foot-{self.video_n:02}" src="{foot["file"]}" muted playsinline data-start="{t0:.3f}" '
               f'data-duration="{dur:.3f}" data-media-start="{self.footage_offset:.2f}" data-track-index="1"></video></div>')
        self.footage_offset += dur
        label = b.get("label") or ""
        lt = (f'<div class="lower-third" {self.a("riseSoft", t0 + 0.5)}><span class="lt-rule"></span>{esc(label)}</div>'
              if label else "")
        return lt, vid

    def media(self, b, line, t0, t1):
        pool = self.assets.get("media") or []
        shot = None
        if pool:
            shot = pool[self.media_i % len(pool)]
            self.media_i += 1
        else:
            stills = self.assets.get("stills") or {}
            shot = stills.get("site") or stills.get("github")
        if not shot:
            return self.statement({"text": b.get("label") or line["text"]}, line, t0, t1)
        dur = max(1.0, t1 - t0)
        src = f'<div class="media-src">{esc(shot.get("source", ""))}</div>' if shot.get("source") else ""
        label = f'<div class="media-label" {self.a("riseSoft", t0 + 0.4)}>{esc(b["label"])}</div>' if b.get("label") else ""
        fit = " contain" if str(shot["file"]).endswith(".svg") else ""
        return (f'<div class="media-card{fit}" {self.a("fadeSlow", t0)}><img src="{esc(shot["file"])}" alt="" '
                f'{self.a("kenburns", t0, scale=1.06, dur=dur)}></div>{label}{src}'), ""

    def statement(self, b, line, t0, t1):
        words = (b.get("text") or line["text"]).split()
        emph = _norm(b.get("emphasis") or "")
        span = min(0.9, max(0.35, (t1 - t0) * 0.35))
        out = []
        for i, w in enumerate(words):
            t = t0 + 0.15 + span * i / max(len(words), 1)
            cls = "sw em" if emph and _norm(w) == emph else "sw"
            out.append(f'<span class="{cls}" {self.a("riseSoft", t)}>{esc(w)}</span>')
        return f'<div class="statement">{" ".join(out)}</div>', ""

    def title(self, b, line, t0, t1):
        return (f'<div class="titlecard"><div class="tc-kicker" {self.a("riseSoft", t0 + 0.1)}>{esc(b.get("label") or "TODAY")}</div>'
                f'<div class="tc-name" {self.a("riseSoft", t0 + 0.25)}>{esc(b.get("text") or "")}</div>'
                f'<div class="tc-rule" {self.a("grow", t0 + 0.5, to=1, dur=0.8)}></div>'
                f'<div class="tc-sub" {self.a("riseSoft", t0 + 0.7)}>{esc(b.get("sub") or "")}</div></div>'), ""

    def diagram(self, b, line, t0, t1):
        items = (b.get("items") or [])[:4]
        n = max(len(items), 1)
        span = max(0.5, (t1 - t0) / n)
        nodes, after = [], t0
        for i, it in enumerate(items):
            t = t0 + 0.15 if i == 0 else max(after + 0.45, word_time(line, it.get("cue"), t0 + i * span, after))
            after = t
            link = (f'<div class="dg-link"><div class="dg-link-fill" {self.a("grow", t - 0.35, to=1, dur=0.35)}></div></div>'
                    if i else "")
            nodes.append(f'{link}<div class="dg-node" {self.a("riseSoft", t)}><div class="dg-n">{i + 1:02}</div>'
                         f'<div class="dg-t">{esc(it.get("text", ""))}</div></div>')
        head = f'<div class="dg-head" {self.a("riseSoft", t0)}>{esc(b["label"])}</div>' if b.get("label") else ""
        return f'<div class="diagram">{head}<div class="dg-row">{"".join(nodes)}</div></div>', ""

    def number(self, b, line, t0, t1):
        v = float(b.get("value") or 0)
        dec = 0 if v.is_integer() else 1
        txt = f"{v:.{dec}f}"
        cnt = max(0.8, min(1.6, word_time(line, b.get("cue"), t0 + 1.0) - t0))
        return (f'<div class="number"><div class="nm-v" {self.a("fadeSlow count", f"{t0 + 0.1:.3f} {t0 + 0.1:.3f}", to=txt, dec=dec, pre=b.get("prefix", ""), suf=b.get("suffix", ""), dur=round(cnt, 2))}>'
                f'{esc(b.get("prefix", ""))}{txt}{esc(b.get("suffix", ""))}</div>'
                f'<div class="nm-u" {self.a("riseSoft", t0 + 0.3)}>{esc(b.get("unit", ""))}</div>'
                f'<div class="nm-l" {self.a("riseSoft", t0 + 0.5)}>{esc(b.get("label", ""))}</div></div>'), ""

    def compare(self, b, line, t0, t1):
        left, right = b.get("left") or {}, b.get("right") or {}
        tr = min(word_time(line, right.get("cue"), t0 + (t1 - t0) * 0.45), t0 + (t1 - t0) * 0.55)

        def col(side, cls, t):
            rows = "".join(f'<div class="cp-row">{esc(x)}</div>' for x in (side.get("items") or [])[:3])
            return f'<div class="cp-col {cls}" {self.a("riseSoft", t)}><div class="cp-h">{esc(side.get("title", ""))}</div>{rows}</div>'

        return f'<div class="compare">{col(left, "l", t0 + 0.15)}<div class="cp-div"></div>{col(right, "r", tr)}</div>', ""

    def code(self, b, line, t0, t1):
        cmd = b.get("command") or b.get("text") or ""
        n = max(len(cmd), 1)
        span = min(1.4, max(0.6, (t1 - t0) * 0.45))
        chars = "".join(f'<span class="ch" {self.a("show", t0 + 0.4 + span * i / n)}>{esc(c) if c != " " else "&nbsp;"}</span>'
                        for i, c in enumerate(cmd))
        return (f'<div class="term" {self.a("fadeSlow", t0)}><div class="term-bar"><i></i><i></i><i></i></div>'
                f'<div class="term-body"><span class="prompt">$</span>{chars}<span class="caret"></span></div></div>'), ""

    def quote(self, b, line, t0, t1):
        return (f'<div class="dquote" {self.a("fadeSlow", t0)}><div class="dq-t">“{esc(b.get("text", ""))}”</div>'
                f'<div class="dq-s">{esc(b.get("label", ""))}</div></div>'), ""

    def end(self, b, line, t0, t1):
        return (f'<div class="endcard"><div class="ec-t" {self.a("riseSoft", t0 + 0.1)}>{esc(b.get("text") or "One new tool, every day.")}</div>'
                f'<div class="ec-s" {self.a("riseSoft", t0 + 0.6)}>{esc(b.get("label") or ("Follow for tomorrow's" if self.fmt == "short" else "Subscribe for tomorrow's"))}</div></div>'), ""


def caption_groups(lines: list[dict], max_words: int) -> list[dict]:
    groups = []
    for line in lines:
        words, i = line["words"], 0
        while i < len(words):
            chunk = words[i:i + max_words]
            for k, w in enumerate(chunk[:-1]):
                if re.search(r"[,.!?;:]$", w["w"]):
                    chunk = chunk[:k + 1]
                    break
            groups.append({"words": chunk, "start": chunk[0]["start"], "end": chunk[-1]["end"]})
            i += len(chunk)
    for g in groups:
        g["show"] = max(0.0, g["start"] - 0.05)
    for a, b in zip(groups, groups[1:]):
        a["hide"] = max(a["end"], min(a["end"] + 0.3, b["show"] - 0.02))
        b["show"] = max(b["show"], a["hide"] + 0.01)
    if groups:
        groups[-1]["hide"] = groups[-1]["end"] + 0.4
    return groups


def compose_doc(project: Path, *, fmt: str, sheet: dict, voice: dict, assets: dict, theme_name: str, tool_label: str) -> Path:
    theme = DOC_THEMES[theme_name]
    W, H = (1080, 1920) if fmt == "short" else (1920, 1080)
    lines = voice["lines"]
    duration = round(voice["duration"] + 0.8, 3)
    d = Doc(fmt, theme, assets)

    beats = []
    for line, spec in zip(lines, sheet["lines"]):
        specs = spec.get("beats") or [{"type": "statement"}]
        after = line["start"]
        for j, bt in enumerate(specs[:2]):
            t = line["start"] if j == 0 else word_time(line, bt.get("at_word"), line["start"] + line["duration"] / 2, after)
            after = t + 0.01
            beats.append((t, bt))
    beats.sort(key=lambda x: x[0])

    stage, media_html = [], []
    for k, (t0, bt) in enumerate(beats):
        t1 = beats[k + 1][0] if k + 1 < len(beats) else duration
        kind = bt.get("type") if bt.get("type") in DOC_BEATS else "statement"
        line = next(ln for ln in reversed(lines) if ln["start"] <= t0 + 1e-6)
        inner, timed = getattr(d, kind)(bt, line, t0, t1)
        overlap = 0.45 if k + 1 < len(beats) else 0.0
        if timed:
            media_html.append(timed)
        cls = "beat clip beat-" + kind + (" over-footage" if timed else "")
        stage.append(f'<div id="beat-{k:02}" class="{cls}" data-start="{t0:.3f}" data-duration="{max(0.2, t1 - t0 + overlap):.3f}" '
                     f'data-track-index="{3 + k % 2}"><div class="beat-inner" '
                     f'{d.a("fadeSlow pushin", f"{t0:.3f} {t0:.3f}", scale=1.035, dur=round(max(0.5, t1 - t0 + overlap), 2))}>'
                     f'{inner}</div></div>')

    caps = []
    for n, g in enumerate(caption_groups(lines, 3 if fmt == "short" else 6)):
        spans = " ".join(f'<span class="dw" data-s="{w["start"]:.3f}">{esc(w["w"])}</span>' for w in g["words"])
        caps.append(f'<div id="cap-{n:03}" class="dcap clip" data-start="{g["show"]:.3f}" data-duration="{max(0.15, g["hide"] - g["show"]):.3f}" '
                    f'data-track-index="7"><div class="dcap-line">{spans}</div></div>')

    (project / "assets").mkdir(parents=True, exist_ok=True)
    shutil.copytree(KIT / "fonts", project / "fonts", dirs_exist_ok=True)
    shutil.copy2(KIT / "gsap.min.js", project / "gsap.min.js")
    underlay = assets.get("underlay")
    foot = assets.get("footage")
    if foot:  # the real footage keeps playing, dimmed, behind every text scene
        parts, t, n = [], 0.0, 0
        while t < duration:
            seg = min(foot["duration"] - 0.2, duration - t)
            n += 1
            parts.append(f'<video id="under-{n:02}" src="{foot["file"]}" muted playsinline data-start="{t:.3f}" '
                         f'data-duration="{seg:.3f}" data-media-start="0" data-track-index="0"></video>')
            t += seg
        under_html = f'<div class="underlay video">{"".join(parts)}</div>'
    else:
        under_html = (f'<div class="underlay"><img src="{esc(underlay)}" alt="" {d.a("kenburns", 0, scale=1.12, y=-60, dur=duration)}></div>'
                      if underlay else "")
    t = theme
    vars_css = (":root{" + ";".join([f"--bg1:{t['bg1']}", f"--bg2:{t['bg2']}", f"--ink:{t['ink']}", f"--muted:{t['muted']}",
                                     f"--accent:{t['accent']}", f"--card:{t['card']}", f"--line:{t['line']}",
                                     f"--serif:'{t['serif']}'", f"--sans:'{t['sans']}'"]) + "}")
    css = (KIT / "fonts.css").read_text(encoding="utf-8") + (KIT / "doc.css").read_text(encoding="utf-8")
    data = {"duration": duration, "theme": {"accent": t["accent"], "accent2": t["accent"], "capText": t["ink"]}}
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
<body class="{fmt}">
<div id="root" data-composition-id="main" data-start="0" data-duration="{duration}" data-width="{W}" data-height="{H}">
  <div id="bg" class="bg clip" data-start="0" data-duration="{duration}" data-track-index="0"></div>
  {under_html}
  <div id="grain" class="grain clip" data-start="0" data-duration="{duration}" data-track-index="2"></div>
  {"".join(media_html)}
  <div class="stage">{"".join(stage)}</div>
  <div id="vignette" class="vignette clip" data-start="0" data-duration="{duration}" data-track-index="6"></div>
  <div class="captions">{"".join(caps)}</div>
  <audio id="narration" src="assets/voice/{voice["path"]}" data-start="0" data-duration="{voice["duration"]:.3f}" data-track-index="10" data-volume="1"></audio>
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
