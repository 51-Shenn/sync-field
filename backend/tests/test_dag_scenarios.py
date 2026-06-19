from backend.workflow.dag_engine.dag_engine import SyncFieldDAG, FieldOpsDomainRules
from backend.optimization.vrp_solver.stub import StubVRPSolver
from backend.integrations.notifications.stub import StubNotifier
from backend.workflow.event_handlers.dispatcher import dispatch_decision
from datetime import datetime, timedelta

if __name__ == "__main__":
    current_time = datetime.now()
    wisma_tasks = [
        {"task_id": "T01", "task_name": "Site Survey & Marking Point", "dependencies": [], "deadline": current_time + timedelta(days=5)},
        {"task_id": "T02", "task_name": "Pasang PVC Conduit & Trunking", "dependencies": ["T01"], "deadline": current_time + timedelta(days=6)},
        {"task_id": "T03", "task_name": "Tarik Kabel Cat6 & RG59", "dependencies": ["T02"], "deadline": current_time + timedelta(days=8)},
        {"task_id": "T04", "task_name": "Mounting Bracket & Camera Install", "dependencies": ["T03"], "deadline": current_time + timedelta(days=9)},
        {"task_id": "T05", "task_name": "Server Rack & NVR/Switch Setup", "dependencies": ["T03"], "deadline": current_time + timedelta(days=10)},
        {"task_id": "T06", "task_name": "Cable Termination & Crimping RJ45", "dependencies": ["T04", "T05"], "deadline": current_time + timedelta(days=11)},
        {"task_id": "T07", "task_name": "IP Network Configuration & NVR Setup", "dependencies": ["T06"], "deadline": current_time + timedelta(days=12)},
        {"task_id": "T08", "task_name": "Testing, Commissioning & Handover", "dependencies": ["T07"], "deadline": current_time + timedelta(days=14)}
    ]

    engine = SyncFieldDAG(wisma_tasks)

    engine.tasks["T03"]["assigned_to"] = "Ahmad_Wireman"
    engine.tasks["T04"]["assigned_to"] = "Ravi_Mounting_Specialist"
    engine.tasks["T05"]["assigned_to"] = "Zul_IT_Tech"
    engine.tasks["T08"]["assigned_to"] = "Haziq_Handover_Specialist"

    vrp = StubVRPSolver(engine)
    notifier = StubNotifier()

    engine.update_task_state("T01", "ACTIVE", "Starting survey")
    engine.update_task_state("T01", "COMPLETE", "Survey complete")
    engine.update_task_state("T02", "ACTIVE", "Fitting pipes")
    engine.update_task_state("T02", "COMPLETE", "Pipes fitted")

    print("\n=== SCENARIO 1: Downstream Impact of a Material Delay ===")
    engine.update_task_state("T03", "ACTIVE", "Ahmad on site, starting cable run")
    failure_report = FieldOpsDomainRules.handle_task_failure(
        engine, task_id="T03", failure_type="MATERIAL_MISSING", technician_id="Ahmad_Wireman"
    )

    print(f"\nDecision Result: {failure_report['action']}")
    print(f"Details: {failure_report['msg']}")

    print("\n--- Dispatch: acting on the escalation ---")
    dispatch_decision(engine, failure_report, vrp, notifier)

    print("\n\U0001f6e0\ufe0f [Resupply] Cable delivered. T03 complete.")
    engine.update_task_state("T03", "ACTIVE", "Continuing cable run")
    engine.update_task_state("T03", "COMPLETE", "Cable run done")

    engine.update_task_state("T04", "ACTIVE")
    engine.update_task_state("T04", "COMPLETE")
    engine.update_task_state("T05", "ACTIVE")
    engine.update_task_state("T05", "COMPLETE")
    engine.update_task_state("T06", "ACTIVE")
    engine.update_task_state("T06", "COMPLETE")

    print("\n=== SCENARIO 2: Technical Failure & Retry Escalation ===")
    engine.update_task_state("T07", "ACTIVE", "Zul configuring IP")
    decision_1 = FieldOpsDomainRules.handle_task_failure(
        engine, task_id="T07", failure_type="IP_CONFLICT", technician_id="Zul_IT_Tech"
    )
    print(f"\nAttempt 1 Action: {decision_1['action']}")
    print(f"Attempt 1 Message: {decision_1['msg']}")

    print("\n--- Dispatch: retry notification ---")
    dispatch_decision(engine, decision_1, vrp, notifier)

    print(f"\nCurrent Priority Score for T07: {engine.compute_priority('T07').score}")

    print("\n\u274c Zul's second attempt to configure fails.")
    decision_2 = FieldOpsDomainRules.handle_task_failure(
        engine, task_id="T07", failure_type="IP_CONFLICT", technician_id="Zul_IT_Tech"
    )
    print(f"\nAttempt 2 Action: {decision_2['action']}")
    print(f"Attempt 2 Message: {decision_2['msg']}")
    print(f"Escalating to: {decision_2['escalate_to_role']}")

    print("\n--- Dispatch: escalation + VRP reroute ---")
    dispatch_decision(engine, decision_2, vrp, notifier)
