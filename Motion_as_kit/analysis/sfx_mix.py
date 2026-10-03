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
import json, re, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SFX = ROOT / "audio" / "sfx"
SR = 48000
DUR = json.loads((ROOT / "data" / "audio.json").read_text(encoding="utf-8"))["duration"]

# ------------------------------------------------------------------ the script
LY = json.loads((ROOT / "data" / "lyrics.json").read_text(encoding="utf-8"))["lines"]
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


# ================================================================== the magpie video's cue sheet
# Every effect sits on a visual event of a plate (the pen, a click, a stamp, a camera whip), and the
# whole sheet is quieter than the original kit's: the voice carries the video.
P = lambda q: line(q)


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


# ---- MARRIED
w = Wd("The biggest coding agents")
cue(w("The")["start"] - 0.02, "spark_ignite", -24)
m = w("married")
cue(m["start"], "pen_line", -24, length=max(0.3, m["end"] - m["start"]) + 0.05, fade=0.08)
bed("spark_sizzle", m["start"], m["end"] + 0.05, -32)
cue(w("company.")["start"], "marker_strike", -24, length=0.45, fade=0.12)
w = Wd("Codex talks to OpenAI")
cue(w("Codex")["start"] - 0.06, "whoosh_fast", -20)
for q, n in (("Codex", 0), ("OpenAI.", 0), ("Claude", 0), ("Anthropic.", 0)):
    cue(w(q, n)["start"] - 0.1, "ui_blip", -27, pan=-0.4 if q in ("Codex", "Claude") else 0.4)
for q in ("OpenAI.", "Anthropic."):
    t0 = w(q)["start"] + 0.05
    cue(t0, "pen_tick", -25, pan=0.1)
    cue(t0 + 0.24, "pen_tick", -25, pan=0.15, rate=1.1)

# ---- CONFIG (paper)
cue(cut("Want a different model"), "paper_slide", -20)
w = Wd("Want a different model")
cue(w("Get")["start"] - 0.2, "paper_slide", -23, rate=1.1)
for i, q in enumerate(("dig", "through", "config")):
    cue(w(q)["start"], "paper_slide", -21, rate=jitter(i, 0.08), pan=0.3)
cue(w("files.")["start"], "marker_strike", -21, length=0.5, fade=0.12)

# ---- QUESTION
cue(cut("So how does an app"), "whoosh_soft", -24)
w = Wd("So how does an app")
cue(w("app")["start"] - 0.05, "pen_line", -27, length=0.42, fade=0.1)
cue(w("fifteen")["start"], "pen_tick", -26)
cue(w("fifteen")["start"] + 0.12, "ui_tick", -29)
cue(w("Codex")["start"] + 0.02, "whoosh_fast", -21)
for q, pan in (("Codex", -0.4), ("DeepSeek,", 0.4), ("Claude", -0.4), ("Kimi?", 0.4)):
    cue(w(q)["start"] - 0.1, "ui_blip", -27, pan=pan)
cue(w("Kimi?")["end"] - 0.05, "pen_line", -24, length=0.32, fade=0.08)
cue(w("Kimi?")["end"] + 0.3, "pen_tick", -22)

# ---- TITLE
w = Wd("It's called magpie")
mg = w("magpie.")
cue(mg["start"] - 0.005, "impact_slam", -16, length=0.5, fade=0.2)
for i in range(6):
    cue(mg["start"] + (i / 6) * max(0.25, mg["end"] - mg["start"]) * 0.8, "ui_tick", -31, rate=0.9 + 0.05 * i, pan=-0.3 + 0.12 * i)
cue(w("free,")["start"], "ui_blip", -23, pan=-0.3)
cue(w("open")["start"], "ui_blip", -23, pan=0.0, rate=1.08)
cue(w("four")["start"] - 0.1, "pen_line", -27, length=0.4, fade=0.1)
t0, t1 = w("four")["start"], w("stars.")["end"]
for i in range(9):
    cue(t0 + (t1 - t0) * (i / 9) ** 1.6, "ui_tick", -32, rate=1.0 + 0.04 * i, pan=0.4)
cue(t1 - 0.05, "confirm_chime", -24, pan=0.35)
cue(t1 - 0.05, "spark_ignite", -28, pan=0.35)

