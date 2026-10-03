"""Chatterbox narration (runs in .venv-tts, Python 3.11). Writes narration.wav and prints the voice JSON.

usage: tts_chatterbox.py LINES_JSON OUT_DIR [--exaggeration 0.45] [--cfg 0.5] [--ref voice.wav]
Output shape matches techdaily.voice_el.synthesize: {path, duration, lines: [{text, start, duration, words}]}.
"""

import argparse
import difflib
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

GAP = 0.22  # pause between lines, seconds


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9%$.]", "", w.lower()).strip(".")


def align(script: list[str], heard: list[dict], duration: float) -> list[dict]:
    a, b = [norm(w) for w in script], [norm(h["w"]) for h in heard]
    times = [None] * len(script)
    for blk in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            h = heard[blk.b + k]
            times[blk.a + k] = (h["start"], h["end"])
    i = 0
    while i < len(script):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(script) and times[j] is None:
            j += 1
        left = times[i - 1][1] if i > 0 else 0.0
        right = times[j][0] if j < len(script) else duration
        span = max(right - left, 0.05 * (j - i))
        weights = [max(len(script[k]), 1) for k in range(i, j)]
        t = left
        for k, wgt in zip(range(i, j), weights):
            d = span * wgt / sum(weights)
            times[k] = (t, t + d)
            t += d
        i = j
    return [{"w": w, "start": round(s, 3), "end": round(max(e, s + 0.05), 3)} for w, (s, e) in zip(script, times)]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("lines_json")
    ap.add_argument("out_dir")
    ap.add_argument("--exaggeration", type=float, default=0.45)
    ap.add_argument("--cfg", type=float, default=0.5)
    ap.add_argument("--ref", default=None)
    args = ap.parse_args()
    lines = json.loads(Path(args.lines_json).read_text(encoding="utf-8"))
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    import torch
    from chatterbox.tts import ChatterboxTTS

    torch.set_num_threads(max(1, torch.get_num_threads()))
    model = ChatterboxTTS.from_pretrained(device="cpu")
    sr = model.sr
    chunks, bounds, t = [], [], 0.0
    for text in lines:
        wav = model.generate(text, audio_prompt_path=args.ref, exaggeration=args.exaggeration, cfg_weight=args.cfg)
        a = wav.squeeze(0).cpu().numpy().astype(np.float32)
        chunks += [a, np.zeros(int(GAP * sr), dtype=np.float32)]
        bounds.append((t, len(a) / sr))
        t += len(a) / sr + GAP
        print(f"line done: {len(a) / sr:.1f}s", file=sys.stderr, flush=True)
    audio = np.concatenate(chunks)
    peak = float(np.max(np.abs(audio))) or 1.0
    audio = audio / peak * 0.89
    path = out / "narration.wav"
    sf.write(str(path), audio, sr)
    duration = round(len(audio) / sr, 3)

    from faster_whisper import WhisperModel

    wm = WhisperModel("base.en", device="cpu", compute_type="int8")
    out_lines = []
    for text, (start, length) in zip(lines, bounds):
        seg = audio[int(start * sr): int((start + length) * sr)]
        tmp = out / "_line.wav"
        sf.write(str(tmp), seg, sr)
        segments, _ = wm.transcribe(str(tmp), language="en", word_timestamps=True, beam_size=1,
                                    condition_on_previous_text=False)
        heard = [{"w": w.word.strip(), "start": w.start, "end": w.end} for s in segments for w in (s.words or [])]
        words = align([w for w in text.split() if w], heard, length)
        out_lines.append({"text": text, "start": round(start, 3), "words": [
            {"w": w["w"], "start": round(start + w["start"], 3), "end": round(start + w["end"], 3)} for w in words]})
        tmp.unlink(missing_ok=True)
    for k, ln in enumerate(out_lines):
        nxt = out_lines[k + 1]["start"] if k + 1 < len(out_lines) else duration
        ln["duration"] = round(nxt - ln["start"], 3)
    print(json.dumps({"path": path.name, "duration": duration, "lines": out_lines}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
