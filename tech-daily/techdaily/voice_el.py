"""ElevenLabs narration: the whole script in one take (natural flow between sentences), with word timings
taken from ElevenLabs' own character alignment."""

from __future__ import annotations

import base64
import logging
import os
import re
from pathlib import Path

import httpx

from .config import ROOT

log = logging.getLogger(__name__)

API = "https://api.elevenlabs.io/v1"


class VoiceError(RuntimeError):
    pass


def api_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY", "")
    env_file = ROOT / ".env"
    if not key and env_file.exists():
        m = re.search(r"^ELEVENLABS_API_KEY=(\S+)", env_file.read_text(encoding="utf-8"), re.M)
        key = m.group(1) if m else ""
    if not key.startswith("sk_"):
        raise VoiceError("ElevenLabs API key missing or not a secret key (must start with sk_); set it in "
                         f"{env_file}")
    return key


def _client() -> httpx.Client:
    return httpx.Client(base_url=API, headers={"xi-api-key": api_key()}, timeout=180)


def list_voices() -> list[dict]:
    with _client() as c:
        r = c.get("/voices")
        r.raise_for_status()
        return r.json()["voices"]


def subscription() -> dict:
    with _client() as c:
        r = c.get("/user/subscription")
        r.raise_for_status()
        return r.json()


def _words_from_alignment(al: dict) -> list[dict]:
    chars, starts, ends = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur, s0, e0 = [], "", None, None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                words.append({"w": cur, "start": s0, "end": e0})
                cur, s0 = "", None
            continue
        if not cur:
            s0 = s
        cur += ch
        e0 = e
    if cur:
        words.append({"w": cur, "start": s0, "end": e0})
    return words


def synthesize(lines: list[str], voice_id: str, out_dir: Path, *, model: str = "eleven_multilingual_v2",
               stability: float = 0.42, similarity: float = 0.8, style: float = 0.28, speed: float = 1.0) -> dict:
    """Return {"path", "duration", "lines": [{text, start, duration, words}]} for the whole narration."""
    out_dir.mkdir(parents=True, exist_ok=True)
    text = " ".join(line.strip() for line in lines)
    body = {"text": text, "model_id": model,
            "voice_settings": {"stability": stability, "similarity_boost": similarity, "style": style,
                               "use_speaker_boost": True, "speed": speed}}
    with _client() as c:
        r = c.post(f"/text-to-speech/{voice_id}/with-timestamps", params={"output_format": "mp3_44100_128"},
                   json=body)
    if r.status_code != 200:
        raise VoiceError(f"ElevenLabs TTS failed ({r.status_code}): {r.text[:300]}")
    data = r.json()
    audio = base64.b64decode(data["audio_base64"])
    path = out_dir / "narration.mp3"
    path.write_bytes(audio)
    words = _words_from_alignment(data.get("normalized_alignment") or data["alignment"])
    if not words:
        raise VoiceError("ElevenLabs returned no alignment")
    duration = round(max(w["end"] for w in words) + 0.25, 3)

    # Split the timed words back into script lines by word count.
    out_lines, i = [], 0
    for line in lines:
        n = len(line.split())
        chunk = words[i:i + n] or words[-1:]
        i += n
        out_lines.append({"text": line, "words": [{"w": w["w"], "start": round(w["start"], 3), "end": round(w["end"], 3)}
                                                  for w in chunk]})
    for k, ln in enumerate(out_lines):
        ln["start"] = ln["words"][0]["start"] if k else 0.0
        nxt = out_lines[k + 1]["words"][0]["start"] if k + 1 < len(out_lines) else duration
        ln["duration"] = round(max(0.3, nxt - ln["start"]), 3)
    log.info("ElevenLabs: %d chars, %.1fs, %d words", len(text), duration, len(words))
    return {"path": path.name, "duration": duration, "lines": out_lines, "chars": len(text)}
