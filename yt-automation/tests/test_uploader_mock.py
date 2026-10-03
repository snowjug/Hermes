"""Drive the real uploader against tests/fixtures/mock_studio.html in headless Chrome.

Opt-in because it needs a browser: set YTAUTO_BROWSER_TESTS=1.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from ytauto import uploader

pytestmark = pytest.mark.skipif(os.environ.get("YTAUTO_BROWSER_TESTS") != "1", reason="set YTAUTO_BROWSER_TESTS=1")

MOCK = Path(__file__).parent / "fixtures" / "mock_studio.html"
IST = ZoneInfo("Asia/Kolkata")
META = {
    "title": "Automate YouTube uploads from your PC",
    "description": "Hook one. Hook two.\n\nChapters\n0:00 Intro\n0:20 Setup\n\n#Automation",
    "tags": ["youtube automation", "claude code"],
}


def run(tmp_path, **kw):
    cfg = {"studio_url": MOCK.as_uri(), "browser_channel": os.environ.get("YTAUTO_BROWSER_CHANNEL", "chrome"),
           "headless": True, "slow_mo_ms": 0, "step_timeout_seconds": 15, "upload_timeout_minutes": 1}
    video = tmp_path / "clip.mp4"
    video.write_bytes(b"\x00" * 100)
    url = uploader.upload(video, META, cfg=cfg, profile_dir=tmp_path / "profile", tz=IST,
                          shots_dir=tmp_path, **kw)
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        ctx = uploader._launch(pw, cfg, tmp_path / "profile", IST)
        page = ctx.new_page()
        page.goto(MOCK.as_uri())
        result = json.loads(page.evaluate("localStorage.getItem('mockStudioResult')"))
        ctx.close()
    return url, result


def test_scheduled_upload(tmp_path):
    when = datetime(2026, 9, 28, 18, 0, tzinfo=IST).astimezone(timezone.utc)
    thumb = tmp_path / "thumb.png"
    thumb.write_bytes(b"\x89PNG\r\n\x1a\n")
    warnings: list[str] = []
    url, r = run(tmp_path, visibility="public", made_for_kids=False, schedule_at=when, thumbnail=thumb,
                 altered_content=True, warnings=warnings)
    assert warnings == []
    assert r["thumbnail"] == "thumb.png" and r["altered"] is True
    assert url == "https://youtu.be/MOCK123"
    assert r["title"] == META["title"]
    assert [line for line in r["description"].split("\n") if line] == [l for l in META["description"].split("\n") if l]
    assert r["tags"] == "youtube automation,claude code,"
    assert r["kids"] == "VIDEO_MADE_FOR_KIDS_NOT_MFK"
    assert r["scheduled"] is True and r["date"] == "Sep 28, 2026" and r["time"] == "6:00 PM"


def test_private_draft(tmp_path):
    _, r = run(tmp_path, visibility="private", made_for_kids=True, schedule_at=None)
    assert r["visibility"] == "PRIVATE" and r["scheduled"] is False and r["kids"] == "VIDEO_MADE_FOR_KIDS_MFK"
