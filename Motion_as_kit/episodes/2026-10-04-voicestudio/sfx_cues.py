# The sound cue sheet of the VoiceStudio video, run by analysis/sfx_mix.py (its helpers: cue, bed, typing,
# W, line, cut, jitter, DUR are in scope). Every effect sits on something you see; the voice leads.
# flake8: noqa


def Wd(lq):
    return lambda q, n=0: W(lq, q, n)


# ---- METER: the live trace, the credit meter, $99; the laptop, the strike, $0
w = Wd("Ten hours of AI voice")
cue(w("Ten")["start"] - 0.25, "scan_sweep", -30)
typing("ui_tick", w("Ten")["start"], w("month?")["end"], -34, pan=-0.4, step=0.07)
ta, tb = w("On")["start"], w("$99")["start"]
for i in range(9):
    cue(ta + (tb - ta) * (i / 9) ** 0.7, "ui_tick", -31, rate=1.0 + 0.06 * i, pan=-0.4)
cue(w("$99")["start"] - 0.005, "impact_slam", -18, length=0.5, fade=0.2)
w = Wd("This app does it")
cue(cut("This app does it"), "whoosh_fast", -21)
cue(w("app")["start"], "pen_line", -27, length=1.1, fade=0.2)
cue(w("meter,")["start"], "marker_strike", -22, length=0.4, fade=0.12)
cue(w("subscription.")["start"] - 0.005, "impact_slam", -18, length=0.5, fade=0.2)

# ---- TITLE: the name, the real app, three verbs
w = Wd("It's called VoiceStudio")
cue(cut("It's called VoiceStudio"), "whoosh_soft", -24)
d = w("VoiceStudio.")
cue(d["start"] - 0.005, "impact_slam", -18, length=0.5, fade=0.2)
for i in range(11):
    cue(d["start"] + (i / 11) * max(0.35, d["end"] - d["start"]) * 0.75, "ui_tick", -33, rate=0.9 + 0.03 * i)
cue(d["start"] + 0.12, "paper_slide", -25, pan=0.4)
for i, q in enumerate(("clones", "designs", "dubs")):
    cue(w(q)["start"] - 0.04, "projector_click", -26, pan=0.4)
    cue(w(q)["start"], "ui_blip", -26, rate=1.0 + 0.08 * i, pan=-0.3)

# ---- STARS: axes, months, the count, the last week
w = Wd("It's open source, not even")
cue(w("not")["start"], "pen_line", -28, length=0.9, fade=0.2)
for i in range(7):
    cue(w("six")["start"] + i * 0.07, "ui_tick", -32, rate=0.95 + 0.04 * i, pan=-0.5 + 0.15 * i)
bed("riser", w("passed")["start"], w("stars.")["end"], -30)
cue(w("stars.")["end"] - 0.05, "impact_small", -20, pan=0.3)
w = Wd("Nearly a third")
cue(w("third")["start"], "marker_strike", -24, length=0.4, fade=0.12, pan=0.4)
cue(w("seven")["start"], "pen_tick", -25, pan=0.3)

# ---- QUESTION: the studio drawn, the tiny app, the lamp
w = Wd("So how does one free app")
cue(cut("So how does one free app"), "whoosh_soft", -25)
cue(w("So")["start"], "pen_line", -29, length=1.4, fade=0.3, pan=0.4)
cue(w("app")["start"], "ui_blip", -24, rate=1.2)
cue(w("studio?")["start"], "impact_small", -22, rate=0.9)

# ---- DECK: the deck drawn, tapes in, one plays; the rack; OmniVoice's tape unspools
w = Wd("Think of it as a tape deck")
cue(w("tape")["start"] - 0.1, "pen_line", -27, length=0.9, fade=0.2)
cue(w("app")["start"], "ui_blip", -26)
for i in range(3):
    cue(w("voice")["start"] + i * 0.12, "paper_slide", -27, pan=0.5 - 0.1 * i, rate=1.0 + 0.05 * i)
t_in = w("tapes.")["end"] + 0.05
cue(t_in + 0.33, "projector_click", -20)
w8 = Wd("There are more than a dozen")
bed("projector_run", t_in + 0.35, w8("There")["start"], -33)
cue(cut("There are more than a dozen"), "whoosh_fast", -20)
for i in range(16):
    cue(w8("There")["start"] + 0.25 + i * 0.03, "ui_tick", -33, rate=1.0 + 0.02 * i, pan=-0.5 + 0.06 * i)
cue(w8("OmniVoice,")["start"] + 0.08, "impact_small", -21)
cue(w8("learned")["start"], "tape_rewind", -25, length=1.6, fade=0.4)
cue(w8("speech.")["end"], "confirm_chime", -25, pan=0.3)

# ---- LANGUAGES: 646 bars, the climb up English, the drop to the median
w = Wd("That's how it speaks")
ta, tb = w("speaks")["start"], w("languages.")["end"]
for i in range(18):
    cue(ta + (tb - ta) * i / 18, "ui_tick", -33, rate=0.9 + 0.025 * i, pan=-0.6 + 0.07 * i)
