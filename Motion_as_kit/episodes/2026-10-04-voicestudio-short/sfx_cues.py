# The sound cue sheet of the VoiceStudio Short (run by analysis/sfx_mix.py). Punchy: a hit on every
# slammed word, a whoosh on every cut. Still nothing without a picture.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


# ---- STOP
w = Wd("Stop paying")
cue(w("Stop")["start"] - 0.005, "impact_slam", -13, length=0.5, fade=0.2)
cue(w("Stop")["start"] + 0.02, "marker_strike", -18, length=0.35, fade=0.1)
cue(w("paying")["start"] - 0.005, "impact_small", -17)
cue(w("for")["start"] - 0.005, "impact_small", -18, rate=1.06)
cue(w("voices.")["start"] - 0.005, "impact_slam", -14, length=0.45, fade=0.2)

# ---- CLIP
w = Wd("This free app copies")
cue(cut("This free app copies") - 0.02, "whoosh_fast", -18)
cue(w("free")["start"] - 0.005, "impact_small", -18)
cue(w("copies")["start"], "paper_slide", -19)
cue(w("copies")["start"] + 0.05, "impact_small", -19, rate=0.9)
cue(w("ten-second")["start"] + 0.04, "impact_slam", -14, length=0.45, fade=0.2)
cue(w("clip.")["start"], "snip", -17)

# ---- DESIGN
w = Wd("Describe a voice")
cue(cut("Describe a voice") - 0.02, "whoosh_fast", -18)
cue(w("Describe")["start"] - 0.005, "impact_small", -17)
typing("key_click", w("Describe")["start"] + 0.1, w("exist,")["end"], -27, step=0.05)
cue(w("doesn't")["start"], "stamp", -15)
ta, tb = w("builds")["start"] - 0.1, w("one.")["end"] + 0.2
for i in range(12):
    cue(ta + (tb - ta) * i / 12, "ui_tick", -25, rate=0.9 + 0.05 * i, pan=-0.5 + 0.09 * i)
cue(w("one.")["start"] - 0.005, "impact_slam", -14, length=0.45, fade=0.2)

# ---- DUB
w = Wd("It even dubs")
cue(cut("It even dubs") - 0.02, "whoosh_fast", -18)
cue(w("dubs")["start"] - 0.005, "impact_slam", -14, length=0.45, fade=0.2)
ta, tb = w("into")["start"], w("languages.")["end"] + 0.2
for i in range(6):
    cue(ta + (tb - ta) * i / 6, "ui_blip", -22, rate=0.9 + 0.08 * i, pan=0.3)

# ---- LOCAL
w = Wd("And it all runs")
cue(cut("And it all runs") - 0.02, "whoosh_fast", -18)
cue(w("own")["start"] - 0.2, "impact_small", -18)
cue(w("computer.")["start"] - 0.005, "impact_small", -17, rate=0.9)
cue(w("No")["start"] - 0.005, "impact_small", -18, rate=1.1)
cue(w("subscription.")["start"] - 0.05, "stamp", -13)
cue(w("subscription.")["start"] - 0.04, "impact_slam", -17, length=0.45, fade=0.2)

# ---- NAME
w = Wd("It's called VoiceStudio")
cue(cut("It's called VoiceStudio") - 0.02, "whoosh_fast", -18)
d = w("VoiceStudio.")
for i in range(11):
    cue(d["start"] + (i / 11) * max(0.4, d["end"] - d["start"]) * 0.95, "ui_tick", -25, rate=0.9 + 0.04 * i)
cue(d["start"] + 0.1, "impact_slam", -15, length=0.4, fade=0.2)
bed("riser", w("52,000")["start"], w("stars,")["end"], -25)
cue(w("stars,")["end"] - 0.03, "impact_small", -17)
cue(w("third")["start"], "impact_small", -17, rate=1.1)
cue(w("week.")["start"], "confirm_chime", -20)

# ---- CATCH
w = Wd("One catch")
cue(cut("One catch") - 0.02, "whoosh_fast", -18)
cue(w("One")["start"] - 0.005, "impact_small", -17)
cue(w("non-commercial.")["start"] - 0.03, "stamp", -12)
cue(w("non-commercial.")["start"] - 0.02, "impact_slam", -16, length=0.45, fade=0.2)
cue(w("Monetizing?")["start"] - 0.005, "impact_small", -17)
cue(w("Switch")["start"], "projector_click", -15)
cue(w("Switch")["start"] + 0.02, "whoosh_fast", -20, rate=1.2)
cue(w("engines.")["start"] - 0.005, "impact_slam", -15, length=0.45, fade=0.2)

# ---- TWIST
w = Wd("Oh, and this voice")
cue(cut("Oh, and this voice") - 0.02, "whoosh_fast", -18)
cue(w("this")["start"] - 0.005, "impact_small", -17)
cue(w("this")["start"], "tape_rewind", -20, length=1.0, fade=0.3)
cue(w("AI.")["start"] - 0.005, "impact_slam", -12, length=0.5, fade=0.2)
cue(w("laptop.")["start"], "confirm_chime", -20)
