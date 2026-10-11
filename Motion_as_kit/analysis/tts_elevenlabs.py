"""The voiceover through the ElevenLabs API (episode.json: voice.engine = "elevenlabs").

One request per script line (its `say` sentences together), so each line keeps its natural phrasing and
pauses; the neighbouring lines go along as previous_text / next_text so the delivery flows from line to
line. Each take is trimmed and checked with faster-whisper like the Chatterbox takes, and made again (with
another seed) only if the words don't match, since every request spends characters. Takes are cached in
work/vo_el by their text and settings. The lines are joined with fixed pauses into audio/voiceover.wav
and audio/voiceover.mp3.

The API key is read from ELEVENLABS_API_KEY or Motion_as_kit/.env (git-ignored; never commit it).
    <venv with faster-whisper>/python analysis/tts_elevenlabs.py [--only 3,7] [--dry]
"""
import argparse, difflib, hashlib, json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ep import EP, CONFIG, ROOT  # noqa: E402
from tts_chatterbox import letters, trim, words  # noqa: E402

SCRIPT = EP / "script.json"
WORK = EP / "work" / "vo_el"
VOICE = CONFIG.get("voice", {})
LEAD, LINE_GAP, TAIL = (VOICE.get(k, d) for k, d in (("lead", 0.3), ("line_gap", 0.35), ("tail", 0.9)))
SR = 44100


def api_key() -> str:
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    env = ROOT / ".env"
    for ln in env.read_text(encoding="utf-8").splitlines() if env.exists() else []:
        if ln.startswith("ELEVENLABS_API_KEY="):
            return ln.split("=", 1)[1].strip()
    raise SystemExit("no ElevenLabs key: set ELEVENLABS_API_KEY or put it in Motion_as_kit/.env")


def synth(text: str, prev: str, nxt: str, seed: int, out: Path) -> None:
    body = {
        "text": text,
        "model_id": VOICE.get("model", "eleven_v4"),
        "voice_settings": {"stability": VOICE.get("stability", 0.5), "similarity_boost": VOICE.get("similarity", 0.8),
                           "style": VOICE.get("style", 0.25), "use_speaker_boost": True},
        "seed": seed,
    }
    if prev:
        body["previous_text"] = prev
    if nxt:
        body["next_text"] = nxt
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE['voice_id']}?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), headers={"xi-api-key": api_key(), "Content-Type": "application/json", "Accept": "audio/mpeg"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            mp3 = r.read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ElevenLabs refused the request ({e.code}): {e.read().decode()[:300]}")
    tmp = out.with_suffix(".mp3")
    tmp.write_bytes(mp3)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-ac", "1", "-ar", str(SR), str(out)], check=True)
    tmp.unlink()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tries", type=int, default=2)
    ap.add_argument("--only", default="", help="comma-separated line numbers (1-based) to re-make")
    ap.add_argument("--dry", action="store_true", help="print the character cost and stop")
    args = ap.parse_args()
    spec = json.loads(SCRIPT.read_text(encoding="utf-8"))
    WORK.mkdir(parents=True, exist_ok=True)
    only = {int(x) for x in args.only.split(",") if x.strip()}
    texts = [" ".join(line["say"]) for line in spec["lines"]]
    sig = json.dumps({k: VOICE.get(k) for k in ("voice_id", "model", "stability", "similarity", "style")}, sort_keys=True)

    jobs = []  # (line index, text, previous, next, cache file)
    for li, text in enumerate(texts):
        prev = texts[li - 1] if li else ""
        nxt = texts[li + 1] if li + 1 < len(texts) else ""
        key = hashlib.sha1(f"{text}|{prev}|{nxt}|{sig}".encode()).hexdigest()[:12]
        f = WORK / f"l{li + 1:02d}_{key}.wav"
        if only and (li + 1) in only and f.exists():
            f.unlink()
        jobs.append((li, text, prev, nxt, f))
    todo = [j for j in jobs if not j[4].exists()]
    cost = sum(len(j[1]) for j in todo)
    print(f"{len(jobs)} lines, {len(todo)} to make, ~{cost} characters", flush=True)
    if args.dry:
        return 0
    if todo:
        from faster_whisper import WhisperModel

        wm = WhisperModel("base.en", device="cpu", compute_type="int8")
        for li, text, prev, nxt, f in todo:
            best = None
            for k in range(args.tries):
                t0 = time.time()
                raw = WORK / "_take.wav"
                synth(text, prev, nxt, 7000 + 100 * li + k, raw)
                a, _ = sf.read(str(raw), dtype="float32")
                a = trim(a, SR)
                sf.write(str(raw), a, SR)
                segs, _ = wm.transcribe(str(raw), language="en", beam_size=1, condition_on_previous_text=False)
                heard = " ".join(s.text for s in segs)
                ratio = difflib.SequenceMatcher(a=letters(text), b=letters(heard), autojunk=False).ratio()
                print(f"line {li + 1} try {k + 1}: {len(a) / SR:.2f}s, {len(words(text)) / (len(a) / SR):.2f} w/s, match {ratio:.2f}"
                      f"  [{time.time() - t0:.0f}s]  heard: {heard.strip()}", flush=True)
                if best is None or ratio > best[0]:
                    best = (ratio, a)
                if ratio >= 0.9:
                    break
            sf.write(str(f), best[1], SR)
        (WORK / "_take.wav").unlink(missing_ok=True)

    # join: lead-in, lines, pauses, tail
    chunks, manifest, t = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
    for idx, (li, text, _, _, f) in enumerate(jobs):
        a, _ = sf.read(str(f), dtype="float32")
        chunks.append(a)
        manifest.append({"line": li + 1, "text": text, "start": round(t, 3), "end": round(t + len(a) / SR, 3)})
        t += len(a) / SR
        gap = TAIL if idx + 1 == len(jobs) else LINE_GAP
        chunks.append(np.zeros(int(gap * SR), np.float32))
        t += gap
    audio = np.concatenate(chunks)
    audio = audio / (np.abs(audio).max() + 1e-9) * 0.89
    out = EP / "audio" / "voiceover.wav"
    sf.write(str(out), audio, SR)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-ar", "44100", "-ac", "1", "-b:a", "192k", str(EP / "audio" / "voiceover.mp3")], check=True)
    (WORK / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print(f"wrote {out} ({len(audio) / SR:.2f}s)", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
