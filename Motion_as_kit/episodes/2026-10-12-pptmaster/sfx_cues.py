# The sound cue sheet of the PPT Master keynote video, run by analysis/sfx_mix.py (cue, bed, typing, W, line,
# cut, jitter, DUR in scope). Slides whoosh in from depth, headlines land with soft impacts, clicks and keys
# for the UI, a riser into the big reveal, chimes for the ticks; the music bed underneath.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def fly(t, db=-24, pan=0.0, rate=1.0):
    cue(t, "whoosh_soft", db, pan=pan, rate=rate)


def land(t, db=-22, rate=1.0):
    cue(t, "impact_small", db, rate=rate)


def click(t, db=-22, pan=0.0):
    cue(t, "mouse_click", db, pan=pan)


# ---- HOOK
w = Wd("Your presentation is due")
land(0.02, -21)
cue(w("due")["start"], "ui_blip", -20, rate=0.8)
cue(w("due")["start"] + 0.05, "impact_small", -22, rate=0.7)
fly(w("forty-page")["start"] - 0.15, -22, pan=-0.5)
land(w("forty-page")["start"], -23, rate=0.9)
fly(w("zero")["start"] - 0.2, -23, pan=0.5)
cue(w("slides")["start"], "reverse_suck", -26, length=0.5, fade=0.15)

# ---- TURN
w = Wd("This free tool turns")
bed("riser", cut("This free tool turns"), w("turns")["start"] + 0.1, -27)
cue(w("turns")["start"] + 0.1, "impact_slam", -19, length=0.7, fade=0.2)
for i in range(9):
    cue(w("turns")["start"] + 0.12 + i * 0.04, "whoosh_fast", -30, pan=-0.8 + 0.2 * i, rate=1.1 + 0.03 * i)
cue(w("turns")["start"] + 0.2, "spark_zip", -26)
land(w("real")["start"], -22)
cue(w("pictures")["start"] + 0.1, "marker_strike", -24, length=0.4, fade=0.12)
click(w("actually")["start"] + 0.2, -20)
cue(w("edit")["start"], "confirm_chime", -23)

# ---- NAME
w = Wd("It's called")
land(w("PPT")["start"] - 0.08, -19, rate=0.85)
cue(w("PPT")["start"], "spark_zip", -27)
bed("riser", w("59,000")["start"] - 0.05, w("stars")["end"], -29)
t0, t1 = w("59,000")["start"], w("stars")["end"]
for i in range(20):
    cue(t0 + (t1 - t0) * i / 20, "ui_tick", -30, rate=1.0 + 0.03 * (i % 6))
cue(w("stars")["end"], "confirm_chime", -22)

# ---- SKILL
w = Wd("It isn't an app")
land(cut("It isn't an app") + 0.05, -23)
cue(w("app")["start"], "marker_strike", -23, length=0.4, fade=0.12)
fly(w("skill")["start"] - 0.05, -22)
for k in ["Claude", "Cursor", "Codex"]:
    cue(w(k)["start"], "ui_blip", -24, rate=1.0 + 0.08 * ["Claude", "Cursor", "Codex"].index(k), pan=0.5)

# ---- PROMPT
w = Wd("You drop the PDF")
fly(w("drop")["start"], -24, pan=-0.6)
land(w("folder")["start"], -25, rate=1.1)
typing("key_click", w("type")["start"] + 0.1, w("type")["start"] + 1.2, -28, pan=0.3)
cue(w("PPT")["end"], "enter_key", -24, pan=0.3)
cue(w("paste")["start"], "key_click", -22)
cue(w("paste")["start"] + 0.05, "ui_blip", -25)

# ---- PLAN
w = Wd("First, it agrees")
fly(cut("First, it agrees") + 0.02, -24)
for k in ["template", "sixteen", "eight"]:
    cue(w(k)["start"], "ui_tick", -24)
    cue(w(k)["start"] + 0.2, "confirm_chime", -28, rate=1.2)
