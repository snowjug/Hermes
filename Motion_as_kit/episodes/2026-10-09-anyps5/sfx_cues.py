# The sound cue sheet of the AnyPS5 video, run by analysis/sfx_mix.py (its helpers: cue, bed, typing,
# W, line, cut, jitter, DUR are in scope). A paper desk: every cutout lands with a paper sound, the marker
# squeaks where it draws, stamps thump. Under it all, the music bed (episode.json "music").
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def land(t, db=-22, pan=0.0, rate=1.0):
    cue(t, "paper_slide", db, pan=pan, rate=rate, length=0.45, fade=0.12)


# ---- HOOK
w = Wd("This tool has one")
land(0.05, -21, pan=-0.4)
cue(0.33, "pen_tick", -27, pan=-0.4)
land(w("PC.")["start"] - 0.12, -21, pan=0.4)
cue(w("running")["start"], "pen_line", -29, length=0.8, fade=0.2)
cue(w("running")["start"] + 0.02, "pen_tick", -26, pan=-0.2)
cue(w("PC.")["start"] + 0.1, "pen_tick", -26, pan=0.3)
t0, t1 = w("Exactly")["start"], w("one.", 1)["end"]
for i in range(11):
    cue(t0 + (t1 - t0) * i / 11, "ui_tick", -27, rate=0.9 + 0.04 * i)
cue(t1 - 0.05, "impact_small", -20)
cue(t0 + 0.05, "marker_strike", -24, length=0.7, fade=0.2)

# ---- STARS
w = Wd("And in two months")
land(cut("And in two months") + 0.02, -22)
land(w("two")["start"] - 0.1, -24, pan=0.5, rate=1.1)
land(w("months,")["start"], -24, pan=0.6, rate=1.05)
bed("riser", w("16,000")["start"] - 0.2, w("GitHub.")["end"], -31)
t0 = w("starred")["start"] - 0.15
for i in range(26):
    cue(t0 + i * 0.045, "ui_tick", -31, rate=1.0 + 0.02 * (i % 7), pan=-0.6 + 0.05 * i)
w = Wd("Here's why")
cue(w("Here's")["start"], "pen_line", -26, length=1.0, fade=0.2)
cue(w("big")["start"], "marker_strike", -25, length=0.5, fade=0.15)
cue(cut("Normally, that takes") - 0.3, "whoosh_soft", -23)
land(cut("Normally, that takes") - 0.25, -22, rate=0.9)

# ---- EMULATE
w = Wd("Normally, that takes")
cue(w("emulation:")["start"], "marker_strike", -24, length=0.6, fade=0.15)
land(w("pretending")["start"], -21, pan=0.3)
cue(w("pretending")["start"] + 0.32, "pen_tick", -25, pan=0.2)
cue(w("pretending")["start"] + 0.4, "pen_tick", -25, pan=0.4)
land(w("translating")["start"] - 0.1, -22, pan=-0.5)
for i in range(6):
    cue(w("translating")["start"] + 0.25 + i * 0.75, "typewriter", -30, length=0.25, fade=0.08, pan=-0.2 + 0.1 * i)
cue(w("instruction")["start"], "ui_blip", -26, rate=0.85)

# ---- RIP
w = Wd("doesn't pretend")
cue(w("AnyPS5")["start"], "impact_small", -20)
cue(w("doesn't")["start"], "whoosh_fast", -20, pan=-0.3)
cue(w("doesn't")["start"] + 0.02, "zap_slash", -27, length=0.35, fade=0.1)
cue(w("pretend.")["start"] - 0.01, "stamp", -15)
cue(w("pretend.")["start"], "impact_slam", -22, length=0.5, fade=0.2)

# ---- CHIP
w = Wd("Inside a PS5")
land(cut("Inside a PS5") + 0.02, -21, pan=-0.3)
cue(w("AMD")["start"], "marker_strike", -24, length=0.7, fade=0.2)
land(w("processor")["start"], -26, pan=0.2, rate=1.1)
land(w("speaks")["start"] - 0.1, -21, pan=0.5)
cue(w("speaks")["start"] + 0.15, "ui_blip", -25, pan=-0.3)
cue(w("PC's")["start"], "ui_blip", -25, pan=0.4, rate=1.1)
cue(w("language,")["start"], "impact_small", -24)
land(w("code")["start"], -25, pan=0.2, rate=1.15)
cue(w("code")["start"], "marker_strike", -27, length=0.6, fade=0.2)
cue(w("is.")["start"], "confirm_chime", -24, pan=0.4)

# ---- MISSING
w = Wd("What's missing")
land(cut("What's missing") + 0.02, -22, pan=-0.4)
cue(cut("What's missing") + 0.12, "pen_tick", -26, pan=-0.4)
t0 = w("Sony's")["start"]
for i in range(6):
    cue(t0 + i * 0.06, "ui_tick", -28, rate=0.95 + 0.05 * i)
for i, q in enumerate(("graphics,", "sound", "controllers.")):
    land(w(q)["start"] - 0.1, -23, pan=0.3, rate=1.0 + 0.05 * i)
    cue(w(q)["start"] - 0.05, "pen_line", -30, length=0.4, fade=0.1)
    cue(w(q)["start"] + 0.2, "pen_tick", -27, pan=0.3)
