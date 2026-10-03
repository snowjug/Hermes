"""Publish-slot assignment and the rules for when a job may be uploaded."""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

DAY_NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

# YouTube Studio refuses schedule times that are too close to "now"; below this we publish directly.
MIN_SCHEDULE_LEAD = timedelta(minutes=20)


def parse_slot(value: str) -> time:
    hh, mm = value.strip().split(":")
    return time(int(hh), int(mm))


def parse_when(value: str, tz: ZoneInfo) -> datetime:
    """Parse a user-supplied publish time. Naive values are read in the configured timezone."""
    text = value.strip().replace("T", " ")
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(text, fmt)
            break
        except ValueError:
            continue
    else:
        dt = datetime.fromisoformat(value.strip())
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=tz)
    return dt.astimezone(timezone.utc)


def next_free_slot(now: datetime, publish_cfg: dict, tz: ZoneInfo, taken: set[datetime]) -> datetime:
    """Return the first configured slot at least min_lead_minutes from now that no other job holds."""
    slots = sorted(parse_slot(s) for s in publish_cfg["slots"])
    days = {DAY_NAMES.index(d.lower()[:3]) for d in publish_cfg["days"]}
    if not slots or not days:
        raise ValueError("publish.slots and publish.days must not be empty")
    earliest = now + timedelta(minutes=int(publish_cfg["min_lead_minutes"]))
    taken_utc = {t.astimezone(timezone.utc) for t in taken}

    local_day = earliest.astimezone(tz).date()
    for _ in range(366 * 2):
        if local_day.weekday() in days:
            for slot in slots:
                candidate = datetime.combine(local_day, slot, tzinfo=tz).astimezone(timezone.utc)
                if candidate >= earliest and candidate not in taken_utc:
                    return candidate
        local_day += timedelta(days=1)
    raise RuntimeError("no free publish slot in the next two years; add slots or days")


def upload_window_open(now: datetime, publish_at: datetime, publish_cfg: dict) -> bool:
    """Whether a prepared job should be uploaded on this tick."""
    if publish_cfg["mode"] == "at_slot":
        return now >= publish_at
    return now >= publish_at - timedelta(hours=float(publish_cfg["upload_ahead_hours"]))


def schedule_on_youtube(now: datetime, publish_at: datetime, publish_cfg: dict) -> bool:
    """True when the upload should use Studio's Schedule option instead of publishing right away."""
    return publish_cfg["mode"] == "youtube_schedule" and publish_at - now >= MIN_SCHEDULE_LEAD
