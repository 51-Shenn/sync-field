from backend.integrations.supabase.client import get_supabase_client
from backend.llm.analyzer import llm_analyze

CONFIDENCE_MAP = {"high": 1.0, "low": 0.5}

_dispatcher = None


def set_dispatcher(dispatcher) -> None:
    global _dispatcher
    _dispatcher = dispatcher


def get_valid_tasks(sb) -> list[str]:
    result = sb.table("tasks").select("task_name").execute()
    return [row["task_name"] for row in result.data]


def resolve_task_id(sb, task_name: str | None) -> str | None:
    if not task_name:
        return None
    result = sb.table("tasks").select("id").eq("task_name", task_name).maybe_single().execute()
    return result.data["id"] if result and result.data else None


def resolve_technician_id(sb, telegram_id) -> str | None:
    if telegram_id is None:
        return None
    result = sb.table("technicians").select("id").eq("telegram_id", str(telegram_id)).maybe_single().execute()
    return result.data["id"] if result and result.data else None


def save_original_message(sb, message: dict, telegram_id=None) -> str:
    inserted = sb.table("original_messages").insert({
        "telegram_id": str(telegram_id) if telegram_id is not None else None,
        "sender_name": message.get("sender_name"),
        "chat_title": message.get("chat_title"),
        "sent_at": message.get("sent_at"),
        "type": message.get("type"),
        "text": message.get("text"),
        "replied_to": message.get("replied_to"),
    }).execute()
    return inserted.data[0]["id"]


def process_message(message: dict, telegram_id=None, dispatcher=None) -> dict | None:
    sb = get_supabase_client()
    original_message_id = save_original_message(sb, message, telegram_id)

    valid_tasks = get_valid_tasks(sb)
    result = llm_analyze(message, valid_tasks)
    if result is None:
        return None

    sb.table("processed_messages").insert({
        "original_message_id": original_message_id,
        "technician_id": resolve_technician_id(sb, telegram_id),
        "task_id": resolve_task_id(sb, result.get("task_name")),
        "label": result.get("label"),
        "status": result.get("status"),
        "material": result.get("material"),
        "quantity": result.get("quantity"),
        "confidence": CONFIDENCE_MAP.get(result.get("confidence")),
        "note": result.get("note"),
        "tier_resolved": "llm",
    }).execute()

    task_id = resolve_task_id(sb, result.get("task_name"))
    confidence = CONFIDENCE_MAP.get(result.get("confidence"), 0.5)

    if task_id and confidence == 1.0 and (dispatcher or _dispatcher):
        label = result.get("label")
        status = result.get("status")
        technician_id = resolve_technician_id(sb, telegram_id) or "llm"
        d = dispatcher or _dispatcher

        if label == "task_completion" and status == "done":
            d.process_completion_report(task_id, technician_id)
        elif label == "issue_report" or status == "blocked":
            failure_type = result.get("note") or "SITE_NOT_READY"
            d.process_failure_report(task_id, failure_type, technician_id)
        elif label == "task_start" and status == "in_progress":
            d.process_start_report(task_id, technician_id)

    return result
