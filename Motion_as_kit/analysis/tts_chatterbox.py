"""The voiceover, made locally with Chatterbox (Resemble AI, MIT) on the CPU.

Reads analysis/vo_script.json, makes one take per sentence (`say`), trims each take's silence and
checks it with faster-whisper: a take whose words don't match the sentence, or that runs far longer
than the sentence should (a mumbled tail), is made again with the next seed. Takes are cached in
analysis/work/vo by their text and settings, so a changed sentence is the only one re-made.
The takes are joined with fixed pauses (between sentences, longer between lines) into
audio/voiceover.wav and audio/voiceover.mp3.

Needs a Python 3.11 env with chatterbox-tts and faster-whisper, and ffmpeg on PATH:
    <venv>/python analysis/tts_chatterbox.py [--exaggeration 0.5] [--cfg 0.5] [--only 3,7]
"""
import argparse, difflib, hashlib, json, re, subprocess, sys, time
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ep import EP, CONFIG  # noqa: E402

SCRIPT = EP / "script.json"
WORK = EP / "work" / "vo"
VOICE = CONFIG.get("voice", {})
LEAD, SENT_GAP, LINE_GAP, TAIL = (VOICE.get(k, d) for k, d in (("lead", 0.30), ("sentence_gap", 0.26), ("line_gap", 0.46), ("tail", 0.8)))  # seconds
WPS = 2.55  # expected words per second, for the length check


def words(s: str) -> list[str]:
    s = s.lower().replace("’", "'").replace("deep seek", "deepseek")
    return [w for w in re.sub(r"[^a-z0-9' ]", " ", s).split() if w]


# whisper's usual mishearings of the names in this script
FIX = (("cloud", "claude"), ("clawed", "claude"), ("clod", "claude"), ("a.i.", "ai"), ("mag pie", "magpie"), ("git hub", "github"),
       ("wiztree", "wiz tree"), ("disktree", "disk tree"), ("disc", "disk"), ("3.4", "three point four"), ("4 million", "four million"), ("11", "eleven"))


def letters(s: str) -> str:
    s = s.lower().replace("’", "'")
    for a, b in FIX:
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]", "", s)


def trim(a: np.ndarray, sr: int) -> np.ndarray:
    hop = sr // 100
    n = len(a) // hop
    db = 20 * np.log10(np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
    on = np.where(db > max(db.max() - 40, -60))[0]
    if not len(on):
        return a
    i0 = max(0, on[0] * hop - int(0.03 * sr))
    i1 = min(len(a), (on[-1] + 1) * hop + int(0.08 * sr))
    out = a[i0:i1].copy()
    f = int(0.012 * sr)
    out[:f] *= np.linspace(0, 1, f)
    out[-f:] *= np.linspace(1, 0, f)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--exaggeration", type=float, default=VOICE.get("exaggeration", 0.5))
    ap.add_argument("--cfg", type=float, default=VOICE.get("cfg", 0.5))
    ap.add_argument("--temperature", type=float, default=VOICE.get("temperature", 0.8))
    ap.add_argument("--tries", type=int, default=3)
    ap.add_argument("--only", default="", help="comma-separated line numbers (1-based) to re-make")
    args = ap.parse_args()
    spec = json.loads(SCRIPT.read_text(encoding="utf-8"))
    WORK.mkdir(parents=True, exist_ok=True)
    only = {int(x) for x in args.only.split(",") if x.strip()}

    jobs = []  # (line, sentence index, text, cache file)
    for li, line in enumerate(spec["lines"]):
        for si, text in enumerate(line["say"]):
            key = hashlib.sha1(f"{text}|{args.exaggeration}|{args.cfg}|{args.temperature}".encode()).hexdigest()[:12]
            f = WORK / f"l{li + 1:02d}_s{si + 1}_{key}.wav"
            if only and (li + 1) in only and f.exists():
                f.unlink()
            jobs.append((li, si, text, f))

    todo = [j for j in jobs if not j[3].exists()]
    print(f"{len(jobs)} sentences, {len(todo)} to make", flush=True)
    if todo:
        import torch
        from chatterbox.tts import ChatterboxTTS
        from faster_whisper import WhisperModel

        model = ChatterboxTTS.from_pretrained(device="cpu")
        sr = model.sr
        wm = WhisperModel("base.en", device="cpu", compute_type="int8")
        for li, si, text, f in todo:
            best = None
            for k in range(args.tries):
                t0 = time.time()
                torch.manual_seed(1000 * (li + 1) + 10 * si + k)
                wav = model.generate(text, exaggeration=args.exaggeration, cfg_weight=args.cfg, temperature=args.temperature)
                a = trim(wav.squeeze(0).cpu().numpy().astype(np.float32), sr)
                tmp = WORK / "_check.wav"
                sf.write(str(tmp), a, sr)
                segs, _ = wm.transcribe(str(tmp), language="en", beam_size=1, condition_on_previous_text=False)
                heard = " ".join(s.text for s in segs)
                ratio = difflib.SequenceMatcher(a=letters(text), b=letters(heard), autojunk=False).ratio()
                dur = len(a) / sr
                expect = len(words(text)) / WPS
                long = dur > expect * 1.7 + 0.8
                score = ratio - (0.3 if long else 0)
                print(f"line {li + 1}.{si + 1} try {k + 1}: {dur:.2f}s (expect ~{expect:.1f}) match {ratio:.2f}"
                      f"{' TOO LONG' if long else ''}  [{time.time() - t0:.0f}s]  heard: {heard.strip()}", flush=True)
                if best is None or score > best[0]:
                    best = (score, a)
                if ratio >= 0.93 and not long:
                    break
            sf.write(str(f), best[1], sr)
        tmp = WORK / "_check.wav"
        tmp.unlink(missing_ok=True)

    # join: lead-in, takes, pauses, tail
    chunks, sr, manifest, t = [], None, [], LEAD
    tempo = float(VOICE.get("tempo", 1.0))  # < 1 slows the read (pitch kept), for a more measured pace
    for idx, (li, si, text, f) in enumerate(jobs):
        if abs(tempo - 1.0) > 1e-3:
            slow = f.with_name(f.stem + f"_t{tempo:.3f}.wav")
            if not slow.exists():
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-af", f"rubberband=tempo={tempo}:pitchq=quality", str(slow)], check=True)
            f = slow
        a, sr = sf.read(str(f), dtype="float32")
        if not chunks:
            chunks.append(np.zeros(int(LEAD * sr), np.float32))
        chunks.append(a)
        manifest.append({"line": li + 1, "sentence": si + 1, "text": text, "start": round(t, 3), "end": round(t + len(a) / sr, 3)})
        t += len(a) / sr
        last = idx + 1 == len(jobs)
        gap = TAIL if last else (LINE_GAP if jobs[idx + 1][0] != li else SENT_GAP)
        chunks.append(np.zeros(int(gap * sr), np.float32))
        t += gap
    audio = np.concatenate(chunks)
    audio = audio / (np.abs(audio).max() + 1e-9) * 0.89
    out = EP / "audio" / "voiceover.wav"
    sf.write(str(out), audio, sr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-ar", "44100", "-ac", "1", "-b:a", "192k", str(EP / "audio" / "voiceover.mp3")], check=True)
    (WORK / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print(f"wrote {out} ({len(audio) / sr:.2f}s)", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
