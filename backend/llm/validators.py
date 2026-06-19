VALID_LABELS = {"task_completion", "task_start", "material_request",
                "issue_report", "progress_update", "instruction", "unclear", "other"}

def validate_output(data, valid_tasks):
    if data.get("label") not in VALID_LABELS:
        data["label"] = "unclear"
    if data.get("task_name") not in valid_tasks:
        data["task_name"] = None
    if data.get("status") not in ("done", "in_progress", "blocked", None):
        data["status"] = None
    if data.get("confidence") not in ("high", "low"):
        data["confidence"] = "low"
    return data