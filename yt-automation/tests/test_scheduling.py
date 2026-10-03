from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from ytauto import scheduling

IST = ZoneInfo("Asia/Kolkata")
CFG = {"mode": "youtube_schedule", "slots": ["18:00", "09:30"], "days": ["mon", "wed", "fri"],
       "min_lead_minutes": 60, "upload_ahead_hours": 48}


def ist(*args):
    return datetime(*args, tzinfo=IST).astimezone(timezone.utc)


def test_next_slot_same_day_respects_lead():
    now = ist(2026, 9, 28, 8, 45)  # Monday
    # 09:30 is less than 60 minutes away, so 18:00 is next
    assert scheduling.next_free_slot(now, CFG, IST, set()) == ist(2026, 9, 28, 18, 0)


def test_next_slot_skips_taken_and_off_days():
    now = ist(2026, 9, 28, 7, 0)  # Monday
    taken = {ist(2026, 9, 28, 9, 30), ist(2026, 9, 28, 18, 0)}
    # Tuesday is not a publish day
    assert scheduling.next_free_slot(now, CFG, IST, taken) == ist(2026, 9, 30, 9, 30)


def test_parse_when_local_and_explicit_offset():
    assert scheduling.parse_when("2026-09-28 18:00", IST) == ist(2026, 9, 28, 18, 0)
    assert scheduling.parse_when("2026-09-28T12:30:00+00:00", IST) == datetime(2026, 9, 28, 12, 30, tzinfo=timezone.utc)


def test_upload_window_and_schedule_decision():
    slot = ist(2026, 9, 30, 18, 0)
    assert not scheduling.upload_window_open(slot - timedelta(hours=49), slot, CFG)
    assert scheduling.upload_window_open(slot - timedelta(hours=47), slot, CFG)
    assert scheduling.schedule_on_youtube(slot - timedelta(hours=5), slot, CFG)
    assert not scheduling.schedule_on_youtube(slot - timedelta(minutes=5), slot, CFG)

    at_slot = {**CFG, "mode": "at_slot"}
    assert not scheduling.upload_window_open(slot - timedelta(minutes=1), slot, at_slot)
    assert scheduling.upload_window_open(slot, slot, at_slot)
    assert not scheduling.schedule_on_youtube(slot - timedelta(hours=5), slot, at_slot)
