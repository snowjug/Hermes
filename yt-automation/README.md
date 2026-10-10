# ytauto

Copy a video into `inbox\` and ytauto transcribes it, writes the title, description and tags with Claude Code, and uploads it to YouTube at the time you chose, through a real Chrome window on your PC. A Short can also go out on Instagram as a Reel at the same time.

## How the pieces fit

Hermes Agent runs the schedule, ytauto does the work, and Claude Code writes the text.

```text
 ┌──────────── Hermes Agent (gateway task, starts at logon) ────────────┐
 │ cron "ytauto-tick", every 10m, no LLM                                │
 │   └─► scripts\ytauto_tick.py (shim: starts ytauto, returns at once)  │
 │ hermes send ◄── upload notices (Telegram/Discord, optional)          │
 │ skill youtube-automation (chat: "post this video Friday 6pm")        │
 └───────────────────────────────┬──────────────────────────────────────┘
                                 ▼
 inbox\video.mp4 ─► ytauto tick  (one at a time; state in state.db)
 (+ video.yaml)      ├─ 1 ingest     move to work\job_id\, pick a slot
                     ├─ 2 transcribe faster-whisper, local
                     │               ─► transcript.json, captions.srt
                     ├─ 3 describe   claude -p, tools off, JSON schema
                     │               ─► metadata.json
                     └─ 4 upload     Playwright + your installed Chrome
                                     + a signed-in automation profile
                                     ─► YouTube Studio

 Claude Code: skill youtube-automation, MCP server "hermes"
