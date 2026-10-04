"""Word timings for the voiceover: CTC forced alignment of the script against the audio.

The display script (with its punctuation, arrows and numbers) is mapped to a spoken form per
word ("5.5." -> FIVE POINT FIVE, "→" -> TO, "MCP." -> EM SEE PEE). wav2vec2-base-960h (quantized
ONNX, char-level CTC) gives frame-wise log-probs (20 ms); one Viterbi pass over the whole file aligns
every character. Word edges are then refined against the audio's energy envelope (a word ends where
the voice actually stops, not on its last CTC spike). Display words made of several spoken words get
`syl` spans, so each part lights up when it is said.

Writes ../data/lyrics.json in the engine's format: { lines: [{ text, start, end, words: [{ w, start, end, syl? }] }] }.

    python -m uv run --no-project --with onnxruntime --with numpy python analysis/align_vo.py
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ep import EP  # noqa: E402
AUDIO = EP / "audio" / "voiceover.mp3"
MODEL = ROOT / "analysis" / "models" / "w2v2_base_960h_q.onnx"
VOCAB = ROOT / "analysis" / "models" / "vocab.json"
SR, HOP = 16000, 320  # 20 ms frames
FRAME = HOP / SR

# The script, one entry per display line, and the spoken form of words the letters don't spell
# (numbers, acronyms): both live in analysis/vo_script.json, shared with the voice generator.
_VO = json.loads((EP / "script.json").read_text(encoding="utf-8"))
SCRIPT = [l["text"] for l in _VO["lines"]]
SPOKEN = {**_VO.get("spoken", {}), "—": [], "→": ["TO"]}


def spoken(w: str) -> list[str]:
    if w in SPOKEN:
        return SPOKEN[w]
    s = w.replace("’", "'").upper()
    s = re.sub(r"[^A-Z' ]", "", s).strip("'")
    return [s] if s else []


def load_audio():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(AUDIO), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def emissions(y):
    sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
    name = sess.get_inputs()[0].name
    n = len(y) // HOP
    out = None
    chunk, ctx = 15 * SR, 2 * SR
    for s in range(0, len(y), chunk):
        a, b = max(0, s - ctx), min(len(y), s + chunk + ctx)
        x = y[a:b]
        x = (x - x.mean()) / np.sqrt(x.var() + 1e-7)  # the feature extractor's normalisation
        lg = sess.run(None, {name: x[None].astype(np.float32)})[0][0]
        lg = lg - np.logaddexp.reduce(lg, axis=1, keepdims=True)
        if out is None:
            out = np.full((n, lg.shape[1]), np.nan, np.float32)
        f0 = a // HOP
        lo, hi = s // HOP, min(n, (s + chunk) // HOP)
        seg = lg[lo - f0: hi - f0]
        out[lo: lo + len(seg)] = seg
    bad = np.isnan(out[:, 0])
    if bad.any():
        last = np.where(~bad)[0].max()
        out[last + 1:] = out[last]
    return out


def viterbi(E, tgt):
    """CTC forced alignment. E: [T, V] log-probs, tgt: token ids (no blanks). Returns the state per frame."""
    T, L = E.shape[0], len(tgt)
    S = 2 * L + 1
    lab = np.zeros(S, np.int64)
    lab[1::2] = tgt
    NEG = -1e30
    # skip transition s-2 -> s allowed for non-blank s whose label differs from s-2's
    skip = np.zeros(S, bool)
    skip[3::2] = np.array(tgt[1:]) != np.array(tgt[:-1])
    dp = np.full(S, NEG)
    dp[0] = E[0, 0]
    dp[1] = E[0, lab[1]]
    bp = np.zeros((T, S), np.int8)
    for t in range(1, T):
        stay = dp
        one = np.concatenate([[NEG], dp[:-1]])
        two = np.where(skip, np.concatenate([[NEG, NEG], dp[:-2]]), NEG)
        best = np.maximum(stay, np.maximum(one, two))
        bp[t] = np.where(best == stay, 0, np.where(best == one, 1, 2))
        dp = best + E[t, lab]
    s = S - 1 if dp[S - 1] >= dp[S - 2] else S - 2
    path = np.zeros(T, np.int64)
    for t in range(T - 1, -1, -1):
        path[t] = s
        s -= int(bp[t, s])
    return path


def envelope_db(y):
    n = len(y) // 160
    fr = y[: n * 160].reshape(n, 160)
    return 20 * np.log10(np.sqrt((fr ** 2).mean(1) + 1e-12) + 1e-9)  # 10 ms frames


def main():
    vocab = json.loads(VOCAB.read_text())
    blank, sep = vocab["<pad>"], vocab["|"]
    y = load_audio()
    dur = len(y) / SR
    print(f"audio {dur:.2f}s", file=sys.stderr)
    E = emissions(y)
    db = envelope_db(y)
    peak = np.percentile(db, 99)
    voiced = db > peak - 34  # 10 ms frames with voice energy

    # target: every spoken unit of every display word, '|' between units
    lines = []
    units = []  # (line, word, part, [token positions])
    tgt = []
    for li, text in enumerate(SCRIPT):
        words = text.split(" ")
        lines.append(words)
        for wi, w in enumerate(words):
            for pi, sp in enumerate(spoken(w)):
                if tgt:
                    tgt.append(sep)
                pos = []
                for ch in sp:
                    if ch == " ":
                        tgt.append(sep)
                        continue
                    pos.append(len(tgt))
                    tgt.append(vocab[ch])
                units.append((li, wi, pi, pos))
    path = viterbi(E, tgt)
    # frames per target token
    tok_frames: dict[int, list[int]] = {}
    for t, s in enumerate(path):
        if s % 2 == 1:
            tok_frames.setdefault((s - 1) // 2, []).append(t)
    spans = {}  # (li, wi, pi) -> [start, end]
    for li, wi, pi, pos in units:
        fr = [f for p in pos for f in tok_frames.get(p, [])]
        if not fr:
            continue
        spans[(li, wi, pi)] = [min(fr) * FRAME, (max(fr) + 1) * FRAME]

    # refine: a unit starts where the voice starts (walk back over voiced 10 ms frames, at most 120 ms)
    # and ends where it stops (walk forward to the next silence, never into the next unit)
    order = sorted(spans.keys())
    for k, key in enumerate(order):
        a, b = spans[key]
        nxt = spans[order[k + 1]][0] if k + 1 < len(order) else dur
        prv = spans[order[k - 1]][1] if k > 0 else 0.0
        # (only onsets after a silence: in connected speech the voicing runs on from the previous word)
        i = int(a * 100)
        lim = max(int(prv * 100), i - 12)
        while i - 1 > lim and voiced[i - 1]:
            i -= 1
        if i - 1 >= 0 and not voiced[i - 1]:
            a = i / 100
        j = int(b * 100)
        while j < min(len(voiced), int(nxt * 100)) and voiced[j]:
            j += 1
        b = max(b, j / 100)
        spans[key] = [a, min(b, nxt)]
    # close small gaps inside a phrase: a unit runs until the next one starts when the gap is unvoiced < 90 ms
    for k, key in enumerate(order[:-1]):
        nk = order[k + 1]
        if 0 < spans[nk][0] - spans[key][1] < 0.09:
            spans[key][1] = spans[nk][0]

    out_lines = []
    for li, words in enumerate(lines):
        ow = []
        for wi, w in enumerate(words):
            parts = [spans[(li, wi, pi)] for pi in range(len(spoken(w))) if (li, wi, pi) in spans]
            if parts:
                wd = {"w": w, "start": round(parts[0][0], 3), "end": round(parts[-1][1], 3)}
                if len(parts) > 1:
                    wd["syl"] = [[round(a, 3), round(b, 3)] for a, b in parts]
            else:
                wd = {"w": w, "start": None, "end": None}
            ow.append(wd)
        # unspoken tokens (the dash): the pause between their neighbours
        for i, wd in enumerate(ow):
            if wd["start"] is None:
                prev = next((x for x in reversed(ow[:i]) if x["start"] is not None), None)
                nxt = next((x for x in ow[i + 1:] if x["start"] is not None), None)
                wd["start"] = prev["end"] if prev else (nxt["start"] if nxt else 0)
                wd["end"] = nxt["start"] if nxt else wd["start"]
        out_lines.append({"text": " ".join(words), "start": ow[0]["start"], "end": ow[-1]["end"], "words": ow})
    (EP / "data" / "lyrics.json").write_text(json.dumps({"source": "align_vo.py (wav2vec2-base-960h CTC)", "lines": out_lines}, indent=1, ensure_ascii=False), encoding="utf-8")
    for l in out_lines:
        print(f"{l['start']:6.2f}-{l['end']:6.2f}  " + " ".join(f"{w['w']}[{w['start']:.2f}]" for w in l["words"]))


if __name__ == "__main__":
    main()
