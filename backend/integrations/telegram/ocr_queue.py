import asyncio
import json
from datetime import datetime
from pathlib import Path

from .document_processor import process_document
from backend.llm.pipeline import process_message


class OcrQueue:
    def __init__(self) -> None:
        self._tasks: set[asyncio.Task] = set()

    def enqueue(
        self,
        file_path: str,
        chat_id: int,
        message_id: int,
        sender_name: str,
        sent_at: datetime,
        chat_title: str | None = None,
        telegram_id=None,
    ) -> None:
        task = asyncio.create_task(
            self._run(file_path, chat_id, message_id, sender_name, sent_at, chat_title, telegram_id)
        )
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def _run(
        self,
        file_path: str,
        chat_id: int,
        message_id: int,
        sender_name: str,
        sent_at: datetime,
        chat_title: str | None = None,
        telegram_id=None,
    ) -> None:
        path = Path(file_path)
        try:
            result = process_document(file_path, chat_id, message_id, sender_name, sent_at, chat_title)
            sent_at_str = sent_at.isoformat() if hasattr(sent_at, "isoformat") else str(sent_at)
            message = {"sender_name": sender_name, "sent_at": sent_at_str, "chat_title": chat_title, "type": "document", "text": result["full_text"]}
            await asyncio.to_thread(process_message, message, telegram_id)
        except Exception as e:
            print(json.dumps({"sender_name": sender_name, "type": "document", "error": str(e)}, ensure_ascii=False))
        finally:
            path.unlink(missing_ok=True)


_queue: OcrQueue | None = None


def get_queue() -> OcrQueue:
    global _queue
    if _queue is None:
        _queue = OcrQueue()
    return _queue
