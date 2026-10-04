# The sound cue sheet of the disktree video, run by analysis/sfx_mix.py (its helpers: cue, bed, typing,
# W, line, cut, jitter, DUR are in scope). Every effect sits on something you see; the voice leads.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


# ---- HOOK
w = Wd("Shopify founder Tobi")
cue(w("Shopify")["start"] - 0.02, "spark_ignite", -24)
cue(w("Tobi")["start"] - 0.005, "impact_slam", -17, length=0.5, fade=0.2)
typing("key_click", w("Tobi")["start"] + 0.15, w("Tobi")["start"] + 0.7, -33, pan=0.4, step=0.05)
cue(w("disk")["start"], "ui_blip", -27, rate=0.8)
cue(w("cleaner.")["start"], "marker_strike", -24, length=0.4, fade=0.12)

# ---- RACE
cue(cut("Run it as administrator"), "whoosh_fast", -21)
w = Wd("Run it as administrator")
for i, q in enumerate(("Windows,", "four-million-file", "administrator")):
    cue(w(q)["start"], "ui_tick", -28, rate=1.0 + 0.05 * i, pan=-0.4 + 0.3 * i)
t0, t1 = w("reads")["start"], w("seconds.")["end"]
bed("projector_run", t0, t1, -31)
cue(t1 - 0.02, "confirm_chime", -22, pan=-0.2)
w = Wd("In his test")
bed("projector_run", t1, w("eleven.")["end"], -33, rate=0.9)
cue(w("eleven.")["end"] - 0.02, "impact_small", -21, pan=0.3)

# ---- NAME
w = Wd("It's called disktree")
d = w("disktree.")
cue(d["start"] - 0.005, "impact_slam", -17, length=0.5, fade=0.2)
for i in range(8):
    cue(d["start"] + (i / 8) * max(0.3, d["end"] - d["start"]) * 0.8, "ui_tick", -32, rate=0.9 + 0.04 * i)
cue(d["start"] + 0.15, "paper_slide", -24, pan=0.4)
for i, q in enumerate(("free,", "open", "Linux,", "Mac", "Windows.")):
    cue(w(q)["start"], "ui_blip", -26, rate=1.0 + 0.05 * i, pan=-0.3)

# ---- TREE
w = Wd("The idea is simple")
cue(w("idea")["start"], "pen_line", -27, length=0.8, fade=0.15)
ta, tb = w("Every")["start"], w("box,")["end"]
for i in range(10):
    cue(ta + (tb - ta) * i / 10, "ui_tick", -33, rate=0.9 + 0.03 * i, pan=-0.5 + 0.1 * i)
cue(w("sized")["start"], "pen_tick", -26)
ta, tb = w("inside")["start"], w("down.")["end"]
for i in range(12):
    cue(ta + (tb - ta) * i / 12, "ui_tick", -35, rate=1.2 + 0.02 * i, pan=0.4 - 0.07 * i)
w = Wd("Scroll, and you zoom")
cue(w("zoom")["start"], "whoosh_soft", -22, rate=0.9)
cue(w("drop")["start"], "whoosh_soft", -22, rate=1.15)
w = Wd("Color tells you")
cue(w("Color")["start"], "whoosh_soft", -24, rate=1.2)
for i, q in enumerate(("code,", "toolchains,", "media,", "documents,", "caches.")):
    cue(w(q)["start"], "ui_blip", -27, rate=0.95 + 0.06 * i, pan=-0.4 + 0.2 * i)
w = Wd("And diagonal stripes")
cue(w("diagonal")["start"], "pen_line", -27, length=0.9, fade=0.2)
bed("spark_sizzle", w("diagonal")["start"], w("stripes")["end"] + 0.3, -33)
cue(w("output.")["start"], "confirm_chime", -26, pan=0.4)
w = Wd("It even counts hidden")
for i in range(4):
    cue(w("hidden")["start"] + i * 0.07, "ui_blip", -29, rate=1.1 + 0.05 * i, pan=-0.5 + 0.3 * i)
cue(w("biggest")["start"] + 0.1, "impact_small", -22)

# ---- MARK
w = Wd("Found the culprit")
cue(w("Mark")["start"] + 0.1, "key_click", -15)
cue(w("Mark")["start"] + 0.12, "zap_slash", -24)
ta = w("everything")["start"]
for i in range(5):
    cue(ta + i * 0.08, "ui_tick", -30, rate=0.85 + 0.05 * i)
w = Wd("Nothing is deleted yet")
cue(w("review")["start"] - 0.15, "paper_slide", -23, pan=0.4)
w = Wd("Then pick the trash")
cue(w("trash,")["start"], "mouse_click", -21, pan=0.4)
cue(w("permanently,")["start"], "mouse_click", -20, pan=0.4)
cue(w("always")["start"], "ui_blip", -22, rate=0.8)
w = Wd("When it's done")
cue(w("scans")["start"], "scan_sweep", -25)
cue(w("scans")["start"] + 0.4, "reverse_suck", -27)
cue(w("space")["start"], "confirm_chime", -23)

# ---- AGENT
w = Wd("One key even copies")
cue(w("key")["start"], "key_click", -14)
typing("typewriter", w("key")["start"] + 0.2, w("key")["start"] + 1.8, -31, step=0.06)
cue(w("coding")["start"], "whoosh_soft", -24)
for q in ("check", "path", "removing"):
    cue(w(q)["start"], "pen_tick", -25, pan=0.3)

# ---- CATCH
cue(cut("The catch?"), "whoosh_fast", -21)
w = Wd("The catch?")
cue(w("catch?")["start"], "impact_small", -19)
cue(w("name,")["start"], "marker_strike", -25, length=0.35, fade=0.1)
cue(w("wrong")["start"] + 0.35, "stamp", -14)
w = Wd("Still, seeing exactly")
cue(w("Still,")["start"] + 0.1, "whoosh_soft", -23)
cue(w("lot.")["start"], "confirm_chime", -27)

# ---- OUTRO
w = Wd("That's today's tool")
cue(w("That's")["start"] - 0.02, "whoosh_fast", -20)
cue(w("tool.")["start"], "impact_small", -22)
cue(w("every")["start"], "confirm_chime", -25)
cue(DUR - 0.12, "reverse_suck", -19)
cue(DUR - 0.12, "spark_ignite", -28, rate=1.3, length=0.06, fade=0.03)