land(w("controllers.")["start"] + 0.05, -24, pan=0.6)
cue(w("controllers.")["end"] + 0.14, "stamp", -16)

# ---- RELINK
w = Wd("So AnyPS5 rewrites")
cue(w("rewrites")["start"] + 0.1, "stamp", -18)
land(w("Windows")["start"], -22, pan=-0.4)
land(w("Linux")["start"], -22, pan=-0.5, rate=1.08)
land(w("Linux")["start"] + 0.1, -25, pan=-0.6, rate=1.15)
for i in range(3):
    cue(w("reconnects")["start"] + i * 0.15, "pen_line", -29, length=0.45, fade=0.1, pan=0.2 * i)
for i in range(3):
    cue(w("own")["start"] + i * 0.12, "confirm_chime", -30, rate=1.0 + 0.06 * i, pan=0.3)
cue(w("libraries.")["start"], "marker_strike", -26, length=0.8, fade=0.2)

# ---- SHADERS
w = Wd("Graphics too")
bed("typewriter", cut("Graphics too") + 0.1, cut("Graphics too") + 1.6, -32)
land(w("recompiled")["start"], -24, rate=1.1)
cue(w("recompiled")["start"], "marker_strike", -25, length=0.6, fade=0.15)
bed("typewriter", w("recompiled")["end"], w("recompiled")["end"] + 1.0, -32)
cue(w("Vulkan,")["start"], "impact_small", -23)
cue(w("ordinary")["start"], "marker_strike", -25, length=0.7, fade=0.2)
land(w("graphics", 1)["start"] - 0.1, -21, pan=0.4)
cue(w("draw")["start"], "marker_strike", -26, length=0.6, fade=0.2)
cue(cut("Emulation is an interpreter") - 0.3, "whoosh_soft", -23)
land(cut("Emulation is an interpreter") - 0.25, -22, rate=0.9)

# ---- BOOK
w = Wd("Emulation is an interpreter")
land(cut("Emulation is an interpreter") + 0.05, -22, pan=-0.5)
for i in range(5):
    cue(w("whispering")["start"] + i * 0.42, "pen_tick", -26, rate=1.0 + 0.04 * i, pan=-0.3)
cue(w("This")["start"], "whoosh_fast", -22, pan=0.3)
land(w("This")["start"] - 0.05, -21, pan=0.5)
for i in range(4):
    land(w("book")["start"] + i * 0.06, -25, pan=0.3 + 0.1 * i, rate=1.1 + 0.05 * i)
cue(w("once.")["start"], "confirm_chime", -25, pan=0.4)

# ---- PROOF
w = Wd("The only game on its list")
bed("typewriter", cut("The only game on its list") + 0.1, w("platformer:")["end"], -33)
cue(w("Dreaming")["start"], "marker_strike", -24, length=0.7, fade=0.2)
land(w("60")["start"] - 0.12, -21, pan=0.4)
cue(w("60")["start"] + 0.05, "impact_small", -20, pan=0.5)
land(w("36")["start"] - 0.12, -21, pan=0.5)
cue(w("36")["start"] + 0.05, "impact_small", -21, pan=0.6, rate=0.92)

# ---- CATCH
w = Wd("The catch")
t0 = cut("The catch") + 0.05
for i in range(9):
    cue(t0 + i * 0.05, "ui_tick", -27, rate=0.9 + 0.04 * i)
cue(t0 + 0.47, "impact_slam", -21, length=0.4, fade=0.15)
cue(w("game,")["start"], "impact_small", -22)
cue(w("Windows.")["start"], "confirm_chime", -25, pan=-0.3)
land(w("Linux")["start"] - 0.08, -21, pan=0.4)
cue(w("question")["start"], "marker_strike", -22, length=1.0, fade=0.25, pan=0.4)

# ---- WARN
w = Wd("It ships no games")
for i, q in enumerate(("games,", "keys", "firmware,")):
    land(w(q)["start"] - 0.12, -23, pan=-0.5 + 0.3 * i)
    cue(w(q)["start"] + 0.15, "marker_strike", -24, length=0.3, fade=0.08, pan=-0.5 + 0.3 * i)
land(w("need")["start"], -25, rate=1.1)
land(w("download")["start"] - 0.1, -22, pan=-0.2)
cue(w("GitHub:")["start"] + 0.1, "confirm_chime", -24, pan=-0.2)
land(w("fake")["start"] - 0.1, -21, pan=0.5)
cue(w("malware")["start"] - 0.01, "stamp", -15, pan=0.4)
cue(w("malware")["start"], "impact_slam", -22, length=0.5, fade=0.2)
cue(cut("That's today's tool") - 0.3, "whoosh_soft", -23)
land(cut("That's today's tool") - 0.25, -22, rate=0.9)

# ---- OUTRO
w = Wd("That's today's tool")
cue(cut("That's today's tool") + 0.2, "impact_small", -24)
land(w("There's")["start"], -25)
