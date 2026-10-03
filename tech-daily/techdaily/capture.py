"""Screenshots of the tool's own pages for the device-frame beats (desktop for 16:9, mobile for Shorts).

Pages are only viewed: nothing is clicked or accepted. Very short or blank captures are dropped.
"""

from __future__ import annotations

import logging
from pathlib import Path
from urllib.parse import urlparse

log = logging.getLogger(__name__)

VIEWS = {"desktop": dict(width=1280, height=800, scale=1.5, mobile=False),
         "mobile": dict(width=390, height=844, scale=2.0, mobile=True)}
FRAME_W = {"desktop": 1180, "mobile": 532}   # width of the device viewport in the composition
FRAME_H = {"desktop": 590, "mobile": 932}


def record_footage(url: str, out_dir: Path, view: str, seconds: float, env: dict) -> Path | None:
    """Screen-record the page being explored (slow scroll) and return an H.264 mp4, or None on failure.

    The recording is made at the page's own size (Playwright pads anything larger with grey) and scaled up
    to the canvas afterwards. GitHub pages start at the README instead of the file list.
    """
    import shutil
    import subprocess
    import time

    from playwright.sync_api import sync_playwright

    from .config import tool

    canvas = {"desktop": (1920, 1080), "mobile": (1080, 1920)}[view]
    vp = {"desktop": (1600, 900), "mobile": (540, 960)}[view]
    if "github.com/" in url and view == "desktop":
        vp = (960, 540)  # narrow enough that the README column fills the frame
    tmp = out_dir / f"rec-{view}"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir(parents=True, exist_ok=True)
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(channel="chrome", headless=True,
                                         args=["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader"])
            ctx = browser.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=1,
                                      is_mobile=view == "mobile", color_scheme="dark", locale="en-US",
                                      record_video_dir=str(tmp), record_video_size={"width": vp[0], "height": vp[1]})
            t_rec = time.monotonic()
            page = ctx.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=40000)
            page.wait_for_timeout(3500)
            if "github.com/" not in url:  # let web apps finish loading before the usable footage starts
                try:
                    page.wait_for_load_state("networkidle", timeout=20000)
                except Exception:  # noqa: BLE001
                    pass
                page.wait_for_timeout(5000)
            if "github.com/" in url:
                page.evaluate("(document.querySelector('article.markdown-body') || document.body).scrollIntoView()")
                page.wait_for_timeout(800)
            page.mouse.move(vp[0] * 0.5, vp[1] * 0.45)
            t_show = time.monotonic() - t_rec
            t_end = time.monotonic() + seconds
            i = 0
            while time.monotonic() < t_end:  # steady exploration, bounded by wall-clock time
                page.mouse.wheel(0, 6 if i % 40 < 30 else 0)
                page.wait_for_timeout(80)
                i += 1
            ctx.close()
            browser.close()
        webm = next(tmp.glob("*.webm"), None)
        if not webm:
            return None
        out = out_dir / f"footage-{view}.mp4"
        subprocess.run([tool(env, "ffmpeg"), "-v", "error", "-y", "-ss", f"{t_show:.2f}", "-t", f"{seconds:.1f}",
                        "-i", str(webm), "-an", "-vf", f"scale={canvas[0]}:{canvas[1]}:flags=lanczos,fps=30",
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "veryfast",
                        "-movflags", "+faststart", str(out)], check=True, env=env)
        shutil.rmtree(tmp, ignore_errors=True)
        return out
    except Exception as exc:  # noqa: BLE001 - footage is a bonus; stills still work
        log.warning("footage recording of %s (%s) failed: %s", url, view, exc)
        return None


def readme_media(repo_url: str, out_dir: Path, limit: int = 4) -> list[dict]:
    """Download the first demo images/GIFs referenced in a GitHub README (the project's own demo media)."""
    import re

    import httpx

    m = re.match(r"https://github\.com/([^/]+)/([^/#?]+)", repo_url or "")
    if not m:
        return []
    owner, repo = m.group(1), m.group(2)
    found = []
    with httpx.Client(timeout=30, follow_redirects=True, headers={"User-Agent": "tech-daily/0.1"}) as c:
        r = c.get(f"https://api.github.com/repos/{owner}/{repo}/readme", headers={"Accept": "application/vnd.github.html"})
        if r.status_code != 200:
            return []
        urls = re.findall(r'<img[^>]+src="([^"]+)"', r.text)
        for u in urls:
            if "shields.io" in u or "badge" in u.lower():
                continue
            if u.startswith("/"):
                u = f"https://github.com{u}"
            elif not u.startswith(("http://", "https://")):
                u = f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{u.lstrip('./')}"
            try:
                resp = c.get(u)
            except Exception:  # noqa: BLE001
                continue
            ctype = resp.headers.get("content-type", "")
            ctype = ctype.split(";")[0]
            if u.endswith(".svg") and ctype in ("text/plain", "application/octet-stream"):
                ctype = "image/svg+xml"
            small_ok = ctype == "image/svg+xml" and len(resp.content) > 2_000
            if resp.status_code != 200 or not ctype.startswith("image/") or (len(resp.content) < 15_000 and not small_ok):
                continue
            ext = {"image/gif": ".gif", "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp",
                   "image/svg+xml": ".svg"}.get(ctype)
            if not ext:
                continue
            name = f"readme-{len(found) + 1}{ext}"
            (out_dir / name).write_bytes(resp.content)
            found.append({"file": f"assets/shots/{name}", "source": f"github.com/{owner}/{repo}"})
            if len(found) >= limit:
                break
    return found


def capture(urls: dict[str, str], out_dir: Path) -> dict:
    """urls: {"site": url, "github": url}. Returns {"site-desktop": {file, h_scaled, frame_h, host}, ...}."""
    from playwright.sync_api import sync_playwright

    out_dir.mkdir(parents=True, exist_ok=True)
    shots: dict = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", headless=True)
        for key, url in urls.items():
            if not url:
                continue
            for view, v in VIEWS.items():
                ctx = browser.new_context(viewport={"width": v["width"], "height": v["height"]},
                                          device_scale_factor=v["scale"], is_mobile=v["mobile"], locale="en-US",
                                          color_scheme="dark")
                page = ctx.new_page()
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    page.wait_for_timeout(3500)
                    full_h = min(page.evaluate("document.documentElement.scrollHeight"), v["height"] * 4)
                    page.set_viewport_size({"width": v["width"], "height": int(full_h)})
                    page.wait_for_timeout(600)
                    name = f"{key}-{view}.jpg"
                    page.screenshot(path=str(out_dir / name), type="jpeg", quality=86,
                                    clip={"x": 0, "y": 0, "width": v["width"], "height": int(full_h)})
                    h_scaled = full_h * FRAME_W[view] / v["width"]
                    if full_h < 300:
                        continue
                    shots[f"{key}-{view}"] = {"file": f"assets/shots/{name}", "h_scaled": h_scaled,
                                              "frame_h": FRAME_H[view], "host": urlparse(url).netloc}
                except Exception as exc:  # noqa: BLE001 - a missing screenshot only removes one beat option
                    log.warning("capture %s (%s) failed: %s", url, view, exc)
                finally:
                    ctx.close()
        browser.close()
    return shots
