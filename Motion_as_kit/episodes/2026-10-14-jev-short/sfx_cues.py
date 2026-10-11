# The sound cue sheet of the Jev Short, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut, jitter, DUR in
# scope). A game show: a whoosh as each round's panels slide in, a blip per panel, a big hit when an answer
# locks, a chime when it turns green, ticks up the ladder, and the subscribe graphic's clicks at the end.
# flake8: noqa


def Ww(lq, q, n=0):
    return W(lq, q, n)


def lock(t, db=-19):
    cue(t, "impact_slam", db, length=0.5, fade=0.15)
    cue(t + 0.02, "ui_blip", db - 4, rate=0.8)


def right(t, db=-20):
    cue(t, "confirm_chime", db)


starts = [line(q)["start"] for q in ["POV", "It's called Jev", "It can't chat", "Its makers", "Developers already", "Final answer"]]
for s in starts[1:]:
    cue(s - 0.32, "whoosh_fast", -21)
for i in range(5):
    cue(0.05 + i * 0.07, "ui_blip", -27, rate=1.0 + 0.06 * i)

# 1
cue(0.15, "impact_small", -20)
lock(Ww("POV", "multiple")["start"])
right(Ww("POV", "choice.")["end"] + 0.15)
# 2
cue(Ww("It's called Jev", "Jev.")["start"], "impact_slam", -20, length=0.6, fade=0.2)
for i in range(3):
    cue(Ww("It's called Jev", "options,")["start"] - 0.3 + i * 0.07, "ui_blip", -26, rate=1.0 + 0.08 * i)
lock(Ww("It's called Jev", "picks")["start"])
cue(Ww("It's called Jev", "blink,")["start"] - 0.1, "spark_zip", -24)
for i in range(8):
    cue(Ww("It's called Jev", "how")["start"] + i * 0.05, "ui_tick", -29, rate=1.2)
right(Ww("It's called Jev", "is.")["end"] + 0.05)
# 3
cue(Ww("It can't chat", "chat.")["start"], "zap_slash", -21, length=0.4, fade=0.1)
cue(Ww("It can't chat", "write.")["start"], "zap_slash", -21, length=0.4, fade=0.1, rate=0.9)
lock(Ww("It can't chat", "decides.")["start"], -20)
right(Ww("It can't chat", "decides.")["start"] + 0.05)
# 4
t0, t1 = Ww("Its makers", "444")["start"] - 0.1, Ww("Its makers", "times")["start"]
for i in range(6):
    cue(t0 + (t1 - t0) * i / 6, "ui_tick", -25, rate=1.0 + 0.12 * i)
lock(t1)
right(Ww("Its makers", "cheaper")["start"])
# 5
cue(Ww("Developers already", "sort")["start"], "ui_blip", -22, rate=1.1)
cue(Ww("Developers already", "guard")["start"] - 0.2, "whoosh_soft", -24)
cue(Ww("Developers already", "guard")["start"], "ui_blip", -22, rate=1.3)
# 6
cue(Ww("Final answer", "Final")["start"], "riser", -24, length=0.9, fade=0.2)
lock(Ww("Final answer", "Subscribe")["start"])
right(Ww("Final answer", "Subscribe")["start"] + 0.35)
t0 = Ww("Final answer", "Subscribe")["start"] + 0.45
for dt, name, d in [(0.02, "whoosh_soft", -24), (0.9, "mouse_click", -18), (0.92, "ui_blip", -22), (1.45, "mouse_click", -19), (1.47, "confirm_chime", -21)]:
    cue(t0 + dt, name, d)
