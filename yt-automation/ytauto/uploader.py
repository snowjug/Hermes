"""Upload one video through YouTube Studio in a real, signed-in Chrome window (Playwright).

The browser uses a dedicated profile folder. You sign in once with `ytauto login`; this module
never types credentials. If Google asks for a sign-in or a verification check, the upload stops
with NeedsLogin so a person can deal with it.

YouTube Studio's markup changes from time to time. Every selector lives in SEL below, each with
fallbacks, so a UI change is a one-line fix. Failed steps save a screenshot into the job folder.
"""

from __future__ import annotations

import logging
import os
import re
import shutil
import subprocess
import time
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Iterator
from zoneinfo import ZoneInfo

log = logging.getLogger(__name__)

SEL = {
    "file_input": ['input[type="file"]'],
    "title": ["#title-textarea #textbox", "ytcp-social-suggestions-textbox#title-textarea #textbox"],
    "description": ["#description-textarea #textbox", "ytcp-social-suggestions-textbox#description-textarea #textbox"],
    "not_for_kids": ['tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]', '[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]'],
    "for_kids": ['tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_MFK"]', '[name="VIDEO_MADE_FOR_KIDS_MFK"]'],
    "show_more": ["#toggle-button", "ytcp-button#toggle-button"],
    "tags_input": ["#tags-container #text-input", 'input[aria-label="Tags"]', "ytcp-free-text-chip-bar #text-input"],
    "thumbnail_button": ['button#select-button[aria-label="Upload file"]',
                         "ytcp-thumbnails-compact-editor-uploader #select-button",
                         "ytcp-thumbnail-uploader #select-button", "#select-button:has-text('Upload file')"],
    "thumbnail_input": ["ytcp-thumbnails-compact-editor-uploader input[type=file]", "#file-loader",
                        "ytcp-thumbnail-uploader input[type=file]"],
    "altered_yes": ['tp-yt-paper-radio-button[name="VIDEO_HAS_ALTERED_CONTENT_YES"]',
                    '[name="VIDEO_HAS_ALTERED_CONTENT_YES"]'],
    "next": ["#next-button"],
    "visibility_radio": 'tp-yt-paper-radio-button[name="{name}"], [name="{name}"][role="radio"]',
    "schedule_expand": ["#second-container-expand-button"],
    "date_trigger": ["#datepicker-trigger", "ytcp-text-dropdown-trigger#datepicker-trigger"],
    "date_input": ["ytcp-date-picker tp-yt-paper-input input", "ytcp-date-picker input"],
    "time_input": ["#time-of-day-container tp-yt-paper-input input", "#time-of-day-container input"],
    "progress": ["ytcp-video-upload-progress .progress-label", "span.progress-label", ".progress-label"],
    "video_link": ["span.video-url-fadeable a", "a.ytcp-video-info", "ytcp-video-info a[href*='youtu']"],
    "done": ["#done-button"],
    "close_dialog": ["ytcp-uploads-still-processing-dialog #close-button", "ytcp-video-share-dialog #close-button",
                     "#close-button"],
    "upload_dialog": ["ytcp-uploads-dialog"],
    "error_text": ["ytcp-uploads-dialog .error-area", "ytcp-uploads-dialog #error-message"],
}

LIMIT_PATTERNS = re.compile(r"daily upload limit|upload limit reached|limit reached", re.I)

# One-time Studio popups that cover the page. Only these are dismissed, and only with a harmless button.
INTERSTITIALS = [
    ("Welcome to YouTube Studio", re.compile(r"^(Continue|Got it)$", re.I)),
]


class NeedsLogin(RuntimeError):
    """The browser profile is signed out or Google wants a verification step."""


class UploadError(RuntimeError):
    pass


def _launch(pw, cfg: dict, profile_dir: Path, tz: ZoneInfo, headless: bool | None = None):
    profile_dir.mkdir(parents=True, exist_ok=True)
    kwargs = dict(
        user_data_dir=str(profile_dir),
        headless=cfg["headless"] if headless is None else headless,
        slow_mo=int(cfg.get("slow_mo_ms") or 0),
        locale="en-US",
        timezone_id=str(tz.key),
        viewport={"width": 1400, "height": 900},
        accept_downloads=False,
    )
    channel = cfg.get("browser_channel")
    if channel:
        kwargs["channel"] = channel
    return pw.chromium.launch_persistent_context(**kwargs)


