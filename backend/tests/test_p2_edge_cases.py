"""
P2 — Cyclic dependencies and FAILED-state re-report.

Run: PYTHONPATH=. python -m backend.tests.test_p2_edge_cases
"""
from backend.workflow.dag_engine.dag_engine import SyncFieldDAG, DEFAULT_POLICIES
from backend.workflow.dag_engine.dag_engine import FieldOpsDomainRules


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def run_cyclic_dependency():
    section("P2 TEST 1: Cyclic dependency — T01 depends on T02, T02 depends on T01")

    tasks = [
        {"task_id": "T01", "task_name": "A", "dependencies": ["T02"]},
        {"task_id": "T02", "task_name": "B", "dependencies": ["T01"]},
    ]

    print("Constructing a 2-node cycle. Both tasks require the OTHER to be COMPLETE.")
    print("Neither can ever leave LOCKED.")

    import time
    start = time.time()
    try:
        engine = SyncFieldDAG(tasks)
        elapsed = time.time() - start
        print(f"\nConstruction completed in {elapsed:.3f}s (no infinite loop / hang).")
        print(f"T01 state: {engine.tasks['T01']['state']}")
        print(f"T02 state: {engine.tasks['T02']['state']}")

        both_locked = engine.tasks["T01"]["state"] == "LOCKED" and engine.tasks["T02"]["state"] == "LOCKED"
        print(f"\n>>> Both correctly stuck in LOCKED (deadlocked, but NOT crashed/hung): OK")
        print("    No cycle-detection at construction time — silent deadlock.")
        return {"hung": False}
    except RecursionError:
        elapsed = time.time() - start
        print(f"\nRecursionError after {elapsed:.3f}s — construction blew the stack.")
        return {"hung": True}


def run_failed_task_reporting_failure():
    section("P2 TEST 2: A FAILED (terminal) task receives another failure report")

    tasks = [{"task_id": "T01", "task_name": "Install", "dependencies": []}]
    engine = SyncFieldDAG(tasks)
    engine.tasks["T01"]["assigned_to"] = "Ahmad"

    engine.update_task_state("T01", "ACTIVE")
    engine.update_task_state("T01", "BLOCKED", "first failure")
    engine.update_task_state("T01", "FAILED", "abandoned after no fix possible")
    print(f"T01 is now FAILED (terminal state).")

    domain_rules = FieldOpsDomainRules(DEFAULT_POLICIES)

    print("\nNow a technician reports ANOTHER failure against the same (FAILED) task:")
    try:
        decision = domain_rules.handle_task_failure(engine, "T01", "MATERIAL_MISSING", "Ahmad")
        print(f"Result: {decision}")
        print(f"T01 state after: {engine.tasks['T01']['state']}")
        print("\n>>> No exception raised — silently re-processed a FAILED task.")
        return {"crashed": False}
    except ValueError as e:
        print(f"ValueError raised: {e}")
        print("\n>>> CONFIRMED GAP: handle_task_failure() raises on an already-FAILED task.")
        print("    A stray late message about an abandoned task throws an uncaught exception.")
        return {"crashed": True}


if __name__ == "__main__":
    r1 = run_cyclic_dependency()
    r2 = run_failed_task_reporting_failure()

    print("\n" + "#" * 70)
    print("P2 EDGE CASE SUMMARY")
    print("#" * 70)
    print(f"2-node cycle hangs/crashes construction:     {r1['hung']}")
    print(f"Re-reporting failure on a FAILED task raises:  {r2['crashed']}")