for i in range(10):
    cue(w("eight")["start"] + i * 0.11, "ui_tick", -31, rate=1.3)

# ---- REASON
w = Wd("Then it reasons")
t0, t1 = w("reasons")["start"], w("shape")["end"]
for i in range(5):
    cue(t0 + (t1 - t0) * i / 5, "ui_blip", -26, rate=0.9 + 0.08 * i, pan=-0.6 + 0.3 * i)
for i in range(5):
    cue(w("designs")["start"] + i * 0.12, "whoosh_fast", -28, pan=-0.6 + 0.3 * i, rate=1.2)
land(w("slides")["start"], -23)

# ---- NATIVE
w = Wd("What comes out")
fly(cut("What comes out") + 0.02, -22)
for k in ["masters", "shapes", "text", "charts", "tables"]:
    click(w(k)["start"], -24)
cue(w("editable")["start"], "confirm_chime", -22)

# ---- CHART
w = Wd("Ask for it")
fly(cut("Ask for it") + 0.02, -23)
click(w("Right-click")["start"], -20, pan=0.4)
click(w("Edit")["start"], -21, pan=0.4)
fly(w("Data")["start"], -24, pan=0.6)
cue(w("numbers")["start"] + 0.2, "spark_zip", -26)

# ---- TEMPLATE
w = Wd("It can learn")
fly(cut("It can learn") + 0.02, -23, pan=-0.6)
cue(w("template")["start"], "scan_sweep", -25, length=0.6, fade=0.15)
for i in range(3):
    fly(w("deck")["start"] + i * 0.1, -26, pan=0.5)
cue(w("pour")["start"], "whoosh_fast", -24, pan=0.5)
cue(w("touching")["start"], "confirm_chime", -24, pan=0.5)

# ---- ANIMATE
w = Wd("It even adds")
for i in range(4):
    cue(cut("It even adds") + 0.3 + i * 1.11, "whoosh_soft", -25, pan=0.4 - 0.25 * i)
cue(w("animations")["start"], "spark_zip", -27)
cue(w("narration")["start"], "ui_blip", -24, rate=0.8)

# ---- LOCAL
w = Wd("Everything runs")
land(cut("Everything runs") + 0.05, -24)
cue(w("only")["start"], "scan_sweep", -25, length=0.7, fade=0.2)
land(w("free")["start"], -19, rate=0.85)
for k in ["Claude", "GPT", "Gemini", "Kimi"]:
    cue(w(k)["start"], "ui_blip", -25, rate=1.0 + 0.07 * ["Claude", "GPT", "Gemini", "Kimi"].index(k), pan=0.5)

# ---- CATCH
w = Wd("The catch")
cue(cut("The catch") + 0.02, "impact_slam", -21, length=0.6, fade=0.2)
typing("typewriter", w("tool")["start"] - 0.3, w("well")["end"], -29, step=0.1)
cue(w("well")["start"] + 0.4, "ui_tick", -24, rate=1.5)
cue(w("rough")["start"], "stamp", -17)
click(w("polish")["start"] + 0.1, -22)
cue(w("yourself")["start"], "confirm_chime", -23)

# ---- AUTHOR
w = Wd("It was built by")
fly(cut("It was built by") + 0.02, -24)
cue(w("finance")["start"], "ui_blip", -25)
land(w("slides")["start"] - 0.05, -24)
cue(w("edit")["start"], "zap_slash", -24, length=0.4, fade=0.1)
cue(w("edit")["start"] + 0.1, "confirm_chime", -24)

# ---- OUTRO
w = Wd("That's today's tool")
bed("riser", cut("That's today's tool") - 0.6, cut("That's today's tool") + 0.1, -28)
cue(cut("That's today's tool") + 0.08, "impact_slam", -20, length=0.8, fade=0.3)
cue(cut("That's today's tool") + 0.15, "spark_zip", -26)
cue(w("every")["start"], "confirm_chime", -24)
