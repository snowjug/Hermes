# The sound cue sheet of the Diagram Design video, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut, jitter,
# DUR in scope). Sound design for a drafting canvas: a fast whoosh on every whip pan between plates, a soft blip as a
# node lands, a thin zip as an edge runs, key clicks under every terminal, low hits for the slams, a riser into the
# big transformation and a clean chime when it lands, strikes for what gets crossed out, ticks under the counters,
# and the subscribe graphic's own clicks and chime.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def cutv(q):
    # the timeline's cut: min(0.24, half the gap) before the line
    l = line(q)
    return l["start"] - 0.21


def whip(q, db=-20):
    t = cutv(q)
    cue(t - 0.12, "whoosh_fast", db, pan=0.4)
    cue(t + 0.12, "whoosh_soft", db - 5, pan=-0.4)


def blip(t, db=-26, rate=1.0, pan=0.0):
    cue(t, "ui_blip", db, rate=rate, pan=pan)


def zipc(t, db=-28, pan=0.0):
    cue(t, "spark_zip", db, pan=pan)


def hit(t, db=-21, rate=1.0, pan=0.0):
    cue(t, "impact_small", db, rate=rate, pan=pan)


def ticks(t0, t1, n, db=-31, rate0=1.0):
    for i in range(n):
        cue(t0 + (t1 - t0) * i / n, "ui_tick", db, rate=rate0 + 0.03 * (i % 6))


SUBSCRIBE = [(0.02, "whoosh_soft", -24), (0.9, "mouse_click", -18), (0.92, "ui_blip", -22), (1.45, "mouse_click", -19), (1.47, "confirm_chime", -21)]


def subscribe_at(t0, db=0):
    for dt, name, d in SUBSCRIBE:
        cue(t0 + dt, name, d + db)


# ---- 01 COFFEE
w = Wd("AI can write")
cue(0.05, "whoosh_soft", -24, rate=0.8)
typing("key_click", w("write")["start"] - 0.1, line("AI can write")["end"] + 0.1, -30, pan=-0.3, step=0.05)
ticks(w("write")["start"], w("cools.")["end"], 16, -34)
cue(w("cools.")["start"], "confirm_chime", -27, pan=0.5)
whip("But ask it")

# ---- 02-05 THE SAME DIAGRAM, TWICE
w = Wd("But ask it")
typing("key_click", w("ask")["start"] - 0.1, w("diagram,")["end"], -28)
cue(w("ask")["start"] + 0.9, "enter_key", -24)
cue(w("this.")["start"] - 0.25, "reverse_suck", -22, length=0.3, fade=0.08)
cue(w("this.")["start"], "impact_slam", -18, length=0.8, fade=0.3)
for i in range(8):
    hit(w("this.")["start"] + 0.04 + i * 0.05, -27, rate=1.3 + 0.05 * (i % 4), pan=-0.6 + 0.17 * i)
w = Wd("Boxes everywhere")
blip(w("Boxes")["start"], -24, rate=0.9)
for i in range(6):
    cue(w("crossing")["start"] - 0.05 + i * 0.09, "pen_tick", -27, rate=1.0 + 0.05 * i, pan=-0.5 + 0.2 * i)
for i in range(5):
    blip(w("Five")["start"] + i * 0.06, -27, rate=0.9 + 0.1 * i, pan=-0.4 + 0.2 * i)
cue(w("shouting")["start"], "zap_slash", -26, length=0.35, fade=0.1)
w = Wd("Now watch the exact")
cue(w("again.")["start"], "tape_rewind", -23, length=0.55, fade=0.15)
w = Wd("Same boxes")
bed("riser", w("Same")["start"] - 0.1, w("Same")["start"] + 2.2, -27)
cue(w("Same")["start"], "scan_sweep", -25, length=2.0, fade=0.4)
for i in range(8):
    zipc(w("Same")["start"] + 0.15 + i * 0.22, -31, pan=-0.7 + 0.2 * i)
cue(w("Same")["start"] + 2.3, "confirm_chime", -22)
cue(w("design")["start"], "pen_line", -27)
whip("This is Diagram Design")

# ---- 06 NAME
w = Wd("This is Diagram Design")
cue(w("Diagram")["start"] - 0.1, "impact_slam", -20, length=0.8, fade=0.3)
for i, k in enumerate(["free,", "open-source"]):
    blip(w(k)["start"], -25, rate=1.0 + 0.1 * i)
zipc(w("AI")["start"], -26)
ticks(w("49,000")["start"] - 0.1, w("49,000")["start"] + 1.0, 18, -30)
cue(w("49,000")["start"] + 1.0, "confirm_chime", -23)
whip("And its trick", -21)

