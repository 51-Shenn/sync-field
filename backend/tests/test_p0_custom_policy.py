"""
P0 — Custom FailurePolicy injection.

The dispatcher exposes FieldOpsDispatcher(..., policies=custom_policies) as
a configuration point, but DEFAULT_POLICIES is the only thing ever exercised.
This test builds a CUSTOM policy set (different retry counts, different
escalation roles) and verifies the dispatcher actually obeys it.

Run: PYTHONPATH=. python -m backend.tests.test_p0_custom_policy
"""
from backend.workflow.dag_engine.dag_engine import SyncFieldDAG, FailurePolicy
from backend.optimization.vrp_solver.solver import VRPSolver
from backend.integrations.notifications.stub import StubNotifier
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def run():
    section("P0: Custom FailurePolicy — TECHNICAL retries 3x instead of default 1x")

    tasks = [{"task_id": "T01", "task_name": "IP Setup", "dependencies": []}]
    engine = SyncFieldDAG(tasks)
    engine.tasks["T01"]["assigned_to"] = "Zul_IT_Tech"

    custom_policies = {
        "RESOURCE":  FailurePolicy("RESOURCE",  "procurement_lead",   max_local_retries=0, urgency_weight=8.0),
        "SITE":      FailurePolicy("SITE",      "project_manager",    max_local_retries=0, urgency_weight=10.0),
        "TECHNICAL": FailurePolicy("TECHNICAL", "senior_network_lead", max_local_retries=3, urgency_weight=20.0),
        "QUALITY":   FailurePolicy("QUALITY",   "site_supervisor",    max_local_retries=0, urgency_weight=5.0),
    }

    solver = VRPSolver(engine, {"Zul_IT_Tech": {"skills": [], "lat": 0, "lng": 0}})
    notifier = StubNotifier()
    dispatcher = FieldOpsDispatcher(engine, solver, notifier, policies=custom_policies)

    engine.update_task_state("T01", "ACTIVE", "Zul starts config")

    actions = []
    for attempt in range(1, 5):
        decision = dispatcher.process_failure_report("T01", "IP_CONFLICT", "Zul_IT_Tech")
        actions.append(decision["action"])
        print(f"Attempt {attempt}: action={decision['action']}, "
              f"escalate_to_role={decision.get('escalate_to_role', 'n/a')}")
        if decision["action"] == "ESCALATE":
            break
        engine.tasks["T01"]["state"] = "ACTIVE"

    print(f"\nAction sequence: {actions}")
    expected = ["RETRY_LOCAL", "RETRY_LOCAL", "RETRY_LOCAL", "ESCALATE"]
    retries_ok = actions == expected
    print(f"\n>>> Retry count honored custom policy (expected {expected}): {'PASS' if retries_ok else 'FAIL'}")

    return {"retries_ok": retries_ok, "actions": actions}


def run_role_check():
    section("P0 (continued): verify escalation role comes from the CUSTOM policy")

    tasks = [{"task_id": "T01", "task_name": "IP Setup", "dependencies": []}]
    engine = SyncFieldDAG(tasks)
    engine.tasks["T01"]["assigned_to"] = "Zul_IT_Tech"

    custom_policies = {
        "RESOURCE":  FailurePolicy("RESOURCE",  "procurement_lead",   max_local_retries=0, urgency_weight=8.0),
        "SITE":      FailurePolicy("SITE",      "project_manager",    max_local_retries=0, urgency_weight=10.0),
        "TECHNICAL": FailurePolicy("TECHNICAL", "senior_network_lead", max_local_retries=0, urgency_weight=20.0),
        "QUALITY":   FailurePolicy("QUALITY",   "site_supervisor",    max_local_retries=0, urgency_weight=5.0),
    }

    solver = VRPSolver(engine, {"Zul_IT_Tech": {"skills": [], "lat": 0, "lng": 0}})
    dispatcher = FieldOpsDispatcher(engine, solver, StubNotifier(), policies=custom_policies)

    engine.update_task_state("T01", "ACTIVE")
    decision = dispatcher.process_failure_report("T01", "IP_CONFLICT", "Zul_IT_Tech")

    print(f"Action: {decision['action']}")
    print(f"Escalated to: {decision.get('escalate_to_role')}")

    expected_role = "senior_network_lead"
    role_ok = decision.get("escalate_to_role") == expected_role
    immediate_escalate_ok = decision["action"] == "ESCALATE"

    print(f"\n>>> Escalation role matches custom policy ({expected_role}): "
          f"{'PASS' if role_ok else 'FAIL'} (got {decision.get('escalate_to_role')})")
    print(f">>> max_local_retries=0 caused immediate escalation: "
          f"{'PASS' if immediate_escalate_ok else 'FAIL'}")

    return {"role_ok": role_ok, "immediate_escalate_ok": immediate_escalate_ok}


if __name__ == "__main__":
    r1 = run()
    r2 = run_role_check()
    print("\n" + "#" * 70)
    all_pass = r1["retries_ok"] and r2["role_ok"] and r2["immediate_escalate_ok"]
    print(f"P0 CUSTOM FAILURE POLICY: {'ALL PASS' if all_pass else 'FAILURES FOUND'}")
    print("#" * 70)
