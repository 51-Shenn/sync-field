"""
Test 2 — End-to-end multi-site simulation against realistic, partially
incomplete data, including an absence event and the all-COMPLETE ETA case.

Run: PYTHONPATH=. python -m backend.tests.test_simulation_realworld
"""
from datetime import datetime, timedelta

from backend.workflow.dag_engine.dag_engine import SyncFieldDAG, DEFAULT_POLICIES
from backend.optimization.vrp_solver.solver import VRPSolver
from backend.integrations.notifications.stub import StubNotifier
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher
from backend.tests.fixtures import (
    wisma_bangsar_tasks, site_b_tasks, site_c_incomplete_tasks, technicians_db,
)


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def run():
    all_tasks = wisma_bangsar_tasks() + site_b_tasks() + site_c_incomplete_tasks()

    section("SETUP: building DAG with intentionally incomplete Site C data")
    try:
        engine = SyncFieldDAG(all_tasks)
    except Exception as e:
        print(f"CRASH on construction with incomplete data: {e!r}")
        raise

    print("Engine built successfully despite missing deadline/lat/lng/skills on Site C tasks.")
    print(f"Total tasks loaded: {len(engine.tasks)}")

    tech_db = technicians_db()
    solver = VRPSolver(engine, tech_db)
    notifier = StubNotifier()
    dispatcher = FieldOpsDispatcher(engine, solver, notifier, policies=DEFAULT_POLICIES)

    engine.tasks["T03"]["assigned_to"] = "Ahmad_Wireman"
    engine.tasks["T04"]["assigned_to"] = "Ravi_Mounting_Specialist"
    engine.tasks["T05"]["assigned_to"] = "Zul_IT_Tech"
    engine.tasks["T08"]["assigned_to"] = "Haziq_Handover_Specialist"

    section("PHASE 1: Normal progress on Site C despite missing fields")
    try:
        engine.update_task_state("C01", "ACTIVE", "Starting survey, no deadline on record")
        engine.update_task_state("C01", "COMPLETE", "Survey done")
        engine.update_task_state("C02", "ACTIVE", "Cable run, no deadline on record either")
        print("C01 -> C02 transitions succeeded with missing deadline/lat/lng fields.")
    except Exception as e:
        print(f"CRASH during incomplete-data transitions: {e!r}")
        raise

    p = engine.compute_priority("C02")
    print(f"Priority score for C02 (no deadline data): {p.score}, "
          f"days_to_deadline={p.days_to_deadline} (expect None, not a crash)")

    section("PHASE 2: Standard cascade — material missing on T03 (Wisma Bangsar)")
    engine.update_task_state("T01", "ACTIVE"); engine.update_task_state("T01", "COMPLETE")
    engine.update_task_state("T02", "ACTIVE"); engine.update_task_state("T02", "COMPLETE")
    engine.update_task_state("T03", "ACTIVE", "Ahmad on site")

    decision = dispatcher.process_failure_report("T03", "MATERIAL_MISSING", "Ahmad_Wireman")
    print(f"Action: {decision['action']}")
    print(f"Rerouting results: {decision.get('rerouting_results', [])}")
    eta_t03 = decision.get("cascade_eta", {}).get("T03", {})
    print(f"T03 cascade ETA: confidence={eta_t03.get('eta_confidence')}, "
          f"reason={eta_t03.get('reason', 'n/a')}")

    section("PHASE 3: Technician absence mid-simulation (Zul, holding T05)")
    print(f"Before absence — T05 assigned_to: {engine.tasks['T05'].get('assigned_to')}, "
          f"state: {engine.tasks['T05']['state']}")

    absence_result = dispatcher.handle_absence("Zul_IT_Tech")
    print(f"Freed tasks: {absence_result['freed_tasks']}")
    print(f"New assignments from re-solve: {absence_result['assignments']}")
    print(f"After absence — T05 assigned_to: {engine.tasks['T05'].get('assigned_to')}, "
          f"state: {engine.tasks['T05']['state']}")

    section("PHASE 4: Resupply, finish T03, T04, then verify all-COMPLETE ETA fix")
    engine.update_task_state("T03", "ACTIVE", "Cable resumed")
    engine.update_task_state("T03", "COMPLETE", "Cable run done")
    engine.update_task_state("T04", "ACTIVE")
    engine.update_task_state("T04", "COMPLETE")

    if engine.tasks["T05"]["state"] not in ("COMPLETE",):
        engine.update_task_state("T05", "ACTIVE")
        engine.update_task_state("T05", "COMPLETE")

    print(f"T04 state: {engine.tasks['T04']['state']}, T05 state: {engine.tasks['T05']['state']}")
    print("Both dependencies of T06 are now COMPLETE.")
    print("Calling compute_cascade_eta('T01') so T06 appears in the descendant chain:")

    eta_result = engine.compute_cascade_eta("T01")
    t06_eta = eta_result.get("T06", {})
    t06_conf = t06_eta.get("eta_confidence")
    print(f"\nT06 ETA result (as descendant of T01): confidence={t06_conf}, "
          f"reason={t06_eta.get('reason', 'n/a')}")

    if t06_conf == "UNKNOWN" and t06_eta.get("reason") == "No dependency data":
        print(">>> BUG CONFIRMED: all-COMPLETE deps still resolve to UNKNOWN.")
        return {"bug_reproduced": True}
    elif t06_conf == "EXACT":
        print(">>> BUG FIXED: all-COMPLETE deps correctly resolve to EXACT.")
        return {"bug_reproduced": False}
    else:
        print(f">>> Unexpected: T06 confidence = {t06_conf}")
        return {"bug_reproduced": None}


if __name__ == "__main__":
    result = run()
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"All-COMPLETE ETA bug reproduced: {result['bug_reproduced']}")
