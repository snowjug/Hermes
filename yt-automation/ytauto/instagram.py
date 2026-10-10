"""Post one video as an Instagram Reel through instagram.com in the signed-in Chrome profile (Playwright).

It works like the YouTube uploader: the browser uses the same dedicated profile folder, you sign in once
with `ytauto ig-login`, and this module never types credentials. A sign-in page or a security check stops
the post with NeedsLogin so a person can deal with it.

Instagram's web composer has no scheduling, so the pipeline calls this at the Reel's publish time.
Every selector lives in SEL below, each with fallbacks; failed steps save a screenshot into the job folder.
"""

from __future__ import annotations

import logging
import re
import subprocess
import time
from pathlib import Path
from zoneinfo import ZoneInfo

from .uploader import NeedsLogin, UploadError, _first, _launch, _step, browser_executable

log = logging.getLogger(__name__)

SEL = {
    "create": ['svg[aria-label="New post"]', 'a:has(svg[aria-label="New post"])', 'text="Create"'],
    "create_post": ['svg[aria-label="Post"]', '[role="menuitem"]:has-text("Post")', 'a:has-text("Post")'],
    "file_input": ['div[role="dialog"] input[type="file"]', 'form[enctype="multipart/form-data"] input[type="file"]',
                   'input[type="file"][accept*="video"]'],
    "crop_button": ['svg[aria-label="Select crop"]', '[aria-label="Select crop"]'],
    "crop_original": ['div[role="dialog"] span:text-is("Original")', 'svg[aria-label="Photo outline icon"]'],
    "caption": ['div[aria-label="Write a caption..."]', 'div[aria-label^="Write a caption"]',
                'div[role="dialog"] div[role="textbox"][contenteditable="true"]'],
    "advanced": ['div[role="dialog"] span:text-is("Advanced settings")', 'div[role="dialog"] :text("Advanced settings")'],
    "shared": ['text="Your reel has been shared."', 'text="Reel shared"', 'text="Your post has been shared."',
               'img[alt="Animated checkmark"]'],
}

# One-time popups that cover the page. Only these are dismissed, and only with a harmless button.
INTERSTITIALS = [
    ("Turn on Notifications", re.compile(r"^Not Now$", re.I)),
    ("Save your login info", re.compile(r"^Not now$", re.I)),
    ("Video posts are now shared as reels", re.compile(r"^OK$", re.I)),
]

HASHTAG_LIMIT = 5  # Instagram allows at most five hashtags per post


def build_caption(meta: dict, *, footer: str = "") -> str:
    """An Instagram caption from the YouTube metadata.

    Links are not clickable in captions, so lines with URLs are dropped. #Shorts becomes #reels, and
    the hashtags (at most five) go on the last line.
    """
    if meta.get("instagram_caption"):
        return str(meta["instagram_caption"]).strip()
    text = meta.get("description") or ""
    tags: list[str] = []
    lines: list[str] = []
    for line in text.split("\n"):
        words = line.split()
        if words and all(w.startswith("#") for w in words):
            tags += [("#reels" if w.lower() == "#shorts" else w) for w in words]
            continue
        if re.search(r"https?://", line):
            continue
        lines.append(line.rstrip())
    body = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
    seen: set[str] = set()
    tags = [t for t in tags if not (t.lower() in seen or seen.add(t.lower()))][:HASHTAG_LIMIT]
    parts = [meta["title"].strip(), body, footer.strip(), " ".join(tags)]
    return "\n\n".join(p for p in parts if p)[:2200]


