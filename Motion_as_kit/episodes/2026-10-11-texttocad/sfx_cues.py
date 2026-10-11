# The sound cue sheet of the text-to-cad video, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut,
# jitter, DUR in scope). Keys for the prompts and code, a motor hum under every print with a sizzle at the nozzle,
# clicks for the UI, soft impacts when parts and headlines land, pen lines for dimensions and drawings.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def fly(t, db=-25, pan=0.0, rate=1.0):
    cue(t, "whoosh_soft", db, pan=pan, rate=rate)


def land(t, db=-22, rate=1.0):
    cue(t, "impact_small", db, rate=rate)


def click(t, db=-22, pan=0.0):
    cue(t, "mouse_click", db, pan=pan)


def keys(t0, t1, db=-28, pan=0.0):
    typing("key_click", t0, t1, db, pan=pan)


def blip(t, db=-25, rate=1.0, pan=0.0):
    cue(t, "ui_blip", db, rate=rate, pan=pan)


# ---- HOOK
w = Wd("Type one sentence")
keys(w("Type")["start"], w("sentence")["end"] + 0.2, -27)
cue(w("sentence")["end"] + 0.25, "enter_key", -23)
t0, t1 = w("designs")["start"] - 0.05, w("print.")["start"] + 0.15
bed("projector_run", t0, t1, -30)
cue(t0, "spark_ignite", -27)
cue(t0 + 0.1, "spark_sizzle", -31, length=t1 - t0, fade=0.2)
cue(w("3D")["start"], "ui_blip", -24, rate=1.2)
fly(w("print.")["end"] + 0.05, -23)
land(w("print.")["end"] + 0.5, -23)
land(W("Type one sentence", "You", 1)["start"] + 0.8, -21, rate=0.9)
cue(W("Type one sentence", "You", 1)["start"] + 0.05, "impact_slam", -22, length=0.6, fade=0.2)
cue(W("Type one sentence", "You", 1)["start"] + 0.25, "pen_line", -27)

# ---- NAME
w = Wd("It's called")
cue(w("text-to-cad:")["start"] - 0.03, "impact_slam", -20, length=0.7, fade=0.2)
cue(w("text-to-cad:")["start"] + 0.15, "pen_line", -27)
for k in ["free,", "open", "source,"]:
    blip(w(k)["start"], -25, rate=1.0 + 0.1 * ["free,", "open", "source,"].index(k))
t0, t1 = w("19,000")["start"], w("stars")["end"]
for i in range(16):
    cue(t0 + (t1 - t0) * i / 16, "ui_tick", -31, rate=1.0 + 0.03 * (i % 6))
cue(w("GitHub.")["start"], "confirm_chime", -23)

# ---- PLUGIN
w = Wd("It isn't a website")
fly(cut("It isn't a website") + 0.05, -26, pan=-0.6)
cue(w("website.")["start"] + 0.05, "marker_strike", -23, length=0.45, fade=0.12)
cue(w("plugin")["start"], "whoosh_fast", -24, pan=-0.4)
land(w("plugin")["start"] + 0.45, -22)
for i, k in enumerate(["Claude", "Codex,", "Cursor,", "Gemini", "Grok."]):
    blip(w(k)["start"], -25, rate=0.95 + 0.07 * i, pan=[-0.6, -0.7, 0.6, 0.7, 0.0][i])

# ---- INSTALL
w = Wd("You don't even install")
cue(w("install")["start"], "marker_strike", -24, length=0.4, fade=0.12)
fly(w("tell")["start"] - 0.1, -26, pan=0.4)
keys(w("install", 1)["start"] - 0.05, w("link.")["end"], -28, pan=0.3)
cue(w("link.")["end"] + 0.1, "enter_key", -24, pan=0.3)
cue(max(w("link.")["end"] + 0.15, w("install", 1)["start"] + 1.55), "confirm_chime", -24, pan=0.3)

# ---- ASK
w = Wd("Then you just ask")
keys(w("ask:")["end"], w("holes.")["end"], -29, pan=-0.4)
cue(w("wall")["start"], "scan_sweep", -27, length=0.5, fade=0.15, pan=0.4)
cue(w("40")["start"], "pen_line", -25, pan=0.4)
blip(w("two")["start"], -24, rate=1.1, pan=0.4)
blip(w("holes.")["start"], -25, rate=1.25, pan=0.4)
cue(w("holes.")["end"] + 0.05, "confirm_chime", -25, pan=0.4)

# ---- SCRIPT
w = Wd("Your agent writes")
keys(w("writes")["start"], w("part.")["end"], -29, pan=-0.4)
cue(w("script", 1)["start"], "spark_zip", -25)
fly(w("spin")["start"], -23, pan=0.4)
fly(w("spin")["start"] + 0.7, -26, pan=0.5, rate=1.2)
blip(w("chat.")["start"] - 0.1, -26, pan=0.4)

# ---- PARAM
w = Wd("Every size is a number")
blip(w("size")["start"], -27, pan=-0.4)
t60 = w("60,")["start"]
for i in range(4):
    cue(t60 - 0.3 + i * 0.07, "key_click", -27, pan=-0.4)
for i in range(4):
    cue(t60 + 0.0 + i * 0.1, "key_click", -26, pan=-0.4)
