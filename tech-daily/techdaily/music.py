"""Original background music, synthesised from scratch with numpy, so it carries no licence or Content ID risk.

Each mood picks a tempo, progression and instrument set; the seed varies the key, voicings and patterns so
no two episodes share a track. The bed is mixed low and ducked under the narration by `mix_under_voice`.
"""

from __future__ import annotations

import hashlib
import subprocess
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

from .config import tool

SR = 44100

# Chords as scale-degree triads/sevenths in semitones from the key root.
PROGRESSIONS = {
    "pop": [[9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14]],             # vi IV I V
    "minor": [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]],          # i VI III VII
    "jazzy": [[2, 5, 9, 12], [7, 11, 14, 17], [0, 4, 7, 11], [9, 12, 16, 19]],  # ii7 V7 Imaj7 vi7
    "lift": [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]],            # I V vi IV
    "cinema": [[0, 3, 7], [5, 8, 12], [8, 12, 15], [7, 11, 14]],          # i iv VI V
}


@dataclass
class Mood:
    bpm: float
    progressions: list[str]
    pad: float
    keys: float          # electric-piano chords
    pluck: float         # arpeggio
    bass: float
    drums: float
    hats: float
    brightness: float    # lowpass cutoff scale
    reverb: float


MOODS = {
    "calm": Mood(74, ["lift", "jazzy"], pad=0.9, keys=0.5, pluck=0.25, bass=0.35, drums=0.0, hats=0.0,
                 brightness=0.5, reverb=0.35),
    "lofi": Mood(82, ["jazzy", "pop"], pad=0.35, keys=0.8, pluck=0.0, bass=0.5, drums=0.55, hats=0.35,
                 brightness=0.35, reverb=0.25),
    "upbeat": Mood(112, ["lift", "pop"], pad=0.45, keys=0.3, pluck=0.7, bass=0.55, drums=0.6, hats=0.45,
                   brightness=0.8, reverb=0.2),
    "cinematic": Mood(66, ["cinema", "minor"], pad=1.0, keys=0.0, pluck=0.3, bass=0.45, drums=0.2, hats=0.0,
                      brightness=0.45, reverb=0.5),
    "electronic": Mood(100, ["minor", "pop"], pad=0.6, keys=0.0, pluck=0.75, bass=0.6, drums=0.55, hats=0.5,
                       brightness=0.9, reverb=0.25),
}


def _hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def _env(n: int, attack: float, release: float) -> np.ndarray:
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    env = np.ones(n, dtype=np.float32)
    env[:a] = np.linspace(0, 1, min(a, n), dtype=np.float32)[: min(a, n)]
    if r < n:
        env[-r:] *= np.linspace(1, 0, r, dtype=np.float32)
    return env


def _lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    """Second-order Butterworth lowpass."""
    b, a = butter(2, min(cutoff, SR / 2.2), fs=SR)
    return lfilter(b, a, x).astype(np.float32)


def _saw_additive(freq: float, n: int, harmonics: int = 10, detune_cents: float = 0.0) -> np.ndarray:
    t = np.arange(n, dtype=np.float32) / SR
    f = freq * 2 ** (detune_cents / 1200)
    out = np.zeros(n, dtype=np.float32)
    for h in range(1, harmonics + 1):
        if f * h > SR / 2.5:
            break
        out += np.sin(2 * np.pi * f * h * t + h * 0.7).astype(np.float32) / h
    return out


def _pad_chord(notes: list[int], n: int, rng: np.random.Generator) -> np.ndarray:
    out = np.zeros(n, dtype=np.float32)
    for m in notes:
        for d in (-7, 0, 6):
            out += _saw_additive(_hz(m), n, harmonics=8, detune_cents=d + rng.uniform(-2, 2))
    return out / (len(notes) * 3) * _env(n, 0.6, 0.8)


def _epiano(freq: float, n: int) -> np.ndarray:
    t = np.arange(n, dtype=np.float32) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 6)
    trem = 1 + 0.15 * np.sin(2 * np.pi * 4.5 * t)
    return (tone * np.exp(-t * 1.6) * trem).astype(np.float32) * _env(n, 0.005, 0.15)