def is_signed_in(cfg: dict, ig_cfg: dict, profile_dir: Path, tz: ZoneInfo) -> bool:
    """Check the automation profile headlessly: a session cookie exists and Instagram does not ask to log in."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        ctx = _launch(pw, cfg, profile_dir, tz, headless=True)
        try:
            names = {c["name"] for c in ctx.cookies() if c["domain"].endswith("instagram.com")}
            if "sessionid" not in names:
                return False
            page = ctx.pages[0] if ctx.pages else ctx.new_page()
            page.goto(ig_cfg["base_url"], wait_until="domcontentloaded")
            page.wait_for_timeout(5000)
            return "/accounts/login" not in page.url and "/challenge" not in page.url
        finally:
            ctx.close()


def login(cfg: dict, ig_cfg: dict, profile_dir: Path, tz: ZoneInfo) -> bool:
    """Open plain Chrome on the automation profile at Instagram, wait for the person to sign in and close it."""
    profile_dir.mkdir(parents=True, exist_ok=True)
    exe = browser_executable(cfg.get("browser_channel"))
    proc = subprocess.Popen([exe, f"--user-data-dir={profile_dir}", "--no-first-run", "--no-default-browser-check",
                             "--new-window", ig_cfg["base_url"].rstrip("/") + "/accounts/login/"])
    print("Sign in to Instagram in the opened window. Close the window when you see your feed.")
    proc.wait()
    time.sleep(2)  # let Chrome finish writing cookies
    return is_signed_in(cfg, ig_cfg, profile_dir, tz)


def _check_signed_in(page) -> None:
    url = page.url
    if "/accounts/login" in url or page.locator('input[name="username"]').count():
        raise NeedsLogin("Instagram is signed out in the automation profile; run `ytauto ig-login`")
    if any(part in url for part in ("/challenge", "/accounts/suspended", "/auth_platform", "/checkpoint")):
        raise NeedsLogin("Instagram asked for a security check; open `ytauto ig-login` and complete it yourself")


def _dismiss_interstitials(page) -> None:
    for text, button in INTERSTITIALS:
        dialog = page.locator("[role=dialog]:visible", has_text=text)
        if dialog.count():
            log.info("dismissing Instagram popup: %s", text)
            dialog.get_by_role("button", name=button).first.click()
            page.wait_for_timeout(1000)


def _dialog_button(page, name: str):
    """A header button (Next, Share) of the topmost composer dialog."""
    return page.locator("div[role=dialog]:visible").get_by_role("button", name=name, exact=True).last


def _type_caption(page, box, caption: str) -> None:
    """Type the caption line by line. A hashtag or mention left open shows a suggestion list, and Enter
    would pick from it, so a space closes the word before each line break and at the end."""
    box.click()
    lines = caption.split("\n")
    for i, line in enumerate(lines):
        if line:
            page.keyboard.type(line)
        if re.search(r"[#@][\w.]+$", line) or i == len(lines) - 1:
            page.keyboard.type(" ")
            page.wait_for_timeout(400)
        if i < len(lines) - 1:
            page.keyboard.press("Enter")


def _set_ai_label(page, step_ms: int) -> None:
    """Switch on the composer's AI label (the Reel uses an AI voice). Raises if this version has none."""
    _first(page, SEL["advanced"], step_ms).click()
    page.wait_for_timeout(800)
    row = page.locator("div[role=dialog] :text-matches('AI label|Made with AI|AI info', 'i')").first
    row.wait_for(state="visible", timeout=5000)
    switch = page.locator("div[role=dialog] input[role=switch], div[role=dialog] input[type=checkbox]")
    target = row.locator("xpath=ancestor::*[.//input][1]//input").first
    target = target if target.count() else switch.last
    if target.get_attribute("aria-checked") != "true" and not target.is_checked():
        target.check(force=True)


def _latest_reel_url(page, ig_cfg: dict) -> str | None:
    """The newest Reel on the account's Reels tab (it can take a minute to appear)."""
    username = ig_cfg.get("username")
    if not username:
        return None
    reels_url = ig_cfg["base_url"].rstrip("/") + f"/{username}/reels/"
    for _ in range(6):
        try:
            page.goto(reels_url, wait_until="domcontentloaded")
            link = page.locator('a[href*="/reel/"]').first
            link.wait_for(state="attached", timeout=10_000)
            href = link.get_attribute("href") or ""
            return href if href.startswith("http") else ig_cfg["base_url"].rstrip("/") + href
        except Exception:  # noqa: BLE001
            page.wait_for_timeout(5000)
    return None


