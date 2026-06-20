"""
Self-contained MC/absence end-to-end test script.
Simulates: Telegram message -> LLM -> Pipeline -> Dispatcher -> Notifier

Usage:
    python backend/tests/test_mc_flow.py
"""
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from integrations.supabase.client import get_supabase_client
from integrations.notifications.telegram_notifier import TelegramNotifier
from llm.pipeline import process_message, set_dispatcher
from backend.workflow.dag_engine.dag_engine import SyncFieldDAG
from backend.optimization.vrp_solver.solver import VRPSolver
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher

BOT_HTTP_URL = "http://localhost:8765"
AUTH_TOKEN = "aJqcSr5xK5Gr-GjhNYGAs3SEquP_pVWCwQ4ypd2Gyx8"


def setup_dispatcher():
    print("[SETUP] Loading data from Supabase...", flush=True)
    sb = get_supabase_client()

    db_tasks = sb.table("tasks").select("*").execute().data or []
    for t in db_tasks:
        t.setdefault("task_id", t.pop("id", None))
    engine = SyncFieldDAG(db_tasks)
    print(f"[SETUP] Loaded {len(db_tasks)} tasks", flush=True)

    tech_data = sb.table("technicians").select("*").execute().data or []
    tech_db = {t["id"]: t for t in tech_data}
    print(f"[SETUP] Loaded {len(tech_db)} technicians", flush=True)

    solver = VRPSolver(engine, tech_db)
    notifier = TelegramNotifier(bot_http_url=BOT_HTTP_URL, auth_token=AUTH_TOKEN)
    dispatcher = FieldOpsDispatcher(engine, solver, notifier, sb_client=sb)
    set_dispatcher(dispatcher)
    return dispatcher, engine


def find_kumar(engine):
    """Show what Kumar is working on before the test."""
    kumar_id = "44c36944-5b00-4e7c-8299-683a4c10f440"
    print(f"\n[PRE-TEST] Kumar (id={kumar_id}) current tasks:", flush=True)
    for t_id, t in engine.tasks.items():
        if t.get("assigned_to") == kumar_id:
            print(f"  {t_id}: {t.get('task_name')} state={t.get('state')}", flush=True)
    return kumar_id


def run_test():
    dispatcher, engine = setup_dispatcher()
    kumar_id = find_kumar(engine)

    message = {
        "sender_name": "nestchao",
        "sent_at": "2026-06-20T15:00:00+00:00",
        "chat_title": "TEST",
        "type": "text",
        "text": "Kumar MC today, cannot come to work",
        "replied_to": None,
    }
    telegram_id = 1082995160

    print(f"\n[TEST] Simulating Telegram message from nestchao (id={telegram_id}):", flush=True)
    print(f"       \"{message['text']}\"", flush=True)
    print(f"\n{'='*60}", flush=True)

    try:
        result = process_message(message, telegram_id=telegram_id)
        print(f"\n[RESULT] process_message returned: {json.dumps(result, indent=2, default=str) if result else 'None'}", flush=True)
    except Exception as e:
        print(f"\n[ERROR] {e}", flush=True)
        import traceback
        traceback.print_exc()

    print(f"\n{'='*60}", flush=True)
    print("[POST-TEST] Kumar's tasks after absence handling:", flush=True)
    for t_id, t in engine.tasks.items():
        if t.get("assigned_to") == kumar_id:
            print(f"  {t_id}: {t.get('task_name')} state={t.get('state')}", flush=True)
        elif t.get("assigned_to") is None and t.get("state") == "READY":
            print(f"  {t_id}: {t.get('task_name')} state=READY (demoted, UNASSIGNED)", flush=True)

    # Show freed task that was reassigned
    print("\n[POST-TEST] Reassigned tasks:", flush=True)
    for t_id, t in engine.tasks.items():
        if t.get("assigned_to") and t.get("assigned_to") != kumar_id and t.get("state") == "ACTIVE":
            # Check if this task was assigned to someone else after Kumar's absence
            assigned_name = t.get("assigned_to")
            print(f"  {t_id} -> {assigned_name}: {t.get('task_name')}", flush=True)

    # Check Kumar status in DB
    sb = get_supabase_client()
    try:
        r = sb.table("technicians").select("id,name,status,leave_until").eq("id", kumar_id).execute()
        if r.data:
            k = r.data[0]
            print(f"\n[DB] Kumar status: {k.get('status')}, leave_until: {k.get('leave_until')}", flush=True)
    except Exception as e:
        print(f"[DB] Could not check Kumar status: {e}", flush=True)

    print("\n[DONE]", flush=True)


if __name__ == "__main__":
    run_test()
