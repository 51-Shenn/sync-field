# Async background queue that processes document OCR tasks in parallel
# and prints JSON results to stdout (no files saved to disk)
import asyncio
import json
from datetime import datetime
from pathlib import Path

from .document_processor import process_document


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
    ) -> None:
        # Spawn a background task; self-cleanup on completion via done callback
        task = asyncio.create_task(
            self._run(file_path, chat_id, message_id, sender_name, sent_at, chat_title)
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
    ) -> None:
        # Execute OCR, print JSON to stdout, then delete the temp file
        path = Path(file_path)
        try:
            result = process_document(file_path, chat_id, message_id, sender_name, sent_at, chat_title)
            sent_at_str = sent_at.isoformat() if hasattr(sent_at, "isoformat") else str(sent_at)
            print(json.dumps({"sender_name": sender_name, "sent_at": sent_at_str, "chat_title": chat_title, "type": "document", "text": result["full_text"]}, ensure_ascii=False))
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
