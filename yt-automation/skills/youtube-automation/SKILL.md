---
name: youtube-automation
description: Queue, schedule, inspect and fix automated YouTube uploads made by the local `ytauto` pipeline (transcribe with Whisper, write title/description/tags with Claude Code, upload through YouTube Studio in Chrome). Use when the user wants to post or schedule a YouTube video, change a video's publish time, title or description before it goes out, check what is scheduled, or find out why an upload failed.
---

# YouTube automation (ytauto)

Project: `C:\Users\HP\Desktop\Hermes\yt-automation`
CLI: `C:\Users\HP\Desktop\Hermes\yt-automation\.venv\Scripts\ytauto.exe` (below: `ytauto`)
Config: `config.yaml` in the project. Logs: `logs\ytauto.log`. One folder per job under `work\<job-id>\`.

## How it runs

A Hermes cron job (`ytauto-tick`, no-agent) runs `ytauto tick` every 10 minutes. Each tick:
1. moves new videos from `inbox\` into `work\<id>\` and gives each the next free publish slot,
2. transcribes (`transcript.json`, `captions.srt`) and asks `claude -p` for metadata (`metadata.json`),
3. uploads at most one due video through YouTube Studio. In `youtube_schedule` mode it uploads up to
   48 h early and uses Studio's Schedule option, so the PC can be off at publish time.

## Common requests

| User wants | Do |
|---|---|
| Post a video | `ytauto add "<path>" [--at "YYYY-MM-DD HH:MM"] [--notes "what it is about"]`, or copy it into `inbox\` |
| See the queue | `ytauto status` (`--all` includes finished ones) |
| See or change the text | `ytauto show <id>`, then edit `work\<id>\metadata.json` directly; the upload re-reads it |
| Rewrite the text | `ytauto describe <id>` |
| Change the time | `ytauto reschedule <id> "YYYY-MM-DD HH:MM"` (times are in `timezone` from config.yaml) |
| Hold or approve | set `publish.require_approval: true`; then `ytauto approve <id>` |
| Upload right now | `ytauto upload <id>`; `--draft` uploads as private for a safe test |
| Make an uploaded video public now | `ytauto publish <id>` (works on private, unlisted or scheduled uploads) |
| Fix title/description after upload | edit `work\<id>\metadata.json`, then `ytauto update-details <id>` |
| Add or replace a thumbnail after upload | `ytauto set-thumbnail <id> [--image file.jpg]` |
| Stop one | `ytauto cancel <id>` |

A sidecar file next to a video in `inbox\` (same name, `.yaml`) sets per-video options:

```yaml
publish_at: "2026-10-05 18:00"
notes: "Unboxing the new mic; compare it with last year's model"
title: "Optional fixed title"
tags: [microphone, review]
visibility: public   # public | unlisted | private
made_for_kids: false
```

Job ids accept the short random suffix (`cb9d4d` for `20260927-cb9d4d`).

`ytauto add` also takes finished material from other tools: `--metadata metadata.json` (skips
transcription and describing), `--thumbnail thumb.jpg`, `--altered-content` (answers YouTube's
"altered or synthetic content" question with Yes, needed for realistic AI narration), and `--hold`.

## The daily tech-tool channel (tech-daily)

Project: `C:\Users\HP\Desktop\Hermes\tech-daily`. CLI: `tech-daily\.venv\Scripts\python.exe -m techdaily`.
A Hermes cron job (`techdaily-run`) starts it every morning at 09:00 and makes TWO videos on two different
trending tools, hosted by Bit (an animated stickman): a vertical Short (published 13:00) and a 90-second
16:9 video (published 18:00). Each: research -> fact-checked beat-sheet script -> Kokoro voice with word
timings -> compiled HyperFrames scenes -> render -> visual check -> `ytauto add`.

| User wants | Do |
|---|---|
| What was made / is coming | `python -m techdaily status` and `ytauto status` |
| Make today's video now | `python -m techdaily run` (resumes where a failed run stopped) |
| Make only one format | `python -m techdaily run --only short` (or `main`) |
| Review before publishing | set `review.hold_for_approval: true` in tech-daily `config.yaml` |

A failed fact-check always holds the video (`ytauto approve <id>` after checking `factcheck.json`).
Episode files live in `tech-daily\episodes\<date>\` (plan, sources, factcheck, metadata, final.mp4).

## When something fails

- `ytauto status` shows `last_error`. `ytauto show <id>` shows the full history.
- `NEEDS_LOGIN` file in the project, or "uploads paused": the Chrome profile is signed out or Google
  wants verification. Only the user can fix this: they run `ytauto login`, sign in by hand, close the
  window. Never type or ask for their password.
- A failed Studio step saves `work\<id>\failed-<step>.png`. Look at it. If Studio's layout changed,
  fix the matching entry in `SEL` in `ytauto\uploader.py`, then `ytauto retry <id>`.
- "previous upload was interrupted": check YouTube Studio for a leftover draft, have the user delete
  it, then `ytauto retry <id>`, so the channel does not get a duplicate.
- Hermes not firing: `hermes cron status` must say the gateway is running (`hermes gateway install`).

## Rules

- Do not publish or change visibility of something the user did not ask for. Prefer `--draft` for tests.
- Do not edit `state.db` by hand; use the CLI.
- Metadata must stay truthful to the video; if the user gives notes, pass them with `--notes`.
