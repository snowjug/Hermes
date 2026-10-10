# Motion as code

Explainer videos and Shorts made without a video editor. Every frame is a deterministic function of time: TypeScript **plates** draw it in WebGL, locked to the voiceover's word timings, and headless Chrome renders it with motion blur.

Each video is an **episode**: one folder under [`episodes/`](episodes/) with its script, voice, timings, plates, sound cues and publishing data. The engine, the shared toolkit and the analysis scripts are the same for all of them.

| Episode | Format | Theme | Published |
|---|---|---|---|
| [`2026-10-03-magpie`](episodes/2026-10-03-magpie/) | 1920×1080, 85 s | `signal` (ink, bone, hazard orange) | [video](https://youtu.be/TuOnUlJSWho) · [Short (reframed)](https://youtube.com/shorts/Y63pJ4viW14) |
| [`2026-10-04-disktree`](episodes/2026-10-04-disktree/) | 1920×1080, 90 s | `blueprint` (navy, cyan, amber) | [video](https://youtu.be/4MmSMJ2c2aQ) |
| [`2026-10-04-disktree-short`](episodes/2026-10-04-disktree-short/) | 1080×1920, 30 s | `pop` (yellow paper, black, hot pink) | [Short](https://youtube.com/shorts/vZ9y7XhO3pc) |
| [`2026-10-04-voicestudio`](episodes/2026-10-04-voicestudio/) | 1920×1080, 90 s | `scope` (oscilloscope green on black, VU amber) | [video](https://youtu.be/2CW_zb6y_ps) |
| [`2026-10-04-voicestudio-short`](episodes/2026-10-04-voicestudio-short/) | 1080×1920, 30 s | `riso` (risograph: cream stock, fluoro pink, riso blue) | [Short](https://youtube.com/shorts/rlxaVkBudiM) |
| [`2026-10-09-anyps5`](episodes/2026-10-09-anyps5/) | 1920×1080, 90 s | `collage` (paper desk: photo cutouts, tape, red string, marker; ElevenLabs voice and music via vidIQ) | [video](https://youtu.be/kCeu58HlppU) |
| [`2026-10-09-anyps5-short`](episodes/2026-10-09-anyps5-short/) | 1080×1920, 30 s | `glitch` (dark screen, RGB-split type, glitching photos) | [Short](https://youtube.com/shorts/1lL9B3y0eJQ) |
| [`2026-10-10-opengym`](episodes/2026-10-10-opengym/) | 1920×1080, 90 s | `kraft` (garage-gym desk: kraft paper, photo cutouts, drawn body map and barbell; Chatterbox voice) | [video](https://youtu.be/-uAf9tqI8aU) |
| [`2026-10-10-opengym-short`](episodes/2026-10-10-opengym-short/) | 1080×1920, 30 s | `court` (electric-blue court, chalk lines, giant chalk and lime type) | [Short](https://youtube.com/shorts/FRRxkiQ8wfM) |
| [`2026-10-11-rea`](episodes/2026-10-11-rea/) | 1920×1080, 90 s | `comic` (motion comic: ink panels, halftone, onomatopoeia, a robot detective, lettered caption boxes) | [video](https://youtu.be/6ZxAIGAm9Qo) |
| [`2026-10-11-rea-short`](episodes/2026-10-11-rea-short/) | 1080×1920, 30 s | `chat` (one continuous group chat: typing dots, word-by-word bubbles, photo messages) | [Short](https://youtube.com/shorts/UJ0Iwi7PSdk) |

## An episode

```text
episodes/<date>-<tool>/
  episode.json      format (main 1920×1080 | short 1080×1920), theme, voice settings, title
  script.json       the lines: `text` (shown and aligned) and `say` (read, one take per sentence)
  timeline.ts       which plate plays when (cuts in the pause before a line, found by its text)
  scenes/*.ts       the plates
  *.ts              data the plates share (e.g. home.ts: the example folder tree)
  sfx_cues.py       the sound cue sheet, keyed to words
  publish/          title, description, tags, thumbnail, links
  audio/ data/      voiceover.mp3; lyrics.json (word timings) and audio.json   (made by the steps below)
  work/ out/        takes, logs, renders                                        (not in git)
```

Themes live in [`app/src/engine/palette.ts`](app/src/engine/palette.ts): `signal`, `blueprint`, `pop`, `scope`, `riso`, `collage`, `glitch`, `kraft`, `court`, `comic` and `chat`. Every theme fills the same slots (ink, ink2, graphite, ash, bone, signal, ember, blood, acid, halation), so a plate looks right in any of them. Plates with `paper = true` draw ink on the bone colour, which is how the `pop` Short gets its yellow paper.

## Make one

Pick the episode with `EPISODE=<folder>`. Without it, the newest episode is used.

```sh
export EPISODE=2026-10-04-disktree
python analysis/approx_data.py                                     # placeholder timings: preview before the voice exists
<py3.11 with chatterbox-tts + faster-whisper> analysis/tts_chatterbox.py   # the voice, checked take by take
uv run --no-project --with onnxruntime --with numpy python analysis/align_vo.py   # word timings
uv run --no-project --with numpy python analysis/audio_vo.py
cd app && npm install && npx vite                                  # live preview (space = play, [ ] = plates)
node scripts/render-node.mjs sheet --times 2,10,20 --cols 3        # contact sheet → episodes/$EPISODE/out/sheet.png
node scripts/render-node.mjs parts --fps 30 --part-sec 10 --samples 4 --noaudio   # resumable render → out/picture.mp4
cd .. && uv run --no-project --with numpy python analysis/sfx_mix.py               # → out/mix.wav, −14 LUFS
ffmpeg -i episodes/$EPISODE/out/picture.mp4 -i episodes/$EPISODE/out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k episodes/$EPISODE/out/final.mp4
uv run --no-project --with numpy python analysis/check_video.py episodes/$EPISODE/out/final.mp4
node app/scripts/render-node.mjs stills --only thumb --t <duration + 2>             # the thumbnail plate
```

Narration can also be one ElevenLabs read (the AnyPS5 pair, through vidIQ): align the raw take with `align_vo.py`, keep its `data/lyrics.json` as `work/lyrics_raw.json`, then `analysis/edit_vo.py` cuts it to length like a dialogue edit (episode.json `edit`). A music bed goes in episode.json `music`; `sfx_mix.py` ducks it under the voice. `analysis/cutouts.py` turns the images listed in an episode's `img/cutouts.json` into paper cutouts with shadows for the collage plates (`app/src/scenes/_collage.ts`). `analysis/make_srt.py` writes the word timings as `publish/captions.en.srt` for YouTube Studio's subtitle upload.

`analysis/make_short.py` turns a finished 16:9 video into a 1080×1920 reframe with captions. That is how the magpie Short was made; native Shorts are their own episodes now.

Not in this repository: the alignment model (`analysis/models/w2v2_base_960h_q.onnx`, 95 MB) and the sound-effect library (`audio/sfx/`). Both come with the Motion as Code starter kit.

## Credits

- Engine and visual language: [pdoom-video](https://github.com/mexicat/pdoom-video) by mexicat (Giacomo Magnanini), MIT. See `LICENSE.pdoom-engine`.
- Workflow: the "Motion as Code" starter kit (voiceover → alignment → plates → render → sound). Files that came with the kit keep their authors' terms.
- Voice: [Chatterbox](https://github.com/resemble-ai/chatterbox) by Resemble AI (MIT), generated locally.
- Fonts: Archivo, IBM Plex Mono and Cormorant Garamond (SIL OFL), plus the EMS and Hershey single-stroke fonts.
