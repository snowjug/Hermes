# Motion as code: the magpie video

An 85-second, 1920×1080 explainer about [magpie](https://github.com/yetone/magpie) (one menu-bar list to pick every coding agent's model), made without a video editor. Every frame is a deterministic function of time, drawn by TypeScript plates in WebGL and locked to the voiceover's word timings.

Published on the Tool Man channel on 3 October 2026. Title, description and tags: [`videos/2026-10-03-magpie/`](videos/2026-10-03-magpie/).

## How it was made

1. **Script**: `analysis/vo_script.json` holds 17 lines. `text` is what the plates show; `say` is what the voice reads, one take per sentence. Every claim comes from magpie's README and website.
2. **Voice**: `analysis/tts_chatterbox.py` runs [Chatterbox](https://github.com/resemble-ai/chatterbox) (MIT) locally on the CPU. faster-whisper checks each take; a take that doesn't match its sentence is made again. The takes are joined with fixed pauses into `audio/voiceover.mp3`.
3. **Word timings**: `analysis/align_vo.py` force-aligns the script against the audio (wav2vec2 CTC, quantised ONNX) and writes `data/lyrics.json`. `analysis/audio_vo.py` writes the loudness envelopes to `data/audio.json`.
4. **Plates**: `app/src/scenes/*.ts` holds 13 plates: married, config, question, title, menubar, formats, gateway, adapter, plans, keys, surgical, catch and switchboard. `app/src/timeline.ts` cuts in the pause before each line, found by its text. `_mp.ts` is the shared toolkit: plate pipeline, nodes, links, packets, windows and stamps. The thumbnail is the `thumb` plate, rendered as a still after the end.
5. **Render**: `node app/scripts/render-node.mjs video --fps 30 --samples 4 --noaudio`. It drives headless Chrome with Playwright, averages 4 motion-blur sub-frames per frame and streams the frames to ffmpeg over HTTP. (The kit's Bun renderer, `render.ts`, can't drive Chrome on Windows.)
6. **Short**: `analysis/make_short.py` turns the finished video into a 1080×1920 Short: a hook headline, the video edge to edge, chapter labels and big word-by-word captions from the same word timings.
7. **Sound**: `analysis/sfx_mix.py` places about 225 effects on visual events (pen strokes, clicks, stamps, camera whips), ducks them under the voice and normalises the mix to −14 LUFS.

```sh
cd app && bun install            # or npm install
npx vite                          # live preview at http://localhost:5173 (space = play)
node scripts/render-node.mjs stills --t 12.5,40 --samples 4 --out ../out/wip
node scripts/render-node.mjs video --fps 30 --samples 4 --shutter 0.5 --noaudio --out ../out/picture.mp4
python -m uv run --no-project --with numpy python analysis/sfx_mix.py
ffmpeg -i out/picture.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/final.mp4
```

Not in this repository: the alignment model (`analysis/models/w2v2_base_960h_q.onnx`, 95 MB), the sound-effect library (`audio/sfx/`) and the starter kit's original plates. They come with the Motion as Code starter kit.

## Credits

- Engine and visual language: [pdoom-video](https://github.com/mexicat/pdoom-video) by mexicat (Giacomo Magnanini), MIT. See `LICENSE.pdoom-engine`. That covers the palette, fonts, spark motif, graph-paper sheets and post-processing.
- Workflow: the "Motion as Code" starter kit (voiceover → alignment → plates → render → sound).
- Voice: Chatterbox by Resemble AI (MIT), generated locally.
- Fonts: Archivo, IBM Plex Mono and Cormorant Garamond (SIL OFL), plus the EMS and Hershey single-stroke fonts.
