# The sound cue sheet of the God's Eye View video, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut, jitter,
# DUR in scope). Sound design for a sensor feed: a crackle of static on every cut and sensor switch, radar blips as
# layers come up, ticks under the counters, key chatter while titles decode and terminals type, a soft lock tone when
# the target brackets close, deep whooshes for the dives, a slam for the title, a riser into the unsettling turn, and
# the subscribe graphic's clicks and chime.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def cutv(q):
    return line(q)["start"] - 0.22


def static(t, db=-23):
    cue(t, "spark_sizzle", db, length=0.22, fade=0.06)
    cue(t + 0.01, "zap_slash", db - 6, length=0.15, fade=0.05)


def blip(t, db=-27, rate=1.0, pan=0.0):
    cue(t, "ui_blip", db, rate=rate, pan=pan)


def ticks(t0, t1, n, db=-31, rate0=1.0):
    for i in range(n):
        cue(t0 + (t1 - t0) * i / n, "ui_tick", db, rate=rate0 + 0.03 * (i % 6))


def lock(t, db=-24, pan=0.0):
    for i in range(3):
        cue(t + i * 0.06, "ui_tick", db - 3, rate=1.4 + 0.1 * i, pan=pan)
    cue(t + 0.22, "confirm_chime", db, rate=1.2, pan=pan)


def decoding(t, dur, db=-30):
    typing("key_click", t, t + dur, db, step=0.03)


SUBSCRIBE = [(0.02, "whoosh_soft", -24), (0.9, "mouse_click", -18), (0.92, "ui_blip", -22), (1.45, "mouse_click", -19), (1.47, "confirm_chime", -21)]

for q in ["Every satellite overhead", "It's called God", "Here's what you're", "Ships stream in", "Earthquakes from", "And then it gets",
          "Now flip the sensor", "Zoom in, and cities", "17 of its 20", "The catch", "All of this data", "That's God's Eye View"]:
    static(cutv(q))

# ---- 01 PLANES
w = Wd("This is every plane")
cue(0.0, "riser", -30, length=1.2, fade=0.3)
for i in range(18):
    blip(0.1 + i * 0.12, -33 + (i % 3), rate=0.8 + 0.05 * (i % 7), pan=-0.8 + 0.09 * i)
ticks(0.0, 2.6, 26, -33)
blip(w("live,")["start"], -22, rate=0.7)

# ---- 02 EVERYTHING
w = Wd("Every satellite overhead")
cue(w("satellite")["start"], "scan_sweep", -26, length=0.9, fade=0.2)
cue(w("ship")["start"], "whoosh_soft", -26, rate=0.8, pan=0.4)
cue(w("browser,")["start"] - 0.2, "whoosh_fast", -22)
cue(w("free.")["start"], "stamp", -18)

# ---- 03-04 NAME
w = Wd("It's called God")
cue(w("God's")["start"] - 0.2, "reverse_suck", -21, length=0.3, fade=0.08)
cue(w("God's")["start"], "impact_slam", -17, length=0.9, fade=0.3)
decoding(w("God's")["start"] - 0.1, 0.7)
typing("typewriter", w("spy")["start"] - 0.1, w("simulator,")["end"] + 0.3, -29, step=0.07)
typing("typewriter", w("except")["start"], w("real.")["end"], -27, step=0.07)
blip(w("real.")["start"], -21, rate=0.8)
w = Wd("It hit number one")
cue(w("number")["start"], "stamp", -19)
ticks(w("50,000")["start"] - 0.1, w("50,000")["start"] + 1.0, 18, -29)
cue(w("stars.")["start"], "confirm_chime", -24)

# ---- 05-06 LAYERS, FLIGHTS
w = Wd("Here's what you're")
for i in range(15):
    cue(line("Here's what you're")["start"] + 0.1 + i * 0.07, "pen_tick", -30, rate=1.0 + 0.03 * i, pan=-0.6)
w = Wd("Over 11,000")
cue(w("11,000")["start"] - 0.35, "whoosh_fast", -20)
cue(w("11,000")["start"] + 0.3, "impact_small", -23, rate=0.7)
lock(w("public")["start"] + 0.1)
cue(w("military")["start"], "zap_slash", -24, length=0.3, fade=0.08, pan=0.6)
blip(w("military")["start"] + 0.05, -22, rate=0.6, pan=0.6)

# ---- 07-08 SHIPS, SATELLITES
w = Wd("Ships stream in")
lock(w("AIS,")["start"], -25)
for i in range(4):
    blip(w("radio")["start"] + i * 0.37, -25, rate=1.3)
w = Wd("838 satellites")
cue(w("838")["start"] - 0.3, "whoosh_fast", -21, rate=0.8)
ticks(w("838")["start"] - 0.1, w("838")["start"] + 1.0, 16, -30)
cue(w("orbit.")["start"], "scan_sweep", -27, length=0.6, fade=0.15)