click(w("run")["start"], -20, pan=-0.2)
cue(w("run")["start"] + 0.35, "scan_sweep", -27, length=0.9, fade=0.25, pan=0.4)
cue(w("updates.")["end"], "confirm_chime", -23, pan=0.4)

# ---- FILES
w = Wd("Out comes a real CAD file")
cue(w("file:")["start"], "spark_zip", -25)
cue(w("STEP")["start"], "whoosh_fast", -24, pan=-0.6)
cue(w("STL")["start"] + 0.1, "whoosh_fast", -25, pan=0.6)
cue(w("3MF")["start"] + 0.1, "whoosh_fast", -25, pan=0.7, rate=1.1)
bed("projector_run", w("printer.")["start"], w("printer.")["start"] + 1.6, -31)

# ---- INPUTS
w = Wd("It also works from a photo")
cue(w("photo")["start"] - 0.1, "paper_slide", -24, pan=-0.6)
cue(w("sketch,")["start"] - 0.1, "paper_slide", -25, pan=-0.4)
cue(w("sketch,")["start"], "pen_line", -24, pan=-0.4)
fly(w("sketch,")["end"], -25)
fly(w("pulls")["start"] - 0.1, -25, pan=0.5)
for i, k in enumerate(["screws,", "bearings", "motors"]):
    land(w(k)["start"], -24, rate=1.0 + 0.1 * i)
cue(w("library.")["start"], "confirm_chime", -25, pan=0.5)

# ---- CHECK
w = Wd("Before you print")
cue(w("checks")["start"], "scan_sweep", -24, length=1.0, fade=0.3)
cue(w("walls")["start"], "zap_slash", -26, length=0.35, fade=0.1)
cue(w("overhangs")["start"], "zap_slash", -26, length=0.35, fade=0.1, rate=0.9)
for i in range(4):
    cue(w("support.")["start"] - 0.1 + i * 0.09, "pen_tick", -25)
cue(w("support.")["end"], "confirm_chime", -24, pan=0.5)

# ---- MAKE
w = Wd("It draws dimensioned")
cue(cut("It draws dimensioned") + 0.05, "paper_slide", -23, pan=-0.6)
cue(w("draws")["start"], "pen_line", -24, pan=-0.6)
cue(w("dimensioned")["start"] + 0.2, "pen_tick", -25, pan=-0.6)
cue(w("slices")["start"] - 0.1, "whoosh_fast", -25)
for i in range(14):
    cue(w("slices")["start"] + i * 0.065, "ui_tick", -31, rate=1.0 + 0.02 * i)
fly(w("send")["start"] - 0.1, -24, pan=0.5)
blip(w("send")["start"] + 0.1, -26, pan=0.6)
cue(w("printer.")["end"], "confirm_chime", -23, pan=0.6)
bed("projector_run", w("printer.")["end"], w("printer.")["end"] + 1.6, -31)

# ---- ROBOT
w = Wd("It even writes the files")
bed("projector_run", cut("It even writes the files"), w("reviews")["start"], -34)
for i in range(4):
    blip(w("describe")["start"] + i * 0.18, -27, rate=1.0 + 0.08 * i, pan=-0.5)
fly(w("reviews")["start"], -25, pan=0.4)
cue(w("CNC")["start"], "spark_sizzle", -30, length=1.0, fade=0.3, pan=0.3)
land(w("sheet")["start"] + 0.5, -23, rate=1.1)
cue(w("metal.")["start"], "confirm_chime", -25, pan=0.6)

# ---- TELEMETRY
w = Wd("The catch")
cue(cut("The catch") + 0.02, "impact_slam", -21, length=0.6, fade=0.2)
for i in range(7):
    cue(w("sends")["start"] + i * 0.32, "ui_tick", -30, rate=1.2, pan=-0.3 + 0.1 * i)
cue(w("never")["start"], "marker_strike", -24, length=0.4, fade=0.12)
keys(w("command")["start"], w("off.")["start"], -27)
cue(w("off.")["start"] + 0.08, "enter_key", -23)
cue(w("off.")["start"] + 0.12, "reverse_suck", -26, length=0.5, fade=0.15, pan=0.4)
cue(w("off.")["start"] + 0.2, "confirm_chime", -24)

# ---- WINDOWS
w = Wd("And on Windows")
cue(w("Windows")["start"], "impact_small", -22)
land(w("Smart")["start"], -23, rate=0.9)
cue(w("block")["start"] + 0.12, "stamp", -19)
click(w("Turning")["start"] + 0.2, -21)
cue(w("one-way,")["start"], "ui_blip", -25, rate=0.7)
cue(w("WSL")["start"] - 0.05, "whoosh_fast", -24, pan=0.5)
keys(w("WSL")["start"] + 0.05, w("WSL")["end"] + 0.2, -29, pan=0.5)
cue(w("safer")["start"], "confirm_chime", -23, pan=0.5)

# ---- OUTRO
w = Wd("Your AI just learned CAD")
bed("riser", cut("Your AI just learned CAD") - 0.6, cut("Your AI just learned CAD") + 0.1, -28)
cue(cut("Your AI just learned CAD") + 0.08, "impact_slam", -20, length=0.8, fade=0.3)
for i in range(5):
    land(cut("Your AI just learned CAD") + 0.1 + i * 0.12, -27, rate=1.0 + 0.06 * i)
cue(w("learned")["start"], "spark_zip", -26)
cue(w("every")["start"], "confirm_chime", -24)
