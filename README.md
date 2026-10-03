# Hermes: a YouTube channel run from a laptop

Code behind the Tool Man channel: one new developer tool explained per video, rendered, voiced and uploaded from a Windows laptop.

| Folder | What it is |
|---|---|
| [`Motion_as_kit/`](Motion_as_kit/) | Motion graphics as code: TypeScript + WebGL plates driven by the voiceover's word timings. Made the 3 Oct 2026 video on [magpie](https://github.com/yetone/magpie). |
| [`yt-automation/`](yt-automation/) | `ytauto`: a queue that uploads, schedules and publishes through YouTube Studio in a signed-in Chrome profile (Playwright), with title, description and thumbnail. |
| [`tech-daily/`](tech-daily/) | `techdaily`: picks a trending tool each day, researches it, fact-checks a script and builds a video (the earlier HyperFrames pipeline). |

[Hermes Agent](https://github.com/NousResearch/hermes-agent) runs the scheduled jobs (`ytauto tick` every 10 minutes) and Claude Code does the authoring.

## The latest video

**[Codex on DeepSeek, Claude Code on Kimi: How This Free 15 MB App Does It](https://youtu.be/TuOnUlJSWho)**: title, description and tags are in [`Motion_as_kit/videos/2026-10-03-magpie/`](Motion_as_kit/videos/2026-10-03-magpie/).

## Not in the repository

Browser profiles, the job database, rendered media, API keys (`.env`), virtual environments, node modules, model weights and third-party asset libraries. See `.gitignore`.
