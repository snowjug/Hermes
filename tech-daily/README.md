# tech-daily

Every morning tech-daily picks two tools that are trending this week and makes two videos hosted by **Bit**, an animated stickman robot:

- **A Short** (1080×1920, about 35 seconds), published at 13:00 IST.
- **A 90-second video** (1920×1080), published at 18:00 IST.

Each video gets its own theme and voice. [ytauto](../yt-automation/README.md) uploads both.

## How a day is made

Everything for one day lives in `episodes/YYYY-MM-DD/`, with `short/` and `main/` subfolders. Each step records itself in `state.json`, so a failed run resumes where it stopped.

```text
collect   official APIs and public feeds ─► candidates.json (~200 items)
          HN Algolia, GitHub search, Product Hunt, TLDR, TechCrunch, The Verge,
          Ars Technica, Reddit RSS, Google Trends RSS, YouTube channel feeds
pick      claude -p ─► picks.json: two different, safe tools (no exploits,
          jailbreaks or piracy), each with a theme, voice and music mood
research  the tool's pages, GitHub README, its own HN thread ─► sources.json
          + [S0] trend signals (stars, points) so hooks are citable
capture   headless Chrome screenshots of the site / GitHub page
script    claude -p beat sheet: hook in 2 s, one visual beat per line, Bit's pose,
          caption emphasis, cue words ─► fact-checked (narration + on-screen
          text), failed claims fixed with minimal edits
voice     Kokoro TTS + faster-whisper word timings + mouth envelope
compose   techdaily/compose.py ─► HyperFrames index.html: hook slam, title,
          live screenshot in a phone/browser frame, bullets, count-up stats,
          before/after, typing terminal, steps, verdict meter, follow call,
          word-by-word captions, Bit lip-synced, SFX on every cut
render    npx hyperframes render ─► music bed mixed under voice ─► final.mp4
check     one still per line, checked by Claude ─► visualcheck.json
publish   description fact-checked, thumbnail (main), ytauto add --altered-content
          (held when any check fails or review.hold_for_approval is on)
```

The look lives in `kit/`: `tdkit.css` for layout and components, `tdkit.js` for the animation runtime, plus bundled fonts, GSAP and Pixabay-licensed sound effects. Themes and Bit's poses are in `techdaily/compose.py`.

## Run it

Hermes runs it every day at 09:00 through the cron job `techdaily-run`. To run it by hand, or to resume a failed run:

```bash
tech-daily\.venv\Scripts\python.exe -m techdaily run
```

| Command | What it does |
|---|---|
| `python -m techdaily status` | Lists recent episodes and how far each got |
| `python -m techdaily run --only short` | Makes just one of the two videos |
| `python -m techdaily run --hold` | Makes both videos but holds them for `ytauto approve` |
| `python -m techdaily integrate` | Registers the daily Hermes cron job |

## Settings that matter

All settings live in `config.yaml`:

- **`review.hold_for_approval`**: set it to `true` to check every video before it uploads. Approve one with `ytauto approve job_id`. A failed fact-check always holds the video.
- **`claude.build_model` / `build_budget_usd`**: the agentic build is the expensive step. The first episode cost about $13 of Claude Code usage across its build, two automatic revisions and the checks, and took about 3 hours of machine time on this laptop. Expect less once the build prompt's lessons stick. A Claude usage limit hit mid-build stops the run, and `techdaily run` resumes it.
- **`claude.max_revisions`**: automatic fix-and-re-render rounds when the fact or visual check fails (default 2).
- **`video.voices`**: Kokoro voices run offline for free. For more human-sounding narration, connect HeyGen (`heygen auth login --oauth`) or ElevenLabs, then change the voice list.
- **`tools.tts_concurrency`**: keep it at `1` on this laptop. Parallel Kokoro processes run it out of memory.

## Staying monetizable

YouTube won't pay for mass-produced, templated AI content ([monetization policies](https://support.google.com/youtube/answer/1311392)). The pipeline works against that in five ways:

- Each episode gets its own design preset, voice, structure and music, chosen for its topic and rotated against history.
- Every script needs a real verdict and an honest limitation. Every claim must come from the sources, the finish step fact-checks the script, and the sources are linked in the description.
- The pipeline never reuses other creators' footage or clips.
- Every upload ticks "Altered or synthetic content", and the description says an AI voice narrates. YouTube says disclosure doesn't reduce earnings.
- The music is synthesized for each episode, so it never gets a Content ID claim.

The pipeline can't reach the Partner Program thresholds on its own. You need 1,000 subscribers plus 4,000 watch hours in 12 months, or 10 million Shorts views in 90 days. Reviewing videos yourself, and adding your own take now and then, keeps the channel clearly on the "original" side.

## Files

| Path | Contents |
|---|---|
| `techdaily/sources.py` | Trend collection |
| `techdaily/plan.py` | Topic pick, history, research |
| `techdaily/episode.py` | The steps above; the build prompt lives in `build_prompt` |
| `techdaily/music.py` | Procedural music and the voice-ducked mix |
| `techdaily/claude.py` | Headless Claude Code calls |
| `.claude/skills/` | HyperFrames skills (Apache-2.0), pinned; `init` never updates them |
