from datetime import datetime
from pathlib import Path

from telethon import TelegramClient, events
from telethon.utils import get_display_name

DOWNLOAD_DIR = Path(__file__).resolve().parent.parent / "downloads"


def format_text(event) -> str:
    parts = []
    if event.text:
        parts.append(event.text)
    if event.photo:
        ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        fname = f"photo_{event.chat_id}_{ts}.jpg"
        parts.append(f"[Photo → downloads/{fname}]")
    return " | ".join(parts) if parts else "[non-text message]"


async def setup_listener(client: TelegramClient) -> None:
    DOWNLOAD_DIR.mkdir(exist_ok=True)

    @client.on(events.NewMessage)
    async def handler(event) -> None:
        sender = await event.get_sender()
        name = get_display_name(sender) if sender else "Unknown"
        ts = datetime.now().strftime("%H:%M")
        chat_title = getattr(event.chat, "title", None) or "Private"
        text = format_text(event)
        print(f"[{ts}] [{chat_title}] {name}: {text}")

        if event.photo:
            ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            fname = f"photo_{event.chat_id}_{ts}.jpg"
            await client.download_media(event.message, file=str(DOWNLOAD_DIR / fname))

    print("Listening for new messages...")
