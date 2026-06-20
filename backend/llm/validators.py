VALID_LABELS = {"task_completion", "task_start", "material_request",
                "issue_report", "progress_update", "instruction",
                "absence_report", "unclear", "other"}

def validate_output(data, valid_tasks, valid_technicians=None):
    if data.get("label") not in VALID_LABELS:
        data["label"] = "unclear"
    if data.get("task_name") not in valid_tasks:
        data["task_name"] = None
    # Only constrain technician_name when a roster is supplied, so the absent
    # worker must resolve to a real technician (mirrors task_name handling).
    if valid_technicians is not None and data.get("technician_name") not in valid_technicians:
        data["technician_name"] = None
    if data.get("status") not in ("done", "in_progress", "blocked", None):
        data["status"] = None
    if data.get("confidence") not in ("high", "low"):
        data["confidence"] = "low"
    return data