```

The design follows these rules:

- **One command, any trigger**: `ytauto tick` does whatever is due and exits. Hermes cron calls it, but Windows Task Scheduler or you can call it too. A skipped or crashed tick loses nothing.
- **Upload early, let YouTube publish**: in `youtube_schedule` mode a video uploads up to 48 hours before its slot and uses Studio's Schedule option, so your PC can sleep at publish time. In `at_slot` mode it uploads at the slot and publishes at once.
- **A state machine in SQLite**: jobs move `queued → transcribed → ready → uploading → done`. Each stage retries with backoff and becomes `failed` after `retry.max_attempts`. Every change goes into a per-job event log.
- **No duplicate uploads**: if a tick dies mid-upload, the job turns `failed` with a note to check Studio for a leftover draft. It never uploads again on its own.
- **Missed slots move**: if your PC was off and a slot passed more than 3 hours ago, the job takes the next free slot instead of publishing late.
- **You own the login**: you sign in to the browser profile yourself with `ytauto login`. If Google signs it out or asks for verification, uploads pause, a `NEEDS_LOGIN` file appears, and you get a message.
- **Editable until upload**: ytauto reads `work\job_id\metadata.json` again at upload time. Edit it, or turn on `publish.require_approval` and approve each video.

Claude Code writes the metadata with your existing Claude Code login, so there's no separate API key. The test run used $0.017 of usage for a 44-second video with Sonnet. Longer transcripts cost more, and `metadata.max_budget_usd` caps each call.

## Finish the setup

This PC already has the virtual environment, the Hermes cron job `ytauto-tick`, the Hermes gateway logon task, the `youtube-automation` skill for Hermes and Claude Code, and `.mcp.json`. Three steps are left:

1. Sign in to YouTube in the automation profile. A Chrome window opens; sign in, wait for Studio to show your channel, then close the window. Set your Studio language to English (US), because ytauto types dates and times in that format.

   ```bash
   yt-automation\.venv\Scripts\ytauto.exe login
   ```

2. Edit `config.yaml`: describe your channel in `channel`, set `style`, `footer`, `slots`, `days` and `timezone`.
3. Upload a private test draft. The first command prints the job id; pass it to the second.

   ```bash
   yt-automation\.venv\Scripts\ytauto.exe add "D:\videos\test.mp4" --notes "test upload"
   ```

   ```bash
   yt-automation\.venv\Scripts\ytauto.exe upload job_id --draft
   ```

To get notices on your phone, run `hermes gateway setup` to connect Telegram, then set `notify.hermes_target: telegram`.

To set up another PC from scratch, run `scripts\setup.ps1`.

## Queue and manage videos

Copy finished videos into `inbox\`. To set details for one video, put a `.yaml` file with the same name next to it:

```yaml
publish_at: "2026-10-05 18:00"
notes: "Review of the new mic; compare with last year's model"
tags: [microphone, review]
visibility: public
```

| Command | What it does |
|---|---|
| `ytauto status` | Lists the queue with publish times and errors |
| `ytauto show job_id` | Shows title, description, tags and history |
| `ytauto reschedule job_id "2026-10-06 18:00"` | Moves the job to a new slot |
| `ytauto describe job_id` | Writes the metadata again |
| `ytauto approve job_id` | Releases a held video |
| `ytauto retry job_id` | Resets a failed job |
| `ytauto cancel job_id` | Drops a job and keeps its files |
| `ytauto upload job_id [--draft]` | Uploads now |
| `ytauto publish job_id` | Makes an uploaded video public now |
| `ytauto update-details job_id` | Pushes an edited `metadata.json` title and description to an uploaded video |
| `ytauto set-thumbnail job_id [--image file]` | Uploads a custom thumbnail to an uploaded video |

Custom thumbnails need a phone-verified channel (done on 2026-09-27). If verification ever lapses, uploads still succeed, YouTube picks a frame, and the job history records a warning.

You can also ask Claude Code or Hermes in plain words; both load the `youtube-automation` skill.

## Post Shorts to Instagram as Reels

Every Short is also posted to Instagram (`instagram.username` in `config.yaml`, @tooladay) as a Reel. Instagram's
web composer has no scheduling, so the first tick after the publish time posts it through instagram.com, in the
same Chrome profile as the YouTube uploads. The PC has to be on then; a Reel that misses its time posts at the
next tick.

Sign in once. A window opens on Instagram; log in, then close it:

```bash
yt-automation\.venv\Scripts\ytauto.exe ig-login
```

| Command | What it does |
|---|---|
| `ytauto add short.mp4 … --instagram` | Queues the Short for YouTube and Instagram |
| `ytauto instagram job_id [--caption file.txt]` | Adds a Reel to a queued or uploaded job, posted at its publish time |
| `ytauto instagram job_id --dry-run` | Goes through Instagram's composer and stops before Share (screenshot `ig-dry-run.png`) |
| `ytauto instagram job_id --now` | Posts the Reel right away |

The caption is saved as `work\job_id\instagram_caption.txt`, so you can edit it before the Reel posts. Without a
caption file, ytauto builds one from the YouTube description:
- links are dropped, since Instagram doesn't make them clickable;
- #Shorts becomes #reels;
- at most five hashtags are kept, which is Instagram's limit.

Jobs added with `--altered-content` also get Instagram's AI label. A signed-out Instagram pauses Reels only (a
`NEEDS_IG_LOGIN` file appears), never YouTube uploads.

## Fix a broken upload step

YouTube Studio changes its page layout now and then. Every selector lives in `SEL` at the top of `ytauto/uploader.py`, with fallbacks. A failed step saves a screenshot named after the step, like `work\job_id\failed-title.png`. Fix the selector, then run `ytauto retry job_id`. Instagram's selectors live in `ytauto/instagram.py` (screenshots `failed-ig-*.png`); check a fix with `ytauto instagram job_id --dry-run`.

## Run the tests

```bash
yt-automation\.venv\Scripts\python.exe -m pytest yt-automation\tests
```

Set `YTAUTO_BROWSER_TESTS=1` to also drive the uploader and the Reel poster in headless Chrome against `tests/fixtures/mock_studio.html` and `tests/fixtures/mock_instagram.html`. These stand-in pages use the sites' element names; the Instagram one also opens hashtag suggestions that Enter would pick, as the real site does.

## Limits and risks

- **Terms of Service**: YouTube's terms restrict automated access. Many creators automate their own channel this way, but Google can still challenge or flag the account. The sanctioned route is the YouTube Data API, where videos from unaudited API projects stay private until Google audits the project.
- **Subtitles**: ytauto saves `captions.srt` for every video but doesn't upload it. YouTube makes its own captions; upload the SRT in Studio when you want exact ones.
- **Visible browser**: uploads run in a Chrome window on your desktop. Don't close it mid-upload.
- **Instagram**: Instagram's terms also restrict automated access, and it may ask the account for a security check, which pauses Reels until you complete it in `ytauto ig-login`. The sanctioned route is the Instagram API, which needs a professional account linked through a Meta app. One Reel a day from your own signed-in browser is low volume, but the risk is not zero.
