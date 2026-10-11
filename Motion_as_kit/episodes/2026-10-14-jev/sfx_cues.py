# The sound cue sheet of the Jev video, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut, jitter, DUR in
# scope). Sound design for an editorial piece: a fast whoosh under every slab wipe, soft rises under the
# headlines, the chatter of bubbles and keys for the talking AIs against single clean hits for the red dot,
# strikes for the crossings-out, ticks under the counters, and the subscribe graphic's own clicks and chime.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def cutv(q):
    # the timeline's cut: 0.24 s before the line (every gap here is at least 0.48 s)
    return line(q)["start"] - 0.24


def wipe(q, db=-21):
    t = cutv(q)
    cue(t - 0.26, "whoosh_fast", db, pan=0.5)
    cue(t + 0.02, "whoosh_soft", db - 4, pan=-0.5)


def rise(t, db=-28):
    cue(t, "whoosh_soft", db, rate=1.3)


def hit(t, db=-21, rate=1.0):
    cue(t, "impact_small", db, rate=rate)


def blip(t, db=-25, rate=1.0, pan=0.0):
    cue(t, "ui_blip", db, rate=rate, pan=pan)


def ticks(t0, t1, n, db=-31, rate0=1.0):
    for i in range(n):
        cue(t0 + (t1 - t0) * i / n, "ui_tick", db, rate=rate0 + 0.03 * (i % 6))


SUBSCRIBE = [(0.02, "whoosh_soft", -24), (0.9, "mouse_click", -18), (0.92, "ui_blip", -22), (1.45, "mouse_click", -19), (1.47, "confirm_chime", -21)]


def subscribe_at(t0, db=0):
    for dt, name, d in SUBSCRIBE:
        cue(t0 + dt, name, d + db)


# ---- 01 TALKS
w = Wd("Every AI you know")
rise(w("Every")["start"] - 0.05)
hit(w("talks.")["start"], -22, rate=0.9)
t0 = w("talks.")["start"]
for i in range(22):
    blip(t0 + i * 0.16 + 0.05, -31 + (i % 3), rate=0.8 + 0.04 * (i % 7), pan=-0.8 + 0.08 * i)
typing("key_click", w("writes")["start"], line("Every AI you know")["end"] + 0.4, -29, pan=0.5)
wipe("This one")

# ---- 02 CAN'T
w = Wd("This one")
hit(cutv("This one") + 0.3, -19, rate=0.8)
rise(w("can't")["start"] - 0.06)
cue(w("chat.")["start"], "marker_strike", -22, length=0.45, fade=0.12)
cue(w("code.")["start"], "marker_strike", -23, length=0.45, fade=0.12, pan=0.3)

# ---- 03 NAME
w = Wd("It's called Jev")
cue(w("Jev,")["start"] - 0.05, "impact_slam", -20, length=0.7, fade=0.2)
hit(w("Jev,")["start"] + 0.3, -24, rate=1.3)
cue(w("San")["start"], "pen_line", -27, pan=0.4)
rise(w("TypeSafe,")["start"] - 0.1)
bed("riser", w("gone")["start"] - 0.1, w("viral.")["end"] + 0.2, -27)
wipe("Jev only makes")

# ---- 04 DECIDE
w = Wd("Jev only makes")
rise(w("Jev")["start"])
hit(w("decisions.")["start"], -24, rate=1.2)
cue(w("facts")["start"], "paper_slide", -24, pan=-0.6)
cue(w("question,")["start"], "paper_slide", -25, pan=-0.2)
cue(w("question,")["end"] + 0.2, "projector_click", -24)
cue(w("answers")["start"], "spark_zip", -25, pan=0.3)
ticks(w("probability.")["start"] - 0.15, w("probability.")["start"] + 0.3, 6)
cue(w("probability.")["start"] + 0.35, "confirm_chime", -23, pan=0.5)

# ---- 05 KINDS
w = Wd("Pick an option")
blip(w("Pick")["start"], -24, pan=-0.6)
hit(w("option,")["end"], -24, rate=1.3)
cue(w("score,")["start"], "pen_line", -26)
blip(w("score,")["start"] + 0.4, -25, rate=1.2)
rise(w("yes")["start"] - 0.05, -27)
cue(w("how")["start"], "scan_sweep", -27, length=0.6, fade=0.2, pan=0.6)

# ---- 06 EMAIL
w = Wd("An email comes in")
cue(w("email")["start"] - 0.15, "whoosh_soft", -23, pan=-0.7)
for k in ["billing,", "technical", "account?"]:
    blip(w(k)["start"], -26, rate=1.0 + 0.1 * ["billing,", "technical", "account?"].index(k), pan=0.5)
cue(w("picks")["start"], "spark_zip", -24)
cue(w("picks")["start"] + 0.05, "scan_sweep", -27, length=0.45, fade=0.15, pan=0.5)
cue(w("confidence.")["start"], "pen_line", -25, pan=0.6)

