"""Write an episode's captions as SRT from its word timings (data/lyrics.json), for YouTube Studio's
Subtitles > Upload file > With timing. Uploaded captions use the on-screen spelling of names and
numbers, which the automatic captions get wrong.

usage: EPISODE=<id> python analysis/make_srt.py [--max 42]
writes episodes/<id>/publish/captions.en.srt
"""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EP = ROOT / "episodes" / os.environ["EPISODE"]
MAX = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 42


def stamp(t: float) -> str:
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def cues(lines):
    """One cue per phrase: words are added until the next would pass MAX characters, and a cue
    closes after a sentence or clause ends once it holds a few words."""
    for line in lines:
        cur = []
        for w in line["words"]:
            text = " ".join(x["w"] for x in cur + [w])
            if cur and len(text) > MAX:
                yield cur
                cur = []
            cur.append(w)
            if len(cur) >= 3 and w["w"][-1] in ".?!:;" or len(cur) >= 4 and w["w"][-1] == ",":
                yield cur
                cur = []
        if cur:
            yield cur


lines = json.loads((EP / "data" / "lyrics.json").read_text(encoding="utf-8"))["lines"]
out = list(cues(lines))
srt = []
for i, ws in enumerate(out):
    start = ws[0]["start"]
    end = ws[-1]["end"] + 0.25
    if i + 1 < len(out):
        end = min(end, out[i + 1][0]["start"] - 0.02)
    srt.append(f"{i + 1}\n{stamp(start)} --> {stamp(end)}\n{' '.join(w['w'] for w in ws)}\n")
dst = EP / "publish" / "captions.en.srt"
dst.write_text("\n".join(srt), encoding="utf-8")
print(f"{dst.relative_to(ROOT)}: {len(srt)} cues")
