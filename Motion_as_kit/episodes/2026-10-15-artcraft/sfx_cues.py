# The sound cue sheet of the ArtCraft video, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut, jitter, DUR in
# scope). Sound design for a film set: a wooden clapper crack (stamp + a fast small impact) on every slate, the board
# rising on a soft whoosh, set pieces dropping in on low hits, the camera's lens clicks and focus sweeps, a projector
# whirr under the film strip, ticket stamps for the price, and the subscribe graphic's own clicks and chime.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def cutv(q):
    # the timeline's cut: 0.24 s before the line (every gap here is at least 0.48 s)
    return line(q)["start"] - 0.24


def rise(t, db=-28):
    cue(t, "whoosh_soft", db, rate=1.3)


def hit(t, db=-21, rate=1.0, pan=0.0):
    cue(t, "impact_small", db, rate=rate, pan=pan)


def blip(t, db=-25, rate=1.0, pan=0.0):
    cue(t, "ui_blip", db, rate=rate, pan=pan)


def ticks(t0, t1, n, db=-31, rate0=1.0):
    for i in range(n):
        cue(t0 + (t1 - t0) * i / n, "ui_tick", db, rate=rate0 + 0.03 * (i % 6))


def slate(q):
    # the board rises over the last 0.32 s of the plate before line q, claps 0.14 s into it, and leaves upward
    t = cutv(q)
    cue(t - 0.34, "whoosh_soft", -24, rate=0.9, pan=-0.2)
    cue(t + 0.13, "stamp", -15, rate=1.35)
    cue(t + 0.135, "impact_small", -19, rate=1.6)
    cue(t + 0.22, "whoosh_fast", -24, pan=0.3)


def drop(t, db=-24, pan=0.0):
    # a set piece landing on the stage
    cue(t, "impact_small", db, rate=0.75, pan=pan)


SUBSCRIBE = [(0.02, "whoosh_soft", -24), (0.9, "mouse_click", -18), (0.92, "ui_blip", -22), (1.45, "mouse_click", -19), (1.47, "confirm_chime", -21)]


def subscribe_at(t0, db=0):
    for dt, name, d in SUBSCRIBE:
        cue(t0 + dt, name, d + db)


# ---- 01 HOOK: the prompt types, the results reroll, "pray." lands
w = Wd("Every AI image tool")
rise(w("Every")["start"] - 0.05)
typing("key_click", w("type")["start"], w("prompt,")["end"] + 0.2, -29, pan=-0.3)
cue(w("prompt,")["end"] + 0.25, "enter_key", -24, pan=-0.3)
for i in range(8):
    blip(w("prompt,")["end"] + 0.4 + i * 0.32, -30 + (i % 2), rate=0.8 + 0.06 * (i % 5), pan=-0.5 + 0.15 * (i % 7))
hit(w("pray.")["start"], -20, rate=0.85)
slate("This one lets you build")

# ---- 02 SET: the room builds, the cast arrives, the letterbox closes, the camera rolls in
w = Wd("This one lets you build")
for i in range(4):
    drop(w("build")["start"] + i * 0.14, -25 + (i % 2), pan=-0.4 + 0.25 * i)
cue(w("first,")["start"], "pen_tick", -24, pan=-0.3)
cue(w("first,")["start"] + 0.12, "pen_tick", -25, pan=0.3)
cue(w("film")["start"] - 0.1, "reverse_suck", -25, length=0.4, fade=0.12)
cue(w("film")["start"] + 0.25, "impact_slam", -22, length=0.6, fade=0.2)
cue(w("set,")["start"], "paper_slide", -25, pan=0.6)
blip(w("only")["start"], -24, rate=0.8)
cue(w("generate.")["start"], "projector_click", -24)

# ---- 03 NAME: the title, FREE · OPEN SOURCE, the star counter
w = Wd("It's called ArtCraft")
rise(w("called")["start"] - 0.15, -25)
cue(w("ArtCraft.")["start"], "impact_slam", -20, length=0.8, fade=0.3)
cue(w("free,")["start"], "stamp", -22)
cue(w("open")["start"], "pen_line", -27, pan=0.4)
ticks(w("three")["start"] - 0.05, w("stars")["end"], 18)
cue(w("stars")["end"] + 0.02, "confirm_chime", -23)
blip(w("single")["start"], -27, rate=1.2)

# ---- 04 IDE: the quote, the app opens, layers stack, the stage turns
w = Wd("Its makers call it")
rise(w("IDE")["start"] - 0.2, -27)
cue(w("app")["start"] - 0.2, "whoosh_soft", -23, pan=-0.3)
cue(w("app")["start"] + 0.05, "mouse_click", -23)
for i in range(3):
    cue(w("compose")["start"] + 0.1 + i * 0.18, "paper_slide", -26 + i, pan=-0.6)
cue(w("stage")["start"], "whoosh_soft", -25, pan=0.6)
drop(w("stage")["start"] + 0.2, -25, pan=0.6)
slate("Drop in a room")

# ---- 05 POSE: room, actors on their marks, poses and the gizmo
w = Wd("Drop in a room")
for i in range(3):
    drop(w("room,")["start"] + i * 0.12, -24 + i, pan=-0.3 + 0.3 * i)
hit(w("actors,")["start"], -24, rate=1.3, pan=-0.4)
hit(w("actors,")["start"] + 0.12, -24, rate=1.4, pan=0.4)
cue(w("pose")["start"], "scan_sweep", -28, length=0.5, fade=0.15)
for i in range(5):
    cue(w("pose")["start"] + 0.08 + i * 0.09, "ui_tick", -29, rate=1.1 + 0.04 * i)
