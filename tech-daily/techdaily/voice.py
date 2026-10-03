"""Narration: Kokoro TTS (one model load for all lines), exact word timings, and a mouth envelope.

Word timings come from faster-whisper run on each synthesized line, then aligned back onto the script's
own words, so captions show the script's spelling and every visual cue lands on the spoken word.
"""

from __future__ import annotations

import difflib
import logging
import re
from functools import lru_cache
from pathlib import Path

import numpy as np
import soundfile as sf

log = logging.getLogger(__name__)

KOKORO_MODEL = Path.home() / ".cache" / "hyperframes" / "tts" / "models" / "kokoro-v1.0.onnx"
KOKORO_VOICES = Path.home() / ".cache" / "hyperframes" / "tts" / "voices" / "voices-v1.0.bin"
ENVELOPE_FPS = 20
LINE_GAP = 0.12  # silence between lines, seconds


@lru_cache(maxsize=1)
def _kokoro():
    from kokoro_onnx import Kokoro

    return Kokoro(str(KOKORO_MODEL), str(KOKORO_VOICES))


@lru_cache(maxsize=1)
def _whisper():
    from faster_whisper import WhisperModel

    return WhisperModel("base.en", device="cpu", compute_type="int8")


def _norm(word: str) -> str:
    return re.sub(r"[^a-z0-9%$.]", "", word.lower()).strip(".")


def script_words(text: str) -> list[str]:
    return [w for w in re.split(r"\s+", text.strip()) if w]


def align(script: list[str], heard: list[dict], duration: float) -> list[dict]:
    """Give every script word a start/end, using matched recognised words and interpolating the rest."""
    a = [_norm(w) for w in script]
    b = [_norm(h["w"]) for h in heard]
    times: list[tuple[float, float] | None] = [None] * len(script)
    for block in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_matching_blocks():
        for k in range(block.size):
            h = heard[block.b + k]
            times[block.a + k] = (h["start"], h["end"])
    # Interpolate gaps by character length between known neighbours.
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
        total = sum(weights)
        t = left
        for k, wgt in zip(range(i, j), weights):
            d = span * wgt / total
            times[k] = (t, t + d)
            t += d
        i = j
    out = []
    for w, (s, e) in zip(script, times):
        out.append({"w": w, "start": round(max(0.0, s), 3), "end": round(min(duration, max(e, s + 0.05)), 3)})
    return out


def envelope(audio: np.ndarray, sr: int) -> list[float]:
    """Mouth openness 0..1 at ENVELOPE_FPS, from smoothed RMS."""
    hop = sr // ENVELOPE_FPS
    frames = len(audio) // hop + 1
    rms = np.array([np.sqrt(np.mean(audio[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(audio) else 0.0
                    for i in range(frames)])
    if rms.max() > 0:
        rms = rms / np.percentile(rms[rms > 0], 95)
    rms = np.clip(rms, 0, 1)
    smooth = np.convolve(rms, [0.25, 0.5, 0.25], mode="same")
    return [round(float(v), 2) if v > 0.12 else 0.0 for v in smooth]


def synthesize(lines: list[str], voice: str, speed: float, out_dir: Path) -> list[dict]:
    """Write one wav per line; return [{path, start, duration, words, env}] with absolute starts."""
    out_dir.mkdir(parents=True, exist_ok=True)
    kokoro = _kokoro()
    whisper = _whisper()
    t = 0.0
    result = []
    for i, text in enumerate(lines, 1):
        audio, sr = kokoro.create(text, voice=voice, speed=speed, lang="en-us" if voice[:1] in "a" else "en-gb")
        path = out_dir / f"line-{i:02}.wav"
        sf.write(str(path), audio, sr)
        duration = len(audio) / sr
        # No initial_prompt: feeding the script as a prompt makes Whisper echo it, doubling "heard" words.
        segments, _ = whisper.transcribe(str(path), language="en", word_timestamps=True, vad_filter=False,
                                         beam_size=1, condition_on_previous_text=False)
        heard = [{"w": w.word.strip(), "start": w.start, "end": w.end} for s in segments for w in (s.words or [])]
        words = align(script_words(text), heard, duration)
        result.append({"path": path.name, "start": round(t, 3), "duration": round(duration, 3), "text": text,
                       "words": [{**w, "start": round(t + w["start"], 3), "end": round(t + w["end"], 3)} for w in words],
                       "env": envelope(audio, sr)})
        log.info("voice line %d: %.1fs, %d/%d words heard", i, duration, len(heard), len(words))
        t += duration + LINE_GAP
    return result
