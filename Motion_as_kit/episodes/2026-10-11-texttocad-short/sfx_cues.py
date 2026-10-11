# The sound cue sheet of the text-to-cad Short, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut,
# jitter, DUR in scope). A paper slide for every page turn, pen lines as the drawings appear, keys in the speech
# bubble, a stamp for each parts-list callout, a motor hum while the printer prints.
# flake8: noqa


def Ww(lq, q, n=0):
    return W(lq, q, n)


starts = [line(q)["start"] for q in ["POV", "Type one sentence", "It writes the code", "Then it slices", "It's called", "It works with", "Step one"]]
for s in starts[1:]:
    cue(s - 0.3, "paper_slide", -22, rate=1.05)

# 1 cover
cue(0.05, "pen_line", -26)
cue(Ww("POV", "learned")["start"] + 0.25, "impact_small", -21)
cue(Ww("POV", "CAD.")["start"], "ui_blip", -23, rate=1.2)
# 2 ask
typing("key_click", Ww("Type one sentence", "a")["start"], Ww("Type one sentence", "cable.")["end"], -28)
cue(Ww("Type one sentence", "phone")["start"], "pen_line", -24)
cue(Ww("Type one sentence", "tilted")["start"], "pen_tick", -24)
cue(Ww("Type one sentence", "slot")["start"], "ui_blip", -24)
# 3 builds
typing("key_click", Ww("It writes the code", "writes")["start"], Ww("It writes the code", "code,")["end"], -28)
cue(Ww("It writes the code", "builds")["start"], "whoosh_soft", -23)
for k in ["checks", "actually", "print."]:
    cue(Ww("It writes the code", k)["start"], "ui_blip", -24, rate=1.0 + 0.1 * ["checks", "actually", "print."].index(k))
# 4 slice and send
for i in range(12):
    cue(Ww("Then it slices", "slices")["start"] + i * 0.066, "ui_tick", -30, rate=1.0 + 0.02 * i)
cue(Ww("Then it slices", "send")["start"], "whoosh_fast", -24)
bed("projector_run", Ww("Then it slices", "straight")["start"], Ww("Then it slices", "straight")["start"] + 1.6, -30)
cue(Ww("Then it slices", "Bambu")["start"], "stamp", -22)
# 5 parts list
cue(Ww("It's called", "text-to-cad.")["start"], "impact_slam", -21, length=0.6, fade=0.2)
for k in ["Free,", "open", "19,000"]:
    cue(Ww("It's called", k)["start"], "stamp", -21)
t0, t1 = Ww("It's called", "19,000")["start"], Ww("It's called", "stars.")["end"]
for i in range(12):
    cue(t0 + (t1 - t0) * i / 12, "ui_tick", -31, rate=1.0 + 0.04 * (i % 5))
# 6 works with
for i, k in enumerate(["Claude", "Codex,", "Cursor,", "Gemini", "Grok."]):
    cue(Ww("It works with", k)["start"], "ui_blip", -24, rate=0.95 + 0.07 * i)
# 7 step one, step two
cue(Ww("Step one", "Step")["start"], "pen_tick", -23)
cue(Ww("Step one", "ask.")["start"], "key_click", -24)
cue(Ww("Step one", "Step", 1)["start"], "pen_tick", -23)
bed("projector_run", Ww("Step one", "Step", 1)["start"], Ww("Step one", "Step", 1)["start"] + 1.2, -30)
cue(Ww("Step one", "print.")["start"], "confirm_chime", -21)
