# The sound cue sheet of the AnyPS5 Short (run by analysis/sfx_mix.py). Glitch: a zap and a hit on every
# tear-in, a sweep on every cut, typing for the terminal. The music bed runs under it (episode.json).
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def tear(t, db=-17, rate=1.0):
    cue(t - 0.01, "zap_slash", db - 4, rate=rate, length=0.35, fade=0.1)
    cue(t, "impact_small", db, rate=rate)


# ---- HOOK
w = Wd("PS5 games on a PC")
tear(0.03, -16)
cue(w("PC,")["start"] - 0.06, "scan_sweep", -20, length=0.5, fade=0.15)
tear(w("PC,")["start"], -17, rate=1.05)
cue(w("emulator.")["start"] - 0.01, "impact_slam", -14, length=0.5, fade=0.2)
cue(w("emulator.")["start"], "zap_slash", -20, length=0.4, fade=0.1)

# ---- REWRITE
w = Wd("This free tool rewrites")
cue(cut("This free tool rewrites") - 0.02, "whoosh_fast", -18)
tear(w("free")["start"] - 0.05, -19)
cue(w("rewrites")["start"] - 0.01, "impact_slam", -15, length=0.45, fade=0.2)
tear(w("game")["start"], -20, rate=1.1)
typing("key_click", w("game")["start"], w("game")["start"] + 1.0, -27, step=0.04)
for i in range(8):
    cue(w("Windows")["start"] - 0.1 + i * 0.06, "ui_tick", -24, rate=1.0 + 0.05 * i)
cue(w("program.")["end"], "confirm_chime", -20)

# ---- LANG
w = Wd("The PS5's processor")
cue(cut("The PS5's processor") - 0.02, "scan_sweep", -18, length=0.6, fade=0.15)
cue(w("processor")["start"] - 0.01, "impact_slam", -15, length=0.45, fade=0.2)
tear(w("PC's")["start"], -18, rate=1.05)
tear(w("language.")["start"], -17, rate=0.95)

# ---- LIBS
w = Wd("It just swaps")
cue(cut("It just swaps") - 0.02, "whoosh_fast", -18)
cue(w("swaps")["start"] - 0.06, "impact_slam", -15, length=0.45, fade=0.2)
typing("key_click", cut("It just swaps") + 0.1, cut("It just swaps") + 0.7, -28, step=0.035)
tear(w("own")["start"], -19)
for i in range(3):
    cue(w("versions")["start"] + i * 0.22, "zap_slash", -22, rate=1.0 + 0.08 * i, length=0.3, fade=0.08)
tear(w("Sony's")["start"], -20, rate=0.9)

# ---- FPS
w = Wd("One game works")
cue(cut("One game works") - 0.02, "whoosh_fast", -18)
cue(w("One")["start"] - 0.04, "impact_slam", -14, length=0.5, fade=0.2)
tear(w("works")["start"], -20)
cue(w("frames")["start"] - 0.4, "scan_sweep", -21, length=0.5, fade=0.15)
bed("riser", w("60")["start"] - 0.05, w("60")["start"] + 0.6, -24)
cue(w("60")["start"] + 0.6, "impact_small", -17)
tear(w("GTX")["start"], -19, rate=1.1)

# ---- STARS
w = Wd("GitHub stars in two months")
cue(cut("GitHub stars in two months") - 0.02, "whoosh_fast", -18)
for i in range(12):
    cue(w("16,000")["start"] - 0.1 + i * 0.07, "ui_tick", -24, rate=0.9 + 0.04 * i)
cue(w("16,000")["start"] + 0.8, "impact_small", -17)
tear(w("GitHub")["start"], -19)
cue(w("two")["start"] - 0.01, "impact_slam", -15, length=0.45, fade=0.2)

# ---- NAME
w = Wd("It's called AnyPS5")
cue(cut("It's called AnyPS5") - 0.02, "scan_sweep", -18, length=0.6, fade=0.15)
cue(w("AnyPS5.")["start"] - 0.06, "impact_slam", -14, length=0.5, fade=0.2)
cue(w("AnyPS5.")["start"] - 0.05, "zap_slash", -19, length=0.4, fade=0.1)
typing("key_click", w("AnyPS5.")["end"], w("AnyPS5.")["end"] + 0.6, -27, step=0.035)
tear(w("Bring")["start"], -18)
tear(w("own")["start"], -18, rate=1.05)
cue(w("only")["start"] - 0.01, "impact_slam", -15, length=0.45, fade=0.2)
cue(w("GitHub.")["start"], "confirm_chime", -20)