def browser_executable(channel: str | None) -> str:
    """Path of the installed Chrome (or Edge) that Playwright's `channel` option would use."""
    local = os.environ.get("LOCALAPPDATA", "")
    candidates = {
        "msedge": [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                   r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"],
    }.get(channel or "chrome", [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                                r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                                os.path.join(local, r"Google\Chrome\Application\chrome.exe")])
    for path in candidates:
        if os.path.isfile(path):
            return path
    found = shutil.which("msedge" if channel == "msedge" else "chrome")
    if found:
        return found
    raise RuntimeError(f"could not find the {channel or 'chrome'} browser executable")


AUTH_COOKIES = {"SID", "SAPISID", "LOGIN_INFO"}


def is_signed_in(cfg: dict, profile_dir: Path, tz: ZoneInfo) -> bool:
    """Check the automation profile headlessly: session cookies exist and Studio does not bounce to sign-in.

    Headless Studio does not always redirect on to /channel/<id>, so the check only looks for the
    sign-in bounce rather than for the dashboard URL.
    """
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        ctx = _launch(pw, cfg, profile_dir, tz, headless=True)
        try:
            names = {c["name"] for c in ctx.cookies()
                     if c["domain"].endswith((".google.com", ".youtube.com"))}
            if not AUTH_COOKIES <= names:
                return False
            page = ctx.pages[0] if ctx.pages else ctx.new_page()
            page.goto("https://studio.youtube.com", wait_until="domcontentloaded")
            page.wait_for_timeout(5000)
            return "accounts.google.com" not in page.url
        finally:
            ctx.close()


def login(cfg: dict, profile_dir: Path, tz: ZoneInfo) -> bool:
    """Open plain Chrome on the automation profile, wait for the person to sign in and close it.

    The browser runs with no automation attached, because Google often refuses sign-in in a
    browser that Playwright controls. Uploads later reuse the session saved in the profile.
    """
    profile_dir.mkdir(parents=True, exist_ok=True)
    exe = browser_executable(cfg.get("browser_channel"))
    proc = subprocess.Popen([exe, f"--user-data-dir={profile_dir}", "--no-first-run",
                             "--no-default-browser-check", "--new-window", "https://studio.youtube.com"])
    print("Sign in to YouTube in the opened window. Close the window when Studio shows your channel.")
    proc.wait()
    time.sleep(2)  # let Chrome finish writing cookies
    return is_signed_in(cfg, profile_dir, tz)


def _first(page, names: list[str], timeout_ms: int, state: str = "visible"):
    """Return the first locator from `names` that reaches `state` within the shared timeout."""
    deadline = time.monotonic() + timeout_ms / 1000
    last_exc = None
    while time.monotonic() < deadline:
        for sel in names:
            loc = page.locator(sel).first
            try:
                loc.wait_for(state=state, timeout=1500)
                return loc
            except Exception as exc:  # noqa: BLE001 - try the next fallback
                last_exc = exc
    raise UploadError(f"none of {names} became {state}: {last_exc}")


def _check_signed_in(page) -> None:
    url = page.url
    if "accounts.google.com" in url or "/signin" in url or "ServiceLogin" in url:
        raise NeedsLogin("YouTube is signed out in the automation profile; run `ytauto login`")
    if "/challenge" in url or "/sorry/" in url or "recaptcha" in url:
        raise NeedsLogin("Google asked for a verification step; open `ytauto login` and complete it yourself")


def _dismiss_interstitials(page) -> None:
    for text, button in INTERSTITIALS:
        dialog = page.locator("[role=dialog]:visible", has_text=text)
        if dialog.count():
            log.info("dismissing Studio popup: %s", text)
            dialog.get_by_role("button", name=button).first.click()
            page.wait_for_timeout(1000)


def _set_text(page, box, text: str, multiline: bool) -> None:
    box.click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    if multiline:
        lines = text.split("\n")
        for i, line in enumerate(lines):
            if line:
                page.keyboard.insert_text(line)
            if i < len(lines) - 1:
                page.keyboard.press("Enter")
    else:
        page.keyboard.insert_text(text)


def _progress_text(page) -> str:
    for sel in SEL["progress"]:
        loc = page.locator(sel).first
        try:
            if loc.count():
                return (loc.inner_text(timeout=2000) or "").strip()
        except Exception:  # noqa: BLE001
            continue
    return ""


def _wait_upload_finished(page, timeout_s: float) -> str:
    """Block until the file has finished transferring. Closing the browser earlier would cancel the upload."""
    deadline = time.monotonic() + timeout_s
    last = ""
    while time.monotonic() < deadline:
        text = _progress_text(page)
        if text != last:
            log.info("studio progress: %s", text)
            last = text
        if LIMIT_PATTERNS.search(text):
            raise UploadError(f"YouTube refused the upload: {text}")
        if text and not re.search(r"uploading|\d+\s*%|queued|waiting|starting|preparing", text, re.I):
            return text
        time.sleep(5)
    raise UploadError(f"upload did not finish within {timeout_s:.0f}s (last status: {last!r})")


def _studio_date(dt: datetime) -> str:
    return f"{dt.strftime('%b')} {dt.day}, {dt.year}"


def _studio_time(dt: datetime) -> str:
    hour = dt.hour % 12 or 12
    return f"{hour}:{dt.minute:02} {'AM' if dt.hour < 12 else 'PM'}"


def _set_thumbnail(page, path: Path, timeout_ms: int) -> None:
    # Studio shows a "?" help badge on the Upload file tile (and hides it) depending on whether the
    # channel may use custom thumbnails. A visible badge means the channel is not verified yet.
    badge = page.locator("#select-tooltip-icon:not([hidden])").locator("visible=true")
    if badge.count():
        raise UploadError("custom thumbnails are not enabled for this channel yet; verify the channel "
                          "with a phone number at https://www.youtube.com/verify")
    button = None
    for sel in SEL["thumbnail_button"]:
        loc = page.locator(sel).locator("visible=true").first
        if loc.count():
            button = loc
            break
    if button is not None:
        try:
            with page.expect_file_chooser(timeout=min(timeout_ms, 20_000)) as chooser:
                button.click()
        except Exception as exc:  # noqa: BLE001
            raise UploadError("Studio did not open a file picker for the thumbnail; custom thumbnails usually "
                              "need a phone-verified channel (https://www.youtube.com/verify)") from exc
        chooser.value.set_files(str(path))
    else:
        _first(page, SEL["thumbnail_input"], timeout_ms, state="attached").set_input_files(str(path))
    page.wait_for_timeout(2500)


def _mark_altered_content(page, timeout_ms: int) -> None:
    """Answer YouTube's "Altered content" question with Yes (realistic synthetic voice or visuals)."""
    for sel in SEL["altered_yes"]:
        loc = page.locator(sel).locator("visible=true").first
        if loc.count():
            loc.click()
            return
    # Fallback by label text, in case the radio's name attribute changes.
    section = page.locator("xpath=//*[contains(normalize-space(text()), 'Altered content')]"
                           "/ancestor::*[.//tp-yt-paper-radio-button][1]").first
    section.wait_for(state="visible", timeout=timeout_ms)
    section.locator("tp-yt-paper-radio-button", has_text=re.compile(r"^\s*Yes")).first.click()


def _soft(page, shots: Path, name: str, warnings: list[str] | None, fn) -> None:
    """Run an optional step; on failure save a screenshot and record a warning instead of failing."""
    try:
        fn()
    except Exception as exc:  # noqa: BLE001
        log.warning("optional step %s failed: %s", name, exc)
        try:
            page.screenshot(path=str(shots / f"warning-{name}.png"), full_page=True)
        except Exception:  # noqa: BLE001
            pass
        if warnings is not None:
            warnings.append(f"{name} was not set automatically ({str(exc).splitlines()[0][:120]})")


@contextmanager
def _step(page, shots: Path, name: str) -> Iterator[None]:
    log.info("studio step: %s", name)
    try:
        yield
    except NeedsLogin:
        raise
    except Exception as exc:
        try:
            shots.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(shots / f"failed-{name}.png"), full_page=True)
        except Exception:  # noqa: BLE001
            pass
        raise UploadError(f"step '{name}' failed: {exc}") from exc


