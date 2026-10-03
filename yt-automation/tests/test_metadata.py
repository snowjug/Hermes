from ytauto import metadata

CFG = {"default_tags": ["my channel"], "footer": "Subscribe: youtube.com/@me"}


def test_assemble_builds_description_and_enforces_limits():
    raw = {
        "title": "A <very> " + "long " * 40 + "title",
        "description": "Hook sentence one. Hook two.\n\nMore detail.",
        "tags": ["python", "Python", "automation, tools", "#yt"],
        "hashtags": ["Python", "#Automation", "YouTube", "Extra"],
        "chapters": [
            {"start_seconds": 0, "title": "Intro"},
            {"start_seconds": 45, "title": "Setup"},
            {"start_seconds": 200, "title": "Upload flow"},
        ],
    }
    meta = metadata.assemble(raw, {}, CFG, duration=600)
    assert len(meta["title"]) <= metadata.TITLE_MAX and "<" not in meta["title"]
    assert meta["tags"] == ["python", "automation tools", "yt", "my channel"]
    assert meta["hashtags"] == ["Python", "Automation", "YouTube"]
    assert "Chapters\n0:00 Intro\n0:45 Setup\n3:20 Upload flow" in meta["description"]
    assert meta["description"].endswith("Subscribe: youtube.com/@me\n\n#Python #Automation #YouTube")


def test_invalid_chapters_are_dropped():
    assert metadata.valid_chapters([{"start_seconds": 5, "title": "a"}, {"start_seconds": 30, "title": "b"},
                                    {"start_seconds": 60, "title": "c"}], 600) == []
    assert metadata.valid_chapters([{"start_seconds": 0, "title": "a"}, {"start_seconds": 4, "title": "b"},
                                    {"start_seconds": 60, "title": "c"}], 600) == []
    assert metadata.valid_chapters([{"start_seconds": 0, "title": "a"}], 600) == []


def test_hints_override_title_and_description_is_capped():
    raw = {"title": "AI title", "description": "x" * 10_000, "tags": [], "hashtags": [], "chapters": []}
    meta = metadata.assemble(raw, {"title": "My own title"}, {"footer": ""}, None)
    assert meta["title"] == "My own title"
    assert len(meta["description"].encode()) <= metadata.DESCRIPTION_MAX_BYTES


def test_prompt_mentions_missing_transcript():
    prompt = metadata.build_user_prompt("clip.mp4", {"notes": "unboxing"}, None)
    assert "No transcript is available" in prompt and "unboxing" in prompt
