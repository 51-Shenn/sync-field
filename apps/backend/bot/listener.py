from datetime import datetime
from pathlib import Path

from telethon import TelegramClient, events
from telethon.utils import get_display_name

from bot.transcribe import preload_model, translate_audio

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
    preload_model()

    @client.on(events.NewMessage)
    async def handler(event) -> None:
        sender = await event.get_sender()
        name = get_display_name(sender) if sender else "Unknown"
        ts = datetime.now().strftime("%H:%M")
        chat_title = getattr(event.chat, "title", None) or "Private"

        if event.message.voice:
            ts_file = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            tmp = DOWNLOAD_DIR / f"voice_{event.chat_id}_{ts_file}.ogg"
            await client.download_media(event.message, file=str(tmp))
            print(f"[{ts}] [{chat_title}] {name}: [Voice → transcribing...]")
            try:
                english_text = translate_audio(str(tmp))
                print(f"[{ts}] [{chat_title}] {name} (English): {english_text}")
            except Exception as e:
                print(f"[{ts}] [{chat_title}] {name}: [Voice failed: {e}]")
            finally:
                tmp.unlink(missing_ok=True)
            return

        text = format_text(event)
        print(f"[{ts}] [{chat_title}] {name}: {text}")

        if event.photo:
            ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            fname = f"photo_{event.chat_id}_{ts}.jpg"
            await client.download_media(event.message, file=str(DOWNLOAD_DIR / fname))

    print("Listening for new messages...")
