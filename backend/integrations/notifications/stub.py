import asyncio


class StubNotifier:
    """Persists every notification to the in-app `alerts` feed, and additionally
    replies role escalations (alert()) back into the Telegram chat.

    Per-recipient notify() messages are in-app only on purpose — pushing each one
    to Telegram would flood the group on cascades (every reassignment/standby)."""

    def __init__(self, sb_client=None):
        self.sb = sb_client
        self._tg_client = None
        self._tg_chat = None
        self._loop = None

    def bind_telegram(self, client, chat, loop) -> None:
        """Wire the live Telethon client so escalations can reply to the chat.
        Called from the bot once the client + target chat are ready."""
        self._tg_client = client
        self._tg_chat = chat
        self._loop = loop

    def _persist(self, message: str, category: str, target_role: str | None = None) -> None:
        if not self.sb:
            return
        try:
            self.sb.table("alerts").insert({
                "target_role": target_role,
                "category": category,
                "message": message,
                "status": "pending",
            }).execute()
        except Exception as e:
            print(f"[Notifier] alert insert failed: {e}")

    def _telegram(self, text: str) -> None:
        if not self._tg_client:
            print("[Notifier] Telegram skipped — no _tg_client bound")
            return
        if not self._tg_chat:
            print("[Notifier] Telegram skipped — no _tg_chat bound")
            return
        if not self._loop:
            print("[Notifier] Telegram skipped — no _loop bound")
            return
        try:
            future = asyncio.run_coroutine_threadsafe(
                self._tg_client.send_message(self._tg_chat, text), self._loop
            )
            future.add_done_callback(lambda f: (
                print(f"[Notifier] Telegram send failed: {f.exception()}") if f.exception() else None
            ))
        except Exception as e:
            print(f"[Notifier] Telegram send failed: {e}")

    def alert(self, role: str, payload: str) -> None:
        print(f"ALERT [{role}] - {payload}")
        self._persist(payload, "workflow", target_role=role)
        self._telegram(f"⚠️ [{role}] {payload}")

    def notify(self, recipient: str, message: str) -> None:
        print(f"NOTIFICATION [{recipient}] - {message}")
        self._persist(message, "notification", target_role=recipient)