def video_id(url: str) -> str:
    match = re.search(r"(?:youtu\.be/|v=|/video/|/shorts/)([\w-]{11})", url)
    if not match:
        raise ValueError(f"no YouTube video id in {url!r}")
    return match.group(1)


def set_visibility(url: str, visibility: str, *, cfg: dict, profile_dir: Path, tz: ZoneInfo,
                   shots_dir: Path) -> str:
    """Change an uploaded video's visibility right now (e.g. private or scheduled -> public).

    Returns the visibility label Studio shows after saving.
    """
    from playwright.sync_api import sync_playwright

    step_ms = int(cfg["step_timeout_seconds"]) * 1000
    edit_url = f"https://studio.youtube.com/video/{video_id(url)}/edit"
    with sync_playwright() as pw:
        ctx = _launch(pw, cfg, profile_dir, tz)
        ctx.set_default_timeout(step_ms)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        try:
            with _step(page, shots_dir, "open-edit"):
                page.goto(edit_url, wait_until="domcontentloaded")
                _check_signed_in(page)
                _first(page, SEL["title"], step_ms)
                page.wait_for_timeout(2000)
                _dismiss_interstitials(page)

            with _step(page, shots_dir, "choose-visibility"):
                page.locator("ytcp-video-metadata-visibility").first.click()
                page.wait_for_timeout(1500)
                radio = page.locator(SEL["visibility_radio"].format(name=visibility.upper())).locator("visible=true")
                if not radio.count():
                    # Scheduled videos open with "Schedule" expanded and "Save or publish" collapsed.
                    page.get_by_text("Save or publish", exact=True).locator("visible=true").first.click()
                    page.wait_for_timeout(1000)
                radio.first.click()
                page.locator("#save-button").locator("visible=true").first.click()

            with _step(page, shots_dir, "save-edit"):
                page.locator("#save").locator("visible=true").first.click()
                page.wait_for_timeout(4000)
                page.reload(wait_until="domcontentloaded")
                _first(page, SEL["title"], step_ms)
                page.wait_for_timeout(2000)
                shown = page.locator("ytcp-video-metadata-visibility #content").first.inner_text().strip()
                if visibility.lower() not in shown.lower():
                    raise UploadError(f"Studio still shows {shown!r}")
            log.info("visibility of %s is now %s", url, shown)
            return shown
        finally:
            try:
                ctx.close()
            except Exception:  # noqa: BLE001
                pass


