import json
from datetime import date

from integrations.supabase.client import get_supabase_client
from llm.analyzer import llm_analyze

CONFIDENCE_MAP = {"high": 1.0, "low": 0.5}
ABSENCE_CONFIDENCE_THRESHOLD = 0.9

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
    result = sb.table("technicians").select("id,name").eq("telegram_id", str(telegram_id)).maybe_single().execute()
    if result and result.data:
        tech_id = result.data["id"]
        print(f"[PIPELINE] resolve_technician_id: telegram_id={telegram_id} -> {tech_id} ({result.data['name']})", flush=True)
        return tech_id
    print(f"[PIPELINE] resolve_technician_id: telegram_id={telegram_id} -> NOT FOUND", flush=True)
    return None


def resolve_technician_by_name(sb, name: str) -> str | None:
    if not name:
        return None
    result = sb.table("technicians").select("id,name").ilike("name", f"%{name}%").limit(5).execute()
    if result and result.data:
        matches = [(r["id"], r["name"]) for r in result.data]
        print(f"[PIPELINE] resolve_technician_by_name: '{name}' -> {len(matches)} matches: {matches}", flush=True)
        return matches[0][0]
    print(f"[PIPELINE] resolve_technician_by_name: '{name}' -> NO MATCHES", flush=True)
    return None


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


def _trigger_absence_command(sb, technician_id: str, note: str | None = None) -> None:
    print(f"[PIPELINE] _trigger_absence_command: technician={technician_id} note={note}", flush=True)
    sb.table("task_commands").insert({
        "command_type": "technician.absence",
        "payload": {
            "technicianId": technician_id,
            "note": note,
        },
        "requested_by": "telegram_bot",
        "status": "pending",
    }).execute()


def process_message(message: dict, telegram_id=None, dispatcher=None) -> dict | None:
    sb = get_supabase_client()
    original_message_id = save_original_message(sb, message, telegram_id)

    valid_tasks = get_valid_tasks(sb)
    result = llm_analyze(message, valid_tasks)
    if result is None:
        print("[PIPELINE] LLM analysis returned None", flush=True)
        return None

    print(f"[PIPELINE] LLM result: label={result.get('label')} confidence={result.get('confidence')} worker_name={result.get('worker_name')} note={result.get('note')}", flush=True)

    sender_tech_id = resolve_technician_id(sb, telegram_id)

    sb.table("processed_messages").insert({
        "original_message_id": original_message_id,
        "technician_id": sender_tech_id,
        "task_id": resolve_task_id(sb, result.get("task_name")),
        "label": result.get("label"),
        "status": result.get("status"),
        "material": result.get("material"),
        "quantity": result.get("quantity"),
        "confidence": CONFIDENCE_MAP.get(result.get("confidence")),
        "note": result.get("note"),
        "tier_resolved": "llm",
    }).execute()

    if result.get("label") == "worker_absence" and CONFIDENCE_MAP.get(result.get("confidence"), 0) >= ABSENCE_CONFIDENCE_THRESHOLD:
        print("[PIPELINE] worker_absence detected, resolving technician...", flush=True)
        worker_name = result.get("worker_name")
        if worker_name:
            print(f"[PIPELINE] worker_name from LLM: '{worker_name}' — looking up by name", flush=True)
            abs_tech_id = resolve_technician_by_name(sb, worker_name)
        else:
            print(f"[PIPELINE] no worker_name — using sender telegram_id={telegram_id}", flush=True)
            abs_tech_id = sender_tech_id

        if abs_tech_id:
            disp = dispatcher or _dispatcher
            if disp:
                print(f"[PIPELINE] calling handle_absence({abs_tech_id}) via dispatcher", flush=True)
                result_absence = disp.handle_absence(abs_tech_id)
                print(f"[PIPELINE] handle_absence result: {json.dumps(result_absence, default=str)}", flush=True)
            else:
                print(f"[PIPELINE] no dispatcher — inserting task_commands for {abs_tech_id}", flush=True)
                _trigger_absence_command(sb, abs_tech_id, result.get("note"))
        else:
            print(json.dumps({
                "warning": "worker_absence detected but could not resolve technician_id",
                "sender_name": message.get("sender_name"),
                "worker_name": worker_name,
                "telegram_id": telegram_id,
            }), flush=True)
    else:
        print(f"[PIPELINE] not an absence (label={result.get('label')}, conf={CONFIDENCE_MAP.get(result.get('confidence'))}) — skipping", flush=True)

    return result
