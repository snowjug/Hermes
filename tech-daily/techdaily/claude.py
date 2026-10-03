"""Headless Claude Code calls: one-shot structured JSON, and a long agentic run with a transcript log."""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
import time
from pathlib import Path

log = logging.getLogger(__name__)


class ClaudeError(RuntimeError):
    pass


def claude_exe() -> str:
    found = shutil.which("claude")
    if not found:
        raise ClaudeError("`claude` CLI not found on PATH")
    # npm's .cmd shim goes through cmd.exe, which mangles JSON arguments; call the native binary.
    if found.lower().endswith((".cmd", ".ps1")):
        native = Path(found).parent / "node_modules" / "@anthropic-ai" / "claude-code" / "bin" / "claude.exe"
        if native.exists():
            return str(native)
    return found


def ask_json(prompt: str, schema: dict, *, system: str, model: str, cwd: Path, budget_usd: float = 1.0,
             tools: list[str] | None = None, env: dict | None = None, timeout: int = 900) -> dict:
    """One structured answer. Tools are off unless listed (e.g. ["Read"] to look at images)."""
    argv = [claude_exe(), "-p", "--output-format", "json", "--json-schema", json.dumps(schema),
            "--strict-mcp-config", "--no-session-persistence", "--model", model,
            "--max-budget-usd", str(budget_usd), "--system-prompt", system]
    if tools:
        argv += ["--tools", ",".join(tools), "--allowedTools", ",".join(tools)]
    else:
        argv += ["--tools", ""]
    for attempt in range(2):  # Claude occasionally exhausts its structured-output retries; one more try fixes it
        proc = subprocess.run(argv, input=prompt, capture_output=True, text=True, encoding="utf-8", cwd=str(cwd),
                              env=env, timeout=timeout)
        if proc.returncode == 0 or "structured_output_retry_exhausted" not in (proc.stdout or ""):
            break
        log.warning("claude structured output failed; retrying once")
    if proc.returncode != 0:
        raise ClaudeError(f"claude -p exited {proc.returncode}: {(proc.stderr or proc.stdout)[-800:]}")
    envelope = json.loads(proc.stdout)
    if envelope.get("is_error") or not isinstance(envelope.get("structured_output"), dict):
        raise ClaudeError(f"claude -p gave no structured output: {str(envelope.get('result'))[:500]}")
    log.info("claude %s answered (cost $%.3f)", model, envelope.get("total_cost_usd") or 0)
    return envelope["structured_output"]


def run_agent(prompt: str, *, cwd: Path, model: str, budget_usd: float, timeout_min: float, transcript: Path,
              allowed_tools: list[str], env: dict | None = None) -> dict:
    """Run Claude Code as an agent until it finishes. Streams events to `transcript` (JSONL).

    Returns the final result event. Raises ClaudeError on failure, timeout or budget exhaustion.
    """
    # --tools limits the built-in tool set itself (no ScheduleWakeup/Monitor/cron: in a one-shot run,
    # ending the turn to "wait" ends the whole run); --allowedTools lets those tools run without prompts.
    argv = [claude_exe(), "-p", "--output-format", "stream-json", "--verbose",
            "--model", model, "--max-budget-usd", str(budget_usd),
            "--tools", ",".join(allowed_tools),
            "--permission-mode", "acceptEdits", "--allowedTools", ",".join(allowed_tools),
            "--strict-mcp-config"]
    transcript.parent.mkdir(parents=True, exist_ok=True)
    deadline = time.monotonic() + timeout_min * 60
    result: dict | None = None
    with open(transcript, "w", encoding="utf-8") as out:
        proc = subprocess.Popen(argv, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                text=True, encoding="utf-8", cwd=str(cwd), env=env)
        assert proc.stdin and proc.stdout
        proc.stdin.write(prompt)
        proc.stdin.close()
        for line in proc.stdout:
            out.write(line)
            out.flush()
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            if event.get("type") == "result":
                result = event
            elif event.get("type") == "assistant":
                for block in event.get("message", {}).get("content", []):
                    if block.get("type") == "tool_use" and block.get("name") == "Bash":
                        log.info("agent: $ %s", str(block["input"].get("command", ""))[:160])
            if time.monotonic() > deadline:
                proc.kill()
                raise ClaudeError(f"agent run exceeded {timeout_min} minutes")
        proc.wait()
    if result is None:
        raise ClaudeError(f"agent run ended without a result (exit {proc.returncode}); see {transcript}")
    if result.get("is_error"):
        raise ClaudeError(f"agent run failed: {result.get('subtype')}: {str(result.get('result'))[:500]}")
    log.info("agent finished in %.1f min, cost $%.2f, %s turns", (result.get("duration_ms") or 0) / 60000,
             result.get("total_cost_usd") or 0, result.get("num_turns"))
    return result