# ---- 07 THRESHOLD
w = Wd("If it's sure")
cue(cutv("If it's sure") + 0.1, "pen_line", -27)
hit(w("sure,")["start"] - 0.05, -23, rate=1.2)
cue(w("acts.")["start"] - 0.05, "projector_click", -22)
cue(w("acts.")["start"], "confirm_chime", -25)
hit(w("not,")["start"], -25, rate=0.8)
blip(w("person")["start"], -24, rate=0.8)
wipe("TypeSafe calls it")

# ---- 08 SYSTEM
w = Wd("TypeSafe calls it")
rise(w("System")["start"] - 0.1)
cue(w("System")["start"], "spark_zip", -26, pan=-0.5)
typing("typewriter", cutv("TypeSafe calls it") + 0.5, line("TypeSafe calls it")["end"], -33, pan=0.6, step=0.32)
hit(w("fast,")["start"], -21, rate=1.1)

# ---- 09 RACE
w = Wd("By TypeSafe's own test")
typing("typewriter", cutv("By TypeSafe's own test") + 0.3, cutv("By TypeSafe's own test") + 4.3, -32, pan=-0.4, step=0.25)
cue(cutv("By TypeSafe's own test") + 0.35, "spark_zip", -22, pan=0.4)
ticks(w("193")["start"] - 0.1, w("193")["start"] + 0.9, 14)
cue(w("faster")["start"], "impact_slam", -21, length=0.6, fade=0.2)
ticks(w("444")["start"] - 0.1, w("444")["start"] + 1.0, 14, rate0=1.2)
cue(w("cheaper.")["start"], "impact_slam", -20, length=0.6, fade=0.2)
wipe("Input costs")

# ---- 10 PRICE
w = Wd("Input costs")
ticks(w("42")["start"] - 0.1, w("42")["start"] + 0.5, 8)
cue(w("42")["start"] + 0.5, "impact_small", -21, rate=0.9)
rise(w("billion")["start"] - 0.1)
cue(w("free.")["start"], "stamp", -18)
subscribe_at(w("answers")["start"] - 0.2, db=-3)

# ---- 11 USES
w = Wd("Developers use it")
cue(w("route")["start"] - 0.2, "paper_slide", -25, pan=-0.6)
for i in range(6):
    cue(w("tickets")["start"] + i * 0.3 + 0.45, "pen_tick", -28, pan=-0.6)
cue(w("police")["start"] - 0.2, "paper_slide", -25)
typing("key_click", w("police")["start"], w("agents.")["start"], -29)
cue(w("agents.")["end"], "zap_slash", -22, length=0.4, fade=0.1)
cue(w("agents.")["end"] + 0.02, "stamp", -22)
cue(w("Someone")["start"] - 0.1, "paper_slide", -25, pan=0.6)
for i, k in enumerate([0.0, 0.06, 0.12]):
    blip(w("play")["start"] + k, -26, rate=0.9 + 0.1 * i, pan=0.6)
hit(w("Doom.")["start"], -22, rate=0.7)
wipe("The catch")

# ---- 12 CATCH
w = Wd("The catch")
cue(cutv("The catch") + 0.08, "impact_slam", -19, length=0.6, fade=0.2)
cue(w("only")["start"], "pen_line", -26, pan=-0.5)
for i in range(3):
    blip(w("options")["start"] + i * 0.08, -26, rate=1.0 + 0.08 * i, pan=-0.5)
cue(w("ask,")["start"] + 0.45, "impact_small", -23, rate=1.5, pan=-0.3)
hit(w("still")["start"], -24)
cue(w("wrong.")["start"], "marker_strike", -20, length=0.5, fade=0.12, pan=0.4)

# ---- 13 CLOSED
w = Wd("And it's closed")
cue(w("closed:")["start"] + 0.1, "projector_click", -19)
cue(w("closed:")["start"] + 0.12, "mouse_click", -22)
rise(w("API")["start"] - 0.1)
cue(w("numbers")["start"], "whoosh_soft", -26)
blip(w("own.")["start"], -22, rate=0.8)
wipe("Still, the idea")

# ---- 14 IDEA
w = Wd("Still, the idea")
rise(w("Still,")["start"])
for i in range(16):
    blip(w("An")["start"] + i * 0.07, -32 + (i % 3), rate=0.8 + 0.05 * (i % 6), pan=-0.8 + 0.1 * i)
cue(w("It")["start"] + 0.05, "reverse_suck", -21, length=0.55, fade=0.15)
cue(w("It")["start"] + 0.42, "impact_slam", -19, length=0.8, fade=0.3)
cue(w("decides.")["start"], "confirm_chime", -24)

# ---- 15 OUTRO
w = Wd("That's today's tool")
cue(cutv("That's today's tool") + 0.06, "impact_small", -22, rate=0.9)
subscribe_at(w("Subscribe,")["start"] - 0.15)
cue(w("every")["start"], "spark_zip", -27)
