# The sound cue sheet of the openGym video, run by analysis/sfx_mix.py (its helpers: cue, bed, typing,
# W, line, cut, jitter, DUR are in scope). A kraft-paper desk: every cutout lands with a paper sound, the
# marker squeaks where it draws, stamps thump, plates clank onto the bar. Under it all, the music bed.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def land(t, db=-22, pan=0.0, rate=1.0):
    cue(t, "paper_slide", db, pan=pan, rate=rate, length=0.45, fade=0.12)


def ransom_ticks(t0, t1, n, db=-27):
    for i in range(n):
        cue(t0 + (t1 - t0) * i / n, "ui_tick", db, rate=0.9 + 0.04 * i)


def marker(t, db=-24, length=0.6):
    cue(t, "marker_strike", db, length=length, fade=0.15)


def wipe(t):
    cue(t, "whoosh_soft", -22)
    land(t + 0.05, -23, rate=0.9)


# ---- HOOK
w = Wd("Most gym apps")
land(0.0, -21, pan=-0.4)
cue(0.26, "pen_tick", -27, pan=-0.4)
land(w("workouts")["start"], -25, pan=-0.3, rate=1.1)
cue(w("workouts")["start"] + 0.1, "pen_line", -29, length=0.8, fade=0.2)
land(w("their")["start"] - 0.12, -21, pan=0.4)
cue(w("servers")["start"] + 0.15, "pen_tick", -26, pan=0.4)
land(w("servers")["start"], -25, pan=0.4, rate=1.1)
cue(w("push")["start"] - 0.15, "whoosh_soft", -25, pan=0.3)
for i in range(3):
    land(w("push")["start"] - 0.1 + 0.18 * i, -23, pan=0.1 + 0.25 * i, rate=1.0 + 0.08 * i)
marker(w("subscription")["start"] - 0.25)
cue(w("subscription")["start"] + 0.13, "stamp", -15)
cue(w("subscription")["start"] + 0.15, "impact_small", -22)

# ---- YOURS
w = Wd("openGym runs on yours")
ransom_ticks(w("openGym")["start"], w("runs")["start"], 7)
cue(w("openGym")["start"], "impact_small", -24)
marker(w("yours")["start"], -23, 0.4)
cue(w("yours")["end"] + 0.25, "whoosh_fast", -21, pan=0.5)
land(w("yours")["end"] + 0.35, -21, pan=0.3)
land(w("yours")["end"] + 0.55, -22, pan=-0.4)
cue(w("week")["start"] - 0.1, "paper_slide", -22, length=0.4, fade=0.1)
bed("riser", w("picked")["start"] - 0.1, w("stars")["end"], -31)
t0, t1 = w("picked")["start"], w("stars")["end"]
for i in range(24):
    cue(t0 + (t1 - t0) * i / 24, "ui_tick", -31, rate=1.0 + 0.02 * (i % 7), pan=-0.5 + 0.04 * i)
for i in range(6):
    cue(w("picked")["start"] + i * 0.12, "ui_blip", -30, rate=1.1 + 0.05 * i, pan=-0.6 + 0.24 * i)
cue(w("stars")["end"], "confirm_chime", -24)
cue(cut("One Docker command") - 0.32, "whoosh_soft", -22)

# ---- DOCKER
w = Wd("One Docker command")
land(cut("One Docker command") + 0.05, -23, pan=-0.4)
typing("key_click", w("Docker")["start"], w("Docker")["start"] + 0.62, -28, pan=-0.4)
cue(w("command")["start"], "enter_key", -24, pan=-0.4)
cue(w("live")["start"] - 0.25, "ui_blip", -26, pan=-0.3)
cue(w("live")["start"], "ui_blip", -26, pan=-0.2, rate=1.1)
land(w("live")["start"] - 0.05, -21, pan=0.4)
land(w("own")["start"], -26, pan=0.4, rate=1.1)
for i, k in enumerate(["ads", "subscription", "telemetry"]):
    t = w(k)["start"]
    land(t - 0.1, -22, pan=-0.5 + 0.5 * i)
    marker(t + 0.18, -23, 0.35)
    cue(t + 0.28, "marker_strike", -25, length=0.3, fade=0.1)

# ---- FOLDER
w = Wd("Your whole training history")
for i, k in enumerate(["training", "history", "sits"]):
    land(w(k)["start"] - 0.1, -23, pan=-0.6 + 0.3 * i, rate=1.0 + 0.06 * i)
land(w("one")["start"] - 0.1, -21, pan=-0.3, rate=0.85)
cue(w("folder")["start"], "whoosh_soft", -24, pan=-0.3)
cue(w("folder")["start"] + 0.35, "paper_slide", -24, length=0.3, fade=0.1)
cue(w("back")["start"], "pen_line", -25, length=1.0, fade=0.2)
cue(w("back")["start"], "paper_slide", -21, pan=0.3, rate=0.95, length=0.6, fade=0.15)
cue(w("everything")["start"] - 0.02, "stamp", -15)
cue(w("everything")["start"], "impact_small", -22)