blip(w("mannequins.")["start"], -26, rate=0.9, pan=0.3)

# ---- 06 CAMERA: the rig glides in, the frustum opens, cut into the lens
w = Wd("Then put the camera")
cue(w("camera")["start"] - 0.2, "whoosh_soft", -23, pan=0.6)
cue(w("camera")["start"] + 0.2, "projector_click", -23, pan=0.5)
cue(w("exactly")["start"], "spark_zip", -27, pan=0.4)
cue(w("frame")["start"] - 0.05, "projector_click", -20)
cue(w("frame")["start"], "scan_sweep", -27, length=0.5, fade=0.15)
cue(w("shot.")["start"], "stamp", -23)

# ---- 07 MESH: a picture stands up as an object; a kit flies into a set
w = Wd("Turn any picture")
cue(w("picture")["start"], "paper_slide", -24, pan=-0.6)
cue(w("3d")["start"] - 0.1, "reverse_suck", -26, length=0.4, fade=0.12, pan=-0.5)
hit(w("3d")["start"] + 0.25, -22, rate=0.9, pan=-0.5)
cue(w("rotate,")["start"], "whoosh_soft", -27, rate=1.2, pan=-0.5)
for i in range(6):
    drop(w("kitbash")["start"] + i * 0.13, -25 + (i % 2), pan=0.3 + 0.08 * i)
hit(w("kits.")["start"], -23, rate=0.8, pan=0.6)
slate("Then you generate")

# ---- 08 GENERATE: the button, the scan paints the shot, the blocking overlay
w = Wd("Then you generate")
cue(w("generate,")["start"], "mouse_click", -19)
cue(w("generate,")["start"] + 0.02, "spark_zip", -23)
bed("riser", w("generate,")["start"] + 0.05, w("generate,")["end"] + 1.0, -28)
cue(w("generate,")["start"] + 0.1, "scan_sweep", -24, length=1.2, fade=0.3)
cue(w("guide")["start"], "pen_line", -25)
cue(w("stand.")["end"], "confirm_chime", -24)

# ---- 09 CONSISTENT: the film strip runs past
w = Wd("Keep the same room")
bed("projector_run", cutv("Keep the same room") + 0.1, line("Keep the same room")["end"] + 0.3, -31, fin=0.3, fout=0.4)
cue(w("same")["start"], "whoosh_soft", -24, pan=-0.5)
for i in range(4):
    cue(w("every")["start"] + i * 0.35, "projector_click", -26 + (i % 2), pan=-0.4 + 0.25 * i)
cue(w("consistent.")["start"], "stamp", -22)

# ---- 10 QUICK: three monitors, a prompt, a mask, a video
w = Wd("Want a quick idea")
blip(w("quick")["start"], -24)
typing("key_click", w("Type")["start"], w("prompt,")["end"] + 0.2, -29, pan=-0.6)
cue(w("mask,")["start"] - 0.1, "pen_line", -24)
cue(w("video.")["start"], "tape_rewind", -27, length=0.6, fade=0.2, pan=0.6)
cue(w("video.")["start"] + 0.3, "projector_click", -24, pan=0.6)
slate("It plugs into")

# ---- 11 MODELS: the rolling credits
w = Wd("It plugs into")
cue(w("list")["start"], "pen_line", -28, pan=-0.6)
for i, k in enumerate(["Midjourney,", "Sora,", "Grok", "World"]):
    blip(w(k)["start"], -25, rate=0.9 + 0.08 * i)
rise(w("worlds.")["start"] - 0.1, -28)

# ---- 12 PRICE: two tickets
w = Wd("The app is free")
cue(cutv("The app is free") + 0.05, "paper_slide", -23, pan=-0.5)
cue(w("free.")["start"], "stamp", -19, pan=-0.4)
cue(w("Generating")["start"] - 0.05, "paper_slide", -23, pan=0.5)
for k in ["bring", "credits,"]:
    cue(w(k)["start"], "typewriter", -27, pan=0.5)
cue(w("8")["start"], "stamp", -20, pan=0.5)
cue(w("yearly.")["start"], "pen_tick", -26, pan=0.4)

# ---- 13 PLATFORMS: three film cans pop up
w = Wd("It runs on Windows")
rise(cutv("It runs on Windows") + 0.05, -29)
hit(w("Windows")["start"], -22, rate=1.1, pan=-0.6)
hit(w("Mac,")["start"], -22, rate=1.2)
hit(w("Linux")["start"], -22, rate=1.0, pan=0.6)
cue(w("build")["start"], "pen_line", -26, pan=0.6)
slate("Stop prompting")

# ---- 14 DIRECTING: struck through; START DIRECTING.
w = Wd("Stop prompting")
cue(w("praying.")["end"], "marker_strike", -20, length=0.5, fade=0.12)
cue(w("Start")["start"] - 0.1, "reverse_suck", -22, length=0.45, fade=0.15)
cue(w("Start")["start"] + 0.12, "impact_slam", -18, length=0.9, fade=0.3)
hit(w("directing.")["start"], -22, rate=0.8)

# ---- 15 OUTRO
w = Wd("That's today's tool")
cue(cutv("That's today's tool") + 0.06, "impact_small", -22, rate=0.9)
subscribe_at(w("Subscribe,")["start"] - 0.15)
cue(w("every")["start"], "spark_zip", -27)
