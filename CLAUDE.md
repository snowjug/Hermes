# Hermes workspace

- `yt-automation/`: the `ytauto` YouTube upload pipeline. Read `yt-automation/README.md` first.
  For queue and schedule requests, use the `youtube-automation` skill.
- Hermes Agent is installed at `%LOCALAPPDATA%\hermes`. Its gateway runs at logon (`Hermes_Gateway`
  scheduled task) and fires the `ytauto-tick` cron job every 10 minutes. `.mcp.json` exposes
  `hermes mcp serve` (messaging tools) to Claude Code.
- Run the pipeline's tests with `yt-automation\.venv\Scripts\python.exe -m pytest yt-automation\tests`.
- Never type the user's Google password or complete Google verification. `ytauto login` is theirs to run.