# ---- 07 TRICK
w = Wd("And its trick")
hit(w("trick")["start"], -21, rate=0.8)
cue(w("trick")["start"] + 0.1, "projector_click", -24)
zipc(w("knows,")["start"], -27, pan=-0.5)
cue(w("knows,")["start"] + 0.25, "confirm_chime", -27, pan=-0.5)
cue(w("does.")["start"], "zap_slash", -24, length=0.35, fade=0.1, pan=0.5)
whip("Install it once")

# ---- 08 INSTALL
w = Wd("Install it once")
typing("key_click", w("Install")["start"] - 0.05, w("once,")["start"] + 0.1, -28, step=0.045)
cue(w("once,")["start"] + 0.15, "enter_key", -23)
cue(w("once,")["start"] + 0.2, "confirm_chime", -26)
typing("key_click", w("draw")["start"] - 0.05, w("app.")["end"], -29, pan=0.2)
whip("Your agent picks")

# ---- 09 TYPES
w = Wd("Your agent picks")
for i in range(14):
    blip(w("picks")["start"] - 0.2 + i * 0.05, -31 + (i % 2), rate=0.9 + 0.04 * (i % 8), pan=-0.7 + 0.1 * i)
ticks(w("picks")["start"], w("types,")["start"] + 0.2, 12, -30)
hit(w("types,")["start"] + 0.2, -22, rate=1.2)
cue(w("tells")["start"] + 0.1, "whoosh_soft", -25, pan=0.6)
typing("typewriter", w("tells")["start"] + 0.25, w("plan,")["end"] + 0.5, -31, pan=0.5, step=0.12)
zipc(w("writes")["start"], -25, pan=0.5)
cue(w("single")["start"], "impact_small", -21, rate=0.9, pan=0.5)
whip("No build step")

# ---- 10 ONE FILE
w = Wd("No build step")
cue(w("build")["start"] + 0.15, "marker_strike", -22, length=0.4, fade=0.12, pan=-0.5)
cue(w("JavaScript.")["start"] + 0.15, "marker_strike", -22, length=0.4, fade=0.12, pan=-0.5)
cue(w("One")["start"] + 0.15, "confirm_chime", -24, pan=-0.5)
cue(w("opens")["start"], "whoosh_soft", -23, pan=0.4)
blip(w("anywhere.")["start"], -25, pan=0.6)
whip("Now, the trick")

# ---- 11-12 SUBTRACT
w = Wd("Now, the trick")
cue(w("trick:")["start"] + 0.1, "mouse_click", -20)
cue(w("trick:")["start"] + 0.12, "projector_click", -22)
cue(w("adds.")["start"] - 0.2, "impact_small", -22, rate=1.1)
for i in range(3):
    cue(w("refuses")["start"] + i * 0.15, "zap_slash", -25, length=0.3, fade=0.08, pan=-0.5 + 0.5 * i)
cue(w("add.")["start"], "whoosh_fast", -24)
w = Wd("One accent colour")
cue(w("accent")["start"], "scan_sweep", -27, length=0.8, fade=0.2)
hit(w("matters.")["start"], -22, rate=0.9)
cue(w("Hairline")["start"], "pen_line", -24)
cue(w("Zero")["start"], "reverse_suck", -25, length=0.4, fade=0.1)
cue(w("snapped")["start"], "impact_slam", -21, length=0.5, fade=0.2)
ticks(w("snapped")["start"], w("grid.")["start"] + 0.2, 8, -30, 1.2)
whip("As its own rulebook")

# ---- 13 THE RULEBOOK
w = Wd("As its own rulebook")
cue(w("highest-quality")["start"] - 0.1, "whoosh_soft", -26)
cue(w("deletion.")["start"], "marker_strike", -23, length=0.45, fade=0.12)
subscribe_at(w("rulebook")["start"] - 0.2, db=-4)
whip("And it draws far more")

# ---- 14 MORE THAN BOXES
w = Wd("And it draws far more")
for k in ["flowcharts,", "timelines,", "Sankeys,", "Wardley"]:
    cue(w(k)["start"] - 0.35, "whoosh_fast", -23, pan=0.5)
    cue(w(k)["start"], "pen_line", -28, pan=-0.2)
cue(w("exploded")["start"] - 0.4, "whoosh_fast", -21, pan=0.5)
cue(w("3D")["start"] - 0.1, "riser", -27, length=1.0, fade=0.2)
for i in range(4):
    hit(w("3D")["start"] + 0.1 + i * 0.22, -25, rate=0.8 + 0.1 * i)
