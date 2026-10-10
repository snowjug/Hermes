"""Drive the real Reel poster against tests/fixtures/mock_instagram.html in headless Chrome.

Opt-in because it needs a browser: set YTAUTO_BROWSER_TESTS=1.
"""

import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from ytauto import instagram, uploader

pytestmark = pytest.mark.skipif(os.environ.get("YTAUTO_BROWSER_TESTS") != "1", reason="set YTAUTO_BROWSER_TESTS=1")

MOCK = Path(__file__).parent / "fixtures" / "mock_instagram.html"
IST = ZoneInfo("Asia/Kolkata")
CAPTION = "POV: the deck is due tomorrow\n\nA line that ends in a tag #PowerPoint\nLast words\n\n#PowerPoint #AI #reels"


def run(tmp_path, **kw):
    cfg = {"browser_channel": os.environ.get("YTAUTO_BROWSER_CHANNEL", "chrome"), "headless": True,
           "slow_mo_ms": 0, "step_timeout_seconds": 15}
    ig_cfg = {"base_url": MOCK.as_uri(), "username": None, "post_timeout_minutes": 1}
    video = tmp_path / "short.mp4"
    video.write_bytes(b"\x00" * 100)
    url = instagram.post_reel(video, CAPTION, cfg=cfg, ig_cfg=ig_cfg, profile_dir=tmp_path / "profile", tz=IST,
                              shots_dir=tmp_path, **kw)
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        ctx = uploader._launch(pw, cfg, tmp_path / "profile", IST)
        page = ctx.new_page()
        page.goto(MOCK.as_uri())
        raw = page.evaluate("localStorage.getItem('mockInstagramResult')")
        ctx.close()
    return url, json.loads(raw) if raw else None


def test_reel_is_shared(tmp_path):
    warnings: list[str] = []
    url, r = run(tmp_path, ai_label=True, warnings=warnings)
    assert r["shared"] is True and r["file"] == "short.mp4" and r["crop"] == "original" and r["ai"] is True
    assert "suggested" not in r["caption"]  # Enter after a hashtag must not pick a suggestion
    assert [l.strip() for l in r["caption"].split("\n") if l.strip()] == [l for l in CAPTION.split("\n") if l]
    assert url.startswith("file:") and warnings == ["the Reel's own link was not found; this is the profile link"]


def test_dry_run_stops_before_share(tmp_path):
    url, r = run(tmp_path, dry_run=True)
    assert url == "dry-run" and r is None and (tmp_path / "ig-dry-run.png").exists()