def set_thumbnail(url: str, image: Path, *, cfg: dict, profile_dir: Path, tz: ZoneInfo, shots_dir: Path) -> None:
    """Upload a custom thumbnail to an already uploaded video and save."""
    from playwright.sync_api import sync_playwright

    step_ms = int(cfg["step_timeout_seconds"]) * 1000
    edit_url = f"https://studio.youtube.com/video/{video_id(url)}/edit"
    with sync_playwright() as pw:
        ctx = _launch(pw, cfg, profile_dir, tz)
        ctx.set_default_timeout(step_ms)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        try:
            with _step(page, shots_dir, "open-edit"):
                page.goto(edit_url, wait_until="domcontentloaded")
                _check_signed_in(page)
                _first(page, SEL["title"], step_ms)
                page.wait_for_timeout(2000)
                _dismiss_interstitials(page)
            with _step(page, shots_dir, "thumbnail"):
                _set_thumbnail(page, image, step_ms)
            with _step(page, shots_dir, "save-edit"):
                save = page.locator("#save").locator("visible=true").first
                save.click()
                # Studio greys the Save button out again once the change is stored.
                for _ in range(30):
                    page.wait_for_timeout(1000)
                    if save.get_attribute("aria-disabled") == "true":
                        break
                else:
                    raise UploadError("Studio still shows unsaved changes 30 s after Save")
        finally:
            try:
                ctx.close()
            except Exception:  # noqa: BLE001
                pass


