"""Paper cutouts for the collage plates: each source image in <episode>/img becomes
  data/cut/<name>.png  the cutout: a sticker (a white border grown around the subject's alpha) or a print
                       (the photo inside a white, slightly hand-cut border), with a faint paper tooth
  data/cut/<name>_sh.png  its soft shadow (blurred alpha), drawn under it with an offset at render time
Images on a plain white background can be keyed out first (flood fill from the edges).

    EPISODE=<id> uv run --no-project --with numpy --with pillow --with scipy python analysis/cutouts.py
"""
import json, sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ep import EP  # noqa: E402

SPEC = json.loads((EP / "img" / "cutouts.json").read_text(encoding="utf-8"))
OUT = EP / "data" / "cut"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def key_white(im: Image.Image, tol: int) -> Image.Image:
    """Alpha from a flood fill of near-white pixels connected to the border."""
    a = np.asarray(im.convert("RGB")).astype(np.int16)
    white = (a.min(axis=2) >= 255 - tol)
    lab, _ = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    bg = ndimage.binary_opening(bg, iterations=2)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2)))
    rgba = np.dstack([np.asarray(im.convert("RGB")), alpha])
    return Image.fromarray(rgba, "RGBA")


def tooth(img: Image.Image, amount=10) -> Image.Image:
    """A faint paper grain over the whole cutout."""
    w, h = img.size
    n = rng.normal(0, amount, (h, w)).astype(np.float32)
    n = ndimage.gaussian_filter(n, 0.8)
    a = np.asarray(img).astype(np.float32)
    a[..., :3] = np.clip(a[..., :3] + n[..., None], 0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def sticker(im: Image.Image, border: int) -> Image.Image:
    a = np.asarray(im)[..., 3] > 40
    # keep the subject, drop specks: components smaller than 1% of the biggest
    lab, n = ndimage.label(a)
    if n > 1:
        sizes = ndimage.sum(a, lab, range(1, n + 1))
        keep = [i + 1 for i, s in enumerate(sizes) if s >= 0.01 * sizes.max()]
        a = np.isin(lab, keep)
        arr = np.asarray(im).copy(); arr[..., 3] = np.where(a, arr[..., 3], 0); im = Image.fromarray(arr, "RGBA")
    grown = ndimage.binary_dilation(a, structure=disk(border))
    grown = ndimage.binary_closing(grown, structure=disk(border // 2 + 1))
    pad = border + 4
    W, H = im.size[0] + 2 * pad, im.size[1] + 2 * pad
    base = np.zeros((H, W, 4), np.uint8)
    gm = np.zeros((H, W), bool); gm[pad:pad + im.size[1], pad:pad + im.size[0]] = grown
    gm = np.asarray(Image.fromarray((gm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))) > 127
    base[gm] = (250, 248, 242, 255)
    out = Image.fromarray(base, "RGBA")
    out.alpha_composite(im, (pad, pad))
    return out


def disk(r: int):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def print_(im: Image.Image, border: int, cut: float) -> Image.Image:
    """The photo in a white border whose edges wander a little, like a scissor cut."""
    im = im.convert("RGBA")
    w, h = im.size
    W, H = w + 2 * border, h + 2 * border
    pts = []
    for (x0, y0, x1, y1) in ((0, 0, W, 0), (W, 0, W, H), (W, H, 0, H), (0, H, 0, 0)):
        for k in range(12):
            u = k / 12
            j = rng.normal(0, cut)
            nx, ny = (0, 1) if y0 == y1 else (1, 0)
            pts.append((x0 + (x1 - x0) * u + nx * j, y0 + (y1 - y0) * u + ny * j))
    pad = int(cut * 4) + 2
    out = Image.new("RGBA", (W + 2 * pad, H + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    d.polygon([(x + pad, y + pad) for x, y in pts], fill=(250, 248, 242, 255))
    out.alpha_composite(im, (border + pad, border + pad))
    return out


def clipping(im: Image.Image, tear: float) -> Image.Image:
    """Newsprint torn out: no border, ragged edges all round, a little yellowed."""
    im = im.convert("RGBA")
    a = np.asarray(im).astype(np.float32)
    a[..., :3] = a[..., :3] * np.array([0.98, 0.95, 0.86]) + np.array([4, 4, 2])
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    pts = []
    steps = 60
    for (x0, y0, x1, y1) in ((0, 0, w, 0), (w, 0, w, h), (w, h, 0, h), (0, h, 0, 0)):
        for k in range(steps):
            u = k / steps
            j = abs(rng.normal(0, tear)) + tear * 0.6
            nx, ny = (0, 1) if y0 == y1 else (1, 0)
            sgn = 1 if (y0 == 0 and y1 == 0) or (x0 == 0 and x1 == 0) else -1
            pts.append((x0 + (x1 - x0) * u + nx * j * sgn, y0 + (y1 - y0) * u + ny * j * sgn))
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    im.putalpha(mask)
    return im


def shadow(cut: Image.Image, blur: float) -> Image.Image:
    a = np.asarray(cut)[..., 3].astype(np.float32) / 255
    pad = int(blur * 3)
    A = np.zeros((a.shape[0] + 2 * pad, a.shape[1] + 2 * pad), np.float32)
    A[pad:pad + a.shape[0], pad:pad + a.shape[1]] = a
    A = ndimage.gaussian_filter(A, blur)
    rgba = np.zeros(A.shape + (4,), np.uint8)
    rgba[..., 3] = np.clip(A * 255 * 0.62, 0, 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


meta = {}
for name, s in SPEC.items():
    im = Image.open(EP / "img" / s["file"]).convert("RGBA")
    if s.get("crop"):
        l, t, r, b = s["crop"]
        im = im.crop((int(l * im.width), int(t * im.height), int(r * im.width), int(b * im.height)))
    mx = s.get("max", 900)
    im.thumbnail((mx, mx), Image.LANCZOS)
    kind = s.get("kind", "print")
    if s.get("key_white") is not None:
        im = key_white(im, s["key_white"])
    if kind == "sticker":
        cut = sticker(im, s.get("border", 14))
    elif kind == "clipping":
        cut = clipping(im, s.get("tear", 5))
    else:
        cut = print_(im, s.get("border", 18), s.get("cut", 1.6))
    cut = tooth(cut, s.get("tooth", 7))
    cut.save(OUT / f"{name}.png")
    sh = shadow(cut, s.get("blur", 9))
    sh.save(OUT / f"{name}_sh.png")
    meta[name] = {"w": cut.width, "h": cut.height, "sw": sh.width, "sh": sh.height, "kind": kind}
    print(name, kind, cut.size)
(OUT / "meta.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
