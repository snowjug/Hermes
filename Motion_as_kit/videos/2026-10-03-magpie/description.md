# Codex on DeepSeek, Claude Code on Kimi: How This Free 15 MB App Does It

Tool Man, 3 October 2026. 1:26, 1920×1080, 30 fps.
YouTube: https://youtu.be/TuOnUlJSWho
Short (vertical cut, `analysis/make_short.py`, metadata in `short.json`): https://youtube.com/shorts/Y63pJ4viW14

Codex talks to OpenAI. Claude Code talks to Anthropic. magpie is a free, open-source (MIT) app that lets you pick any model for any of your coding agents from one menu-bar list: Codex on DeepSeek, Claude Code on Kimi, Gemini CLI on GLM.

## How it works

magpie runs a gateway on your own computer (127.0.0.1:3425) that speaks OpenAI Chat and Responses, Anthropic Messages and Google Gemini, and translates between them in both directions, streaming and tool calls included. Your agents talk to the gateway; magpie forwards each request to whichever vendor serves the model you picked.

## Also in the video

- Sign-ins to Claude Code, Codex (ChatGPT) or Copilot become providers that your other agents can use, with no key to paste.
- Add several keys: one whose balance runs out sits out half an hour while another one answers.
- Config edits touch only the one setting you change. Comments, ordering and indentation survive.
- Under 15 MB with the desktop app, for macOS, Windows and Linux.

**The catch:** magpie can swap the model, but it can't make a cheaper model as good as the one your agent was built around.

## Chapters

- 0:00 Agents married to one AI company
- 0:17 Meet magpie
- 0:32 The gateway underneath
- 0:53 Plans, keys and careful config edits
- 1:11 The catch

## Sources

- https://github.com/yetone/magpie
- https://usemagpie.ai

Star count (4,422) as of 3 October 2026. Diagrams are illustrations; the config files and model names on screen are examples in the style of the project's README. Narrated with an AI voice (Chatterbox, generated locally). Animated in code: see [`../../`](../../).

Tags: magpie, magpie app, coding agents, Codex, Claude Code, DeepSeek, Kimi, Gemini CLI, OpenCode, AI model gateway, LLM gateway, switch AI models, Codex on DeepSeek, Claude Code with Kimi, open source developer tools, AI tools
