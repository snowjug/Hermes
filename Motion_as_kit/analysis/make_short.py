"""The vertical Short (1080x1920) from the finished 16:9 video.

Layout: a static sheet (graph paper, the hook headline, crop marks) with the 16:9 video edge to edge in
the middle, and under it a band redrawn every frame: the section label and big word-by-word captions
from data/lyrics.json (the word being said in signal orange, the rest of the phrase in bone, words
still to come faint). ffmpeg composites the sheet, the video and the band; the audio is the video's.

    python -m uv run --no-project --with pillow --with numpy python analysis/make_short.py out/magpie_final.mp4 out/magpie_short.mp4
"""
import json, re, subprocess, sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "app" / "public" / "fonts"
W, H, FPS = 1080, 1920, 30
VID_Y, VID_H = 560, 608          # the 16:9 video, full width
BAND_Y, BAND_H = 1188, 300       # section label + captions
INK, BONE, SIGNAL, ASH = (10, 10, 11), (238, 233, 223), (255, 77, 18), (156, 151, 143)
SECTIONS = [  # (line the section starts on, label)
    ("The biggest coding agents", "01 · THE PROBLEM"),
    ("It's called magpie", "02 · MEET MAGPIE"),
    ("The clever part", "03 · HOW IT WORKS"),
    ("Even the plans", "04 · PLANS, KEYS, CONFIGS"),
    ("The catch?", "05 · THE CATCH"),
    ("That's today's tool", "A NEW TOOL EVERY DAY"),
]


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def fit(draw, text, fnt_name, max_w, start):
    s = start
    while s > 20:
        f = font(fnt_name, s)
        if draw.textlength(text, font=f) <= max_w:
            return f
        s -= 2
    return font(fnt_name, s)


def sheet(path: Path):
    img = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(img, "RGBA")
    for x in range(0, W, 24):
        d.line([(x, 0), (x, H)], fill=BONE + (9 if x % 96 else 20,), width=1)
    for y in range(0, H, 24):
        d.line([(0, y), (W, y)], fill=BONE + (9 if y % 96 else 20,), width=1)
    # a warm glow behind the headline
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([(-200, 60), (W + 200, 640)], fill=60)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    img = Image.composite(Image.new("RGB", (W, H), (60, 20, 8)), img, glow)
    d = ImageDraw.Draw(img, "RGBA")
    # the hook
    mono = font("src/IBMPlexMono-Medium.ttf", 30)
    label = "MAGPIE  ·  FREE  ·  OPEN SOURCE"
    x = 60
    for ch in label:  # letter-spaced
        d.text((x, 196), ch, font=mono, fill=SIGNAL)
        x += d.textlength(ch, font=mono) + 4
    big = fit(d, "ANY AGENT.", "Archivo-w1000-900.ttf", W - 120, 170)
    d.text((56, 250), "ANY AGENT.", font=big, fill=BONE)
    d.text((56, 250 + int(big.size * 0.98)), "ANY MODEL.", font=big, fill=SIGNAL)
    # crop marks around the video, and hairlines along its edges
    for (cx, cy, sx, sy) in [(24, VID_Y - 18, 1, 1), (W - 24, VID_Y - 18, -1, 1), (24, VID_Y + VID_H + 18, 1, -1), (W - 24, VID_Y + VID_H + 18, -1, -1)]:
        d.line([(cx, cy), (cx + sx * 26, cy)], fill=BONE + (110,), width=2)
        d.line([(cx, cy), (cx, cy + sy * 26)], fill=BONE + (110,), width=2)
    d.line([(0, VID_Y - 1), (W, VID_Y - 1)], fill=BONE + (40,), width=1)
    d.line([(0, VID_Y + VID_H), (W, VID_Y + VID_H)], fill=BONE + (40,), width=1)
    # vignette
    yy, xx = np.mgrid[0:H, 0:W]
    v = np.clip(1.15 - 0.55 * (((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.6)) ** 2), 0.55, 1)
    arr = (np.asarray(img).astype(np.float32) * v[..., None]).clip(0, 255).astype(np.uint8)
    Image.fromarray(arr).save(path)


