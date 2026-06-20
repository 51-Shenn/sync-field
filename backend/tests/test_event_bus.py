"""
Test the SupabaseEventBus idempotency guard and cascade logic
with a mocked DAG engine and fake payloads.

Run: PYTHONPATH=. python -m backend.tests.test_event_bus
"""
from unittest.mock import MagicMock
from backend.workflow.dag_engine.dag_engine import SyncFieldDAG
from backend.workflow.event_handlers.event_bus import SupabaseEventBus


class FakeDispatcher:
    def __init__(self, engine):
        self.engine = engine


def test_idempotency_guard_skips_matching_state():
    """
    If memory state == db state, the bus should NOT call update_task_state.
    This is the infinite-loop prevention guard.
    """
    engine = SyncFieldDAG([
        {"task_id": "T01", "task_name": "Test", "dependencies": []},
    ])
    engine.tasks["T01"]["state"] = "READY"

    bus = SupabaseEventBus(FakeDispatcher(engine), MagicMock())
    original_update = engine.update_task_state
    call_count = [0]

    def counting_update(*args, **kwargs):
        call_count[0] += 1
        return original_update(*args, **kwargs)

    engine.update_task_state = counting_update

    bus.handle_db_change({
        "new": {"id": "T01", "state": "READY"}  # matches memory
    })

    assert call_count[0] == 0, f"Idempotency guard failed: engine called {call_count[0]} times"
    print("PASS: Idempotency guard — matching state correctly skipped")


def test_processes_genuine_external_change():
    """
    If memory state != db state, the bus SHOULD call update_task_state.
    """
    engine = SyncFieldDAG([
        {"task_id": "T01", "task_name": "Test", "dependencies": []},
        {"task_id": "T02", "task_name": "Child", "dependencies": ["T01"]},
    ])
    engine.tasks["T01"]["state"] = "ACTIVE"
    engine.tasks["T02"]["state"] = "READY"

    bus = SupabaseEventBus(FakeDispatcher(engine), MagicMock())
    call_records = []

    def record_call(*args, **kwargs):
        call_records.append((args, kwargs))
        return []

    engine.update_task_state = record_call

    bus.handle_db_change({
        "new": {"id": "T01", "state": "BLOCKED"}  # different from memory
    })

    assert len(call_records) == 1, f"Expected 1 call, got {len(call_records)}"
    args, kwargs = call_records[0]
    assert args[0] == "T01", f"Wrong task_id: {args[0]}"
    assert args[1] == "BLOCKED", f"Wrong state: {args[1]}"
    print("PASS: Genuine external change correctly triggers engine")


def test_ignores_missing_task():
    """
    If the task_id doesn't exist in the engine, skip silently.
    """
    engine = SyncFieldDAG([
        {"task_id": "T01", "task_name": "Test", "dependencies": []},
    ])
    call_count = [0]

    def counting_update(*args, **kwargs):
        call_count[0] += 1
        return []

    engine.update_task_state = counting_update
    bus = SupabaseEventBus(FakeDispatcher(engine), MagicMock())

    bus.handle_db_change({
        "new": {"id": "T99", "state": "BLOCKED"}  # doesn't exist
    })

    assert call_count[0] == 0
    print("PASS: Missing task correctly ignored")


def test_ignores_null_payload():
    """
    Empty payload, null 'new', null state — all should be skipped.
    """
    engine = SyncFieldDAG([
        {"task_id": "T01", "task_name": "Test", "dependencies": []},
    ])
    call_count = [0]
    engine.update_task_state = lambda *a, **kw: (call_count.__setitem__(0, call_count[0] + 1) or [])
    bus = SupabaseEventBus(FakeDispatcher(engine), MagicMock())

    for payload in [
        {},
        {"new": None},
        {"new": {}},
        {"new": {"id": "T01"}},
        {"new": {"state": "READY"}},
    ]:
        bus.handle_db_change(payload)

    assert call_count[0] == 0, f"Expected 0 calls for null payloads, got {call_count[0]}"
    print("PASS: All null payload variants correctly skipped")


if __name__ == "__main__":
    test_idempotency_guard_skips_matching_state()
    test_processes_genuine_external_change()
    test_ignores_missing_task()
    test_ignores_null_payload()
    print("\n" + "=" * 60)
    print("ALL EVENT BUS TESTS PASSED")
    print("=" * 60)
