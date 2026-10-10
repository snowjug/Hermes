# The sound cue sheet of the REA motion comic, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut,
# jitter, DUR in scope). Panels land with a whoosh and a paper slap, onomatopoeia hit with impacts, code types
# itself, stamps thump; the music bed runs underneath.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


def panel(t, db=-24, pan=0.0, rate=1.0):
    cue(t - 0.05, "whoosh_soft", db + 2, pan=pan, rate=rate)
    cue(t + 0.05, "paper_slide", db, pan=pan, rate=rate, length=0.35, fade=0.1)


def hit(t, db=-20, rate=1.0, big=False):
    cue(t, "impact_slam" if big else "impact_small", db, rate=rate, length=0.6 if big else None, fade=0.2 if big else 0.03)


# ---- HOOK
w = Wd("You see a feature")
panel(0.0, -22, pan=-0.4)
cue(w("feature")["start"], "spark_zip", -26)
hit(w("feature")["start"] + 0.05, -21)
panel(w("think")["start"] - 0.15, -22, pan=0.4)
cue(w("how")["start"] - 0.05, "ui_blip", -24, pan=0.4)
cue(cut("REA lets your AI agent") - 0.2, "whoosh_fast", -22)

# ---- AGENT
w = Wd("REA lets your AI agent")
panel(cut("REA lets your AI agent") + 0.02, -22, pan=-0.4)
hit(w("REA")["start"], -19, big=True)
panel(w("agent")["start"], -23, pan=0.4)
cue(w("find")["start"], "scan_sweep", -26, length=0.5, fade=0.15)
cue(w("without")["start"], "marker_strike", -22, length=0.4, fade=0.12)
hit(w("source")["start"], -19)

# ---- STARS
w = Wd("It picked up")
panel(cut("It picked up") + 0.02, -21)
bed("riser", w("picked")["start"], w("day")["end"], -29)
t0, t1 = w("picked")["start"], w("day")["end"]
for i in range(22):
    cue(t0 + (t1 - t0) * i / 22, "ui_tick", -30, rate=1.0 + 0.02 * (i % 7))
for i in range(9):
    cue(w("GitHub")["start"] + i * 0.07, "ui_blip", -30, rate=1.1 + 0.04 * i, pan=-0.6 + 0.15 * i)
hit(w("single")["start"], -18, big=True)

# ---- MCP
w = Wd("REA is a free")
panel(cut("REA is a free") + 0.02, -22, pan=-0.5)
cue(w("free")["start"], "pen_tick", -25)
cue(w("MCP")["start"], "pen_tick", -25)
for k in ["Claude", "Codex", "Cursor", "Gemini"]:
    cue(w(k)["start"], "ui_blip", -25, rate=1.0 + 0.05 * ["Claude", "Codex", "Cursor", "Gemini"].index(k))
panel(w("Claude")["start"] - 0.15, -23, pan=0.1)
cue(w("toolbox")["start"], "key_click", -18)
hit(w("toolbox")["start"] + 0.02, -22)
panel(w("same")["start"] - 0.12, -23, pan=0.5)
typing("key_click", w("same")["start"], w("same")["start"] + 1.3, -29, pan=0.5)

# ---- NATIVE
w = Wd("Point it at a native")
panel(cut("Point it at a native") + 0.02, -22, pan=-0.6)
panel(w("assembly")["start"] - 0.12, -23, pan=0.0)
typing("key_click", w("assembly")["start"], w("assembly")["start"] + 1.1, -30)
panel(w("pseudocode")["start"] - 0.12, -23, pan=0.5)
typing("key_click", w("pseudocode")["start"], w("pseudocode")["start"] + 0.9, -30, pan=0.5)
cue(w("strings")["start"], "pen_tick", -25, pan=0.4)
cue(w("symbols")["start"], "pen_tick", -25, pan=0.5)
for i, k in enumerate(["Ghidra", "Hopper", "IDA"]):
    cue(w(k)["start"], "stamp", -19, pan=-0.5 + 0.5 * i)
hit(w("heavy")["start"], -21, rate=0.85)

# ---- ELECTRON
w = Wd("An Electron or JavaScript")
panel(cut("An Electron or JavaScript") + 0.02, -21)
for i in range(4):
    cue(w("modules")["start"] + i * 0.1, "ui_tick", -26, rate=1.0 + 0.08 * i)
cue(w("imports")["start"], "pen_line", -27, length=0.6, fade=0.15)
cue(w("messages")["start"], "whoosh_fast", -24)
hit(w("passed")["start"], -21)
for i in range(4):
    cue(w("messages")["start"] + 0.3 + i * 0.28, "whoosh_fast", -30, pan=-0.5 + (i % 2), rate=1.2)

