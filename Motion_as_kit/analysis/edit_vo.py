"""Edit a one-take voiceover (e.g. an ElevenLabs read) like a dialogue editor: keep the aligned lines,
drop whole lines or the words before a cue, set every pause between lines to the same length, shorten
long pauses inside lines, add a lead-in and a tail, then time-stretch (pitch kept) to a target length.

Reads audio/voice_raw.mp3 and work/lyrics_raw.json (align_vo.py run on the raw take); writes
audio/voiceover.wav and audio/voiceover.mp3. episode.json "edit" options:
    {"drop": [9], "from_word": {"15": "That's"}, "line_gap": 0.42, "inner_max": 0.3,
     "lead": 0.3, "tail": 0.9, "target": 90.0, "max_tempo": 1.06}

    EPISODE=<id> uv run --no-project --with numpy python analysis/edit_vo.py
"""
import json, re, subprocess, sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ep import EP, CONFIG  # noqa: E402

SR = 44100
E = CONFIG.get("edit", {})
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower().replace("’", "'"))


def load(p: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def squeeze(seg: np.ndarray, inner_max: float) -> np.ndarray:
    """Shorten silent runs inside a line to inner_max seconds (cut in the middle of each run)."""
    hop = SR // 100
    n = len(seg) // hop
    if n < 3:
        return seg
    db = 20 * np.log10(np.sqrt((seg[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
    quiet = db < db.max() - 40
    out, i, last = [], 0, 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            run = (j - i) / 100
            if run > inner_max and i > 0 and j < n:
                keep = int(inner_max * SR / 2)
                a, b = i * hop + keep, j * hop - keep
                out.append(seg[last:a])
                last = b
            i = j
        else:
            i += 1
    out.append(seg[last:])
    return np.concatenate([fade(x) for x in out])


def fade(x: np.ndarray, ms: float = 6) -> np.ndarray:
    x = x.copy()
    f = min(len(x) // 2, int(ms / 1000 * SR))
    if f > 0:
        x[:f] *= np.linspace(0, 1, f)
        x[-f:] *= np.linspace(1, 0, f)
    return x


def main() -> int:
    y = load(EP / "audio" / "voice_raw.mp3")
    lines = json.loads((EP / "work" / "lyrics_raw.json").read_text(encoding="utf-8"))["lines"]
    drop = set(E.get("drop", []))
    from_word = {int(k): v for k, v in E.get("from_word", {}).items()}
    gap, inner, lead, tail = E.get("line_gap", 0.42), E.get("inner_max", 0.3), E.get("lead", 0.3), E.get("tail", 0.9)
    parts = [np.zeros(int(lead * SR), np.float32)]
    kept = []
    for li, l in enumerate(lines, 1):
        if li in drop:
            continue
        t0, t1 = l["start"], l["end"]
        if li in from_word:
            w = next(w for w in l["words"] if norm(w["w"]) == norm(from_word[li]))
            t0 = w["start"]
        a, b = max(0, int((t0 - 0.05) * SR)), min(len(y), int((t1 + 0.08) * SR))
        seg = squeeze(fade(y[a:b]), inner)
        if kept:
            parts.append(np.zeros(int(gap * SR), np.float32))
        parts.append(seg)
        kept.append(li)
    parts.append(np.zeros(int(tail * SR), np.float32))
    out = np.concatenate(parts)
    dur = len(out) / SR
    target, mx = E.get("target"), E.get("max_tempo", 1.06)
    tempo = 1.0
    if target and dur > target:
        tempo = min(mx, dur / target)
    tmp = EP / "work" / "edit_tmp.wav"
    import wave
    with wave.open(str(tmp), "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
        wf.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
    # time-stretch with the pitch kept, then a gentle broadcast chain: rumble cut, a little warmth and
    # presence, light compression, de-essing, a limiter
    chain = (f"rubberband=tempo={tempo:.4f}:pitchq=quality," if tempo > 1.0005 else "") + \
        "highpass=f=70,equalizer=f=170:t=q:w=1.0:g=1.2,equalizer=f=3400:t=q:w=1.2:g=1.5," \
        "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=140:makeup=1.5,deesser=i=0.35,alimiter=limit=0.89"
    wav = EP / "audio" / "voiceover.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", chain, "-ar", str(SR), str(wav)], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ar", "44100", "-ac", "1", "-b:a", "192k", str(EP / "audio" / "voiceover.mp3")], check=True)
    tmp.unlink(missing_ok=True)
    final = len(load(wav)) / SR
    print(f"kept lines {kept}; edited {dur:.2f}s; tempo {tempo:.4f}; final {final:.2f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