w10 = Wd("English got over")
bed("riser", w("split.")["start"], w10("hours.")["start"], -24)
cue(w10("hours.")["start"] - 0.01, "impact_slam", -17, length=0.6, fade=0.25)
cue(w10("Half")["start"] - 0.05, "reverse_suck", -21)
cue(w10("languages")["start"] + 0.15, "impact_small", -20)
cue(w10("Half")["start"] + 0.12, "marker_strike", -25, length=0.5, fade=0.15)

# ---- CLONE: the ruler, the bracket, the clip lifts into a voiceprint
w = Wd("To copy a voice")
cue(w("To")["start"], "pen_line", -30, length=0.6, fade=0.15)
cue(w("three")["start"], "ui_blip", -25)
cue(w("ten")["start"], "ui_blip", -25, rate=1.25)
cue(w("seconds.")["start"], "snip", -21)
cue(w("seconds.")["start"] + 0.15, "spark_zip", -26, length=0.6, fade=0.2)

# ---- DESIGN: no clip, a description typed, four knobs, the voice locks
w = Wd("No clip?")
cue(w("clip?")["start"], "marker_strike", -24, length=0.35, fade=0.1)
typing("key_click", w("Describe")["start"] + 0.1, w("whisper,")["end"], -34, pan=-0.3, step=0.06)
for i, q in enumerate(("age,", "pitch,", "accent,", "whisper,")):
    cue(w(q)["start"], "ui_tick", -24, rate=0.85 + 0.12 * i, pan=-0.6 + 0.4 * i)
cue(w("designs")["start"] + 0.05, "confirm_chime", -22)

# ---- DUB: along the line
w = Wd("Dubbing chains it all")
cue(w("transcribe")["start"], "whoosh_soft", -26)
typing("key_click", w("transcribe")["start"] + 0.05, w("video,")["end"] + 0.2, -35, step=0.05)
cue(w("translate")["start"] + 0.05, "whoosh_soft", -26, rate=1.1)
cue(w("translate")["start"] + 0.15, "spark_zip", -29, length=0.5, fade=0.15)
cue(w("re-voice")["start"] + 0.1, "whoosh_soft", -26, rate=1.2)
cue(w("time.")["end"] - 0.05, "confirm_chime", -22)
cue(w("time.")["end"] + 0.05, "whoosh_soft", -27, rate=0.8)

# ---- AGENTS: the server, the agent types, the call, the speaker talks
w = Wd("It even runs a local server")
cue(w("local")["start"], "pen_line", -28, length=0.7, fade=0.2)
typing("key_click", w("so")["start"] + 0.1, w("so")["start"] + 0.65, -33, pan=-0.4, step=0.05)
cue(w("so")["start"] + 0.72, "enter_key", -26, pan=-0.4)
cue(w("speak")["start"], "ui_blip", -22, rate=0.9, pan=0.4)

# ---- HARDWARE: three machines, three bars
w = Wd("Nvidia, Apple Silicon")
for q in ("Nvidia,", "Apple", "plain"):
    cue(w(q)["start"], "pen_line", -29, length=0.6, fade=0.15)
t_run = w("runs")["start"]
cue(t_run + 0.55, "confirm_chime", -27, pan=-0.5)
cue(t_run + 1.1, "confirm_chime", -27, rate=1.1)
bed("projector_run", t_run, w("card.")["end"], -34, pan=0.5)

# ---- CATCH: free tick, NON-COMMERCIAL, the tape swap, the consent card
w = Wd("Now the catch")
cue(w("catch.")["start"], "impact_small", -21)
cue(w("free,")["start"], "pen_tick", -24)
cue(w("non-commercial.")["start"] - 0.01, "stamp", -15)
cue(w("non-commercial.")["start"], "impact_slam", -21, length=0.5, fade=0.2)
w = Wd("Making money?")
cue(w("money?")["start"], "ui_blip", -24, rate=0.9)
cue(w("Swap")["start"], "whoosh_fast", -22, pan=0.4)
cue(w("CosyVoice.")["end"] - 0.05, "projector_click", -21)
cue(w("And")["start"] - 0.05, "whoosh_fast", -22, rate=0.9)
cue(w("clone")["start"], "pen_tick", -23)
cue(w("permission")["start"], "pen_tick", -23, rate=1.1)

# ---- TWIST: the narration rewinds onto the screen; the laptop
w = Wd("One more thing")
cue(w("narration")["start"] - 0.1, "tape_rewind", -21, length=1.1, fade=0.3)
cue(w("AI")["start"], "impact_small", -22)
cue(w("laptop")["start"] - 0.1, "pen_line", -28, length=0.9, fade=0.2)
cue(w("graphics")["start"], "ui_blip", -26)

# ---- OUTRO
w = Wd("That's today's tool")
cue(w("There's")["start"], "ui_blip", -26, rate=0.8)
