import asyncio

from telethon import TelegramClient

from integrations.telegram import config
from integrations.telegram.history import fetch_history
from integrations.telegram.listener import setup_listener
from integrations.supabase.client import get_supabase_client
from backend.workflow.dag_engine.dag_engine import SyncFieldDAG
from backend.optimization.vrp_solver.solver import VRPSolver
from backend.integrations.notifications.stub import StubNotifier
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher
from backend.workflow.event_handlers.event_bus import (
    SupabaseEventBus,
    RealtimeEventBusListener,
)


async def main() -> None:
    sb_client = get_supabase_client()

    db_tasks = sb_client.table("tasks").select("*").execute().data or []
    for t in db_tasks:
        t.setdefault("task_id", t.pop("id", None))
    engine = SyncFieldDAG(db_tasks)

    tech_data = sb_client.table("technicians").select("*").execute().data or []
    tech_db = {t["id"]: t for t in tech_data}

    solver = VRPSolver(engine, tech_db)
    notifier = StubNotifier()
    dispatcher = FieldOpsDispatcher(engine, solver, notifier)

    event_bus = SupabaseEventBus(dispatcher, sb_client)
    realtime_listener = RealtimeEventBusListener(event_bus)
    realtime_listener.start()

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

    await setup_listener(client)
    await client.run_until_disconnected()

    realtime_listener.stop()


if __name__ == "__main__":
    asyncio.run(main())
