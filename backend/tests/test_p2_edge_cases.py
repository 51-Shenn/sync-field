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

    print("Constructing a 2-node cycle. Engine should reject this at construction time.")

    import time
    start = time.time()
    try:
        engine = SyncFieldDAG(tasks)
        elapsed = time.time() - start
        print(f"\nUnexpectedly SUCCEEDED in {elapsed:.3f}s — silent deadlock accepted.")
        print(f"T01 state: {engine.tasks['T01']['state']}")
        print(f"T02 state: {engine.tasks['T02']['state']}")
        return {"hung": False, "rejected": False}
    except ValueError as e:
        elapsed = time.time() - start
        print(f"\nCorrectly rejected in {elapsed:.3f}s: {e}")
        return {"hung": False, "rejected": True}


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
    decision = domain_rules.handle_task_failure(engine, "T01", "MATERIAL_MISSING", "Ahmad")
    print(f"Result: action={decision['action']}, msg={decision['msg']}")
    print(f"T01 state after: {engine.tasks['T01']['state']} (unchanged)")

    guarded = decision["action"] == "ALREADY_FAILED" and engine.tasks["T01"]["state"] == "FAILED"
    print(f"\n>>> {'PASS' if guarded else 'FAIL'}: ALREADY_FAILED guard correctly no-ops without exception")
    return {"crashed": False, "guarded": guarded}


if __name__ == "__main__":
    r1 = run_cyclic_dependency()
    r2 = run_failed_task_reporting_failure()

    print("\n" + "#" * 70)
    print("P2 EDGE CASE SUMMARY")
    print("#" * 70)
    print(f"2-node cycle correctly rejected at construction: {r1['rejected']}")
    print(f"FAILED re-report guarded with ALREADY_FAILED:    {r2['guarded']}")