def set_details(url: str, title: str, description: str, *, cfg: dict, profile_dir: Path, tz: ZoneInfo,
                shots_dir: Path) -> None:
    """Replace an uploaded video's title and description in Studio and save."""
    from playwright.sync_api import sync_playwright

    step_ms = int(cfg["step_timeout_seconds"]) * 1000
    edit_url = f"https://studio.youtube.com/video/{video_id(url)}/edit"
    with sync_playwright() as pw:
        ctx = _launch(pw, cfg, profile_dir, tz)
        ctx.set_default_timeout(step_ms)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        try:
            with _step(page, shots_dir, "open-edit"):
                page.goto(edit_url, wait_until="domcontentloaded")
                _check_signed_in(page)
                title_box = _first(page, SEL["title"], step_ms)
                page.wait_for_timeout(2000)
                _dismiss_interstitials(page)
            with _step(page, shots_dir, "edit-text"):
                _set_text(page, title_box, title, multiline=False)
                _set_text(page, _first(page, SEL["description"], step_ms), description, multiline=True)
                title_box.click()  # closes the hashtag popup; Escape could close dialogs
                page.wait_for_timeout(500)
            with _step(page, shots_dir, "save-edit"):
                page.locator("#save").locator("visible=true").first.click()
                page.wait_for_timeout(4000)
                page.reload(wait_until="domcontentloaded")
                box = _first(page, SEL["description"], step_ms)
                page.wait_for_timeout(2000)
                norm = lambda s: [ln.strip() for ln in s.splitlines() if ln.strip()]  # noqa: E731
                if norm(box.inner_text()) != norm(description):
                    raise UploadError("Studio did not keep the new description")
        finally:
            try:
                ctx.close()
            except Exception:  # noqa: BLE001
                pass


def _open_draft(page, title: str, timeout_ms: int):
    """Open Studio's upload dialog for an existing draft (Shorts or Videos tab) and return its title box."""
    page.goto("https://studio.youtube.com", wait_until="domcontentloaded")
    page.wait_for_timeout(4000)
    _check_signed_in(page)
    m = re.search(r"/channel/([\w-]+)", page.url)
    if not m:
        raise UploadError("could not find the channel id in Studio")
    for tab in ("videos/short", "videos/upload"):
        page.goto(f"https://studio.youtube.com/channel/{m.group(1)}/{tab}", wait_until="domcontentloaded")
        page.wait_for_timeout(5000)
        _dismiss_interstitials(page)
        row = page.locator("ytcp-video-row", has_text=title).first
        if not row.count():
            continue
        row.hover()
        button = row.get_by_text("Edit draft", exact=False).first
        if not button.count():
            raise UploadError(f"'{title}' exists but is not a draft")
        button.click()
        return _first(page, SEL["title"], timeout_ms)
    raise UploadError(f"no draft titled {title!r} in Studio")


