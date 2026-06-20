import asyncio

from telethon import TelegramClient

from backend.integrations.telegram import config
from backend.integrations.telegram.history import fetch_history
from backend.integrations.telegram.listener import setup_listener
from backend.integrations.supabase.client import get_supabase_client, get_supabase_async_client
from backend.workflow.dag_engine.dag_engine import (
    SyncFieldDAG,
    TechnicianSchedule,
    AvailabilityWindow,
)
from backend.optimization.vrp_solver.solver import VRPSolver
from backend.integrations.notifications.stub import StubNotifier
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher
from backend.workflow.event_handlers.event_bus import (
    SupabaseEventBus,
    RealtimeEventBusListener,
)
from backend.workflow.command_processor import (
    CommandProcessor,
    CommandQueueListener,
    hydrate_task_rows,
)
from backend.llm.pipeline import set_dispatcher
from datetime import datetime


def _build_schedules(tech_data: list) -> dict:
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    schedules = {}
    for t in tech_data:
        shift_start = t.get("shift_start") or "08:00"
        shift_end = t.get("shift_end") or "18:00"
        sh, sm = (int(p) for p in shift_start.split(":")[:2])
        eh, em = (int(p) for p in shift_end.split(":")[:2])
        window = AvailabilityWindow(
            start=today.replace(hour=sh, minute=sm),
            end=today.replace(hour=eh, minute=em),
            source="shift",
            confirmed=True,
        )
        schedules[t["id"]] = TechnicianSchedule([window])
    return schedules


async def main() -> None:
    sb_client = get_supabase_client()

    db_tasks = sb_client.table("tasks").select("*").execute().data or []
    engine = SyncFieldDAG(hydrate_task_rows(db_tasks))

    tech_data = sb_client.table("technicians").select("*").execute().data or []
    tech_db = {t["id"]: t for t in tech_data}
    schedules = _build_schedules(tech_data)

    solver = VRPSolver(engine, tech_db)
    notifier = StubNotifier(sb_client)
    dispatcher = FieldOpsDispatcher(engine, solver, notifier, sb_client=sb_client)
    set_dispatcher(dispatcher)

    event_bus = SupabaseEventBus(dispatcher, sb_client)
    async_sb = await get_supabase_async_client()
    realtime_listener = RealtimeEventBusListener(event_bus, async_sb=async_sb)
    realtime_listener.start_sync()
    command_processor = CommandProcessor(dispatcher, solver, sb_client)
    command_processor.reload_graph()
    command_listener = CommandQueueListener(command_processor, async_sb)
    command_listener.start_sync()

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

    try:
        await client.run_until_disconnected()
    finally:
        print("\n[Bot] Shutting down. Cleaning up Event Bus channels...")
        await realtime_listener.stop()
        await command_listener.stop()


if __name__ == "__main__":
    asyncio.run(main())