cue(w("stack.")["start"], "confirm_chime", -25)
whip("Got an old diagram")

# ---- 15 REDRAW
w = Wd("Got an old diagram")
for k in ["draw.io,", "Mermaid", "Excalidraw"]:
    cue(w(k)["start"] - 0.1, "paper_slide", -24, pan=-0.6)
    zipc(w(k)["start"] + 0.15, -29, pan=-0.3)
cue(w("redraws")["start"], "scan_sweep", -25, length=0.6, fade=0.2, pan=0.4)
typing("typewriter", w("receipt")["start"], w("dropped.")["end"] + 0.3, -29, pan=0.4, step=0.11)
cue(w("dropped.")["start"], "stamp", -21, pan=0.4)
whip("Want your company")

# ---- 16 YOUR BRAND
w = Wd("Want your company")
cue(w("website,")["start"] - 0.1, "whoosh_soft", -24, pan=-0.5)
cue(w("pulls")["start"], "mouse_click", -21, pan=-0.5)
for i in range(5):
    zipc(w("pulls")["start"] + 0.1 + i * 0.12, -29, pan=-0.3 + 0.2 * i)
blip(w("fonts,")["start"], -24, pan=0.4)
cue(w("checks")["start"] + 0.1, "scan_sweep", -28, length=0.4, fade=0.1, pan=0.4)
cue(w("readable.")["start"], "confirm_chime", -23, pan=0.4)
whip("It works in Claude Code")

# ---- 17 WHERE IT RUNS
w = Wd("It works in Claude Code")
for i, k in enumerate(["Claude", "Codex,", "Copilot,", "Cursor", "more,"]):
    blip(w(k)["start"], -25, rate=0.9 + 0.07 * i, pan=-0.6)
zipc(w("exports")["start"], -25, pan=0.4)
hit(w("SVG")["start"], -23, rate=1.2, pan=0.5)
hit(w("PNG")["start"], -23, rate=1.3, pan=0.5)
cue(w("slides")["start"], "paper_slide", -26, pan=0.7)
whip("The catch")

# ---- 18 THE CATCH
w = Wd("The catch")
cue(w("catch:")["start"], "impact_slam", -20, length=0.6, fade=0.2)
blip(w("only")["start"], -26, rate=0.8, pan=-0.6)
blip(w("same")["start"], -26, rate=0.9)
for i in range(4):
    cue(w("lay")["start"] + i * 0.45, "projector_click", -27)
blip(w("picture,")["start"], -26, rate=1.0, pan=0.6)
cue(w("editable")["start"] - 0.1, "mouse_click", -22, pan=0.6)
cue(w("editable")["start"] + 0.35, "zap_slash", -26, length=0.3, fade=0.08, pan=0.6)
whip("If your diagrams live")

# ---- 19 STICK WITH MERMAID
w = Wd("If your diagrams live")
for i in range(6):
    cue(w("Git")["start"] - 0.1 + i * 0.2, "pen_tick", -27, rate=1.0 + 0.04 * i, pan=-0.6 + 0.2 * i)
cue(w("stick")["start"], "impact_small", -21, rate=0.9)
cue(w("Mermaid.")["start"], "confirm_chime", -24)
whip("But for the one diagram")

# ---- 20 THE ONE THAT CONVINCES
w = Wd("But for the one diagram")
cue(line("But for the one diagram")["start"], "whoosh_soft", -25)
cue(w("convince")["start"], "paper_slide", -24, pan=0.6)
cue(w("someone,")["start"], "confirm_chime", -23, pan=0.6)
bed("riser", w("this")["start"] - 0.4, w("it.")["end"], -28)
hit(w("it.")["start"], -20, rate=0.8)
whip("One command")

# ---- 21 ONE COMMAND
w = Wd("One command")
typing("key_click", line("One command")["start"] - 0.05, w("next")["start"], -27, step=0.035)
cue(w("next")["start"] - 0.05, "enter_key", -22)
for i in range(8):
    blip(w("next")["start"] + 0.1 + i * 0.08, -30, rate=0.9 + 0.05 * i, pan=-0.6 + 0.15 * i)
cue(w("hired")["start"], "stamp", -18)
whip("That's today's tool", -21)

# ---- 22 OUTRO
w = Wd("That's today's tool")
hit(cutv("That's today's tool") + 0.1, -22, rate=0.9)
subscribe_at(w("Subscribe,")["start"] - 0.15)
zipc(w("every")["start"], -27)