def post_reel(video: Path, caption: str, *, cfg: dict, ig_cfg: dict, profile_dir: Path, tz: ZoneInfo,
              shots_dir: Path, ai_label: bool = False, dry_run: bool = False,
              warnings: list[str] | None = None) -> str:
    """Post `video` as a Reel with `caption`. Returns the Reel's URL (or the profile's Reels tab).

    dry_run stops on the caption page, before Share, so the selectors can be checked without posting.
    """
    from playwright.sync_api import sync_playwright

    step_ms = int(cfg["step_timeout_seconds"]) * 1000
    shots_dir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        ctx = _launch(pw, cfg, profile_dir, tz)
        ctx.set_default_timeout(step_ms)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        try:
            with _step(page, shots_dir, "ig-open"):
                page.goto(ig_cfg["base_url"], wait_until="domcontentloaded")
                page.wait_for_timeout(4000)
                _check_signed_in(page)
                _dismiss_interstitials(page)

            with _step(page, shots_dir, "ig-create"):
                _first(page, SEL["create"], step_ms).click()
                page.wait_for_timeout(1200)
                # Newer layouts open a small menu (Post, Live video, ...) before the composer.
                composer = page.locator("div[role=dialog]:visible").filter(has_text="Create new post")
                if not composer.count():
                    _first(page, SEL["create_post"], step_ms).click()
                composer.first.wait_for(timeout=step_ms)

            with _step(page, shots_dir, "ig-select-file"):
                _first(page, SEL["file_input"], step_ms, state="attached").set_input_files(str(video))
                page.wait_for_timeout(3000)
                _dismiss_interstitials(page)

            with _step(page, shots_dir, "ig-crop"):
                # Keep the video's own 9:16 frame; some versions default to a square crop.
                try:
                    _first(page, SEL["crop_button"], 8000).click()
                    page.wait_for_timeout(600)
                    _first(page, SEL["crop_original"], 5000).click()
                    page.wait_for_timeout(600)
                except Exception as exc:  # noqa: BLE001
                    log.warning("could not choose the Original crop: %s", exc)
                    if warnings is not None:
                        warnings.append("crop was left at Instagram's default; check the Reel's framing")
                _dialog_button(page, "Next").click()

            with _step(page, shots_dir, "ig-edit"):
                page.wait_for_timeout(1500)
                _dialog_button(page, "Next").click()

            with _step(page, shots_dir, "ig-caption"):
                box = _first(page, SEL["caption"], step_ms)
                _type_caption(page, box, caption)

            if ai_label:
                try:
                    _set_ai_label(page, step_ms)
                except Exception as exc:  # noqa: BLE001
                    log.warning("optional step ai-label failed: %s", exc)
                    page.screenshot(path=str(shots_dir / "warning-ig-ai-label.png"), full_page=True)
                    if warnings is not None:
                        warnings.append("AI label was not set automatically; add it in the Reel's settings")

            if dry_run:
                page.screenshot(path=str(shots_dir / "ig-dry-run.png"), full_page=True)
                log.info("instagram dry run stopped before Share; screenshot ig-dry-run.png")
                return "dry-run"

            with _step(page, shots_dir, "ig-share"):
                _dialog_button(page, "Share").click()
                timeout_ms = int(ig_cfg.get("post_timeout_minutes", 15)) * 60_000
                deadline = time.monotonic() + timeout_ms / 1000
                while time.monotonic() < deadline:
                    if any(page.locator(sel).locator("visible=true").count() for sel in SEL["shared"]):
                        break
                    if page.locator("div[role=dialog]", has_text=re.compile(r"couldn.t be shared|try again",
                                                                           re.I)).count():
                        raise UploadError("Instagram said the Reel couldn't be shared")
                    page.wait_for_timeout(3000)
                else:
                    raise UploadError(f"Instagram did not confirm the Reel within {timeout_ms // 60_000} min")
                log.info("instagram: reel shared")
                page.wait_for_timeout(2000)

            url = _latest_reel_url(page, ig_cfg)
            if url is None:
                url = ig_cfg["base_url"].rstrip("/") + f"/{ig_cfg.get('username') or ''}"
                if warnings is not None:
                    warnings.append("the Reel's own link was not found; this is the profile link")
            log.info("posted reel %s -> %s", video.name, url)
            return url
        finally:
            try:
                ctx.close()
            except Exception:  # noqa: BLE001
                pass
