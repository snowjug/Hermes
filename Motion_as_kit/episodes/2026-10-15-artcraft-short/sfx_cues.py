# The sound cue sheet of the ArtCraft Short, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut, jitter, DUR in
# scope). A sketchbook: a paper slide and a soft whoosh as each page flips up over the spiral, pencil lines under the
# hand lettering, a low wet whoosh as the watercolour blooms, tape and a sticky note going down, a marker strike for
# the crossing-out, and the subscribe graphic's clicks and chime at the end.
# flake8: noqa


def Ww(lq, q, n=0):
    return W(lq, q, n)


def flip(t):
    cue(t, "paper_slide", -19)
    cue(t + 0.12, "whoosh_soft", -25, pan=0.3)


def letter(t0, t1, db=-24, pan=0.0):
    # the pencil writing a headline from t0 to t1
    cue(t0, "pen_line", db, pan=pan, length=max(0.25, t1 - t0), fade=0.08)


def bloom(t, db=-29, pan=0.0):
    cue(t, "whoosh_soft", db, rate=0.7, pan=pan)


SUBSCRIBE = [(0.02, "whoosh_soft", -24), (0.9, "mouse_click", -18), (0.92, "ui_blip", -22), (1.45, "mouse_click", -19), (1.47, "confirm_chime", -21)]

turn = Ww("Same room", "Turn")["start"]
for s in [line(q)["start"] for q in ["In ArtCraft", "Then you generate", "Same room", "It's free", "Stop prompting"]] + [turn]:
    flip(s - 0.3)

# 1 POV: the lettering, the mannequin sketched in, the rings, the watercolour
letter(0.12, 0.85, -22)
cue(0.4, "pen_line", -28, length=1.0, fade=0.2, pan=0.2)
cue(Ww("POV", "control")["start"], "spark_zip", -26, pan=0.4)
for i in range(3):
    cue(Ww("POV", "control")["start"] + 0.05 + i * 0.1, "pen_tick", -27, rate=1.0 + 0.1 * i, pan=0.4)
bloom(Ww("POV", "AI")["start"] - 0.1, -25)
bloom(Ww("POV", "draws.")["start"], -28, pan=0.4)

# 2 ArtCraft: the room, the cast, the camera, 1ST
w = lambda q: Ww("In ArtCraft", q)
letter(w("ArtCraft,")["start"] - 0.05, w("ArtCraft,")["end"] + 0.1, -22)
cue(w("ArtCraft,")["end"] + 0.05, "marker_strike", -27, length=0.35, fade=0.1)
cue(line("In ArtCraft")["start"] - 0.05, "pen_line", -29, length=0.8, fade=0.2, pan=-0.3)
cue(w("pose")["start"] - 0.35, "impact_small", -25, rate=1.4, pan=-0.2)
cue(w("pose")["start"] - 0.3, "impact_small", -25, rate=1.5, pan=0.2)
cue(w("pose")["start"] + 0.1, "scan_sweep", -30, length=0.4, fade=0.12)
bloom(w("characters")["start"], -29)
cue(w("camera")["start"] - 0.05, "impact_small", -21, rate=0.9, pan=-0.4)
cue(w("camera")["start"] + 0.25, "projector_click", -25, pan=-0.4)
letter(w("first.")["start"] - 0.05, w("first.")["start"] + 0.3, -23, pan=-0.5)
cue(w("first.")["start"] + 0.25, "pen_line", -26, length=0.35, fade=0.1, pan=-0.5)

# 3 generate
w = lambda q: Ww("Then you generate", q)
cue(line("Then you generate")["start"] - 0.1, "snip", -26, pan=-0.5)
cue(line("Then you generate")["start"], "snip", -27, pan=0.5)
cue(w("generate,")["start"], "mouse_click", -18, pan=0.3)
cue(w("generate,")["start"] + 0.05, "spark_zip", -24)
bloom(w("generate,")["start"] + 0.1, -23)
cue(w("generate,")["start"] + 0.15, "scan_sweep", -28, length=0.9, fade=0.25)
cue(w("guide")["start"] - 0.1, "pen_line", -24, length=0.4, fade=0.1, pan=-0.3)

# 4 same room, every shot
w = lambda q: Ww("Same room", q)
for k, t in enumerate([line("Same room")["start"] - 0.15, w("room,")["start"], w("every")["start"]]):
    cue(t, "paper_slide", -23, pan=[-0.4, 0.4, -0.4][k])
    cue(t + 0.08, "snip", -27, pan=[0.4, -0.4, 0.4][k])
    bloom(t + 0.1, -30)
letter(w("shot.")["start"] - 0.05, w("shot.")["end"] + 0.35, -24, pan=0.5)

# 5 a picture into a 3D prop
cue(turn - 0.25, "stamp", -24, rate=1.3, pan=-0.4)
cue(turn - 0.1, "pen_line", -26, length=0.7, fade=0.15, pan=-0.4)
cue(w("into")["start"] - 0.1, "pen_line", -25, length=0.4, fade=0.1)
cue(w("3D")["start"] - 0.3, "reverse_suck", -24, length=0.35, fade=0.1, pan=0.3)
cue(w("3D")["start"], "impact_small", -20, rate=0.9, pan=0.3)
bloom(w("3D")["start"] + 0.05, -26, pan=0.3)
letter(w("prop.")["start"] - 0.05, w("prop.")["start"] + 0.4, -25, pan=0.3)

# 6 free, open source, the stars
w = lambda q: Ww("It's free", q)
bloom(w("free")["start"] - 0.15, -25)
letter(w("free")["start"] - 0.1, w("free")["start"] + 0.45, -21)
letter(w("open")["start"] - 0.05, w("source,")["end"], -25)
letter(w("three")["start"] - 0.05, w("stars")["start"] + 0.1, -23)
cue(w("stars")["start"], "confirm_chime", -24, pan=0.5)
for i in range(8):
    cue(w("thousand")["start"] + i * 0.11, "ui_blip", -29 + (i % 2), rate=1.1 + 0.06 * i, pan=-0.7 + 0.2 * i)
letter(w("in")["start"] - 0.05, w("day.")["start"] + 0.3, -25, pan=0.1)
cue(w("day.")["start"] + 0.05, "pen_line", -26, length=0.4, fade=0.1)

# 7 stop prompting, start directing, subscribe
w = lambda q: Ww("Stop prompting", q)
letter(w("Stop")["start"] - 0.05, w("prompting.")["end"], -24)
cue(w("prompting.")["end"] + 0.05, "marker_strike", -19, length=0.35, fade=0.1)
cue(w("prompting.")["end"] + 0.22, "marker_strike", -21, length=0.35, fade=0.1, rate=1.1)
letter(w("Start")["start"] - 0.05, w("directing.")["end"] + 0.1, -21)
cue(w("Start")["start"], "impact_slam", -22, length=0.6, fade=0.2)
cue(w("directing.")["end"], "marker_strike", -26, length=0.4, fade=0.12)
cue(w("Start")["start"] + 0.1, "pen_line", -28, length=0.7, fade=0.2, pan=0.2)
t0 = w("Subscribe")["start"] - 0.1
for dt, name, d in SUBSCRIBE:
    cue(t0 + dt, name, d)
