# The sound cue sheet of the magpie video, run by analysis/sfx_mix.py (its helpers: cue, bed, typing,
# W, line, cut, jitter, DUR are in scope).
# flake8: noqa
# ================================================================== the magpie video's cue sheet
# Every effect sits on a visual event of a plate (the pen, a click, a stamp, a camera whip), and the
# whole sheet is quieter than the original kit's: the voice carries the video.
P = lambda q: line(q)


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


# ---- MARRIED
w = Wd("The biggest coding agents")
cue(w("The")["start"] - 0.02, "spark_ignite", -24)
m = w("married")
cue(m["start"], "pen_line", -24, length=max(0.3, m["end"] - m["start"]) + 0.05, fade=0.08)
bed("spark_sizzle", m["start"], m["end"] + 0.05, -32)
cue(w("company.")["start"], "marker_strike", -24, length=0.45, fade=0.12)
w = Wd("Codex talks to OpenAI")
cue(w("Codex")["start"] - 0.06, "whoosh_fast", -20)
for q, n in (("Codex", 0), ("OpenAI.", 0), ("Claude", 0), ("Anthropic.", 0)):
    cue(w(q, n)["start"] - 0.1, "ui_blip", -27, pan=-0.4 if q in ("Codex", "Claude") else 0.4)
for q in ("OpenAI.", "Anthropic."):
    t0 = w(q)["start"] + 0.05
    cue(t0, "pen_tick", -25, pan=0.1)
    cue(t0 + 0.24, "pen_tick", -25, pan=0.15, rate=1.1)

# ---- CONFIG (paper)
cue(cut("Want a different model"), "paper_slide", -20)
w = Wd("Want a different model")
cue(w("Get")["start"] - 0.2, "paper_slide", -23, rate=1.1)
for i, q in enumerate(("dig", "through", "config")):
    cue(w(q)["start"], "paper_slide", -21, rate=jitter(i, 0.08), pan=0.3)
cue(w("files.")["start"], "marker_strike", -21, length=0.5, fade=0.12)

# ---- QUESTION
cue(cut("So how does an app"), "whoosh_soft", -24)
w = Wd("So how does an app")
cue(w("app")["start"] - 0.05, "pen_line", -27, length=0.42, fade=0.1)
cue(w("fifteen")["start"], "pen_tick", -26)
cue(w("fifteen")["start"] + 0.12, "ui_tick", -29)
cue(w("Codex")["start"] + 0.02, "whoosh_fast", -21)
for q, pan in (("Codex", -0.4), ("DeepSeek,", 0.4), ("Claude", -0.4), ("Kimi?", 0.4)):
    cue(w(q)["start"] - 0.1, "ui_blip", -27, pan=pan)
cue(w("Kimi?")["end"] - 0.05, "pen_line", -24, length=0.32, fade=0.08)
cue(w("Kimi?")["end"] + 0.3, "pen_tick", -22)

# ---- TITLE
w = Wd("It's called magpie")
mg = w("magpie.")
cue(mg["start"] - 0.005, "impact_slam", -16, length=0.5, fade=0.2)
for i in range(6):
    cue(mg["start"] + (i / 6) * max(0.25, mg["end"] - mg["start"]) * 0.8, "ui_tick", -31, rate=0.9 + 0.05 * i, pan=-0.3 + 0.12 * i)
cue(w("free,")["start"], "ui_blip", -23, pan=-0.3)
cue(w("open")["start"], "ui_blip", -23, pan=0.0, rate=1.08)
cue(w("four")["start"] - 0.1, "pen_line", -27, length=0.4, fade=0.1)
t0, t1 = w("four")["start"], w("stars.")["end"]
for i in range(9):
    cue(t0 + (t1 - t0) * (i / 9) ** 1.6, "ui_tick", -32, rate=1.0 + 0.04 * i, pan=0.4)
cue(t1 - 0.05, "confirm_chime", -24, pan=0.35)
cue(t1 - 0.05, "spark_ignite", -28, pan=0.35)

# ---- MENUBAR
w = Wd("Click its menu bar icon")
cue(w("icon")["start"] + 0.05, "mouse_click", -18, pan=0.35)
cue(w("icon")["end"], "whoosh_soft", -25, rate=1.2)
ta, tb = w("every")["start"], w("machine,")["end"]
for i in range(7):
    cue(ta + (tb - ta) * i / 7, "ui_tick", -32, rate=0.95 + 0.03 * i)
typing("key_click", w("model")["start"], w("to.")["end"] + 0.2, -33, pan=0.15, step=0.06)
w = Wd("Click a model, pick")
cue(w("Click")["start"] + 0.18, "mouse_click", -18, pan=0.1)
cue(w("Click")["start"] + 0.25, "ui_blip", -27, pan=0.1)
cue(w("new")["start"], "mouse_click", -18, pan=0.1, rate=1.05)
cue(w("new")["start"] + 0.12, "confirm_chime", -26, pan=0.1)
cue(w("whole")["start"], "pen_line", -27, length=0.5, fade=0.12)

# ---- FORMATS
cue(cut("The clever part"), "whoosh_soft", -25)
w = Wd("The clever part")
cue(w("underneath.")["start"], "whoosh_soft", -22, rate=0.85)
w = Wd("Codex only speaks")
cue(w("Codex")["start"] - 0.04, "whoosh_fast", -21)
typing("key_click", w("speaks")["start"], w("format.")["end"], -32, pan=-0.35, step=0.07)
typing("key_click", w("speaks", 1)["start"], w("format.", 1)["end"], -32, pan=0.35, step=0.07, start=50)