def chunks(lines):
    """Caption phrases: up to 3 words / ~18 characters, broken after punctuation."""
    out = []
    for l in lines:
        cur = []
        for w in l["words"]:
            if w["end"] <= w["start"] and not re.search(r"[a-z0-9]", w["w"].lower()):
                continue
            cur.append(w)
            text = " ".join(x["w"] for x in cur)
            if len(cur) >= 3 or len(text) >= 18 or re.search(r"[.,?!:]$", w["w"]):
                out.append(cur)
                cur = []
        if cur:
            out.append(cur)
    for i, c in enumerate(out):
        nxt = out[i + 1][0]["start"] if i + 1 < len(out) else c[-1]["end"] + 1.0
        c_end = min(nxt, c[-1]["end"] + 0.6)
        out[i] = {"words": c, "start": c[0]["start"] - 0.06, "end": c_end}
    return out


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from ep import EP
    lines = json.loads((EP / "data" / "lyrics.json").read_text(encoding="utf-8"))["lines"]
    fold = lambda s: s.lower().replace("’", "'")
    secs = []
    for q, lab in SECTIONS:
        l = next(x for x in lines if fold(q) in fold(x["text"]))
        secs.append((l["start"] - 0.15, lab))
    secs[0] = (0.0, secs[0][1])
    caps = chunks(lines)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)],
                               capture_output=True, text=True, check=True).stdout.strip())
    n = int(round(dur * FPS))
    bg = dst.with_suffix(".sheet.png")
    sheet(bg)

    cap_font = font("Archivo-w1000-900.ttf", 84)
    lab_font = font("src/IBMPlexMono-Medium.ttf", 28)
    ff = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y", "-i", str(src), "-loop", "1", "-framerate", str(FPS), "-i", str(bg),
        "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{BAND_H}", "-r", str(FPS), "-i", "pipe:0",
        "-filter_complex",
        f"[0:v]scale={W}:{VID_H}:flags=lanczos[v];[1:v][v]overlay=0:{VID_Y}:shortest=1[a];[a][2:v]overlay=0:{BAND_Y}:shortest=1,format=yuv420p[out]",
        "-map", "[out]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", str(FPS),
        "-c:a", "copy", "-movflags", "+faststart", "-t", f"{dur:.3f}", str(dst)], stdin=subprocess.PIPE)
    probe = ImageDraw.Draw(Image.new("RGBA", (8, 8)))
    for k in range(n):
        t = k / FPS
        band = Image.new("RGBA", (W, BAND_H), (0, 0, 0, 0))
        d = ImageDraw.Draw(band)
        # section label (fades in at each section start)
        cur = [s for s in secs if s[0] <= t]
        if cur:
            st, lab = cur[-1]
            a = int(255 * min(1.0, (t - st) / 0.25)) if st > 0 else 255
            x = 60
            for ch in lab:
                d.text((x, 6), ch, font=lab_font, fill=SIGNAL + (a,))
                x += probe.textlength(ch, font=lab_font) + 3
        # the caption phrase on screen at t
        c = next((c for c in caps if c["start"] <= t < c["end"]), None)
        if c:
            words = c["words"]
            pop = min(1.0, (t - c["start"]) / 0.12)
            dy = int((1 - pop) * 14)
            sp = probe.textlength(" ", font=cap_font)
            # wrap to two lines if needed
            rows, row, wsum = [], [], 0.0
            for w in words:
                ww = probe.textlength(w["w"], font=cap_font)
                if row and wsum + sp + ww > W - 150:
                    rows.append(row); row, wsum = [], 0.0
                row.append((w, ww)); wsum += (sp if len(row) > 1 else 0) + ww
            rows.append(row)
            y = 66 + dy
            for row in rows:
                x = 60
                for w, ww in row:
                    if t >= w["end"]:
                        col = BONE + (int(255 * pop),)
                    elif t >= w["start"]:
                        col = SIGNAL + (int(255 * pop),)
                    else:
                        col = BONE + (int(80 * pop),)
                    d.text((x, y), w["w"], font=cap_font, fill=col, stroke_width=5, stroke_fill=INK + (int(220 * pop),))
                    x += ww + sp
                y += 100
        ff.stdin.write(band.tobytes())
        if k % 300 == 0:
            print(f"{k}/{n}", flush=True)
    ff.stdin.close()
    ff.wait()
    print(f"wrote {dst} ({n} frames)")
    return ff.returncode


if __name__ == "__main__":
    sys.exit(main())
