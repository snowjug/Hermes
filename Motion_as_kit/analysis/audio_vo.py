"""data/audio.json for the voiceover: the engine's audio API (envelopes, onsets, a beat grid) for a
track that has no music. The envelopes are the voice's loudness (rms, vocal) and three bands; the
'vocal' onsets are the word starts from data/lyrics.json; the beat grid is a nominal 120 BPM (the
scenes time everything from the words, the grid only feeds generic helpers).

    python -m uv run --no-project --with numpy python analysis/audio_vo.py
"""
import json, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR, FPS = 16000, 100
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ROOT / "audio" / "voiceover.mp3"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
y = np.frombuffer(raw, dtype=np.float32)
dur = len(y) / SR
hop = SR // FPS
n = int(np.ceil(dur * FPS))
win = np.hanning(2 * hop)
pad = np.concatenate([np.zeros(hop), y, np.zeros(3 * hop)])
spec = np.abs(np.fft.rfft(np.stack([pad[i * hop: i * hop + 2 * hop] * win for i in range(n)]), axis=1))
freqs = np.fft.rfftfreq(2 * hop, 1 / SR)


def norm(x):
    x = np.convolve(x, np.ones(3) / 3, mode="same")
    p = np.percentile(x, 99.5)
    return np.clip(x / (p + 1e-9), 0, 1)


rms = norm(np.sqrt((spec ** 2).mean(1)))
bands = {k: norm(spec[:, (freqs >= a) & (freqs < b)].mean(1)) for k, (a, b) in {"low": (60, 300), "mid": (300, 2000), "high": (2000, 8000)}.items()}
lyr = json.loads((ROOT / "data" / "lyrics.json").read_text(encoding="utf-8"))
words = [w for l in lyr["lines"] for w in l["words"] if w["end"] > w["start"]]
vocal_on = [[round(w["start"], 3), round(float(rms[min(n - 1, int(w["start"] * FPS) + 3)]), 3)] for w in words]
line_on = [[round(l["start"], 3), 1.0] for l in lyr["lines"]]
period = 0.5
beats = [round(i * period, 3) for i in range(int(dur / period) + 1)]
out = {
    "duration": round(dur, 3), "bpm": 120.0, "beat_period": period, "time_signature": 4,
    "beats": beats, "downbeats": beats[::4],
    "sections": [{"name": f"l{i}", "start": l["start"], "end": l["end"]} for i, l in enumerate(lyr["lines"])],
    "fps": FPS,
    "rms": rms.round(4).tolist(), "vocal": rms.round(4).tolist(),
    "low": bands["low"].round(4).tolist(), "mid": bands["mid"].round(4).tolist(), "high": bands["high"].round(4).tolist(),
    "drums": [0.0] * n, "bass": [0.0] * n, "other": [0.0] * n,
    "onsets": {"vocal": vocal_on, "kick": line_on, "snare": [], "hat": []},
    "notes": "Voiceover only (no music). 'kick' onsets are line starts; 'vocal' onsets are word starts; the beat grid is nominal.",
}
(ROOT / "data" / "audio.json").write_text(json.dumps(out), encoding="utf-8")
print(f"duration {dur:.2f}s, {n} frames, {len(vocal_on)} word onsets, {len(beats)} beats")
