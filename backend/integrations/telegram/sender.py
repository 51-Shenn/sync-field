import json
from telethon import TelegramClient, Button


async def send_message(client: TelegramClient, chat_id: int, text: str) -> dict:
    msg = await client.send_message(chat_id, text)
    return {"ok": True, "message_id": msg.id, "chat_id": chat_id}


async def send_approval(
    client: TelegramClient,
    chat_id: int,
    shift_id: str,
    title: str,
    body: str,
) -> dict:
    text = f"{title}\n\n{body}"
    buttons = [
        [Button.inline("同意", f"approve:shift:{shift_id}".encode()),
         Button.inline("拒绝", f"reject:shift:{shift_id}".encode())],
    ]
    msg = await client.send_message(chat_id, text, buttons=buttons)
    return {"ok": True, "message_id": msg.id, "chat_id": chat_id, "shift_id": shift_id}
