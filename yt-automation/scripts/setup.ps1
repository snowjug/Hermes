# Set up ytauto on a Windows PC that already has Python 3.11+, Google Chrome, Claude Code and Hermes Agent.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File yt-automation\scripts\setup.ps1
$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
Set-Location $project

if (-not (Test-Path ".venv")) { python -m venv .venv }
.\.venv\Scripts\python.exe -m pip install --upgrade pip -q
.\.venv\Scripts\python.exe -m pip install -e ".[transcribe,dev]" -q

.\.venv\Scripts\ytauto.exe init
.\.venv\Scripts\ytauto.exe integrate --every 10m

# Let Claude Code in the parent folder talk to Hermes over MCP (approve it on the next `claude` start).
Push-Location (Split-Path -Parent $project)
$hermes = (Get-Command hermes).Source
claude mcp add hermes -s project -- $hermes mcp serve
Pop-Location

Write-Host ""
Write-Host "Next:"
Write-Host "  hermes gateway install              # keeps Hermes cron running after every logon"
Write-Host "  .venv\Scripts\ytauto.exe login      # sign in to YouTube once in the automation browser"
