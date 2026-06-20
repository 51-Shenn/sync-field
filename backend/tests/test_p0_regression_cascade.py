"""
P0 — Reverse cascade: COMPLETE -> REGRESSED propagation through descendants
that are themselves already COMPLETE.

This is the test the user correctly identified as missing and as the single
most important one: every cascade test so far drove failures FORWARD from
a node that hadn't finished yet. This test instead completes an ENTIRE
multi-layer chain first, then regresses a node in the MIDDLE, and checks
that every downstream node that was COMPLETE flips to REGRESSED -- which is
the actual claim behind "bidirectional DAG."

Run: PYTHONPATH=. python -m backend.tests.test_p0_regression_cascade
"""
from backend.workflow.dag_engine.dag_engine import SyncFieldDAG


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def build_chain():
    tasks = [
        {"task_id": "A", "task_name": "Survey", "dependencies": []},
        {"task_id": "B", "task_name": "Conduit", "dependencies": ["A"]},
        {"task_id": "C", "task_name": "CableRun", "dependencies": ["B"]},
        {"task_id": "D", "task_name": "RackSetup", "dependencies": ["B"]},
        {"task_id": "E", "task_name": "Termination", "dependencies": ["C", "D"]},
    ]
    return SyncFieldDAG(tasks)


def run():
    section("P0 TEST 1: Full completion, then regress B mid-chain")

    engine = build_chain()
    for t_id in ["A", "B", "C", "D", "E"]:
        engine.update_task_state(t_id, "ACTIVE")
        engine.update_task_state(t_id, "COMPLETE")

    print("\nAll tasks COMPLETE. States:")
    for t_id in ["A", "B", "C", "D", "E"]:
        print(f"  {t_id}: {engine.tasks[t_id]['state']}")

    print("\nNow regressing B (e.g. inspection finds the conduit was never actually installed):")
    events = engine.update_task_state("B", "REGRESSED", "Inspection found conduit missing")

    print(f"\n{len(events)} events generated:")
    for e in events:
        print(f"  depth={e.get('depth')} | {e['task_id']:<3} | {e['old_state']:<10} -> {e['new_state']:<10} | {e['reason']}")

    print("\nFinal states:")
    failures = []
    expected = {"A": "COMPLETE", "B": "REGRESSED", "C": "REGRESSED", "D": "REGRESSED", "E": "REGRESSED"}
    for t_id, exp in expected.items():
        actual = engine.tasks[t_id]["state"]
        status = "OK" if actual == exp else "FAIL"
        if status == "FAIL":
            failures.append(t_id)
        print(f"  {t_id}: {actual} (expected {exp}) [{status}]")

    if failures:
        print(f"\n>>> P0 FAILURE: nodes {failures} did not regress correctly.")
        print(">>> This means 'bidirectional DAG' is not actually proven for multi-layer chains.")
    else:
        print("\n>>> P0 PASS: COMPLETE descendants correctly cascade to REGRESSED, "
              "multiple layers deep, through a multi-parent join (E depends on both C and D).")

    return {"failures": failures}


def run_partial_regression():
    section("P0 TEST 2: Partial regression — only one of two parents regresses")

    engine = build_chain()
    for t_id in ["A", "B", "C", "D", "E"]:
        engine.update_task_state(t_id, "ACTIVE")
        engine.update_task_state(t_id, "COMPLETE")

    print("Regressing C only (D stays COMPLETE). E depends on both C AND D.")
    engine.update_task_state("C", "REGRESSED", "Cable damaged, found during QA")

    print(f"\nD state (should remain COMPLETE, untouched): {engine.tasks['D']['state']}")
    print(f"E state (should regress, since C is one of its deps): {engine.tasks['E']['state']}")

    ok = engine.tasks["D"]["state"] == "COMPLETE" and engine.tasks["E"]["state"] == "REGRESSED"
    print(f"\n>>> {'PASS' if ok else 'FAIL'}: partial-parent regression correctly handled = {ok}")
    return {"pass": ok}


if __name__ == "__main__":
    r1 = run()
    r2 = run_partial_regression()
    print("\n" + "#" * 70)
    print(f"P0 REGRESSION CASCADE: {'ALL PASS' if not r1['failures'] and r2['pass'] else 'FAILURES FOUND'}")
    print("#" * 70)
