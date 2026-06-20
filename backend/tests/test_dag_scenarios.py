from backend.workflow.dag_engine.dag_engine import SyncFieldDAG
from backend.optimization.vrp_solver.solver import VRPSolver, Assignment
from backend.integrations.notifications.stub import StubNotifier
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher
from backend.workflow.parser.parser import FieldOpsParser
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

    # --- SCENARIO 3: Absence Handling ---
    print("\n\n=== SCENARIO 3: Technician Absence ===")
    fresh_tasks = [{**t, "state": "LOCKED", "assigned_to": None, "attempt_count": 0, "failure_category": None} for t in all_tasks]
    engine2 = SyncFieldDAG(fresh_tasks)
    engine2.tasks["T01"]["assigned_to"] = "Ahmad_Wireman"
    engine2.update_task_state("T01", "ACTIVE", "Ahmad starts work")
    engine2.tasks["S01"]["assigned_to"] = "Mei_Ling_Cabler"
    engine2.update_task_state("S01", "ACTIVE", "Mei Ling pulling cable")

    solver2 = VRPSolver(engine2, technicians_db)
    notifier2 = StubNotifier()
    dispatcher2 = FieldOpsDispatcher(engine2, solver2, notifier2)

    result = dispatcher2.handle_absence("Ahmad_Wireman")
    print(f"\nFreed tasks: {result['freed_tasks']}")
    print(f"Reassignments: {result['assignments']}")
    print(f"T01 state: {engine2.tasks['T01']['state']}, assigned_to: {engine2.tasks['T01'].get('assigned_to')}")

    assert engine2.tasks["T01"]["state"] == "READY", f"Expected READY, got {engine2.tasks['T01']['state']}"
    assert engine2.tasks["T01"].get("assigned_to") != "Ahmad_Wireman", "T01 should not still have Ahmad as assignee after absence"
    assert engine2.tasks["S01"].get("assigned_to") == "Mei_Ling_Cabler", "S01 should still be with Mei Ling"

    # --- SCENARIO 4: Parser (3-Tier) ---
    print("\n\n=== SCENARIO 4: Parser ===")
    parser = FieldOpsParser()

    # Tier 1: JSON
    r1 = parser.parse('{"task_id": "T03", "failure_type": "MATERIAL_MISSING", "technician_id": "Ahmad"}', "dummy")
    assert r1.tier == 1, f"Expected tier 1, got tier {r1.tier}"
    assert r1.task_id == "T03"
    assert r1.failure_type == "MATERIAL_MISSING"
    print(f"Tier 1 (JSON): {r1}")

    # Tier 1: Command
    r2 = parser.parse("report T03 MATERIAL_MISSING by Ahmad", "dummy")
    assert r2.tier == 1, f"Expected tier 1, got tier {r2.tier}"
    assert r2.failure_type == "MATERIAL_MISSING"
    print(f"Tier 1 (Command): {r2}")

    # Tier 2: Keyword
    r3 = parser.parse("T03 cannot proceed because no material available at site", "Ahmad")
    assert r3.tier == 2, f"Expected tier 2, got tier {r3.tier}"
    assert r3.failure_type == "MATERIAL_MISSING"
    print(f"Tier 2 (Keyword): {r3}")

    # Tier 2: active_task_id fallback — single-word msg with no task ID
    r3b = parser.parse("Koyak.", technician_id="Din", active_task_id="T03")
    assert r3b.tier == 2, f"Expected tier 2, got tier {r3b.tier}"
    assert r3b.task_id == "T03", f"Expected T03 from active_task_id, got {r3b.task_id}"
    assert r3b.failure_type == "TOOL_MISSING"
    print(f"Tier 2 (active_task_id fallback): {r3b}")

    # Tier 2: Manglish — Patah
    r_ml1 = parser.parse("T05 drill patah", "Zul")
    assert r_ml1.tier == 2, f"Expected tier 2, got tier {r_ml1.tier}"
    assert r_ml1.failure_type == "TOOL_DAMAGED"
    print(f"Tier 2 (Manglish - Patah): {r_ml1}")

    # Tier 2: Manglish — Blank
    r_ml2 = parser.parse("T06 cable tester blank no pulse", "Haziq")
    assert r_ml2.tier == 2
    assert r_ml2.failure_type == "TEST_FAILED"
    print(f"Tier 2 (Manglish - Blank): {r_ml2}")

    # Tier 2: Manglish — Takleh login
    r_ml3 = parser.parse("T07 takleh login ip crash", "Zul")
    assert r_ml3.tier == 2
    assert r_ml3.failure_type == "IP_CONFLICT"
    print(f"Tier 2 (Manglish - Takleh login): {r_ml3}")

    # Tier 2: Manglish — stok kosong
    r_ml4 = parser.parse("T03 stok kosong, habis", "Ahmad")
    assert r_ml4.tier == 2
    assert r_ml4.failure_type == "MATERIAL_MISSING"
    print(f"Tier 2 (Manglish - Habis): {r_ml4}")

    # Tier 2: Malay
    r4 = parser.parse("T04 tool rosak, drill not working", "Ravi")
    assert r4.tier == 2, f"Expected tier 2, got tier {r4.tier}"
    assert r4.failure_type == "TOOL_DAMAGED"
    print(f"Tier 2 (Malay): {r4}")

    # Tier 3: LLM stub
    r5 = parser.parse("something completely ambiguous and unparsable", "Zul")
    assert r5.tier == 3, f"Expected tier 3, got tier {r5.tier}"
    print(f"Tier 3 (LLM stub): {r5}")

    # --- SCENARIO 5: Cascade ETA with 3 Confidence Levels ---
    print("\n\n=== SCENARIO 5: Cascade ETA Propagation ===")
    eta_tasks = [{**t, "state": "LOCKED", "assigned_to": None, "attempt_count": 0, "failure_category": None} for t in all_tasks]
    engine5 = SyncFieldDAG(eta_tasks)

    engine5.update_task_state("T01", "ACTIVE")
    engine5.update_task_state("T01", "COMPLETE")
    engine5.update_task_state("T02", "ACTIVE")
    engine5.update_task_state("T02", "COMPLETE")
    engine5.update_task_state("T03", "ACTIVE")
    engine5.tasks["T03"]["blocked_since"] = datetime.now()
    engine5.update_task_state("T03", "BLOCKED", "material missing")

    # Case A: No resolution ETA → all UNKNOWN
    eta_a = engine5.compute_cascade_eta("T03")
    print("\nCase A: No resolution ETA set")
    for t_id in ["T03", "T04", "T05", "T06", "T07", "T08"]:
        conf = eta_a[t_id]["eta_confidence"]
        print(f"  {t_id}: confidence={conf}")
        assert conf == "UNKNOWN", f"Expected UNKNOWN for {t_id}, got {conf}"

    # Case B: Set T03 resolution_eta → all EXACT
    tomorrow_9am = datetime.now() + timedelta(days=1)
    tomorrow_9am = tomorrow_9am.replace(hour=9, minute=0, second=0, microsecond=0)
    engine5.tasks["T03"]["resolution_eta"] = tomorrow_9am
    engine5.tasks["T03"]["eta_confidence"] = "EXACT"

    eta_b = engine5.compute_cascade_eta("T03")
    print("\nCase B: T03 resolution_eta = tomorrow 9am (EXACT)")
    for t_id in ["T03", "T04", "T05", "T06", "T07", "T08"]:
        start = eta_b[t_id]["earliest_start"]
        conf = eta_b[t_id]["eta_confidence"]
        print(f"  {t_id}: confidence={conf}, start={start.strftime('%d %b %H:%M') if start else 'None'}")
        assert conf == "EXACT", f"Expected EXACT for {t_id}, got {conf}"
        assert start is not None, f"Expected start time for {t_id}"

    # T04 and T05 are parallel children of T03
    t03_duration = engine5.tasks["T03"]["estimated_duration_hours"]
    expected_t04_start = tomorrow_9am + timedelta(hours=t03_duration)
    assert eta_b["T04"]["earliest_start"] == expected_t04_start
    assert eta_b["T05"]["earliest_start"] == expected_t04_start

    # T06 depends on both T04 and T05
    t04_duration = engine5.tasks["T04"]["estimated_duration_hours"]
    t05_duration = engine5.tasks["T05"]["estimated_duration_hours"]
    latest_t04_t05 = max(t04_duration, t05_duration)
    expected_t06_start = expected_t04_start + timedelta(hours=latest_t04_t05)
    assert eta_b["T06"]["earliest_start"] == expected_t06_start

    print("\n  Cascade timing verified: T04/T05 start = T03 finish, T06 starts after max(T04, T05)")

    print("\n" + "=" * 60)
    print("ALL SCENARIOS PASSED")
    print("=" * 60)