# ---- GATEWAY
cue(cut("So magpie runs"), "whoosh_soft", -25)
w = Wd("So magpie runs")
cue(w("gateway")["start"], "impact_small", -21)
cue(w("your")["start"], "pen_line", -27, length=0.8, fade=0.15)
for i, q in enumerate(("speaks", "all", "them,")):
    cue(w(q)["start"], "ui_blip", -25, rate=1.0 + 0.06 * i, pan=-0.2 + 0.2 * i)
cue(w("translates")["start"] + 0.1, "spark_zip", -27, length=0.6, fade=0.2)
cue(w("streaming")["start"] + 0.15, "pen_tick", -23, pan=-0.2)
cue(w("calls")["start"] + 0.1, "pen_tick", -23, pan=0.2)

# ---- ADAPTER
cue(cut("Think of it as"), "whoosh_soft", -25)
w = Wd("Think of it as a travel adapter")
cue(w("Think")["start"], "pen_line", -27, length=0.9, fade=0.15, pan=-0.4)
cue(w("travel")["start"], "pen_line", -27, length=0.6, fade=0.12)
cue(w("adapter.")["start"] + 0.1, "pen_line", -29, length=0.5, fade=0.12, pan=0.4)
cue(w("same.")["start"], "marker_strike", -24, length=0.3, fade=0.1, pan=-0.4)
for q, d in (("socket", 0.05), ("be", 0.0), ("anywhere.", 0.15)):
    cue(w(q)["start"] + d, "projector_click", -19, pan=0.4)
    cue(w(q)["start"] + d, "spark_ignite", -30, pan=0.3, rate=1.2)

# ---- PLANS
cue(cut("Even the plans"), "whoosh_soft", -25)
w = Wd("Even the plans")
cue(w("plans")["start"], "paper_slide", -24, pan=-0.3)
cue(w("become")["start"], "whoosh_soft", -22, rate=1.1, pan=0.2)
for i in range(3):
    cue(w("become")["start"] + 0.55 + i * 0.1, "ui_tick", -28, pan=0.5)
cue(w("Claude")["start"], "confirm_chime", -25, pan=0.4)
cue(w("power")["start"], "spark_zip", -27, length=0.5, fade=0.15)
cue(w("key")["start"] - 0.25, "pen_line", -27, length=0.45, fade=0.1)
cue(w("paste.")["start"], "zap_slash", -19)

# ---- KEYS
cue(cut("Add several keys"), "whoosh_soft", -25)
w = Wd("Add several keys")
for i in range(3):
    cue(w("several")["start"] + i * 0.12, "ui_tick", -28, pan=0.4, rate=1.0 + 0.05 * i)
cue(w("credit,")["end"] - 0.05, "ui_blip", -22, rate=0.7, pan=0.4)
cue(w("sits")["start"], "stamp", -13, pan=0.4)
for i in range(2):
    cue(w("sits")["start"] + 0.5 + i, "ui_tick", -31, rate=1.3, pan=0.5)
cue(w("another")["start"], "whoosh_soft", -24, rate=1.2)
cue(w("another")["start"] + 0.2, "confirm_chime", -25, pan=0.4)

# ---- SURGICAL (paper)
cue(cut("And when it edits"), "paper_slide", -20)
w = Wd("And when it edits")
cue(w("edits")["start"] - 0.2, "paper_slide", -23, rate=1.1)
cue(w("only")["start"], "marker_strike", -19, length=0.35, fade=0.1)
typing("typewriter", w("setting")["start"], w("setting")["start"] + 0.45, -27, step=0.05)
for i in range(3):
    cue(w("comments")["start"] + i * 0.12, "pen_tick", -23, pan=-0.5)

# ---- CATCH
cue(cut("The catch?"), "whoosh_fast", -21)
w = Wd("The catch?")
cue(w("catch?")["start"], "impact_small", -19)
for i in range(7):
    cue(w("swap")["start"] + i * 0.11, "ui_tick", -27, rate=1.0 + 0.04 * i)
cue(w("It")["start"], "pen_line", -28, length=0.5, fade=0.12)
cue(w("cheaper")["start"] + 0.2, "impact_small", -24, rate=1.2, pan=0.4)
cue(w("one")["start"] + 0.2, "impact_small", -21, rate=0.8, pan=-0.4)
cue(w("good")["start"], "impact_small", -20, rate=0.7)

# ---- SWITCHBOARD
cue(cut("But if you juggle"), "whoosh_soft", -25)
w = Wd("But if you juggle")
cue(w("switchboard")["start"] - 0.1, "projector_click", -21)
for i in range(4):
    cue(w("switchboard")["start"] + 0.02 * i, "ui_tick", -27, rate=0.95 + 0.05 * i)
for i, (q, d) in enumerate((("switchboard", 0.1), ("you've", 0.0), ("been", 0.0), ("missing.", 0.0))):
    t0 = w(q)["start"] + d
    cue(t0, "pen_line", -28, length=0.32, fade=0.08, pan=-0.3 + 0.2 * i)
    cue(t0 + 0.32, "enter_key", -23, pan=0.3)
w = Wd("That's today's tool")
cue(w("That's")["start"] - 0.02, "whoosh_fast", -19)
cue(w("tool.")["start"], "impact_small", -21)
cue(w("every")["start"], "confirm_chime", -25)
cue(DUR - 0.12, "reverse_suck", -19)
cue(DUR - 0.12, "spark_ignite", -28, rate=1.3, length=0.06, fade=0.03)
