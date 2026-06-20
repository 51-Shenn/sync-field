"""
Realistic fixture data for SyncField testing.
Mirrors actual field-ops chatter patterns: Manglish, single-word reports,
multi-site concurrent work, deliberately incomplete records (missing
deadlines, missing skills, missing coordinates) to exercise graceful
degradation rather than only the happy path.
"""
from datetime import datetime, timedelta

NOW = datetime.now()


def wisma_bangsar_tasks():
    """Primary CCTV install DAG — fully specified, used as the 'clean' baseline."""
    return [
        {"task_id": "T01", "task_name": "Site Survey & Marking Point", "dependencies": [],
         "deadline": NOW + timedelta(days=5), "lat": 3.120, "lng": 101.655,
         "estimated_duration_hours": 2},
        {"task_id": "T02", "task_name": "Pasang PVC Conduit & Trunking", "dependencies": ["T01"],
         "deadline": NOW + timedelta(days=6), "lat": 3.120, "lng": 101.655,
         "estimated_duration_hours": 3},
        {"task_id": "T03", "task_name": "Tarik Kabel Cat6 & RG59", "dependencies": ["T02"],
         "deadline": NOW + timedelta(days=8), "lat": 3.120, "lng": 101.655,
         "estimated_duration_hours": 4, "required_skills": ["cabling"],
         "required_materials_qty": {"cat6_drum": 1, "rg59_drum": 1}},
        {"task_id": "T04", "task_name": "Mounting Bracket & Camera Install", "dependencies": ["T03"],
         "deadline": NOW + timedelta(days=9), "lat": 3.120, "lng": 101.655,
         "estimated_duration_hours": 3, "required_skills": ["mounting"]},
        {"task_id": "T05", "task_name": "Server Rack & NVR/Switch Setup", "dependencies": ["T03"],
         "deadline": NOW + timedelta(days=10), "lat": 3.120, "lng": 101.655,
         "estimated_duration_hours": 2, "required_skills": ["networking"]},
        {"task_id": "T06", "task_name": "Cable Termination & Crimping RJ45", "dependencies": ["T04", "T05"],
         "deadline": NOW + timedelta(days=11), "lat": 3.120, "lng": 101.655,
         "estimated_duration_hours": 3, "required_skills": ["termination"]},
        {"task_id": "T07", "task_name": "IP Network Configuration & NVR Setup", "dependencies": ["T06"],
         "deadline": NOW + timedelta(days=12), "lat": 3.120, "lng": 101.655,
         "estimated_duration_hours": 2, "required_skills": ["networking", "config"]},
        {"task_id": "T08", "task_name": "Testing, Commissioning & Handover", "dependencies": ["T07"],
         "deadline": NOW + timedelta(days=14), "lat": 3.120, "lng": 101.655,
         "estimated_duration_hours": 3, "required_skills": ["testing", "commissioning"]},
    ]


def site_b_tasks():
    """Independent site — no dependencies, used as the VRP overflow target."""
    return [
        {"task_id": "S01", "task_name": "Pull Cable at Site B", "dependencies": [],
         "deadline": NOW + timedelta(days=4), "lat": 3.150, "lng": 101.700,
         "estimated_duration_hours": 3, "required_skills": ["cabling"],
         "required_materials_qty": {"cat6_drum": 1}},
        {"task_id": "S02", "task_name": "Mount Cameras at Site B", "dependencies": [],
         "deadline": NOW + timedelta(days=4), "lat": 3.150, "lng": 101.700,
         "estimated_duration_hours": 2, "required_skills": ["mounting"]},
        {"task_id": "S03", "task_name": "Configure NVR at Site B", "dependencies": [],
         "deadline": NOW + timedelta(days=5), "lat": 3.150, "lng": 101.700,
         "estimated_duration_hours": 1, "required_skills": ["networking", "config"]},
    ]


def site_c_incomplete_tasks():
    """
    Deliberately MESSY data — the kind a real subcontractor actually sends in.
    No deadline on some tasks, no lat/lng on some, no required_skills on one.
    This is what should exercise graceful degradation, not crash the system.
    """
    return [
        {"task_id": "C01", "task_name": "Survey - Mont Kiara Condo", "dependencies": []},
        {"task_id": "C02", "task_name": "Cable Run - Mont Kiara", "dependencies": ["C01"],
         "lat": 3.1726, "lng": 101.6519, "required_skills": ["cabling"]},
        {"task_id": "C03", "task_name": "NVR Setup - Mont Kiara", "dependencies": ["C02"],
         "deadline": NOW + timedelta(days=6), "lat": 3.1726, "lng": 101.6519,
         "estimated_duration_hours": 2},
    ]


def technicians_db():
    return {
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
        "Mei_Ling_Cabler": {
            "lat": 3.150, "lng": 101.700,
            "skills": ["cabling", "termination"],
            "shift_end_hour": 18,
            "van_inventory": {"cat6_drum": 2, "rg59_drum": 1},
        },
        "Lim_EndOfShift": {
            "lat": 3.121, "lng": 101.656,
            "skills": ["cabling", "mounting", "networking", "config", "termination"],
            "shift_end_hour": 10,
            "van_inventory": {"cat6_drum": 5, "rg59_drum": 5, "ladder": 2, "laptop": 1},
        },
    }


REALISTIC_MESSAGE_LOG = [
    {"sender": "Ahmad_Wireman", "text": '{"task_id": "T03", "failure_type": "material_missing"}',
     "active_task_id": "T03", "expect_tier": 1},
    {"sender": "Ravi_Mounting_Specialist", "text": "T04 tool_damaged",
     "active_task_id": "T04", "expect_tier": 1},

    {"sender": "Ahmad_Wireman", "text": "Koyak.", "active_task_id": "T03", "expect_tier": 2},
    {"sender": "Zul_IT_Tech", "text": "takleh login pulak kt sini", "active_task_id": "T07", "expect_tier": 2},
    {"sender": "Ravi_Mounting_Specialist", "text": "Rosak.", "active_task_id": "T04", "expect_tier": 2},
    {"sender": "Haziq_Handover_Specialist", "text": "blank. testing fail jugak", "active_task_id": "T08", "expect_tier": 2},
    {"sender": "Ahmad_Wireman", "text": "stok kabel kosong kat van", "active_task_id": "T03", "expect_tier": 2},
    {"sender": "Mei_Ling_Cabler", "text": "site tempat belum siap, contractor lain blum habis", "active_task_id": "S01", "expect_tier": 2},

    {"sender": "Zul_IT_Tech", "text": "ip conflict ni, takleh proceed", "active_task_id": "T07", "expect_tier": 2},

    {"sender": "Ahmad_Wireman", "text": "ok dah", "active_task_id": "T03", "expect_tier": 3},
    {"sender": "Ravi_Mounting_Specialist", "text": "ada problem sikit, tunggu jap", "active_task_id": "T04", "expect_tier": 3},

    {"sender": "Mei_Ling_Cabler", "text": "lunch break dulu", "active_task_id": "S01", "expect_tier": None},
    {"sender": "Haziq_Handover_Specialist", "text": "\U0001F44D\U0001F44D", "active_task_id": "T08", "expect_tier": None},
    {"sender": "Ahmad_Wireman", "text": "anyone got extra cable ties not for this site lol", "active_task_id": "T03", "expect_tier": None},
]