# ---- TARGETS
w = Wd("It also reads websites")
for i, k in enumerate(["websites", ".NET", "Android", "firmware"]):
    panel(w(k)["start"] - 0.12, -22, pan=-0.5 + (i % 2), rate=1.0 + 0.05 * i)
hit(w("even")["start"], -21)

# ---- EVIDENCE
w = Wd("Every answer comes")
panel(cut("Every answer comes") + 0.02, -22, pan=-0.5)
panel(w("evidence")["start"] - 0.15, -22, pan=0.4)
typing("key_click", w("code")["start"], w("code")["start"] + 0.8, -30)
hit(w("found")["start"], -20)
cue(w("still")["start"] - 0.1, "paper_slide", -22, pan=0.6, length=0.35, fade=0.1)

# ---- BUILD
w = Wd("Then your agent can explain")
panel(cut("Then your agent can explain") + 0.02, -22, pan=-0.5)
cue(w("explain")["start"] - 0.05, "ui_blip", -24)
panel(w("build")["start"] - 0.12, -22)
cue(w("build")["start"], "pen_line", -26, length=0.8, fade=0.2)
panel(w("own")["start"] - 0.15, -22, pan=0.5)
hit(w("project")["start"], -20)
cue(w("project")["start"] + 0.05, "confirm_chime", -24)

# ---- DX-BALL
w = Wd("One real case")
panel(cut("One real case") + 0.02, -21)
hit(w("classic")["start"] - 0.05, -21)
for i in range(6):
    cue(w("followed")["start"] + i * 0.36, "ui_blip", -28, pan=-0.8 + 0.32 * i, rate=1.3)
hit(w("sound")["start"], -22, rate=1.2)
w = Wd("The rebuilt C code")
cue(w("rebuilt")["start"] - 0.25, "whoosh_soft", -22)
panel(w("rebuilt")["start"] - 0.3, -22, pan=-0.4)
typing("key_click", w("rebuilt")["start"], w("rebuilt")["start"] + 1.1, -30, pan=-0.4)
panel(w("passes")["start"] - 0.15, -22, pan=0.4)
bed("riser", w("passes")["start"], w("tests")["end"], -30)
t0, t1 = w("passes")["start"], w("tests")["end"]
for i in range(16):
    cue(t0 + (t1 - t0) * i / 16, "ui_tick", -30, rate=1.0 + 0.03 * i)
cue(w("tests")["end"], "confirm_chime", -22)
hit(w("bytes")["start"], -18, big=True)

# ---- NOTION
w = Wd("Another traces how")
panel(cut("Another traces how") + 0.02, -22, pan=-0.6)
hit(w("Notion's")["start"], -22)
cue(w("clipboard")["start"], "key_click", -20)
panel(w("bridge")["start"] - 0.15, -22)
cue(w("bridge")["start"], "whoosh_fast", -25)
panel(w("main")["start"] - 0.15, -22, pan=0.6)
cue(w("main")["start"], "whoosh_fast", -25, pan=0.5)

# ---- SETUP
w = Wd("Setup is a single")
panel(cut("Setup is a single") + 0.02, -22, pan=-0.4)
typing("key_click", w("npx")["start"], w("command")["end"] + 0.4, -28, pan=-0.4)
cue(w("command")["end"] + 0.4, "enter_key", -23, pan=-0.4)
hit(w("config")["end"], -21)
panel(w("analysis")["start"] - 0.15, -22, pan=0.5)
cue(w("own")["start"], "confirm_chime", -25, pan=0.5)

# ---- CATCH
w = Wd("The catch")
hit(w("catch")["start"] - 0.05, -19, big=True)
panel(w("deep")["start"] - 0.15, -22, pan=-0.4)
for i, k in enumerate(["Ghidra", "Hopper", "IDA"]):
    cue(w(k)["start"] - 0.05, "stamp", -21, pan=-0.6 + 0.3 * i)
panel(w("provider")["start"] - 0.15, -22, pan=0.4)
cue(w("sees")["start"], "scan_sweep", -26, length=0.5, fade=0.15)
w = Wd("So only take apart")
cue(w("only")["start"] - 0.35, "whoosh_soft", -22)
panel(w("only")["start"] - 0.35, -21)
hit(w("allowed")["start"] - 0.1, -21)
cue(cut("That's today's tool") - 0.2, "whoosh_fast", -22)

# ---- OUTRO
w = Wd("That's today's tool")
panel(cut("That's today's tool") + 0.02, -21)
hit(cut("That's today's tool") + 0.15, -19, big=True)
cue(w("every")["start"], "confirm_chime", -24)