# ---- 09 HAZARDS
w = Wd("Earthquakes from")
for k in ["Earthquakes", "Fires", "Rain", "lightning,", "cyclones", "wind."]:
    blip(w(k)["start"], -24, rate=0.9)
cue(w("Earthquakes")["start"] + 0.1, "impact_small", -22, rate=0.6)
cue(w("lightning,")["start"] + 0.1, "zap_slash", -23, length=0.25, fade=0.06)
cue(w("wind.")["start"], "whoosh_soft", -25, rate=0.7)

# ---- 10-11 CAMERAS
w = Wd("And then it gets")
bed("riser", w("then")["start"], line("And then it gets")["end"] + 0.35, -24)
cue(w("unsettling.")["start"], "reverse_suck", -22, length=0.5, fade=0.12)
w = Wd("Nearly 4,000")
cue(w("Nearly")["start"], "impact_slam", -19, length=0.7, fade=0.25)
ticks(w("4,000")["start"], w("4,000")["start"] + 1.4, 20, -30)
for k in ["Texas", "London", "Finland,"]:
    lock(w(k)["start"], -26)
for i in range(6):
    cue(w("Texas")["start"] + i * 0.12, "projector_click", -28, pan=0.6)

# ---- 12-13 SENSORS
w = Wd("Now flip the sensor")
cue(w("flip")["start"], "mouse_click", -21)
for k in ["Night", "Thermal.", "CRT"]:
    static(w(k)["start"] - 0.05, -20)
    cue(w(k)["start"], "projector_click", -22)
w = Wd("And your browser looks")
for i in range(3):
    lock(w("surveillance")["start"] + i * 0.3, -26, pan=-0.5 + 0.5 * i)
typing("typewriter", w("feed")["start"], line("And your browser looks")["end"] + 0.4, -29, step=0.06)

# ---- 14-15 TECH
w = Wd("Zoom in, and cities")
cue(w("Zoom")["start"], "whoosh_soft", -23, rate=0.8)
for i in range(10):
    cue(w("Zoom")["start"] + 0.2 + i * 0.1, "impact_small", -29, rate=0.8 + 0.06 * i, pan=-0.6 + 0.12 * i)
cue(w("tiles.")["start"] - 0.3, "scan_sweep", -26, length=1.0, fade=0.2)
w = Wd("Add an OpenAI key")
cue(w("OpenAI")["start"], "ui_blip", -22, rate=0.8)
cue(w("steer")["start"], "spark_zip", -26)

# ---- 16 KEYS
w = Wd("17 of its 20")
for i in range(20):
    blip(line("17 of its 20")["start"] + 0.1 + i * 0.04, -32 + (i % 2), rate=0.9 + 0.03 * i, pan=-0.6 + 0.06 * i)
cue(w("need")["start"] + 0.1, "confirm_chime", -25)
typing("key_click", w("Clone")["start"], w("planet")["start"], -28, step=0.035)
cue(w("planet")["start"] - 0.1, "enter_key", -22)
cue(w("opens")["start"], "whoosh_soft", -24, pan=0.5)

# ---- 17-19 CATCH
w = Wd("The catch")
cue(w("catch:")["start"], "impact_slam", -20, length=0.6, fade=0.2)
decoding(w("catch:")["start"] - 0.1, 0.4)
typing("typewriter", w("delayed,")["start"] - 0.3, w("delayed,")["start"] + 1.1, -28, step=0.06)
cue(w("navigation")["start"], "stamp", -19)
w = Wd("Traffic is simulated")
for k in ["Traffic", "camera", "3D"]:
    cue(w(k)["start"], "pen_tick", -24)
w = Wd("And by design")
cue(w("design,")["start"], "impact_small", -21, rate=0.7)
cue(w("face")["start"], "zap_slash", -25, length=0.3, fade=0.08, pan=-0.5)
cue(w("track")["start"], "zap_slash", -25, length=0.3, fade=0.08, pan=0.5)

# ---- 20 PUBLIC
w = Wd("All of this data")
cue(line("All of this data")["start"], "riser", -28, length=1.5, fade=0.3)
decoding(w("public.")["start"] - 0.1, 0.4)
decoding(w("all", 1)["start"] - 0.05, 0.4)
cue(w("all", 1)["start"], "impact_slam", -20, length=0.8, fade=0.3)

# ---- 21-22 OUTRO
w = Wd("That's God's Eye View")
decoding(w("God's")["start"] - 0.2, 0.6)
cue(w("God's")["start"], "impact_small", -21, rate=0.8)
static(w("terrifying.")["start"] - 0.05, -22)
w = Wd("Subscribe, there")
for dt, name, d in SUBSCRIBE:
    cue(w("Subscribe,")["start"] - 0.15 + dt, name, d)