# ---- MENUBAR
w = Wd("Click its menu bar icon")
cue(w("icon")["start"] + 0.05, "mouse_click", -18, pan=0.35)
cue(w("icon")["end"], "whoosh_soft", -25, rate=1.2)
ta, tb = w("every")["start"], w("machine,")["end"]
for i in range(7):
    cue(ta + (tb - ta) * i / 7, "ui_tick", -32, rate=0.95 + 0.03 * i)
typing("key_click", w("model")["start"], w("to.")["end"] + 0.2, -33, pan=0.15, step=0.06)
w = Wd("Click a model, pick")
cue(w("Click")["start"] + 0.18, "mouse_click", -18, pan=0.1)
cue(w("Click")["start"] + 0.25, "ui_blip", -27, pan=0.1)
cue(w("new")["start"], "mouse_click", -18, pan=0.1, rate=1.05)
cue(w("new")["start"] + 0.12, "confirm_chime", -26, pan=0.1)
cue(w("whole")["start"], "pen_line", -27, length=0.5, fade=0.12)

# ---- FORMATS
cue(cut("The clever part"), "whoosh_soft", -25)
w = Wd("The clever part")
cue(w("underneath.")["start"], "whoosh_soft", -22, rate=0.85)
w = Wd("Codex only speaks")
cue(w("Codex")["start"] - 0.04, "whoosh_fast", -21)
typing("key_click", w("speaks")["start"], w("format.")["end"], -32, pan=-0.35, step=0.07)
typing("key_click", w("speaks", 1)["start"], w("format.", 1)["end"], -32, pan=0.35, step=0.07, start=50)

# ---- GATEWAY
cue(cut("So magpie runs"), "whoosh_soft", -25)
w = Wd("So magpie runs")
cue(w("gateway")["start"], "impact_small", -21)
cue(w("your")["start"], "pen_line", -27, length=0.8, fade=0.15)
for i, q in enumerate(("speaks", "all", "them,")):
    cue(w(q)["start"], "ui_blip", -25, rate=1.0 + 0.06 * i, pan=-0.2 + 0.2 * i)
cue(w("translates")["start"] + 0.1, "spark_zip", -27, length=0.6, fade=0.2)
cue(w("streaming")["start"] + 0.15, "pen_tick", -23, pan=-0.2)
cue(w("calls")["start"] + 0.1, "pen_tick", -23, pan=0.2)

# ---- ADAPTER
cue(cut("Think of it as"), "whoosh_soft", -25)
w = Wd("Think of it as a travel adapter")
cue(w("Think")["start"], "pen_line", -27, length=0.9, fade=0.15, pan=-0.4)
cue(w("travel")["start"], "pen_line", -27, length=0.6, fade=0.12)
cue(w("adapter.")["start"] + 0.1, "pen_line", -29, length=0.5, fade=0.12, pan=0.4)
cue(w("same.")["start"], "marker_strike", -24, length=0.3, fade=0.1, pan=-0.4)
for q, d in (("socket", 0.05), ("be", 0.0), ("anywhere.", 0.15)):
    cue(w(q)["start"] + d, "projector_click", -19, pan=0.4)
    cue(w(q)["start"] + d, "spark_ignite", -30, pan=0.3, rate=1.2)

# ---- PLANS
cue(cut("Even the plans"), "whoosh_soft", -25)
w = Wd("Even the plans")
cue(w("plans")["start"], "paper_slide", -24, pan=-0.3)
cue(w("become")["start"], "whoosh_soft", -22, rate=1.1, pan=0.2)
for i in range(3):
    cue(w("become")["start"] + 0.55 + i * 0.1, "ui_tick", -28, pan=0.5)
cue(w("Claude")["start"], "confirm_chime", -25, pan=0.4)
cue(w("power")["start"], "spark_zip", -27, length=0.5, fade=0.15)
cue(w("key")["start"] - 0.25, "pen_line", -27, length=0.45, fade=0.1)
cue(w("paste.")["start"], "zap_slash", -19)

