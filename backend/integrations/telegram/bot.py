import asyncio

from telethon import TelegramClient

from integrations.telegram import config
from integrations.telegram.history import fetch_history
from integrations.telegram.listener import setup_listener


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

    await setup_listener(client)
    await client.run_until_disconnected()


if __name__ == "__main__":
    asyncio.run(main())
