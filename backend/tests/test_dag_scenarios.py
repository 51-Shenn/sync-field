from backend.workflow.dag_engine.dag_engine import SyncFieldDAG, FieldOpsDomainRules
from backend.optimization.vrp_solver.solver import VRPSolver, Assignment
from backend.integrations.notifications.stub import StubNotifier
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher
from datetime import datetime, timedelta

if __name__ == "__main__":
    current_time = datetime.now()

    # --- Technician profiles (lat/lng = Kuala Lumpur coords) ---
    technicians_db = {
        "Ahmad_Wireman": {
            "lat": 3.120, "lng": 101.655,
            "skills": ["cabling", "termination"],
            "shift_end_hour": 18,
            "van_inventory": {"cat6_drum": 1, "rg59_drum": 1},
        },
        "Ravi_Mounting_Specialist": {
            "lat": 3.125, "lng": 101.660,
            "skills": ["mounting", "alignment"],
            "shift_end_hour": 18,
            "van_inventory": {"ladder": 1, "drill": 1},
        },
        "Zul_IT_Tech": {
            "lat": 3.118, "lng": 101.658,
            "skills": ["networking", "config"],
            "shift_end_hour": 18,
            "van_inventory": {"laptop": 1, "switch": 1},
        },
        "Haziq_Handover_Specialist": {
            "lat": 3.122, "lng": 101.662,
            "skills": ["testing", "commissioning"],
            "shift_end_hour": 17,
            "van_inventory": {"test_kit": 1},
        },
        # Extra technicians already at Site B
        "Mei_Ling_Cabler": {
            "lat": 3.150, "lng": 101.700,
            "skills": ["cabling", "termination"],
            "shift_end_hour": 18,
            "van_inventory": {"cat6_drum": 2, "rg59_drum": 1},
        },
    }

    # --- Site A: Wisma Bangsar (main DAG) ---
    wisma_tasks = [
        {"task_id": "T01", "task_name": "Site Survey & Marking Point", "dependencies": [], "deadline": current_time + timedelta(days=5), "lat": 3.120, "lng": 101.655, "estimated_duration_hours": 2},
        {"task_id": "T02", "task_name": "Pasang PVC Conduit & Trunking", "dependencies": ["T01"], "deadline": current_time + timedelta(days=6), "lat": 3.120, "lng": 101.655, "estimated_duration_hours": 3},
        {"task_id": "T03", "task_name": "Tarik Kabel Cat6 & RG59", "dependencies": ["T02"], "deadline": current_time + timedelta(days=8), "lat": 3.120, "lng": 101.655, "estimated_duration_hours": 4, "required_skills": ["cabling"], "required_materials_qty": {"cat6_drum": 1, "rg59_drum": 1}},
        {"task_id": "T04", "task_name": "Mounting Bracket & Camera Install", "dependencies": ["T03"], "deadline": current_time + timedelta(days=9), "lat": 3.120, "lng": 101.655, "estimated_duration_hours": 3, "required_skills": ["mounting"]},
        {"task_id": "T05", "task_name": "Server Rack & NVR/Switch Setup", "dependencies": ["T03"], "deadline": current_time + timedelta(days=10), "lat": 3.120, "lng": 101.655, "estimated_duration_hours": 2, "required_skills": ["networking"]},
        {"task_id": "T06", "task_name": "Cable Termination & Crimping RJ45", "dependencies": ["T04", "T05"], "deadline": current_time + timedelta(days=11), "lat": 3.120, "lng": 101.655, "estimated_duration_hours": 3, "required_skills": ["termination"]},
        {"task_id": "T07", "task_name": "IP Network Configuration & NVR Setup", "dependencies": ["T06"], "deadline": current_time + timedelta(days=12), "lat": 3.120, "lng": 101.655, "estimated_duration_hours": 2, "required_skills": ["networking", "config"]},
        {"task_id": "T08", "task_name": "Testing, Commissioning & Handover", "dependencies": ["T07"], "deadline": current_time + timedelta(days=14), "lat": 3.120, "lng": 101.655, "estimated_duration_hours": 3, "required_skills": ["testing", "commissioning"]},
    ]

    # --- Site B: Another site with independent READY tasks ---
    site_b_tasks = [
        {"task_id": "S01", "task_name": "Pull Cable at Site B", "dependencies": [], "deadline": current_time + timedelta(days=4), "lat": 3.150, "lng": 101.700, "estimated_duration_hours": 3, "required_skills": ["cabling"], "required_materials_qty": {"cat6_drum": 1}},
        {"task_id": "S02", "task_name": "Mount Cameras at Site B", "dependencies": [], "deadline": current_time + timedelta(days=4), "lat": 3.150, "lng": 101.700, "estimated_duration_hours": 2, "required_skills": ["mounting"]},
        {"task_id": "S03", "task_name": "Configure NVR at Site B", "dependencies": [], "deadline": current_time + timedelta(days=5), "lat": 3.150, "lng": 101.700, "estimated_duration_hours": 1, "required_skills": ["networking", "config"]},
    ]

    all_tasks = wisma_tasks + site_b_tasks
    engine = SyncFieldDAG(all_tasks)

    engine.tasks["T03"]["assigned_to"] = "Ahmad_Wireman"
    engine.tasks["T04"]["assigned_to"] = "Ravi_Mounting_Specialist"
    engine.tasks["T05"]["assigned_to"] = "Zul_IT_Tech"
    engine.tasks["T08"]["assigned_to"] = "Haziq_Handover_Specialist"

    solver = VRPSolver(engine, technicians_db)
    notifier = StubNotifier()
    dispatcher = FieldOpsDispatcher(engine, solver, notifier)

    engine.update_task_state("T01", "ACTIVE", "Starting survey")
    engine.update_task_state("T01", "COMPLETE", "Survey complete")
    engine.update_task_state("T02", "ACTIVE", "Fitting pipes")
    engine.update_task_state("T02", "COMPLETE", "Pipes fitted")

    print("=== SCENARIO 1: Cascade + Joint VRP Reassignment ===")
    engine.update_task_state("T03", "ACTIVE", "Ahmad on site, starting cable run")
    decision = dispatcher.process_failure_report(
        task_id="T03", failure_type="MATERIAL_MISSING", technician_id="Ahmad_Wireman"
    )

    print(f"\nAction: {decision['action']}")
    print(f"Details: {decision['msg']}")
    print(f"Rerouting results: {decision.get('rerouting_results', [])}")

    print("\n=== SCENARIO 2: Technical Failure & Retry Escalation (Site A) ===")
    print("\n🛠️ [Resupply] Cable delivered. T03 complete.")
    engine.update_task_state("T03", "ACTIVE", "Continuing cable run")
    engine.update_task_state("T03", "COMPLETE", "Cable run done")

    engine.update_task_state("T04", "ACTIVE")
    engine.update_task_state("T04", "COMPLETE")
    engine.update_task_state("T05", "ACTIVE")
    engine.update_task_state("T05", "COMPLETE")
    engine.update_task_state("T06", "ACTIVE")
    engine.update_task_state("T06", "COMPLETE")

    engine.update_task_state("T07", "ACTIVE", "Zul configuring IP")
    d1 = dispatcher.process_failure_report(
        task_id="T07", failure_type="IP_CONFLICT", technician_id="Zul_IT_Tech"
    )
    print(f"\nAttempt 1 Action: {d1['action']} — {d1['msg']}")
    print(f"Priority Score for T07: {engine.compute_priority('T07').score}")

    print("\n❌ Zul's second attempt to configure fails.")
    d2 = dispatcher.process_failure_report(
        task_id="T07", failure_type="IP_CONFLICT", technician_id="Zul_IT_Tech"
    )
    print(f"\nAttempt 2 Action: {d2['action']} — {d2['msg']}")
    print(f"Escalating to: {d2['escalate_to_role']}")
    print(f"Rerouting results: {d2.get('rerouting_results', [])}")

    print("\n--- Final task assignments ---")
    for t_id, t in sorted(engine.tasks.items()):
        if t.get("assigned_to") or t["state"] != "LOCKED":
            print(f"  {t_id}: state={t['state']}, assigned_to={t.get('assigned_to', '-')}")