def _pluck(freq: float, n: int, rng: np.random.Generator, damping: float = 0.996) -> np.ndarray:
    """Karplus-Strong string, vectorised one period at a time."""
    period = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, period).astype(np.float32)
    out = np.empty(n, dtype=np.float32)
    pos = 0
    while pos < n:
        take = min(period, n - pos)
        out[pos:pos + take] = buf[:take]
        buf = damping * 0.5 * (buf + np.roll(buf, -1))
        pos += take
    return out * _env(n, 0.002, 0.05)


def _kick(n: int) -> np.ndarray:
    t = np.arange(n, dtype=np.float32) / SR
    freq = 45 + 75 * np.exp(-t * 30)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return (np.sin(phase) * np.exp(-t * 9)).astype(np.float32)


def _snare(n: int, rng: np.random.Generator) -> np.ndarray:
    t = np.arange(n, dtype=np.float32) / SR
    noise = rng.uniform(-1, 1, n).astype(np.float32)
    noise = noise - _lowpass(noise, 1500)
    return (0.6 * noise * np.exp(-t * 22) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)).astype(np.float32)


def _hat(n: int, rng: np.random.Generator) -> np.ndarray:
    t = np.arange(n, dtype=np.float32) / SR
    noise = rng.uniform(-1, 1, n).astype(np.float32)
    noise = noise - _lowpass(noise, 7000)
    return (noise * np.exp(-t * 60)).astype(np.float32)


def _place(track: np.ndarray, sound: np.ndarray, start: int, gain: float) -> None:
    end = min(len(track), start + len(sound))
    if start < end:
        track[start:end] += sound[: end - start] * gain


