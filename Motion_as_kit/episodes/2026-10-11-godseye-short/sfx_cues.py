# The sound cue sheet of the God's Eye View Short, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut, jitter,
# DUR in scope). A classified file: rubber stamps thumping down, the folder cover flapping open, pages sliding onto
# the stack, typewriter keys under every typed line, a paper clip, red-pen ticks, a static hiss for night vision, and
# the subscribe graphic's clicks and chime.
# flake8: noqa


def Ww(lq, q, n=0):
    return W(lq, q, n)


def thump(t, db=-16):
    cue(t, "stamp", db)
    cue(t + 0.01, "impact_small", db - 6, rate=0.7)


def page(t, db=-20, pan=0.0):
    cue(t, "paper_slide", db, pan=pan)
    cue(t + 0.1, "whoosh_soft", db - 7, rate=0.9, pan=pan)


SUBSCRIBE = [(0.02, "whoosh_soft", -24), (0.9, "mouse_click", -18), (0.92, "ui_blip", -22), (1.45, "mouse_click", -19), (1.47, "confirm_chime", -21)]

# 1 the folder
thump(0.15)
cue(Ww("POV", "browser")["start"] - 0.25, "paper_slide", -19)
cue(Ww("POV", "browser")["start"] - 0.1, "whoosh_soft", -24)
typing("typewriter", Ww("POV", "browser")["start"] + 0.1, Ww("POV", "browser")["start"] + 0.6, -27, step=0.05)
cue(Ww("POV", "browser")["start"] + 0.2, "snip", -26)
thump(Ww("POV", "spy")["start"] - 0.05)
# 2 the layers page
t = Ww("11,000 live", "11,000")["start"]
page(t - 0.35, pan=0.5)
typing("typewriter", t - 0.3, t + 0.2, -28, step=0.05)
cue(t + 0.1, "snip", -25, pan=-0.3)
cue(Ww("11,000 live", "838")["start"] + 0.1, "snip", -25, pan=0.3)
for k in ["11,000", "838"]:
    cue(Ww("11,000 live", k)["start"] + 0.1, "marker_strike", -25, length=0.3, fade=0.08)
for k in ["Ships,", "earthquakes,", "fires."]:
    typing("typewriter", Ww("11,000 live", k)["start"] - 0.05, Ww("11,000 live", k)["start"] + 0.3, -28, step=0.05)
    cue(Ww("11,000 live", k)["start"], "pen_tick", -21)
# 3 the cameras page
t = Ww("Nearly 4,000", "Nearly")["start"]
page(t - 0.35, pan=-0.5)
cue(Ww("Nearly 4,000", "4,000")["start"] + 0.05, "marker_strike", -24, length=0.35, fade=0.1)
for i in range(6):
    cue(Ww("Nearly 4,000", "public")["start"] + i * 0.1, "projector_click", -27, pan=-0.5 + 0.2 * i)
cue(Ww("Nearly 4,000", "night")["start"] - 0.05, "spark_sizzle", -22, length=0.25, fade=0.06)
thump(Ww("Nearly 4,000", "night")["start"])
# 4 the cover sheet
t = Ww("It's called God", "called")["start"]
page(t - 0.3)
typing("typewriter", Ww("It's called God", "God's")["start"] - 0.05, Ww("It's called God", "God's")["start"] + 1.4, -26, step=0.05)
thump(Ww("It's called God", "free,")["start"])
thump(Ww("It's called God", "open")["start"], -17)
cue(Ww("It's called God", "real.")["start"] - 0.2, "reverse_suck", -21, length=0.25, fade=0.06)
thump(Ww("It's called God", "real.")["start"], -14)
cue(Ww("It's called God", "real.")["start"] + 0.02, "impact_slam", -19, length=0.6, fade=0.2)
# 5 subscribe
t0 = Ww("Subscribe for", "Subscribe")["start"] - 0.1
for dt, name, d in SUBSCRIBE:
    cue(t0 + dt, name, d)
