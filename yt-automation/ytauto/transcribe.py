"""Local speech-to-text with faster-whisper. Writes transcript.json and captions.srt into the job folder."""

from __future__ import annotations

import json
import logging
from pathlib import Path

log = logging.getLogger(__name__)

_MODEL_CACHE: dict[tuple, object] = {}


class TranscriptionUnavailable(RuntimeError):
    pass


def _srt_time(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def to_srt(segments: list[dict]) -> str:
    blocks = []
    for i, seg in enumerate(segments, 1):
        blocks.append(f"{i}\n{_srt_time(seg['start'])} --> {_srt_time(seg['end'])}\n{seg['text'].strip()}\n")
    return "\n".join(blocks)


def transcribe(video: Path, out_dir: Path, cfg: dict) -> dict:
    """Transcribe `video`; return {"language", "duration", "segments": [{start, end, text}]}."""
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise TranscriptionUnavailable(
            "faster-whisper is not installed; run `pip install -e .[transcribe]` or set transcription.enabled: false"
        ) from exc

    key = (cfg["model"], cfg["device"], cfg["compute_type"])
    model = _MODEL_CACHE.get(key)
    if model is None:
        log.info("loading whisper model %s on %s", cfg["model"], cfg["device"])
        model = WhisperModel(cfg["model"], device=cfg["device"], compute_type=cfg["compute_type"])
        _MODEL_CACHE[key] = model

    seg_iter, info = model.transcribe(str(video), language=cfg.get("language") or None, vad_filter=True)
    segments = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()} for s in seg_iter]
    result = {"language": info.language, "duration": round(info.duration, 2), "segments": segments}

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "transcript.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "captions.srt").write_text(to_srt(segments), encoding="utf-8")
    log.info("transcribed %s: %d segments, %.0fs, language=%s", video.name, len(segments), info.duration, info.language)
    return result