# ---- KEYS
cue(cut("Add several keys"), "whoosh_soft", -25)
w = Wd("Add several keys")
for i in range(3):
    cue(w("several")["start"] + i * 0.12, "ui_tick", -28, pan=0.4, rate=1.0 + 0.05 * i)
cue(w("credit,")["end"] - 0.05, "ui_blip", -22, rate=0.7, pan=0.4)
cue(w("sits")["start"], "stamp", -13, pan=0.4)
for i in range(2):
    cue(w("sits")["start"] + 0.5 + i, "ui_tick", -31, rate=1.3, pan=0.5)
cue(w("another")["start"], "whoosh_soft", -24, rate=1.2)
cue(w("another")["start"] + 0.2, "confirm_chime", -25, pan=0.4)

# ---- SURGICAL (paper)
cue(cut("And when it edits"), "paper_slide", -20)
w = Wd("And when it edits")
cue(w("edits")["start"] - 0.2, "paper_slide", -23, rate=1.1)
cue(w("only")["start"], "marker_strike", -19, length=0.35, fade=0.1)
typing("typewriter", w("setting")["start"], w("setting")["start"] + 0.45, -27, step=0.05)
for i in range(3):
    cue(w("comments")["start"] + i * 0.12, "pen_tick", -23, pan=-0.5)

# ---- CATCH
cue(cut("The catch?"), "whoosh_fast", -21)
w = Wd("The catch?")
cue(w("catch?")["start"], "impact_small", -19)
for i in range(7):
    cue(w("swap")["start"] + i * 0.11, "ui_tick", -27, rate=1.0 + 0.04 * i)
cue(w("It")["start"], "pen_line", -28, length=0.5, fade=0.12)
cue(w("cheaper")["start"] + 0.2, "impact_small", -24, rate=1.2, pan=0.4)
cue(w("one")["start"] + 0.2, "impact_small", -21, rate=0.8, pan=-0.4)
cue(w("good")["start"], "impact_small", -20, rate=0.7)

# ---- SWITCHBOARD
cue(cut("But if you juggle"), "whoosh_soft", -25)
w = Wd("But if you juggle")
cue(w("switchboard")["start"] - 0.1, "projector_click", -21)
for i in range(4):
    cue(w("switchboard")["start"] + 0.02 * i, "ui_tick", -27, rate=0.95 + 0.05 * i)
for i, (q, d) in enumerate((("switchboard", 0.1), ("you've", 0.0), ("been", 0.0), ("missing.", 0.0))):
    t0 = w(q)["start"] + d
    cue(t0, "pen_line", -28, length=0.32, fade=0.08, pan=-0.3 + 0.2 * i)
    cue(t0 + 0.32, "enter_key", -23, pan=0.3)
w = Wd("That's today's tool")
cue(w("That's")["start"] - 0.02, "whoosh_fast", -19)
cue(w("tool.")["start"], "impact_small", -21)
cue(w("every")["start"], "confirm_chime", -25)
cue(DUR - 0.12, "reverse_suck", -19)
cue(DUR - 0.12, "spark_ignite", -28, rate=1.3, length=0.06, fade=0.03)


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
    vo = decode(ROOT / "audio" / "voiceover.mp3")[:n]
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
    peak = np.abs(mix).max()
    if peak > 0.99:
        mix *= 0.99 / peak
    out = ROOT / "out" / "mix_raw.wav"
    import wave
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
    with wave.open(str(out), "wb") as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
    (ROOT / "out" / "sfx_cues.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
    sfx_rms = float(np.sqrt((bus ** 2).mean())); vo_rms = float(np.sqrt((vo ** 2).mean()))
    print(f"{len(report)} cues; SFX bus {20*np.log10(sfx_rms+1e-9):.1f} dB RMS vs voice {20*np.log10(vo_rms+1e-9):.1f} dB RMS; mix peak {20*np.log10(peak+1e-9):.1f} dBFS")
    # loudness: two-pass loudnorm to -14 LUFS, true peak -1.5
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    j = json.loads(meas[meas.rindex("{"): meas.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
          f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-af", af, "-ar", str(SR), str(ROOT / "out" / "mix.wav")], check=True)
    print(f"input {j['input_i']} LUFS -> -14 LUFS; wrote out/mix.wav")


if __name__ == "__main__":
    main()
