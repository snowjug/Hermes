"""Placeholder data/lyrics.json and data/audio.json from the episode's script (no audio needed), so the
plates can be previewed and checked before the voice exists. align_vo.py and audio_vo.py overwrite both.

    EPISODE=<id> python analysis/approx_data.py
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ep import EP  # noqa: E402

spec = json.loads((EP / "script.json").read_text(encoding="utf-8"))
t, lines = 0.3, []
for l in spec["lines"]:
    ws = []
    for w in l["text"].split(" "):
        d = 0.055 * len(w) + 0.09
        ws.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d + 0.02
        if w[-1] in ".?:,":
            t += 0.16
    lines.append({"text": l["text"], "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
    t += 0.42
dur = round(t + 0.8, 3)
n = int(dur * 100)
beats = [round(i * 0.5, 3) for i in range(int(dur / 0.5) + 1)]
(EP / "data" / "lyrics.json").write_text(json.dumps({"source": "approx", "lines": lines}, ensure_ascii=False), encoding="utf-8")
(EP / "data" / "audio.json").write_text(json.dumps({"duration": dur, "bpm": 120.0, "beats": beats, "downbeats": beats[::4], "sections": [], "fps": 100,
    **{k: [0.0] * n for k in ("rms", "vocal", "low", "mid", "high", "drums", "bass", "other")}, "onsets": {"vocal": [], "kick": [], "snare": [], "hat": []}}), encoding="utf-8")
print(f"{EP.name}: approx {dur}s; line starts: " + ", ".join(f"{l['start']:.1f}" for l in lines))
