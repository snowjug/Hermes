# The sound cue sheet of the Diagram Design Short, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut, jitter,
# DUR in scope). A design tool: soft clicks and pops for the cursors and the comment, a slam and wobbly zips for the
# spaghetti, a drag-and-drop thunk for the skill, a sweep and ticks as the inspector logs each change, a whoosh out to
# the 44 frames and back, a chime for the stars, and the subscribe graphic's clicks and chime.
# flake8: noqa


def Ww(lq, q, n=0):
    return W(lq, q, n)


SUBSCRIBE = [(0.02, "whoosh_soft", -24), (0.9, "mouse_click", -18), (0.92, "ui_blip", -22), (1.45, "mouse_click", -19), (1.47, "confirm_chime", -21)]

cue(0.02, "ui_blip", -24, rate=0.9)
# 1 POV: the comment
cue(Ww("POV", "asked")["start"] - 0.2, "mouse_click", -21)
typing("key_click", Ww("POV", "asked")["start"] - 0.05, Ww("POV", "diagram.")["end"], -29, step=0.05)
# 2 spaghetti
t = Ww("It gave you", "gave")["start"]
cue(t - 0.2, "reverse_suck", -22, length=0.25, fade=0.06)
cue(t, "impact_slam", -18, length=0.7, fade=0.25)
for i in range(6):
    cue(t + 0.05 + i * 0.05, "impact_small", -27, rate=1.3 + 0.05 * i, pan=-0.5 + 0.2 * i)
t = Ww("It gave you", "spaghetti.")["start"]
for i in range(5):
    cue(t + i * 0.08, "spark_zip", -27, rate=0.7 + 0.08 * i, pan=-0.6 + 0.3 * i)
cue(t + 0.05, "stamp", -22, rate=1.2)
# 3 the skill dragged in
t = Ww("Now add one", "add")["start"]
cue(t - 0.1, "mouse_click", -21, pan=0.6)
cue(t, "paper_slide", -23, pan=0.5)
cue(Ww("Now add one", "skill,")["start"], "impact_small", -20, rate=0.8)
cue(Ww("Now add one", "ask")["start"] - 0.1, "ui_blip", -24)
typing("key_click", Ww("Now add one", "ask")["start"], Ww("Now add one", "again.")["end"], -30, step=0.05)
# 4 the inspector, the 44 frames, the brand
w = lambda q: Ww("One accent", q)
cue(w("accent")["start"], "scan_sweep", -24, length=2.2, fade=0.4)
bed("riser", w("accent")["start"], w("shadows,")["end"], -29)
for k in ["accent", "hairline", "zero"]:
    cue(w(k)["start"] + 0.1, "pen_tick", -24)
    cue(w(k)["start"] + 0.12, "ui_blip", -27, rate=1.2)
cue(w("44")["start"] - 0.1, "whoosh_fast", -21)
for i in range(16):
    cue(w("44")["start"] + 0.1 + i * 0.035, "ui_tick", -31, rate=1.0 + 0.02 * i, pan=-0.7 + 0.09 * i)
cue(w("brand's")["start"] - 0.1, "whoosh_fast", -22, rate=1.1)
cue(w("brand's")["start"] + 0.2, "mouse_click", -20)
cue(w("colours.")["start"], "confirm_chime", -25)
# 5 the name and the stars
w = lambda q: Ww("It's called Diagram", q)
typing("key_click", w("called")["start"], w("Design,")["end"], -29, step=0.05)
for i in range(14):
    cue(w("49,000")["start"] - 0.1 + i * 0.06, "ui_tick", -30, rate=1.0 + 0.03 * i)
cue(w("stars.")["start"], "confirm_chime", -22)
# 6 hired, subscribe
w = lambda q: Ww("Your AI just hired", q)
cue(w("hired")["start"], "stamp", -19)
t0 = w("Subscribe")["start"] - 0.1
for dt, name, d in SUBSCRIBE:
    cue(t0 + dt, name, d)
