# backend/tests/sim_message.py
"""
Simulate a Telegram message hitting the pipeline and watch the DAG react.

This mirrors the wiring in backend/integrations/telegram/bot.py main(), but
instead of starting Telethon it feeds a hand-crafted message straight into
process_message() — the same entry point listener.py uses. After the call it
prints the in-memory DAG state so you can see exactly what moved.

Usage:
    python -m backend.tests.sim_message "T03 cabling done"
    python -m backend.tests.sim_message "material missing at T04" --telegram-id 12345

Requires the same .env (SUPABASE_URL/KEY, GEMINI_API_KEY) the bot uses, since
the real LLM + real Supabase run here. It WILL write to original_messages /
processed_messages / tasks / task_events, just like a real message.
"""
import argparse

from backend.integrations.supabase.client import get_supabase_client
from backend.workflow.dag_engine.dag_engine import SyncFieldDAG
from backend.optimization.vrp_solver.solver import VRPSolver
from backend.integrations.notifications.stub import StubNotifier
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher
from backend.llm.pipeline import process_message, set_dispatcher


def build_dispatcher():
    """Same dependency order as bot.py main(), minus Telethon + Realtime."""
    sb = get_supabase_client()

    db_tasks = sb.table("tasks").select("*").execute().data or []
    for t in db_tasks:
        t.setdefault("task_id", t.pop("id", None))
    engine = SyncFieldDAG(db_tasks)

    tech_data = sb.table("technicians").select("*").execute().data or []
    tech_db = {t["id"]: t for t in tech_data}

    solver = VRPSolver(engine, tech_db)
    dispatcher = FieldOpsDispatcher(engine, solver, StubNotifier(), sb_client=sb)
    set_dispatcher(dispatcher)
    return dispatcher


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("text", help="the message text, as if typed in Telegram")
    ap.add_argument("--telegram-id", default=None, help="sender telegram id")
    args = ap.parse_args()

    dispatcher = build_dispatcher()
    engine = dispatcher.engine

    print("\n===== DAG BEFORE =====")
    engine.print_state()

    message = {
        "sender_name": "sim",
        "sent_at": None,
        "chat_title": "sim",
        "type": "text",
        "text": args.text,
    }
    result = process_message(message, telegram_id=args.telegram_id, dispatcher=dispatcher)

    print("\n===== LLM RESULT =====")
    print(result)

    print("\n===== DAG AFTER =====")
    engine.print_state()


if __name__ == "__main__":
    main()