# ---- LIBRARY
w = Wd("Over 5,600 exercises")
land(cut("Over 5,600 exercises") + 0.05, -21, pan=-0.5)
bed("riser", w("over")["start"] - 0.1, w("exercises")["end"], -31)
t0, t1 = w("over")["start"], w("exercises")["end"]
for i in range(18):
    cue(t0 + (t1 - t0) * i / 18, "ui_tick", -31, rate=1.0 + 0.02 * (i % 6))
land(w("animated")["start"] - 0.1, -22, pan=0.5)
land(w("demo")["start"], -26, pan=0.5, rate=1.1)
marker(w("tap")["start"])
cue(w("trains")["start"] - 0.3, "pen_line", -26, length=0.4, fade=0.1)
for i in range(3):
    land(w("trains")["start"] + 0.05 + 0.14 * i, -24, rate=1.05 + 0.05 * i)
cue(w("filter")["start"] - 0.1, "whoosh_soft", -26, pan=0.4)
marker(w("equipment")["start"], -24, 0.5)
land(w("equipment")["start"], -26, pan=0.4, rate=1.1)

# ---- SESSION
w = Wd("In the gym")
land(cut("In the gym") + 0.05, -21, pan=-0.4)
land(w("last")["start"], -24, pan=0.1, rate=1.1)
cue(w("weights")["start"], "pen_line", -26, length=0.6, fade=0.15)
land(w("rest")["start"] - 0.1, -21, pan=0.4)
for i in range(4):
    cue(w("timer")["start"] + i * 1.0, "ui_tick", -26 - i, pan=0.4)
cue(w("records")["start"] - 0.05, "impact_small", -20)
cue(w("records")["start"], "confirm_chime", -22, pan=0.5)

# ---- PLATES
w = Wd("It even does the plate math")
land(cut("It even does the plate math") + 0.03, -23, pan=0.6)
ransom_ticks(w("plate")["start"], w("math")["end"], 9)
for i in range(6):
    cue(w("your")["start"] + i * 0.09, "impact_small", -27 - i * 0.5, rate=1.25 - 0.05 * i, pan=-0.6 + 0.24 * i)
cue(w("tells")["start"] - 0.1, "pen_line", -27, length=0.5, fade=0.15)
cue(w("goes")["start"], "whoosh_fast", -24)
cue(w("goes")["start"] + 0.36, "impact_small", -21, rate=0.8)
cue(w("goes")["start"] + 0.51, "impact_small", -22, rate=0.85)
marker(w("goes")["start"], -25, 0.4)
marker(w("goes")["start"] + 0.15, -25, 0.4)
land(w("bar")["start"], -24, rate=1.1)

# ---- MUSCLE MAP
w = Wd("Then there's the muscle map")
land(cut("Then there's the muscle map") + 0.03, -22, pan=-0.3)
land(cut("Then there's the muscle map") + 0.1, -22, pan=0.2)
for i in range(3):
    cue(w("muscle")["start"] + i * 0.08, "ui_tick", -27, rate=1.0 + 0.1 * i)
land(w("map")["start"], -25, pan=0.6, rate=1.1)
for k in ["volume", "still"]:
    cue(w(k)["start"], "scan_sweep", -27, length=0.5, fade=0.15)
    cue(w(k)["start"], "ui_blip", -26)
w = Wd("and what you")
cue(w("stopped")["start"], "scan_sweep", -27, length=0.5, fade=0.15)
cue(w("stopped")["start"] + 0.05, "pen_line", -26, length=0.5, fade=0.15)
marker(w("looking")["start"] + 0.05, -23, 0.45)
marker(w("looking")["start"] + 0.3, -24, 0.45)
ransom_ticks(w("looking")["start"] + 0.1, w("legs")["end"], 5)
cue(w("legs")["start"], "impact_small", -21)

# ---- PROGRESS
w = Wd("Progress is built in")
land(cut("Progress is built in") + 0.03, -21)
land(cut("Progress is built in") + 0.2, -24, pan=0.6)
land(w("built")["start"], -26, pan=0.6, rate=1.1)
for k in ["hit", "weight", "miss", "stall", "plans"]:
    marker(w(k)["start"], -25, 0.5)
cue(w("up")["start"], "ui_blip", -25, rate=1.2)
cue(w("doesn't")["start"], "pen_tick", -24)
cue(w("doesn't")["start"] + 0.12, "pen_tick", -24)
cue(w("deload")["start"], "reverse_suck", -27, length=0.5, fade=0.15)
marker(w("deload")["end"] + 0.1, -26, 0.6)

