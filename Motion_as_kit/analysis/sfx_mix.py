"""Sound design for the voiceover video.

The cue sheet below is derived from data/lyrics.json — the same word times the plates animate on —
so every effect lands on its visual event. The sounds are the ElevenLabs library in audio/sfx/
(name_1.mp3, name_2.mp3 … alternate takes). Each sound is placed by its transient ('onset'), by its
loudest point ('peak', whooshes), by its end ('end', reverse sucks and risers) or as recorded
('raw', beds). Effects are ducked under the voice, then the whole mix is loudness-normalised.

    python -m uv run --no-project --with numpy python analysis/sfx_mix.py
Writes out/mix.wav (48 kHz stereo) and out/sfx_cues.json; mux with:
    ffmpeg -i out/motion-as-code.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest out/…
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ep import EP, CONFIG  # noqa: E402
SFX = ROOT / "audio" / "sfx"
SR = 48000
DUR = json.loads((EP / "data" / "audio.json").read_text(encoding="utf-8"))["duration"]

# ------------------------------------------------------------------ the script
LY = json.loads((EP / "data" / "lyrics.json").read_text(encoding="utf-8"))["lines"]
fold = lambda s: s.lower().replace("’", "'").replace("“", '"').replace("”", '"')
norm = lambda s: re.sub(r"[^a-z0-9()]", "", fold(s))


def line(q, nth=0):
    ls = [l for l in LY if fold(q) in fold(l["text"])]
    return ls[nth]


def W(lq, wq, nth=0):
    ws = [w for w in line(lq)["words"] if norm(w["w"]) == norm(wq)]
    return ws[nth]


def parts(w):
    return w.get("syl") or [[w["start"], w["end"]]]


def cut(q):
    l = line(q)
    i = LY.index(l)
    gap = l["start"] - LY[i - 1]["end"] if i else 1
    return l["start"] - min(0.18, max(0.04, gap * 0.45))


# ------------------------------------------------------------------ the library
MODE = {  # how a sound is placed relative to its cue time
    "whoosh_fast": "peak", "whoosh_soft": "peak", "reverse_suck": "end", "riser": "end",
    "spark_sizzle": "raw", "projector_run": "raw", "tape_rewind": "raw", "tape_ff": "raw", "scan_sweep": "raw", "spark_zip": "raw",
    "falling_pieces": "onset", "paper_slide": "onset",
}
_cache = {}


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def takes(name):
    if name == "tape_ff":  # the rewind, played backwards: a fast-forward
        return [t[::-1].copy() for t in takes("tape_rewind")]
    if name not in _cache:
        fs = sorted(SFX.glob(f"{name}_*.mp3"))
        if not fs:
            raise FileNotFoundError(f"no takes for {name}")
        out = []
        for f in fs:
            x = decode(f)
            x = x - x.mean()
            pk = np.abs(x).max() + 1e-9
            x = x / pk * 10 ** (-1 / 20)  # peak -1 dBFS
            out.append(x)
        _cache[name] = out
    return _cache[name]


def onset(x):
    """Start of the main transient: the first sample above half the peak, less 8 ms of attack
    (a soft pre-noise before the hit must not shift the hit off its frame)."""
    a = np.abs(x)
    idx = np.where(a > 0.5 * a.max())[0]
    return max(0, int(idx[0]) - int(0.008 * SR)) if len(idx) else 0


def peak_at(x):
    env = np.convolve(np.abs(x), np.ones(int(0.02 * SR)) / (0.02 * SR), mode="same")
    return int(np.argmax(env))


def resample(x, rate):
    if abs(rate - 1) < 1e-4:
        return x
    n = int(len(x) / rate)
    return np.interp(np.arange(n) * rate, np.arange(len(x)), x).astype(np.float32)


# ------------------------------------------------------------------ cues
CUES = []
_n = {}


def cue(t, name, db, pan=0.0, rate=1.0, take=None, length=None, fade=0.03, mode=None):
    """Place `name` at time t (seconds). take: 1-based take index (default: alternate)."""
    k = _n.get(name, 0)
    _n[name] = k + 1
    CUES.append(dict(t=float(t), name=name, db=float(db), pan=float(pan), rate=float(rate), take=take if take else None, k=k, length=length, fade=fade, mode=mode or MODE.get(name, "onset")))


def bed(name, t0, t1, db, pan=0.0, rate=1.0, fin=0.06, fout=0.12):
    CUES.append(dict(t=float(t0), name=name, db=float(db), pan=float(pan), rate=float(rate), take=1, k=0, length=float(t1 - t0), fade=fout, fin=fin, mode="bed"))


def jitter(i, a=0.05):
    """Deterministic ±a pitch jitter for repeated sounds."""
    return 1.0 + a * (((i * 7919) % 101) / 50.0 - 1.0)


def typing(name, t0, t1, db, pan=0.0, step=0.075, start=0):
    """Key strikes from t0 to t1 at ~step intervals (with a little swing)."""
    t, i = t0, start
    while t < t1 - 0.01:
        cue(t, name, db + (((i * 37) % 7) - 3) * 0.6, pan=pan, rate=jitter(i))
        t += step * (0.8 + 0.4 * (((i * 53) % 11) / 10.0))
        i += 1
    return i


def type_words(name, words, db, pan=0.0, frac=0.75, per=2.6):
    """Key clicks for words typed as they are said: ~one strike per `per` chars, over frac of each word."""
    i = 0
    for w in words:
        n = max(1, round(len(w["w"]) / per))
        d = max(0.08, (w["end"] - w["start"]) * frac)
        for j in range(n):
            cue(w["start"] + d * j / n, name, db + (((i * 37) % 7) - 3) * 0.5, pan=pan, rate=jitter(i))
            i += 1


# ------------------------------------------------------------------ the episode's cue sheet
_cues = EP / "sfx_cues.py"
exec(compile(_cues.read_text(encoding="utf-8"), str(_cues), "exec"))


# ------------------------------------------------------------------ render the mix
def main():
    n = int(DUR * SR)
    bus = np.zeros((2, n), np.float32)
    report = []
    for c in CUES:
        tk = takes(c["name"])
        x = tk[(c["take"] - 1) % len(tk)] if c["take"] else tk[c["k"] % len(tk)]
        x = resample(x, c["rate"])
        mode = c["mode"]
        if mode == "onset":
            x = x[onset(x):]
            start = c["t"]
        elif mode == "peak":
            start = c["t"] - peak_at(x) / SR
        elif mode == "end":
            start = c["t"] - len(x) / SR
        else:
            start = c["t"]
        if mode == "bed":
            L = int(c["length"] * SR)
            reps = int(np.ceil(L / len(x))) + 1
            x = np.tile(x, reps)[:L].copy()
            fi = int(c.get("fin", 0.06) * SR)
            if fi:
                x[:fi] *= np.linspace(0, 1, fi)
        if c.get("length") and mode != "bed":
            x = x[: int(c["length"] * SR)].copy()
        fo = min(len(x), int(c["fade"] * SR))
        if fo > 1:
            x[-fo:] *= np.linspace(1, 0, fo)
        g = 10 ** (c["db"] / 20)
        a = (c["pan"] + 1) * np.pi / 4
        i0 = int(round(start * SR))
        j0 = max(0, -i0)
        i0 = max(0, i0)
        seg = x[j0:]
        m = min(len(seg), n - i0)
        if m <= 0:
            continue
        bus[0, i0:i0 + m] += seg[:m] * g * np.cos(a)
        bus[1, i0:i0 + m] += seg[:m] * g * np.sin(a)
        report.append({**{k: c[k] for k in ("t", "name", "db", "pan", "rate", "mode")}, "start": round(start, 3)})
    # the voice
    vo = decode(EP / "audio" / "voiceover.mp3")[:n]
    vo = np.pad(vo, (0, n - len(vo)))
    # ducking: effects dip up to 7 dB while the voice is speaking (10 ms attack, 180 ms release)
    hop = int(0.005 * SR)
    env = np.sqrt(np.convolve(vo ** 2, np.ones(hop * 4) / (hop * 4), mode="same"))
    env = env / (np.percentile(env, 99) + 1e-9)
    sm = np.zeros_like(env)
    a_att, a_rel = np.exp(-1 / (0.010 * SR)), np.exp(-1 / (0.180 * SR))
    prev = 0.0
    for i in range(0, n, hop):  # one-pole follower at 5 ms steps
        e = float(env[i])
        coef = a_att if e > prev else a_rel
        coef = coef ** hop
        prev = coef * prev + (1 - coef) * e
        sm[i:i + hop] = prev
    duck = 10 ** (-7 * np.clip(sm, 0, 1) / 20)
    mix = bus * duck[None, :] + vo[None, :]
    # an optional music bed (episode.json "music": {"file", "db" below the voice's RMS, "duck" dB under speech})
    mus = CONFIG.get("music")
    if mus:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(EP / "audio" / mus["file"]), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
        m = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).T.copy()[:, :n]
        m = np.pad(m, ((0, 0), (0, n - m.shape[1])))
        vo_db = 20 * np.log10(np.sqrt((vo[np.abs(vo) > 1e-4] ** 2).mean()) + 1e-9)
        m_db = 20 * np.log10(np.sqrt((m ** 2).mean()) + 1e-9)
        g = 10 ** ((vo_db + mus.get("db", -17) - m_db) / 20)
        fi, fo = int(mus.get("fade_in", 0.6) * SR), int(mus.get("fade_out", 1.8) * SR)
        ramp = np.ones(n, np.float32); ramp[:fi] = np.linspace(0, 1, fi); ramp[n - fo:] = np.linspace(1, 0, fo)
        mduck = 10 ** (-mus.get("duck", 8) * np.clip(sm, 0, 1) / 20)
        mix = mix + m * (g * ramp * mduck)[None, :]
        print(f"music {mus['file']}: {m_db:.1f} dB RMS, gain {20*np.log10(g):.1f} dB, ducked {mus.get('duck', 8)} dB under the voice")
    peak = np.abs(mix).max()
    if peak > 0.99:
        mix *= 0.99 / peak
    out = EP / "out" / "mix_raw.wav"
    import wave
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
    with wave.open(str(out), "wb") as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
    (EP / "out" / "sfx_cues.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
    sfx_rms = float(np.sqrt((bus ** 2).mean())); vo_rms = float(np.sqrt((vo ** 2).mean()))
    print(f"{len(report)} cues; SFX bus {20*np.log10(sfx_rms+1e-9):.1f} dB RMS vs voice {20*np.log10(vo_rms+1e-9):.1f} dB RMS; mix peak {20*np.log10(peak+1e-9):.1f} dBFS")
    # loudness: two-pass loudnorm to -14 LUFS, true peak -1.5
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    j = json.loads(meas[meas.rindex("{"): meas.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
          f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-af", af, "-ar", str(SR), str(EP / "out" / "mix.wav")], check=True)
    print(f"input {j['input_i']} LUFS -> -14 LUFS; wrote out/mix.wav")


if __name__ == "__main__":
    main()
