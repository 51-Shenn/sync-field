# Telethon event listener — handles voice, document, text, and photo messages.
# Each type is processed differently and output as JSON to stdout.
import asyncio
from datetime import datetime
from pathlib import Path
import json
import sys
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding="utf-8")

from telethon import TelegramClient, events
from telethon.tl.types import DocumentAttributeFilename
from telethon.utils import get_display_name

from . import config
from .document_processor import detect_file_type, ocr_image_file
from .ocr_queue import get_queue
from .transcribe import preload_model, translate_audio
from integrations.google_drive import get_uploader, init_uploader
from integrations.supabase.client import get_supabase_client
from llm.pipeline import process_message

DOWNLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "downloads"


async def _analyze_and_log(message: dict, telegram_id) -> None:
    try:
        await asyncio.to_thread(process_message, message, telegram_id)
    except Exception as e:
        print(json.dumps({**message, "error": str(e)}, ensure_ascii=False))


async def _upload_to_drive(file_path: str, file_name: str, sender_name: str) -> str | None:
    uploader = get_uploader()
    if uploader is None:
        return None
    return await asyncio.to_thread(uploader.upload, file_path, file_name, sender_name)


async def setup_listener(client: TelegramClient) -> None:
    DOWNLOAD_DIR.mkdir(exist_ok=True)
    preload_model()

    if config.GOOGLE_DRIVE_TOKEN_PATH and config.GOOGLE_DRIVE_ROOT_FOLDER_ID:
        init_uploader(str(config.GOOGLE_DRIVE_TOKEN_PATH), config.GOOGLE_DRIVE_ROOT_FOLDER_ID)
        print(f"Google Drive uploader ready → root folder {config.GOOGLE_DRIVE_ROOT_FOLDER_ID}")
    else:
        print("Google Drive uploader not configured — skipping Drive uploads")

    @client.on(events.CallbackQuery)
    async def callback_handler(event) -> None:
        raw = event.data.decode("utf-8", errors="replace")
        parts = raw.split(":")
        if len(parts) == 3 and parts[0] in ("approve", "reject") and parts[1] == "shift":
            action = parts[0]
            shift_id = parts[2]
            sender = await event.get_sender()
            name = get_display_name(sender) if sender else "Unknown"
            user_id = sender.id if sender else 0
            action_label = "同意" if action == "approve" else "拒绝"

            await event.answer(f"你已{action_label}排班 {shift_id}")

            msg = await event.get_message()
            await event.edit(msg.text + f"\n\n— {name} 已{action_label}此排班安排")

            def _record():
                try:
                    db = get_supabase_client()
                    db.table("shift_approvals").insert({
                        "shift_id": shift_id,
                        "action": action,
                        "user_id": user_id,
                        "user_name": name,
                    }).execute()
                except Exception as e:
                    print(f"Supabase record failed: {e}")

            def _notify():
                body = json.dumps({
                    "shift_id": shift_id,
                    "action": action,
                    "user_id": user_id,
                    "user_name": name,
                }).encode()
                req = urllib.request.Request(
                    f"{config.NEXTJS_WEBHOOK_URL}/api/telegram/callback",
                    data=body,
                    headers={
                        "Content-Type": "application/json",
                        "X-Auth-Token": config.NEXTJS_WEBHOOK_TOKEN,
                    },
                    method="POST",
                )
                try:
                    urllib.request.urlopen(req, timeout=5)
                except Exception as e:
                    print(f"Webhook notify failed: {e}")

            await asyncio.gather(
                asyncio.to_thread(_record),
                asyncio.to_thread(_notify),
            )

    @client.on(events.NewMessage)
    async def handler(event) -> None:
        sender = await event.get_sender()
        name = get_display_name(sender) if sender else "Unknown"
        telegram_id = sender.id if sender else None
        sent_at_iso = event.date.isoformat()
        chat_title = getattr(event.chat, "title", None) or "Private"

        print(f"\n{'='*50}", flush=True)
        print(f"[MSG IN] sender={name} telegram_id={telegram_id} chat={chat_title}", flush=True)
        print(f"[MSG IN] type={'voice' if event.message.voice else 'photo' if event.photo else 'document' if event.message.document else 'text'}", flush=True)
        if event.text:
            print(f"[MSG IN] text={event.text[:200]}", flush=True)
        print(f"{'='*50}", flush=True)

        if event.message.voice:
            ts_file = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            tmp = DOWNLOAD_DIR / f"voice_{event.chat_id}_{ts_file}.ogg"
            await client.download_media(event.message, file=str(tmp))
            try:
                english_text = translate_audio(str(tmp))
                message = {"sender_name": name, "sent_at": sent_at_iso, "chat_title": chat_title, "type": "voice", "text": english_text}
                await _analyze_and_log(message, telegram_id)
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
                await _upload_to_drive(str(tmp), filename, name)
                get_queue().enqueue(str(tmp), event.chat_id, event.message.id,
                                     name, event.date, chat_title, telegram_id)
                return

        if event.text:
            message = {"sender_name": name, "sent_at": sent_at_iso, "chat_title": chat_title, "type": "text", "text": event.text}
            await _analyze_and_log(message, telegram_id)

        if event.photo:
            ts_file = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            fname = f"photo_{event.chat_id}_{ts_file}.jpg"
            photo_path = DOWNLOAD_DIR / fname
            await client.download_media(event.message, file=str(photo_path))
            try:
                ocr_task = asyncio.to_thread(ocr_image_file, str(photo_path))
                drive_task = _upload_to_drive(str(photo_path), fname, name)
                ocr_text, _ = await asyncio.gather(ocr_task, drive_task, return_exceptions=True)
                if isinstance(ocr_text, Exception):
                    raise ocr_text
                if ocr_text.strip():
                    message = {"sender_name": name, "sent_at": sent_at_iso, "chat_title": chat_title, "type": "photo", "text": ocr_text}
                    await _analyze_and_log(message, telegram_id)
            except Exception as e:
                print(json.dumps({"sender_name": name, "sent_at": sent_at_iso, "chat_title": chat_title, "type": "photo", "error": str(e)}, ensure_ascii=False))
            finally:
                photo_path.unlink(missing_ok=True)

    print("Listening for new messages...")
