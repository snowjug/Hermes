"""Sanity checks on a rendered video before it goes out.

- every 0.5 s: a frame must not be the engine's error fill (dark red) or flat black;
- the audio and video streams must have the same length (within 0.1 s);
- writes a contact sheet (out/check_sheet.png) to look at.

    python analysis/check_video.py out/final.mp4
"""
import json, subprocess, sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,duration,width,height,r_frame_rate",
                          "-of", "json", str(path)], capture_output=True, text=True, check=True).stdout
    return json.loads(out)["streams"]


def main():
    path = Path(sys.argv[1])
    streams = probe(path)
    for s in streams:
        print(s)
    durs = [float(s["duration"]) for s in streams if "duration" in s]
    problems = []
    if len(durs) >= 2 and abs(durs[0] - durs[1]) > 0.1:
        problems.append(f"stream lengths differ: {durs}")
    w, h = 160, 90
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"fps=2,scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)
    for i, f in enumerate(frames):
        r, g, b = f[..., 0].mean(), f[..., 1].mean(), f[..., 2].mean()
        red_px = ((f[..., 0] > 40) & (f[..., 0] > 3 * f[..., 1]) & (f[..., 0] > 3 * f[..., 2])).mean()
        if red_px > 0.6:
            problems.append(f"t={i / 2:.1f}s looks like the error fill (red {red_px:.0%})")
        if max(r, g, b) < 3 and 0 < i < len(frames) - 1:
            problems.append(f"t={i / 2:.1f}s is black")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-vf", "fps=1/3,scale=480:-1,tile=6x5", "-frames:v", "1",
                    str(ROOT / "out" / "check_sheet.png")], check=True)
    print(f"{len(frames)} frames checked; sheet: out/check_sheet.png")
    print("PROBLEMS:\n" + "\n".join(problems) if problems else "no problems found")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
