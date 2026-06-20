from datetime import datetime
from pathlib import Path
import json

from telethon import TelegramClient, events
from telethon.tl.types import DocumentAttributeFilename
from telethon.utils import get_display_name

from .document_processor import detect_file_type, ocr_image_file
from .ocr_queue import get_queue
from .transcribe import preload_model, translate_audio

DOWNLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "downloads"


async def setup_listener(client: TelegramClient) -> None:
    DOWNLOAD_DIR.mkdir(exist_ok=True)
    preload_model()

    @client.on(events.NewMessage)
    async def handler(event) -> None:
        sender = await event.get_sender()
        name = get_display_name(sender) if sender else "Unknown"
        sent_at_iso = event.date.isoformat()
        chat_title = getattr(event.chat, "title", None) or "Private"

        if event.message.voice:
            ts_file = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            tmp = DOWNLOAD_DIR / f"voice_{event.chat_id}_{ts_file}.ogg"
            await client.download_media(event.message, file=str(tmp))
            try:
                english_text = translate_audio(str(tmp))
                print(json.dumps({"sender_name": name, "sent_at": sent_at_iso, "chat_title": chat_title, "type": "voice", "text": english_text}, ensure_ascii=False))
            except Exception as e:
                print(json.dumps({"sender_name": name, "sent_at": sent_at_iso, "chat_title": chat_title, "type": "voice", "error": str(e)}, ensure_ascii=False))
            finally:
                tmp.unlink(missing_ok=True)
            return

        if event.message.document:
            doc = event.message.document
            filename = None
            for attr in doc.attributes:
                if isinstance(attr, DocumentAttributeFilename):
                    filename = attr.file_name
                    break
            if filename and detect_file_type(filename):
                ts_file = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                tmp = DOWNLOAD_DIR / f"doc_{event.chat_id}_{ts_file}{Path(filename).suffix}"
                await client.download_media(event.message, file=str(tmp))
                get_queue().enqueue(str(tmp), event.chat_id, event.message.id,
                                     name, event.date, chat_title)
                return

        if event.text:
            print(json.dumps({"sender_name": name, "sent_at": sent_at_iso, "chat_title": chat_title, "type": "text", "text": event.text}, ensure_ascii=False))

        if event.photo:
            ts_file = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            fname = f"photo_{event.chat_id}_{ts_file}.jpg"
            photo_path = DOWNLOAD_DIR / fname
            await client.download_media(event.message, file=str(photo_path))
            try:
                ocr_text = ocr_image_file(str(photo_path))
                if ocr_text.strip():
                    print(json.dumps({"sender_name": name, "sent_at": sent_at_iso, "chat_title": chat_title, "type": "photo", "text": ocr_text}, ensure_ascii=False))
            except Exception as e:
                print(json.dumps({"sender_name": name, "sent_at": sent_at_iso, "chat_title": chat_title, "type": "photo", "error": str(e)}, ensure_ascii=False))
            finally:
                photo_path.unlink(missing_ok=True)

    print("Listening for new messages...")
