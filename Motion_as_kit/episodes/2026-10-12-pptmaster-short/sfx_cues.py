# The sound cue sheet of the PPT Master retro-desktop Short, run by analysis/sfx_mix.py (cue, bed, typing, W,
# line, cut, jitter, DUR in scope). Windows open with a click and a blip, the progress bar ticks, keys clatter in
# the chat, an alarm-ish blip for the reminder, and a soft whoosh as the screen goes to night.
# flake8: noqa


def L(q):
    return line(q)


def Ww(l, q, n=0):
    return W(l["text"], q, n)


def win(t, rate=1.0):
    cue(t, "mouse_click", -22)
    cue(t + 0.02, "ui_blip", -25, rate=rate)


l1, l2, l3, l4, l5, l6 = (L(q) for q in ["POV", "This free AI tool", "Not screenshots", "Your AI agent", "It's called", "You'll still polish"])
cue(0.02, "ui_tick", -26)
win(0.12, 0.8)
for i in range(3):
    cue(Ww(l1, "due")["start"] + 0.15 + i * 0.18, "ui_blip", -27, rate=0.7)
win(Ww(l1, "started")["start"] - 0.1)
win(Ww(l2, "turns")["start"] - 0.1, 1.1)
t0 = Ww(l2, "turns")["start"]
for i in range(14):
    cue(t0 + 0.1 + i * 0.17, "ui_tick", -29, rate=1.0 + 0.02 * i)
cue(Ww(l2, "real")["start"], "confirm_chime", -24)
win(Ww(l3, "screenshots")["start"] - 0.05, 1.2)
cue(Ww(l3, "screenshots")["start"] + 0.2, "zap_slash", -24, length=0.35, fade=0.1)
cue(Ww(l3, "editable")["start"], "mouse_click", -21)
for k in ["charts", "tables", "animations"]:
    cue(Ww(l3, k)["start"], "ui_blip", -25, rate=1.2)
win(Ww(l4, "agent")["start"] - 0.1)
typing("key_click", Ww(l4, "type")["start"], Ww(l4, "type")["start"] + 1.0, -27)
cue(Ww(l4, "type")["start"] + 1.05, "enter_key", -23)
win(Ww(l5, "called")["start"] - 0.05, 0.9)
cue(Ww(l5, "stars")["end"], "confirm_chime", -22)
win(Ww(l6, "polish")["start"] - 0.1, 0.8)
cue(Ww(l6, "sleep")["start"] - 0.2, "mouse_click", -20)
cue(Ww(l6, "sleep")["start"] - 0.1, "reverse_suck", -26, length=0.6, fade=0.2)
