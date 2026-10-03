"""One episode, one folder: episodes/<date>-<slug>/. Each step records itself in state.json so a crashed
or interrupted run resumes where it stopped instead of starting over.

    collect -> pick -> research -> scaffold -> build -> finish -> queue
"""

from __future__ import annotations

import json
import logging
import os
import re
import shutil
import subprocess
from datetime import date, datetime, timedelta
from pathlib import Path

from . import music, plan as plan_mod
from .claude import ask_json, run_agent
from .config import Config, tool
from .sources import collect

log = logging.getLogger(__name__)

STEPS = ["collect", "pick", "research", "scaffold", "build", "finish", "queue"]
AGENT_TOOLS = ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "Agent", "Task", "TodoWrite", "Skill"]


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:48] or "episode"


class Episode:
    def __init__(self, cfg: Config, folder: Path):
        self.cfg = cfg
        self.dir = folder
        self.dir.mkdir(parents=True, exist_ok=True)

    # ---- state -------------------------------------------------------------------------------

    @property
    def state_path(self) -> Path:
        return self.dir / "state.json"

    @property
    def state(self) -> dict:
        return json.loads(self.state_path.read_text(encoding="utf-8")) if self.state_path.exists() else {}

    def mark(self, step: str, **info) -> None:
        state = self.state
        state[step] = {"done_at": datetime.now().isoformat(timespec="seconds"), **info}
        self.state_path.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")

    def done(self, step: str) -> bool:
        return step in self.state

    def read_json(self, name: str):
        return json.loads((self.dir / name).read_text(encoding="utf-8"))

    def write_json(self, name: str, data) -> None:
        (self.dir / name).write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    @property
    def video_dir(self) -> Path:
        return self.dir / "video"

    # ---- steps -------------------------------------------------------------------------------

    def step_collect(self) -> None:
        candidates, status = collect(self.cfg["sources"])
        self.write_json("candidates.json", [c.to_dict() for c in candidates])
        self.mark("collect", candidates=len(candidates), sources=status)

    def step_pick(self) -> None:
        from .sources import Candidate

        candidates = [Candidate(**c) for c in self.read_json("candidates.json")]
        history = plan_mod.load_history(self.cfg.root)
        chosen = plan_mod.pick_topic(self.cfg, candidates, history, self.dir)
        self.write_json("plan.json", chosen)
        self.mark("pick", tool=chosen["tool_name"], preset=chosen["style_preset"], voice=chosen["voice"])

    def step_research(self) -> None:
        chosen = self.read_json("plan.json")
        sources = plan_mod.research(chosen, self.dir)
        self.mark("research", sources=len(sources))

    def step_scaffold(self) -> None:
        chosen = self.read_json("plan.json")
        sources = self.read_json("sources.json")
        if not (self.video_dir / "hyperframes.json").exists():
            if self.video_dir.exists() and any(self.video_dir.iterdir()):
                raise RuntimeError(f"{self.video_dir} is not empty and has no hyperframes.json")
            self._npx(["hyperframes", "init", str(self.video_dir), "--non-interactive", "--example=blank",
                       "--skill=faceless-explainer"], cwd=self.cfg.root)
        (self.video_dir / "BRIEF.md").write_text(self.brief(chosen), encoding="utf-8")
        extracted = self.video_dir / "capture" / "extracted"
        extracted.mkdir(parents=True, exist_ok=True)
        (extracted / "visible-text.txt").write_text(plan_mod.sources_as_text(chosen, sources), encoding="utf-8")
        (extracted / "tokens.json").write_text(json.dumps(
            {"title": chosen["topic_title"], "description": chosen["message"], "colors": [], "fonts": []},
            indent=2), encoding="utf-8")
        self.mark("scaffold")

    def brief(self, p: dict) -> str:
        channel = self.cfg["channel"]
        return f"""---
workflow: faceless-explainer
flow: automation
storyboard: no
message: {json.dumps(p['message'])}
destination: youtube
aspect: 1920x1080
language: en
audience: {json.dumps(channel['audience'])}
length: {p['target_seconds']}s
angle: {p['structure']}
narration: yes
voice: {p['voice']}
style_preset: {p['style_preset']}
---

## Intent

Today's episode of a daily channel: "{channel['promise']}" This one covers **{p['tool_name']}** ({p['category']}).
Angle: {p['angle']}
Why now: {p['why_now']}
Narration tone: {p['tone']}. Sound like a knowledgeable friend, not an announcer.

## Customizations

- Burned-in captions using the preset's caption skin.
- Tasteful motion: kinetic type for the hook, a clear diagram for how it works, count-ups only for numbers that
  appear in the sources.
- No background music inside the project (`music: none`): an original music bed is mixed in after render.
- Sound effects only from the bundled local SFX set, used sparingly on key reveals.

## Notes

- Every factual claim must come from capture/extracted/visible-text.txt. No invented numbers, prices,
  benchmarks, dates, quotes or features. Community discussion is opinion and must be framed as such.
- Structure: hook with the concrete benefit (first 5 s) -> what it is -> how it works or how to start ->
  who it is for -> one honest limitation -> verdict -> one-line sign-off inviting viewers back tomorrow.
- Advertiser-friendly. No clickbait, no fake urgency, no "smash the like button".
- No logos except the tool's own. No real people's likeness.
"""

    def build_prompt(self, p: dict) -> str:
        rel = self.video_dir.relative_to(self.cfg.root).as_posix()
        return f"""You are producing today's episode of a YouTube channel, running unattended on a schedule.
Nobody will answer questions: never ask; decide, and state each decision in one line.

This is ONE non-interactive session. The moment you end your turn, the run is over and the episode fails.
Never end your turn to wait for something. To wait for a background job (audio, render), block inside a
Bash call, for example `for i in $(seq 1 55); do [ -f audio_meta.json ] && break; sleep 10; done`, and repeat
such calls until it is done. Kokoro narration on this PC can take 20-40 minutes; that is normal. Keep
waiting. Only end your turn once renders/video.mp4 and thumbnail.html exist, or on an unrecoverable error.

If the project already holds work from an earlier attempt (STORYBOARD.md, SCRIPT.md, audio files,
compositions/), resume from where it stopped instead of redoing finished steps. If an audio job is still
running (audio.log growing, assets/voice/ filling, no audio_meta.json yet), wait for it; do not start a
second one.

The HyperFrames project is `{rel}` (relative to the current directory). It is already initialised and
BRIEF.md, capture/extracted/visible-text.txt and capture/extracted/tokens.json are written and confirmed.

Run the /faceless-explainer workflow from Step 1's gate onward, with `{rel}` as <PROJECT_ROOT>.
Mode is autonomous (flow: automation, storyboard: no). Do not re-run init. Do not run
`npx hyperframes skills update` or any other skills update: the installed skills are pinned.

Fixed decisions:
- HeyGen is not signed in. Continue offline: narration with the local Kokoro voice `{p['voice']}`
  (pass `--voice {p['voice']}` to audio.mjs).
- Put `music: none` in STORYBOARD.md frontmatter: a music bed is mixed in after the render.
- Style preset: `{p['style_preset']}`.
- When the workflow reaches "preview first, or render?", the answer is: render now. Skip `preview`.
- Final render: `npx hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4`
  run from <PROJECT_ROOT>.
- If a check fails, fix the frame HTML and rerun that check. Do not give up on the first error.
- Every frame worker must style its root with a plain `#root { ... }` and plain descendant selectors.
  Never `#root[data-composition-id=...]` or a class on the root: at render the scene comes out unstyled
  (tiny default text in the top-left corner) even though lint passes. Check each returned frame for this.
- After rendering, extract one still per frame from renders/video.mp4 with ffmpeg (at ~60% of each
  frame's time range), Read them, and fix + re-render any frame that looks unstyled, blank or broken.

Editorial rules (this channel must stay eligible for YouTube monetization, so each video needs real value):
- Every factual claim in SCRIPT.md comes from visible-text.txt. No invented numbers, benchmarks, prices,
  dates, quotes or features. Present community comments as opinion ("developers on Hacker News say ...").
- Cover: what it is, who it is for, how it works or how to start, one honest limitation, a clear verdict.
- Target about {p['target_seconds']} seconds of narration (within 20%).

After the render succeeds, write `{rel}/thumbnail.html`: a static 1280x720 YouTube thumbnail in the same
palette and display font as frame.md. Two to five huge words (not the whole title), the tool name, one bold
graphic element, high contrast, readable when small. Self-contained HTML (Google Fonts links allowed).

End your final message with exactly one line:
RESULT {{"video": "{rel}/renders/video.mp4", "script": "{rel}/SCRIPT.md", "thumbnail": "{rel}/thumbnail.html"}}
"""

    def _agent(self, prompt: str, label: str) -> dict:
        claude_cfg = self.cfg["claude"]
        env = self.cfg.env()
        # Renders and Kokoro narration run far longer than Claude Code's 2-minute default Bash timeout.
        env["BASH_DEFAULT_TIMEOUT_MS"] = str(30 * 60 * 1000)
        env["BASH_MAX_TIMEOUT_MS"] = str(120 * 60 * 1000)
        attempt = len(list((self.dir / "logs").glob(f"{label}-transcript*.jsonl"))) + 1
        return run_agent(
            prompt, cwd=self.cfg.root, model=claude_cfg["build_model"],
            budget_usd=float(claude_cfg["build_budget_usd"]), timeout_min=float(claude_cfg["build_timeout_minutes"]),
            transcript=self.dir / "logs" / f"{label}-transcript-{attempt}.jsonl", allowed_tools=AGENT_TOOLS, env=env,
        )

    def step_build(self) -> None:
        result = self._agent(self.build_prompt(self.read_json("plan.json")), "build")
        video = self.video_dir / "renders" / "video.mp4"
        if not video.exists():
            raise RuntimeError(f"agent finished but {video} is missing; see logs/build-transcript.jsonl")
        self.mark("build", cost_usd=result.get("total_cost_usd"), turns=result.get("num_turns"),
                  minutes=round((result.get("duration_ms") or 0) / 60000, 1))

    def revise_prompt(self, p: dict, factcheck: dict, visual: dict) -> str:
        rel = self.video_dir.relative_to(self.cfg.root).as_posix()
        facts = "\n".join(f"- {c['claim']}\n  Problem: {c['problem']}" for c in factcheck["unsupported_claims"])
        looks = "\n".join(f"- {i['still']}: {i['problem']}" for i in visual["issues"])
        return f"""You are revising today's episode video after automated QA failed. Running unattended in ONE
non-interactive session: never ask questions, never end your turn to wait (block inside Bash loops
instead), and end your turn only when the fixed renders/video.mp4 exists or on an unrecoverable error.

The HyperFrames project is `{rel}` (faceless-explainer workflow, already fully built and rendered once).
Use the installed /faceless-explainer, /hyperframes-core and /media-use skills for how things work. Do not
run any `skills update` and do not re-init.

FACT-CHECK FAILURES (narration claims the sources in capture/extracted/visible-text.txt do not support):
{facts or "- none"}

VISUAL FAILURES (stills from the final render, in qa/stills of the episode folder, one per frame in order):
{looks or "- none"}

Fix every item:
1. Facts: rewrite only the affected SCRIPT.md lines so every claim is supported by the sources (rephrase,
   soften or cut; do not add new unsupported claims). Mirror the change in STORYBOARD.md (voiceover and any
   on-screen text) and in the affected frame HTML.
2. Narration: regenerate audio only for changed lines, with the same Kokoro voice `{p['voice']}`, so the
   unchanged lines keep their files. Then run the workflow's duration sync and rebuild captions so timings
   match the new audio, and re-assemble index.html.
3. Visuals: fix the named frames (style roots with plain `#root`; no empty placeholder cards; every text
   animation must finish before its frame ends).
4. Run `npx hyperframes lint` and `npx hyperframes check`, then re-render with
   `npx hyperframes render --skill=faceless-explainer --quality high --output renders/video.mp4`.
5. Extract one still per frame from the new render with ffmpeg, Read them, and fix anything still broken.

End with one line: RESULT {{"video": "{rel}/renders/video.mp4"}}
"""

    def step_finish(self) -> None:
        chosen = self.read_json("plan.json")
        sources = self.read_json("sources.json")
        render = self.video_dir / "renders" / "video.mp4"
        video_cfg = self.cfg["video"]
        max_revisions = int(self.cfg["claude"].get("max_revisions", 2))
        for revision in range(max_revisions + 1):
            info = probe(render, self.cfg.env())
            duration = info["duration"]
            if not info["has_audio"]:
                raise RuntimeError("rendered video has no audio track")
            if not (video_cfg["min_seconds"] * 0.6 <= duration <= video_cfg["max_seconds"] * 1.5):
                raise RuntimeError(f"rendered video is {duration:.0f}s, outside the expected range")

            script = narration_text(self.video_dir / "SCRIPT.md")
            check = self.fact_check(script, sources)
            self.write_json("factcheck.json", check)
            chapters = self.chapters(duration)
            visual = self.visual_check(render, chapters, duration)
            self.write_json("visualcheck.json", visual)
            if check["verdict"] == "pass" and visual["verdict"] == "pass":
                break
            if revision == max_revisions:
                log.warning("QA still failing after %d revisions; the upload will be held", max_revisions)
                break
            log.info("QA failed (facts %s, visuals %s); revision %d", check["verdict"], visual["verdict"], revision + 1)
            self._agent(self.revise_prompt(chosen, check, visual), "revise")

        # The description is public text too: fact-check it, rewrite once with the problems, else hold.
        problems: list[dict] = []
        for _ in range(2):
            meta = self.metadata(chosen, script, sources, chapters, problems=problems)
            meta_check = self.fact_check(description_prose(meta), sources)
            problems = meta_check["unsupported_claims"]
            if meta_check["verdict"] == "pass":
                break
        self.write_json("metadata.json", meta)
        self.write_json("metadatacheck.json", meta_check)

        thumb = self.thumbnail()
        music_path = music.write_music(self.dir / "music.wav", chosen["music_mood"], duration + 1, seed=self.dir.name)
        music.mix_under_voice(render, music_path, self.dir / "final.mp4",
                              music_db=float(video_cfg.get("music_volume_db", -22)), env=self.cfg.env())
        self.mark("finish", duration_s=round(duration, 1), factcheck=check["verdict"],
                  unsupported=len(check["unsupported_claims"]), visual=visual["verdict"],
                  thumbnail=bool(thumb), title=meta["title"])

    def visual_check(self, render: Path, chapters: list[dict], duration: float) -> dict:
        """Look at a still from the middle of every scene of the final render, the way a viewer would."""
        env = self.cfg.env()
        starts = [c["start_seconds"] for c in chapters] or list(range(0, int(duration), 20))
        ends = starts[1:] + [duration]
        stills_dir = self.dir / "qa" / "stills"
        if stills_dir.exists():
            shutil.rmtree(stills_dir)  # stills from an earlier render would be mistaken for this one's
        stills_dir.mkdir(parents=True)
        stills = []
        for i, (a, b) in enumerate(zip(starts, ends), 1):
            t = a + (b - a) * 0.6  # past each scene's entrance animation
            out = stills_dir / f"{i:02}-at-{t:.0f}s.png"
            subprocess.run([tool(env, "ffmpeg"), "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(render),
                            "-frames:v", "1", "-vf", "scale=960:-1", str(out)], check=True, env=env)
            stills.append(out)
        schema = {
            "type": "object",
            "properties": {
                "verdict": {"type": "string", "enum": ["pass", "fail"]},
                "issues": {"type": "array", "items": {"type": "object", "properties": {
                    "still": {"type": "string"}, "problem": {"type": "string"}}, "required": ["still", "problem"]}},
            },
            "required": ["verdict", "issues"],
        }
        system = ("You are the last visual check before a motion-graphics video is published on YouTube. Use Read "
                  "to open every listed still. Fail the video if any still shows: unstyled or tiny default-font "
                  "text, text crammed into a corner, a blank or nearly blank frame where content is expected, "
                  "clipped or overflowing text, overlapping unreadable elements, broken layout, or placeholder text. "
                  "Minimal, intentional designs with lots of whitespace are fine. Be concrete in each problem.")
        prompt = "Stills (one per scene, in order):\n" + "\n".join(str(p) for p in stills)
        return ask_json(prompt, schema, system=system, model=self.cfg["claude"]["metadata_model"], cwd=self.dir,
                        budget_usd=1.5, tools=["Read"])

    def fact_check(self, script: str, sources: list[dict]) -> dict:
        schema = {
            "type": "object",
            "properties": {
                "verdict": {"type": "string", "enum": ["pass", "fail"]},
                "unsupported_claims": {"type": "array", "items": {
                    "type": "object",
                    "properties": {"claim": {"type": "string"}, "problem": {"type": "string"}},
                    "required": ["claim", "problem"]}},
            },
            "required": ["verdict", "unsupported_claims"],
        }
        system = ("You fact-check a video narration against its sources. List every factual claim (numbers, "
                  "features, names, dates, comparisons, attributions) that the sources do not support or that "
                  "misstates them. Opinions framed as opinions, the verdict, and the sign-off are not claims. "
                  "verdict is fail when any unsupported claim exists.")
        prompt = "NARRATION:\n" + script + "\n\nSOURCES:\n" + "\n\n".join(
            f"[{s['id']}] {s['url']}\n{s['text']}" for s in sources)
        return ask_json(prompt, schema, system=system, model=self.cfg["claude"]["metadata_model"], cwd=self.dir,
                        budget_usd=1.5)

    def chapters(self, duration: float) -> list[dict]:
        """Chapter starts from the synced storyboard durations (real voice timings)."""
        text = (self.video_dir / "STORYBOARD.md").read_text(encoding="utf-8")
        frames = re.findall(r"^##+\s*Frame\s+(\d+)[^\n]*?(?:[—:-]\s*(.+))?$", text, re.M)
        durations = [float(d) for d in re.findall(r"^\s*-?\s*duration:\s*([\d.]+)", text, re.M)]
        if durations and len(durations) == len(frames) + 1:
            durations = durations[1:]  # first match is the frontmatter total
        if len(frames) < 3 or len(durations) != len(frames):
            return []
        out, t = [], 0.0
        for (num, title), d in zip(frames, durations):
            out.append({"start_seconds": round(t), "title": (title or f"Part {num}").strip(" *")})
            t += d
        return out if t <= duration + 5 else []

    def metadata(self, p: dict, script: str, sources: list[dict], chapters: list[dict],
                 problems: list[dict] | None = None) -> dict:
        schema = {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "hook": {"type": "string", "description": "two sentences shown above the fold"},
                "summary": {"type": "string", "description": "one or two short paragraphs"},
                "chapter_titles": {"type": "array", "items": {"type": "string"}},
                "tags": {"type": "array", "items": {"type": "string"}, "maxItems": 15},
                "hashtags": {"type": "array", "items": {"type": "string"}, "maxItems": 3},
            },
            "required": ["title", "hook", "summary", "chapter_titles", "tags", "hashtags"],
        }
        system = ("You write YouTube metadata for a daily tech-tool channel. Title: specific, honest, under 70 "
                  "characters, names the tool, no clickbait, no ALL CAPS, no emojis. Hook and summary: plain, "
                  "factual, only what the narration says, with the same relationships it states: never describe "
                  "another project as built on, spawned by or copying the tool unless the narration says exactly "
                  "that, and never swap one named project for another. chapter_titles: one short, neutral title "
                  "(2-5 words) per chapter given, same order; no pejoratives. Tags: search phrases, most specific "
                  "first. Hashtags without '#'. No angle brackets anywhere.")
        prompt = (f"Tool: {p['tool_name']}\nMessage: {p['message']}\n\nChapters (current names):\n"
                  + "\n".join(f"- {c['title']}" for c in chapters) + f"\n\nNARRATION:\n{script}")
        if problems:
            prompt += ("\n\nA fact-check rejected your previous description. Fix these:\n"
                       + "\n".join(f"- {c['claim']}: {c['problem']}" for c in problems))
        raw = ask_json(prompt, schema, system=system, model=self.cfg["claude"]["metadata_model"], cwd=self.dir,
                       budget_usd=1.0)
        if len(raw["chapter_titles"]) == len(chapters):
            chapters = [{**c, "title": t} for c, t in zip(chapters, raw["chapter_titles"])]
        parts = [raw["hook"].strip(), raw["summary"].strip()]
        if len(chapters) >= 3:
            parts.append("Chapters\n" + "\n".join(f"{_mmss(c['start_seconds'])} {c['title']}" for c in chapters))
        parts.append("Sources\n" + "\n".join(f"- {s['url']}" for s in sources))
        parts.append("Narrated with an AI voice. The script is written with AI assistance from the sources above "
                     "and fact-checked against them before publishing.")
        tags = [h.lstrip("#") for h in raw["hashtags"]][:3]
        if tags:
            parts.append(" ".join(f"#{re.sub(r'[^0-9A-Za-z]', '', h)}" for h in tags))
        return {"title": raw["title"].strip(), "description": "\n\n".join(parts), "tags": raw["tags"],
                "chapters": chapters}

    def thumbnail(self) -> Path | None:
        html = self.video_dir / "thumbnail.html"
        if not html.exists():
            log.warning("no thumbnail.html; YouTube will pick a frame")
            return None
        from playwright.sync_api import sync_playwright

        out = self.dir / "thumbnail.jpg"
        with sync_playwright() as pw:
            browser = pw.chromium.launch(channel="chrome", headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.goto(html.resolve().as_uri(), wait_until="networkidle")
            page.wait_for_timeout(1500)  # web fonts
            page.screenshot(path=str(out), type="jpeg", quality=90)
            browser.close()
        return out

    def step_queue(self) -> None:
        check = self.read_json("factcheck.json")
        visual_path = self.dir / "visualcheck.json"
        visual_ok = not visual_path.exists() or self.read_json("visualcheck.json")["verdict"] == "pass"
        meta_path = self.dir / "metadatacheck.json"
        meta_ok = not meta_path.exists() or self.read_json("metadatacheck.json")["verdict"] == "pass"
        hold = (bool(self.cfg["review"].get("hold_for_approval")) or check["verdict"] != "pass" or not visual_ok
                or not meta_ok)
        argv = [str(self.cfg.ytauto_exe), "add", str(self.dir / "final.mp4"), "--metadata", str(self.dir / "metadata.json")]
        thumb = self.dir / "thumbnail.jpg"
        if thumb.exists():
            argv += ["--thumbnail", str(thumb)]
        if self.cfg["ytauto"].get("altered_content", True):
            argv.append("--altered-content")
        if hold:
            argv.append("--hold")
        # Publish the same day at publish_time. When the build ran late, publish this evening anyway
        # (about 40 minutes out, on a quarter hour) so it does not collide with tomorrow's episode.
        publish_time = self.cfg["video"].get("publish_time")
        if publish_time:
            hh, mm = (int(x) for x in publish_time.split(":"))
            now = datetime.now(self.cfg.tz)
            slot = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
            if (slot - now).total_seconds() < 45 * 60:
                late = now + timedelta(minutes=40)
                slot = late.replace(minute=(late.minute // 15 + 1) * 15 % 60, second=0, microsecond=0)
                if late.minute >= 45:
                    slot += timedelta(hours=1)
            argv += ["--at", slot.strftime("%Y-%m-%d %H:%M")]
        proc = subprocess.run(argv, capture_output=True, text=True, encoding="utf-8", timeout=600)
        if proc.returncode != 0:
            raise RuntimeError(f"ytauto add failed: {(proc.stderr or proc.stdout)[-600:]}")
        job_id = proc.stdout.split(":", 1)[0].strip()
        chosen = self.read_json("plan.json")
        history = [h for h in plan_mod.load_history(self.cfg.root) if h.get("date") != self.dir.name]
        history.append({"date": self.dir.name, "tool_name": chosen["tool_name"], "style_preset": chosen["style_preset"],
                        "voice": chosen["voice"], "structure": chosen["structure"], "ytauto_job": job_id,
                        "title": self.read_json("metadata.json")["title"]})
        plan_mod.save_history(self.cfg.root, history)
        self.mark("queue", ytauto_job=job_id, held=hold, ytauto=proc.stdout.strip())

    # ---- helpers -----------------------------------------------------------------------------

    def _npx(self, args: list[str], cwd: Path) -> str:
        proc = subprocess.run(["npx.cmd" if os.name == "nt" else "npx", "-y", *args], cwd=str(cwd),
                              env=self.cfg.env(), capture_output=True, text=True, encoding="utf-8", timeout=900)
        if proc.returncode != 0:
            raise RuntimeError(f"npx {' '.join(args[:2])} failed: {(proc.stderr or proc.stdout)[-800:]}")
        return proc.stdout


def _mmss(seconds: float) -> str:
    seconds = int(seconds)
    return f"{seconds // 60}:{seconds % 60:02}"


def probe(video: Path, env: dict) -> dict:
    proc = subprocess.run([tool(env, "ffprobe"), "-v", "error", "-show_entries", "format=duration:stream=codec_type",
                           "-of", "json", str(video)], capture_output=True, text=True, env=env, check=True)
    data = json.loads(proc.stdout)
    return {"duration": float(data["format"]["duration"]),
            "has_audio": any(s.get("codec_type") == "audio" for s in data.get("streams", []))}


def description_prose(meta: dict) -> str:
    """The claims-bearing part of a description: everything before the Sources list, plus the title."""
    body = meta["description"].split("\n\nSources\n", 1)[0]
    return f"TITLE: {meta['title']}\n\n{body}"


def narration_text(script_md: Path) -> str:
    """The spoken lines of SCRIPT.md (indented blocks), without headings and delivery notes."""
    lines = script_md.read_text(encoding="utf-8").splitlines()
    spoken = [ln.strip() for ln in lines if ln.startswith("    ") and ln.strip()]
    return "\n".join(spoken) if spoken else script_md.read_text(encoding="utf-8")


def episode_for(cfg: Config, day: date | None = None) -> Episode:
    """One episode folder per day: episodes/YYYY-MM-DD."""
    return Episode(cfg, cfg.episodes_dir / (day or datetime.now(cfg.tz).date()).isoformat())