def _reverb(x: np.ndarray, amount: float, rng: np.random.Generator, seconds: float = 2.2) -> np.ndarray:
    """Convolution with a decaying-noise impulse response, overlap-add in blocks to keep memory low."""
    if amount <= 0:
        return x
    ir_n = int(seconds * SR)
    t = np.arange(ir_n, dtype=np.float32) / SR
    ir = (rng.uniform(-1, 1, ir_n).astype(np.float32) * np.exp(-t * 3.2 / seconds))
    ir = _lowpass(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    block = 1 << 16
    nfft = 1 << int(np.ceil(np.log2(block + ir_n)))
    irf = np.fft.rfft(ir, nfft)
    wet = np.zeros(len(x) + ir_n, dtype=np.float32)
    for i in range(0, len(x), block):
        seg = x[i:i + block]
        y = np.fft.irfft(np.fft.rfft(seg, nfft) * irf, nfft)[: len(seg) + ir_n].astype(np.float32)
        wet[i:i + len(y)] += y
    return x + amount * wet[: len(x)]


def compose(mood_name: str, seconds: float, seed: str) -> np.ndarray:
    """Return a stereo float32 array of `seconds` of music for `mood_name`."""
    mood = MOODS.get(mood_name, MOODS["calm"])
    rng = np.random.default_rng(int(hashlib.sha256(seed.encode()).hexdigest()[:12], 16))
    root = 45 + int(rng.integers(0, 12))           # A2..G#3 region for the key root
    prog = PROGRESSIONS[mood.progressions[int(rng.integers(0, len(mood.progressions)))]]
    bpm = mood.bpm * rng.uniform(0.96, 1.04)
    beat = 60.0 / bpm
    bar_n = int(4 * beat * SR)
    total = int(seconds * SR) + SR
    bars = int(np.ceil(total / bar_n))

    pad = np.zeros(total, dtype=np.float32)
    keys = np.zeros(total, dtype=np.float32)
    pluck = np.zeros(total, dtype=np.float32)
    bass = np.zeros(total, dtype=np.float32)
    drums = np.zeros(total, dtype=np.float32)

    arp_shape = rng.permutation([0, 1, 2, 1, 2, 0, 2, 1])
    kick_s, snare_s, hat_s = _kick(int(0.45 * SR)), _snare(int(0.25 * SR), rng), _hat(int(0.06 * SR), rng)
    for b in range(bars):
        chord = [root + 12 + x for x in prog[b % len(prog)]]
        start = b * bar_n
        intro_or_outro = b < 2 or b >= bars - 2
        if mood.pad:
            _place(pad, _pad_chord(chord, bar_n + int(0.4 * SR), rng), start, mood.pad)
        if mood.keys:
            for hit in (0, 2.5) if rng.random() < 0.5 else (0, 1.5, 3):
                for m in chord:
                    _place(keys, _epiano(_hz(m + 12), int(1.6 * SR)), start + int(hit * beat * SR), mood.keys / len(chord))
        if mood.pluck and not (b < 1):
            for step in range(8):
                note = chord[arp_shape[step] % len(chord)] + 24
                _place(pluck, _pluck(_hz(note), int(0.5 * SR), rng), start + int(step * beat / 2 * SR), mood.pluck * 0.5)
        if mood.bass and not intro_or_outro:
            t = np.arange(int(1.9 * beat * SR), dtype=np.float32) / SR
            tone = np.tanh(2.2 * np.sin(2 * np.pi * _hz(chord[0] - 12) * t)) * _env(len(t), 0.01, 0.2)
            for hit in (0, 2):
                _place(bass, tone.astype(np.float32), start + int(hit * beat * SR), mood.bass)
        if mood.drums and not intro_or_outro:
            kicks = (0, 1, 2, 3) if mood_name in ("upbeat", "electronic") else (0, 2.5)
            for k in kicks:
                _place(drums, kick_s, start + int(k * beat * SR), mood.drums)
            if mood_name in ("lofi", "upbeat", "electronic"):
                for s in (1, 3):
                    _place(drums, snare_s, start + int(s * beat * SR), mood.drums * 0.55)
        if mood.hats and not intro_or_outro:
            for h in range(8):
                _place(drums, hat_s, start + int(h * beat / 2 * SR), mood.hats * (0.8 if h % 2 else 0.5))

    cutoff = 1800 + 6000 * mood.brightness
    tonal = _lowpass(pad * 0.7 + keys * 0.8 + pluck * 0.6, cutoff) + _lowpass(bass, 400) * 0.9
    tonal = _reverb(tonal, mood.reverb, rng)
    drums = _lowpass(drums, 2500 + 5000 * mood.brightness)  # keep hats soft under a voice
    mono = tonal + drums * 0.7
    # Stereo: short Haas delay on the tonal bed, drums centred.
    d = int(0.012 * SR)
    left = mono
    right = np.concatenate([np.zeros(d, dtype=np.float32), tonal[:-d]]) + drums * 0.7
    stereo = np.stack([left, right], axis=1)[: int(seconds * SR)]
    stereo /= np.max(np.abs(stereo)) + 1e-9
    stereo = np.tanh(stereo * 1.2) * 0.8
    n = len(stereo)
    fade_in, fade_out = min(int(2 * SR), n // 4), min(int(4 * SR), n // 3)
    stereo[:fade_in] *= np.linspace(0, 1, fade_in, dtype=np.float32)[:, None]
    stereo[-fade_out:] *= np.linspace(1, 0, fade_out, dtype=np.float32)[:, None]
    return stereo.astype(np.float32)


def write_music(path: Path, mood: str, seconds: float, seed: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), compose(mood, seconds, seed), SR, subtype="PCM_16")
    return path


def mix_under_voice(video: Path, music: Path, out: Path, *, music_db: float, env: dict) -> Path:
    """Lay the music under the video's audio, ducked while the narration speaks, loudness-normalised
    to YouTube's -14 LUFS. Video is stream-copied."""
    graph = (
        f"[0:a]asplit=2[voice][key];"
        f"[1:a]volume={music_db}dB[bed];"
        f"[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=30:release=450[ducked];"
        f"[voice][ducked]amix=inputs=2:duration=first:normalize=0[mix];"
        f"[mix]loudnorm=I=-14:TP=-1.5:LRA=11[aout]"
    )
    cmd = [tool(env, "ffmpeg"), "-y", "-hide_banner", "-loglevel", "error", "-i", str(video), "-i", str(music),
           "-filter_complex", graph, "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac",
           "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True, env=env)
    return out
