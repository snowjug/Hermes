# The sound cue sheet of the REA chat Short, run by analysis/sfx_mix.py (cue, bed, typing, W, line, cut,
# jitter, DUR in scope). Every incoming bubble gets a soft "received" blip, every sent reaction a "sent"
# whoosh, photos land with a click; the music bed runs underneath.
# flake8: noqa


def L(q):
    return line(q)


def received(t, rate=1.0):
    cue(t, "ui_blip", -22, rate=rate)


def sent(t):
    cue(t, "whoosh_fast", -26, rate=1.4)
    cue(t + 0.02, "ui_blip", -26, rate=1.5)


def photo(t):
    cue(t, "projector_click", -22)


l1, l2, l3, l4, l5, l6, l7 = (L(q) for q in ["This AI tool", "Point your agent", "pulls out", "It even rebuilt", "Then your agent", "It's called", "Free, open source"])
for i, l in enumerate([l1, l2, l3, l4, l5, l6, l7]):
    lead = 0.06
    typing("key_click", l["start"] - lead - 0.8, l["start"] - lead - 0.1, -34, step=0.09)
    received(l["start"] - lead, rate=1.0 + 0.03 * i)
sent(l1["end"] + 0.05)
photo(l2["end"] - 0.2)
photo(l3["words"][3]["start"])
sent(l3["end"] + 0.05)
photo(l4["words"][5]["start"])
cue(l4["words"][5]["start"] + 0.3, "confirm_chime", -26)
sent(l4["end"] + 0.05)
photo(l6["words"][3]["start"])
bed("riser", l6["words"][3]["start"], l6["words"][3]["start"] + 1.2, -31)
sent(l6["end"] + 0.05)
photo(l7["words"][4]["start"])
cue(l7["end"], "confirm_chime", -24)
