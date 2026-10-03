"""Send short status messages through Hermes (`hermes send`), e.g. to Telegram. Never raises."""

from __future__ import annotations

import logging
import shutil
import subprocess

log = logging.getLogger(__name__)


def notify(cfg: dict, subject: str, message: str) -> None:
    target = cfg.get("hermes_target")
    if not target:
        return
    hermes = shutil.which("hermes")
    if not hermes:
        log.warning("notify: `hermes` not on PATH; skipped: %s", subject)
        return
    try:
        proc = subprocess.run(
            [hermes, "send", "--to", str(target), "--subject", subject, "--quiet"],
            input=message, capture_output=True, text=True, encoding="utf-8", timeout=60,
        )
        if proc.returncode != 0:
            log.warning("notify: hermes send exited %s: %s", proc.returncode, (proc.stderr or "")[-300:])
    except Exception as exc:  # noqa: BLE001 - notifications must never break the pipeline
        log.warning("notify failed: %s", exc)
