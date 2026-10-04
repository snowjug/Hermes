# The sound cue sheet of the disktree Short (run by analysis/sfx_mix.py). Punchier than the long video:
# a hit on every slammed word, a whoosh on every snap of the camera. Still nothing without a picture.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


w = Wd("Your disk is full")
for i, q in enumerate(("Your", "disk", "is")):
    cue(w(q)["start"] - 0.005, "impact_small", -17, rate=1.0 - 0.06 * i)
cue(w("full.")["start"], "riser", -26)
cue(w("full.")["start"] - 0.005, "impact_slam", -13, length=0.5, fade=0.2)
w = Wd("But full of what")
cue(w("But")["start"] - 0.03, "whoosh_fast", -18)
cue(w("of")["start"], "impact_small", -20, rate=1.1)
cue(w("what?")["start"] + 0.07, "impact_slam", -12, length=0.6, fade=0.25)

w = Wd("This free app")
cue(w("app")["start"], "pen_line", -24, length=0.5, fade=0.12)
ta, tb = w("every")["start"], w("box,")["end"]
for i in range(9):
    cue(ta + (tb - ta) * i / 9, "ui_tick", -27, rate=0.9 + 0.05 * i, pan=-0.5 + 0.12 * i)
cue(w("sized")["start"], "ui_blip", -24)
w = Wd("Folders inside folders")
for i in range(8):
    cue(w("inside")["start"] + i * 0.06, "ui_tick", -29, rate=1.3 + 0.03 * i)
for q in ("all", "way", "down."):
    cue(w(q)["start"] + 0.12, "whoosh_fast", -19, rate=1.1)

w = Wd("The biggest box")
cue(w("biggest")["start"], "impact_small", -19)
cue(w("hidden")["start"] + 0.08, "impact_slam", -15, length=0.45, fade=0.2)
cue(w("cache.")["start"], "impact_small", -18, rate=0.85)
w = Wd("Striped boxes")
cue(w("Striped")["start"], "spark_zip", -22, length=0.8, fade=0.2)
ta, tb = w("back,")["start"], w("output.")["end"]
for i in range(10):
    cue(ta + (tb - ta) * (i / 10) ** 1.5, "ui_tick", -28, rate=1.0 + 0.05 * i)
cue(tb, "confirm_chime", -21)

w = Wd("Mark them")
cue(w("Mark")["start"], "stamp", -15)
cue(w("review")["start"], "stamp", -16, rate=1.08)
cue(w("review")["start"] + 0.1, "paper_slide", -21)
cue(w("then")["start"], "impact_small", -18)
cue(w("delete.")["start"], "impact_slam", -12, length=0.5, fade=0.2)
cue(w("delete.")["start"] + 0.2, "falling_pieces", -18)
cue(w("delete.")["start"] + 0.5, "confirm_chime", -20)

w = Wd("It's called disktree")
d = w("disktree,")
cue(d["start"] - 0.005, "impact_slam", -14, length=0.5, fade=0.2)
for i in range(8):
    cue(d["start"] + (i / 8) * max(0.3, d["end"] - d["start"]) * 0.8, "ui_tick", -29, rate=0.9 + 0.05 * i)
for i, q in enumerate(("Free", "Linux,", "Mac", "Windows.")):
    cue(w(q)["start"], "ui_blip", -22, rate=1.0 + 0.07 * i, pan=-0.3 + 0.2 * i)
w = Wd("Full breakdown")
cue(w("Full")["start"] - 0.03, "whoosh_fast", -19)
cue(w("channel.")["start"], "impact_small", -20)