def upload(
    video: Path,
    meta: dict,
    *,
    cfg: dict,
    profile_dir: Path,
    tz: ZoneInfo,
    visibility: str,
    made_for_kids: bool,
    schedule_at: datetime | None,
    shots_dir: Path,
    thumbnail: Path | None = None,
    altered_content: bool = False,
    warnings: list[str] | None = None,
    draft_title: str | None = None,
) -> str:
    """Upload `video` and return its URL. With draft_title, finish that existing draft instead of uploading again.

    schedule_at: when set, the video is scheduled to go public at that moment (Studio's Schedule
    option). When None, `visibility` applies immediately ("private" makes a safe test draft).
    """
    from playwright.sync_api import sync_playwright

    step_ms = int(cfg["step_timeout_seconds"]) * 1000
    with sync_playwright() as pw:
        ctx = _launch(pw, cfg, profile_dir, tz)
        ctx.set_default_timeout(step_ms)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        try:
            if draft_title:
                with _step(page, shots_dir, "open-draft"):
                    title_box = _open_draft(page, draft_title, step_ms)
            else:
                with _step(page, shots_dir, "open-studio"):
                    page.goto(cfg["studio_url"], wait_until="domcontentloaded")
                    page.wait_for_load_state("load")
                    _check_signed_in(page)
                    file_input = _first(page, SEL["file_input"], step_ms, state="attached")
                    page.wait_for_timeout(1500)
                    _dismiss_interstitials(page)

                with _step(page, shots_dir, "select-file"):
                    file_input.set_input_files(str(video))
                    title_box = _first(page, SEL["title"], step_ms)

            with _step(page, shots_dir, "title"):
                # Studio pre-fills the file name; wait for that so our text is not overwritten.
                page.wait_for_timeout(1500)
                _set_text(page, title_box, meta["title"], multiline=False)
                got = title_box.inner_text().strip()
                if got != meta["title"].strip():
                    raise UploadError(f"title did not stick (got {got!r})")

            with _step(page, shots_dir, "description"):
                desc_box = _first(page, SEL["description"], step_ms)
                _set_text(page, desc_box, meta["description"], multiline=True)
                # Close the hashtag suggestion popup by focusing the title box. Never press Escape here:
                # in the upload dialog, Escape closes the whole dialog.
                title_box.click()
                page.wait_for_timeout(500)

            if thumbnail is not None and Path(thumbnail).exists():
                _soft(page, shots_dir, "thumbnail", warnings, lambda: _set_thumbnail(page, Path(thumbnail), step_ms))

            with _step(page, shots_dir, "audience"):
                _first(page, SEL["for_kids" if made_for_kids else "not_for_kids"], step_ms).click()

            if meta.get("tags") or altered_content:
                with _step(page, shots_dir, "show-more"):
                    _first(page, SEL["show_more"], step_ms).click()
                    page.wait_for_timeout(800)

            if meta.get("tags"):
                with _step(page, shots_dir, "tags"):
                    tags_input = _first(page, SEL["tags_input"], step_ms)
                    tags_input.click()
                    page.keyboard.insert_text(",".join(meta["tags"]) + ",")

            if altered_content:
                _soft(page, shots_dir, "altered-content disclosure", warnings,
                      lambda: _mark_altered_content(page, step_ms))

            with _step(page, shots_dir, "to-visibility"):
                visibility_sel = SEL["visibility_radio"].format(name="PUBLIC")
                for _ in range(3):
                    _first(page, SEL["next"], step_ms).click()
                    page.wait_for_timeout(800)
                page.locator(visibility_sel).first.wait_for(state="visible", timeout=step_ms)

            if schedule_at is not None:
                local = schedule_at.astimezone(tz)
                with _step(page, shots_dir, "schedule"):
                    _first(page, SEL["schedule_expand"], step_ms).click()
                    _first(page, SEL["date_trigger"], step_ms).click()
                    date_input = _first(page, SEL["date_input"], step_ms)
                    date_input.fill(_studio_date(local))
                    date_input.press("Enter")
                    time_input = _first(page, SEL["time_input"], step_ms)
                    time_input.fill(_studio_time(local))
                    time_input.press("Enter")
            else:
                with _step(page, shots_dir, "visibility"):
                    radio = SEL["visibility_radio"].format(name=visibility.upper())
                    page.locator(radio).first.click()

            with _step(page, shots_dir, "wait-upload"):
                status = _wait_upload_finished(page, float(cfg["upload_timeout_minutes"]) * 60)
                log.info("upload transferred: %s", status)

            with _step(page, shots_dir, "video-link"):
                link = _first(page, SEL["video_link"], step_ms)
                url = (link.get_attribute("href") or link.inner_text()).strip()
                if not url:
                    raise UploadError("Studio showed no video link")

            with _step(page, shots_dir, "save"):
                _first(page, SEL["done"], step_ms).click()
                # Studio then shows a "published/scheduled" or "still processing" dialog; close it.
                try:
                    _first(page, SEL["close_dialog"], 20_000).click()
                except UploadError:
                    pass
                page.wait_for_timeout(2000)

            log.info("uploaded %s -> %s", video.name, url)
            return url
        finally:
            try:
                ctx.close()
            except Exception:  # noqa: BLE001
                pass
