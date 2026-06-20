"""
P1 — Full Schedule Engine pipeline: AvailabilityWindow + TechnicianSchedule +
compute_cascade_eta(schedules=...) actually wired together.

Run: PYTHONPATH=. python -m backend.tests.test_p1_schedule_pipeline
"""
from datetime import datetime, timedelta

from backend.workflow.dag_engine.dag_engine import (
    SyncFieldDAG, AvailabilityWindow, TechnicianSchedule,
)


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def run_basic_window_removal():
    section("P1 TEST 1: remove_window() actually excludes a lunch break")

    day_start = datetime(2026, 6, 22, 8, 0)
    day_end = datetime(2026, 6, 22, 18, 0)

    schedule = TechnicianSchedule([
        AvailabilityWindow(day_start, day_end, source="shift", confirmed=True)
    ])

    lunch_start = datetime(2026, 6, 22, 13, 0)
    lunch_end = datetime(2026, 6, 22, 14, 0)
    schedule.remove_window(lunch_start, lunch_end, source="lunch_break")

    print("Windows after removing lunch (13:00-14:00):")
    for w in schedule.windows:
        print(f"  {w.start.strftime('%H:%M')} - {w.end.strftime('%H:%M')} (source={w.source}, confirmed={w.confirmed})")

    request_start = datetime(2026, 6, 22, 12, 0)
    slot_start, confidence = schedule.next_available_slot(request_start, timedelta(hours=2))

    print(f"\nRequested 2hr slot starting at 12:00 (would overlap lunch break).")
    print(f"Got: start={slot_start}, confidence={confidence}")

    expected_start = datetime(2026, 6, 22, 14, 0)
    ok = slot_start == expected_start and confidence == "EXACT"
    print(f"\n>>> {'PASS' if ok else 'FAIL'}: Expected slot to jump to 14:00 (after lunch)")
    return {"pass": ok}


def run_delay_from():
    section("P1 TEST 2: delay_from() on a schedule with two windows")

    schedule = TechnicianSchedule([
        AvailabilityWindow(datetime(2026, 6, 22, 8, 0), datetime(2026, 6, 22, 12, 0), source="morning", confirmed=True),
        AvailabilityWindow(datetime(2026, 6, 22, 13, 0), datetime(2026, 6, 22, 18, 0), source="afternoon", confirmed=True),
    ])
    schedule.delay_from(datetime(2026, 6, 22, 10, 0), by=timedelta(minutes=90), confirmed=False)

    print("Two windows: 08:00-12:00 (morning) and 13:00-18:00 (afternoon).")
    print("Delay reported at 10:00, +90min. Afternoon window starts at 13:00 (>= 10:00), should shift.")
    for w in schedule.windows:
        print(f"  {w.start.strftime('%H:%M')} - {w.end.strftime('%H:%M')} (source={w.source}, confirmed={w.confirmed})")

    afternoon = [w for w in schedule.windows if w.source == "afternoon"][0]
    expected_shift = afternoon.start == datetime(2026, 6, 22, 14, 30)
    print(f"\n>>> {'PASS' if expected_shift else 'FAIL'}: Afternoon window shifted from 13:00 to 14:30")

    section("P1 TEST 2c: delay_from() on a SINGLE large window — mid-window split")
    schedule3 = TechnicianSchedule([
        AvailabilityWindow(datetime(2026, 6, 22, 8, 0), datetime(2026, 6, 22, 18, 0), source="shift", confirmed=True),
    ])
    schedule3.delay_from(datetime(2026, 6, 22, 10, 0), by=timedelta(minutes=90), confirmed=False)

    print("Single 08:00-18:00 window. Delay at 10:00, +90min. Should split into two windows.")
    for w in schedule3.windows:
        print(f"  {w.start.strftime('%H:%M')} - {w.end.strftime('%H:%M')} (source={w.source}, confirmed={w.confirmed})")

    split_ok = len(schedule3.windows) == 2
    morning = schedule3.windows[0]
    afternoon = schedule3.windows[1]
    times_ok = morning.start == datetime(2026, 6, 22, 8, 0) and morning.end == datetime(2026, 6, 22, 10, 0)
    shift_ok = afternoon.start == datetime(2026, 6, 22, 11, 30) and afternoon.end == datetime(2026, 6, 22, 19, 30)
    print(f"\n>>> Window split correctly (2 windows, morning 08:00-10:00, afternoon 11:30-19:30): "
          f"{'PASS' if (split_ok and times_ok and shift_ok) else 'FAIL'}")

    return {"pass": expected_shift and split_ok and times_ok and shift_ok}


def run_eta_with_real_schedule():
    section("P1 TEST 3: compute_cascade_eta(schedules={...}) with a REAL schedule")

    tasks = [
        {"task_id": "T01", "task_name": "Conduit", "dependencies": [],
         "estimated_duration_hours": 2},
        {"task_id": "T02", "task_name": "Cable Run", "dependencies": ["T01"],
         "estimated_duration_hours": 3},
    ]
    engine = SyncFieldDAG(tasks)
    engine.tasks["T02"]["assigned_to"] = "Ahmad"

    today = datetime(2026, 6, 22)
    engine.update_task_state("T01", "ACTIVE")
    engine.update_task_state("T01", "BLOCKED", "Material delay")
    engine.tasks["T01"]["resolution_eta"] = today.replace(hour=11, minute=0)
    engine.tasks["T01"]["eta_confidence"] = "EXACT"

    ahmad_schedule = TechnicianSchedule([
        AvailabilityWindow(today.replace(hour=8), today.replace(hour=18), source="shift", confirmed=True)
    ])
    ahmad_schedule.remove_window(today.replace(hour=13), today.replace(hour=14), source="lunch")

    print("T01 resolution_eta = 11:00 (duration 2h, finishes at 13:00).")
    print("T02 (Ahmad, duration 3h) would naively start at 13:00 — right into his lunch break.")

    result = engine.compute_cascade_eta("T01", schedules={"Ahmad": ahmad_schedule})
    t02 = result.get("T02", {})
    print(f"T02 computed: earliest_start={t02.get('earliest_start')}, "
          f"confidence={t02.get('eta_confidence')}")

    expected_start = today.replace(hour=14)
    ok = t02.get("earliest_start") == expected_start
    print(f"\n>>> {'PASS' if ok else 'FAIL'}: T02 pushed past Ahmad's lunch to 14:00")
    return {"pass": ok}


if __name__ == "__main__":
    r1 = run_basic_window_removal()
    r2 = run_delay_from()
    r3 = run_eta_with_real_schedule()
    print("\n" + "#" * 70)
    all_pass = r1["pass"] and r2["pass"] and r3["pass"]
    print(f"P1 SCHEDULE PIPELINE: {'ALL PASS' if all_pass else 'FAILURES FOUND'}")
    print("#" * 70)