# ---- IMPORTS
w = Wd("Coming from Strong")
land(cut("Coming from Strong") + 0.05, -22, pan=0.5)
for i, k in enumerate(["strong", "hevy", "fitnotes"]):
    land(w(k)["start"] - 0.1, -23, pan=-0.7 + 0.25 * i, rate=1.0 + 0.05 * i)
cue(w("imports")["start"] - 0.1, "pen_line", -26, length=0.5, fade=0.15)
for i in range(3):
    cue(w("imports")["start"] + 0.05 + i * 0.12, "whoosh_fast", -26, pan=-0.4 + 0.4 * i, rate=1.0 + 0.08 * i)
cue(w("history")["start"] - 0.02, "stamp", -15)
cue(w("history")["start"], "impact_small", -22)

# ---- PASSKEY
w = Wd("It signs you in")
land(cut("It signs you in") + 0.05, -22, pan=-0.6)
cue(w("passkey")["start"], "scan_sweep", -25, length=0.6, fade=0.15, pan=-0.5)
land(w("works")["start"], -24, pan=-0.3)
marker(w("offline")["start"] + 0.1, -23, 0.35)
land(w("phone")["start"] - 0.08, -21, pan=0.1)
land(w("laptop")["start"] - 0.08, -21, pan=0.6)
cue(w("sync")["start"] - 0.25, "pen_line", -25, length=0.7, fade=0.15)
cue(w("sync")["start"] + 0.05, "pen_line", -26, length=0.5, fade=0.15, pan=0.3)
land(w("merge")["start"], -24, pan=0.3, rate=1.1)

# ---- COACH
w = Wd("There's even an optional")
land(cut("There's even an optional") + 0.05, -21, pan=-0.6)
land(w("optional")["start"], -25, pan=-0.6, rate=1.1)
land(w("drafts")["start"] - 0.1, -22)
typing("typewriter", w("drafts")["start"], w("nothing")["start"] - 0.1, -29, step=0.11)
land(w("nothing")["start"] - 0.05, -24, pan=0.5)
cue(w("approve")["start"], "pen_tick", -23, pan=0.5)
cue(w("approve")["start"] + 0.12, "pen_tick", -24, pan=0.5)
cue(w("approve")["end"] + 0.08, "stamp", -15)
cue(w("approve")["end"] + 0.1, "impact_small", -22)

# ---- MCP
w = Wd("And a read-only MCP server")
land(cut("And a read-only MCP server") + 0.05, -22, pan=-0.6)
land(w("MCP")["start"] - 0.1, -22, pan=-0.2)
land(w("read-only")["start"], -26, rate=1.1)
cue(w("assistant")["start"] - 0.05, "ui_blip", -24, pan=0.4)
typing("key_click", w("assistant")["start"], w("assistant")["start"] + 0.55, -31, pan=0.4)
cue(w("answer")["start"] - 0.05, "ui_blip", -24, rate=0.9)
typing("key_click", w("answer")["start"], w("training")["end"], -32, step=0.09)

# ---- CATCH
w = Wd("The catch")
ransom_ticks(w("catch")["start"] - 0.1, w("catch")["end"] + 0.1, 6)
cue(w("catch")["start"], "impact_slam", -24, length=0.5, fade=0.2)
land(w("phone")["start"] - 0.1, -22, pan=-0.4)
typing("key_click", w("HTTPS")["start"], w("HTTPS")["start"] + 0.6, -29, pan=-0.4)
land(w("domain")["start"], -25, pan=-0.3, rate=1.1)
land(w("iPhone")["start"] - 0.1, -22, pan=0.5)
land(w("web")["start"], -25, pan=0.5, rate=1.1)
land(w("App", 1)["start"] - 0.1, -22, pan=0.5)
marker(w("Store")["start"] + 0.1, -23, 0.4)
w = Wd("No server at all")
cue(w("server")["start"] - 0.35, "whoosh_soft", -22)
land(w("server")["start"] - 0.25, -21, pan=-0.3)
marker(w("all")["start"], -23, 0.4)
cue(w("all")["start"] + 0.12, "marker_strike", -24, length=0.35, fade=0.1)
land(w("Android")["start"] - 0.1, -21, pan=0.4)
land(w("Android")["start"] + 0.05, -25, pan=0.6, rate=1.1)
wipe(cut("That's today's tool") - 0.32)

# ---- OUTRO
w = Wd("That's today's tool")
for i in range(5):
    land(cut("That's today's tool") + 0.1 + 0.15 * i, -24, pan=-0.6 + 0.3 * i, rate=1.0 + 0.04 * i)
ransom_ticks(cut("That's today's tool") + 0.15, cut("That's today's tool") + 0.65, 7)
land(w("tool")["start"], -24)
land(w("new")["start"], -25, rate=1.1)
cue(w("every")["start"], "confirm_chime", -26)
