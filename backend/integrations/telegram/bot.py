# Telegram bot entry point
#   - Connects as a bot user via Telethon
#   - Wires the DAG dispatcher for realtime absence handling
#   - Fetches recent chat history (if admin)
#   - Listens for incoming messages and processes them
#   - Serves HTTP endpoints for outbound messages
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import asyncio
import signal

from telethon import TelegramClient

from . import config
from .history import fetch_history
from .listener import setup_listener
from .http_server import start_http_server

from backend.integrations.supabase.client import get_supabase_client
from backend.workflow.dag_engine.dag_engine import SyncFieldDAG
from backend.optimization.vrp_solver.solver import VRPSolver
from backend.integrations.notifications.telegram_notifier import TelegramNotifier
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher
from llm.pipeline import set_dispatcher


def _wire_dispatcher():
    sb = get_supabase_client()

    db_tasks = sb.table("tasks").select("*").execute().data or []
    for t in db_tasks:
        t.setdefault("task_id", t.pop("id", None))
    engine = SyncFieldDAG(db_tasks)

    tech_data = sb.table("technicians").select("*").execute().data or []
    tech_db = {t["id"]: t for t in tech_data}

    solver = VRPSolver(engine, tech_db)
    notifier = TelegramNotifier(
        bot_http_url=f"http://localhost:{config.HTTP_PORT}",
        auth_token=config.HTTP_AUTH_TOKEN,
    )
    dispatcher = FieldOpsDispatcher(engine, solver, notifier, sb_client=sb)
    set_dispatcher(dispatcher)
    print(f"[Dispatcher] Wired — {len(db_tasks)} tasks, {len(tech_db)} technicians loaded")
    return dispatcher


async def main() -> None:
    client = TelegramClient(
        session="bot_session",
        api_id=config.API_ID,
        api_hash=config.API_HASH,
    )
    await client.start(bot_token=config.BOT_TOKEN)

    chat = await client.get_entity(int(config.TARGET_CHAT))
    print(f"Connected to: {chat.title if hasattr(chat, 'title') else chat.id}")

    try:
        await fetch_history(client, chat, limit=50)
    except Exception as e:
        print(f"Skipping history (bot not admin?): {e}")

    _wire_dispatcher()

    await setup_listener(client)
    site = await start_http_server(client)

    stop_event = asyncio.Event()

    def _shutdown():
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, _shutdown)
        except NotImplementedError:
            pass

    await stop_event.wait()
    print("Shutting down...")
    await site.stop()
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
