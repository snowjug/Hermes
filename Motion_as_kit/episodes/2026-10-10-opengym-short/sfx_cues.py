# The sound cue sheet of the openGym Short, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut,
# jitter, DUR in scope). Giant words slam in with hits, cutouts land with paper, plates clank, the lime
# marker squeaks; the music bed runs underneath.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def land(t, db=-22, pan=0.0, rate=1.0):
    cue(t, "paper_slide", db, pan=pan, rate=rate, length=0.45, fade=0.12)


def slam(t, db=-22, rate=1.0):
    cue(t, "impact_small", db, rate=rate)


# ---- HOOK
w = Wd("This free gym app")
slam(0.0, -21)
cue(0.05, "impact_small", -26, rate=1.3)
slam(w("shows")["start"], -22)
slam(w("muscles")["start"], -21, rate=0.9)
cue(w("muscles")["start"], "scan_sweep", -28, length=0.5, fade=0.15)
slam(w("skipping")["start"] - 0.05, -19, rate=0.85)
cue(w("skipping")["start"], "marker_strike", -23, length=0.5, fade=0.15)
cue(w("skipping")["start"] + 0.05, "pen_line", -27, length=0.4, fade=0.1)
cue(cut("Pick a muscle") - 0.15, "whoosh_fast", -22)

# ---- LIBRARY
w = Wd("Pick a muscle")
land(cut("Pick a muscle") + 0.02, -21)
slam(cut("Pick a muscle") + 0.04, -23)
slam(w("muscle")["start"] - 0.05, -21, rate=0.9)
cue(w("muscle")["start"], "marker_strike", -23, length=0.45, fade=0.12)
slam(w("over")["start"] - 0.05, -20, rate=0.85)
bed("riser", w("over")["start"] - 0.2, w("over")["start"] + 0.05, -30)
slam(w("exercises")["start"], -23, rate=1.1)
land(w("demo")["start"] - 0.1, -21, pan=0.5)
cue(cut("It fills in") - 0.15, "whoosh_fast", -22)

# ---- SESSION
w = Wd("It fills in")
land(cut("It fills in") + 0.02, -21, pan=-0.4)
slam(w("last")["start"] - 0.05, -22)
slam(w("weights")["start"] - 0.05, -21, rate=0.9)
land(w("weights")["start"], -25, pan=-0.3, rate=1.1)
slam(w("rest")["start"] - 0.05, -22)
land(w("rest")["start"] - 0.1, -22, pan=0.5)
slam(w("timer")["start"] - 0.05, -21, rate=0.9)
for i in range(3):
    cue(w("timer")["start"] + i, "ui_tick", -25 - i, pan=0.5)
slam(w("new")["start"] - 0.05, -22)
slam(w("records")["start"] - 0.05, -20, rate=0.85)
cue(w("records")["start"], "confirm_chime", -22)
cue(cut("It even does the plate math") - 0.15, "whoosh_fast", -22)

# ---- PLATES
w = Wd("It even does the plate math")
for i in range(5):
    cue(cut("It even does the plate math") + 0.05 + i * 0.07, "impact_small", -26, rate=1.3 - 0.06 * i, pan=-0.5 + 0.25 * i)
slam(w("plate")["start"] - 0.05, -21)
slam(w("math")["start"] - 0.05, -20, rate=0.9)
cue(w("for")["start"], "whoosh_fast", -24)
cue(w("for")["start"] + 0.32, "impact_small", -20, rate=0.8)
cue(w("for")["start"] + 0.47, "impact_small", -21, rate=0.85)
slam(w("bar")["start"] - 0.05, -19, rate=0.8)
cue(cut("No subscription") - 0.15, "whoosh_fast", -22)

# ---- FREE
w = Wd("No subscription")
land(cut("No subscription") + 0.02, -21)
slam(cut("No subscription") + 0.04, -22)
slam(w("subscription")["start"] - 0.05, -21, rate=0.9)
cue(w("subscription")["start"] + 0.1, "marker_strike", -22, length=0.3, fade=0.1)
slam(w("No", 1)["start"] - 0.05, -20, rate=0.85)
cue(w("ads")["start"] + 0.05, "marker_strike", -22, length=0.3, fade=0.1)
cue(w("runs")["start"], "whoosh_fast", -22, pan=0.5)
land(w("runs")["start"] - 0.05, -21, pan=-0.3)
slam(w("server")["start"] - 0.05, -21)
land(w("Android")["start"] - 0.1, -21, pan=0.4)
slam(w("phone")["start"] - 0.05, -20, rate=0.9)
cue(cut("It's called openGym") - 0.15, "whoosh_fast", -22)

# ---- NAME
w = Wd("It's called openGym")
land(cut("It's called openGym") + 0.1, -23, pan=0.4)
t0, t1 = w("called")["start"], w("openGym")["end"]
for i in range(7):
    cue(t0 + (t1 - t0) * i / 7, "ui_tick", -26, rate=0.9 + 0.05 * i)
slam(w("openGym")["start"], -21)
land(w("Nearly")["start"] - 0.1, -22)
bed("riser", w("Nearly")["start"], w("stars")["end"], -30)
t0, t1 = w("Nearly")["start"], w("stars")["end"]
for i in range(18):
    cue(t0 + (t1 - t0) * i / 18, "ui_tick", -30, rate=1.0 + 0.02 * (i % 6))
for i in range(5):
    cue(w("GitHub")["start"] + i * 0.1, "ui_blip", -28, rate=1.1 + 0.05 * i, pan=-0.5 + 0.25 * i)
cue(w("stars")["end"], "confirm_chime", -23)
land(w("week")["start"], -25, rate=1.1)
cue(cut("So be honest") - 0.15, "whoosh_fast", -22)

# ---- LEGS
w = Wd("So be honest")
land(cut("So be honest") + 0.02, -22, pan=-0.3)
land(cut("So be honest") + 0.08, -22, pan=0.3)
slam(w("be")["start"] - 0.05, -22)
slam(w("honest")["start"] - 0.05, -21, rate=0.9)
slam(w("When")["start"] - 0.05, -22)
slam(w("last")["start"] - 0.05, -22, rate=1.05)
slam(w("legs")["start"] - 0.05, -18, rate=0.8)
cue(w("legs")["start"], "marker_strike", -22, length=0.4, fade=0.12)
cue(w("legs")["start"] + 0.15, "marker_strike", -23, length=0.4, fade=0.12)
