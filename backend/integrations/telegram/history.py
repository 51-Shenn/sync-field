from datetime import datetime
from pathlib import Path

from telethon import TelegramClient
from telethon.utils import get_display_name

DOWNLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "downloads"


def format_text(msg) -> str:
    parts = []
    if msg.text:
        parts.append(msg.text)
    if msg.photo:
        ts = datetime.fromtimestamp(msg.date.timestamp()).strftime("%Y-%m-%d_%H-%M-%S")
        fname = f"photo_{msg.chat_id}_{ts}.jpg"
        parts.append(f"[Photo → downloads/{fname}]")
    return " | ".join(parts) if parts else "[non-text message]"


async def fetch_history(client: TelegramClient, chat, limit: int = 50) -> None:
    DOWNLOAD_DIR.mkdir(exist_ok=True)

    messages = []
    async for msg in client.iter_messages(chat, limit=limit):
        messages.append(msg)

    messages.reverse()

    for msg in messages:
        sender = msg.sender
        name = get_display_name(sender) if sender else "Unknown"
        ts = datetime.fromtimestamp(msg.date.timestamp()).strftime("%H:%M")
        text = format_text(msg)
        print(f"[{ts}] {name}: {text}")

        if msg.photo:
            ts = datetime.fromtimestamp(msg.date.timestamp()).strftime("%Y-%m-%d_%H-%M-%S")
            fname = f"photo_{msg.chat_id}_{ts}.jpg"
            await client.download_media(msg, file=str(DOWNLOAD_DIR / fname))
