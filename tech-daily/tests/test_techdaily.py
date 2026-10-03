import json

import numpy as np
import pytest

from techdaily import episode as episode_mod
from techdaily import music, plan
from techdaily.config import load_config

STORYBOARD = """---
format: 1920x1080
duration: 60s
music: none
---

## Video direction

- stuff

## Frame 1 — Hook

- voiceover: "a"
- duration: 12.5s

## Frame 2 — How it works

- duration: 30s

## Frame 3 — Verdict

- duration: 17.5s
"""

SCRIPT = """# SCRIPT

## Line 1 — Hook (Frame 1)

**Delivery:** wry

    First spoken line.

## Line 2 — Body (Frame 2)

    Second spoken line.
"""


@pytest.fixture
def ep(tmp_path, monkeypatch):
    cfg = load_config()
    e = episode_mod.Episode(cfg, tmp_path / "2026-01-01")
    e.video_dir.mkdir(parents=True)
    (e.video_dir / "STORYBOARD.md").write_text(STORYBOARD, encoding="utf-8")
    (e.video_dir / "SCRIPT.md").write_text(SCRIPT, encoding="utf-8")
    return e


def test_chapters_follow_storyboard_durations(ep):
    assert ep.chapters(60.0) == [
        {"start_seconds": 0, "title": "Hook"},
        {"start_seconds": 12, "title": "How it works"},  # 12.5 rounds to even
        {"start_seconds": 42, "title": "Verdict"},
    ]
    assert ep.chapters(20.0) == []  # storyboard longer than the render: timings are stale


def test_narration_text_keeps_only_spoken_lines(ep):
    assert episode_mod.narration_text(ep.video_dir / "SCRIPT.md") == "First spoken line.\nSecond spoken line."


def test_metadata_description_layout(ep, monkeypatch):
    def fake_ask(prompt, schema, **kw):
        return {"title": "Laya answers in one pass", "hook": "Hook one. Hook two.", "summary": "Summary.",
                "chapter_titles": ["Why", "How", "Verdict"], "tags": ["laya"], "hashtags": ["#AI", "Dev Tools"]}

    monkeypatch.setattr(episode_mod, "ask_json", fake_ask)
    meta = ep.metadata({"tool_name": "laya", "message": "m"}, "script", [{"url": "https://a"}, {"url": "https://b"}],
                       ep.chapters(60.0))
    d = meta["description"]
    assert d.startswith("Hook one. Hook two.\n\nSummary.\n\nChapters\n0:00 Why\n0:12 How\n0:42 Verdict")
    assert "Sources\n- https://a\n- https://b" in d
    assert "Narrated with an AI voice" in d
    assert d.endswith("#AI #DevTools")


def test_music_is_seeded_and_bounded():
    a = music.compose("lofi", 3.0, "seed-1")
    b = music.compose("lofi", 3.0, "seed-1")
    c = music.compose("lofi", 3.0, "seed-2")
    assert a.shape == (3 * music.SR, 2) and np.array_equal(a, b) and not np.array_equal(a, c)
    assert np.max(np.abs(a)) <= 0.81 and not np.isnan(a).any()


def test_research_drops_sources_that_never_name_the_tool(tmp_path, monkeypatch):
    pages = {"https://tool.dev": "Laya is great " * 30, "https://other.dev": "Unrelated project " * 30,
             "https://news.dev": "People compare Laya with others " * 10}
    monkeypatch.setattr(plan, "fetch_text", lambda client, url: pages[url])
    p = {"tool_name": "Laya", "primary_url": "https://tool.dev", "supporting_urls": ["https://other.dev", "https://news.dev"],
         "candidates_used": []}
    sources = plan.research(p, tmp_path)
    assert [s["url"] for s in sources] == ["https://tool.dev", "https://news.dev"]
    assert [s["id"] for s in sources] == ["S1", "S2"]
    assert json.loads((tmp_path / "sources.json").read_text())[1]["id"] == "S2"
