import json
import urllib.request
import urllib.error

from integrations.notifications import Notifier
from integrations.supabase.client import get_supabase_client
from integrations.telegram.config import TARGET_CHAT as _TARGET_CHAT_CONFIG

_FALLBACK_CHAT_IDS = {
    "project_manager": [_TARGET_CHAT_CONFIG],
    "manager": [_TARGET_CHAT_CONFIG],
}


class TelegramNotifier(Notifier):
    def __init__(self, bot_http_url: str, auth_token: str) -> None:
        self.bot_url = bot_http_url.rstrip("/")
        self.auth_token = auth_token

    def _send_http(self, endpoint: str, body: dict) -> None:
        url = f"{self.bot_url}{endpoint}"
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "X-Auth-Token": self.auth_token,
            },
            method="POST",
        )
        try:
            urllib.request.urlopen(req, timeout=10)
            print(f"[NOTIFIER] sent to chat_id={body.get('chat_id')}: {body.get('text', '')[:80]}", flush=True)
        except urllib.error.HTTPError as e:
            print(f"[NOTIFIER] HTTP error {e.code}: {e.read().decode()}", flush=True)

    def _get_recipients_by_role(self, role: str) -> list[int]:
        try:
            client = get_supabase_client()
            rows = client.rpc("get_telegram_recipients", {"p_role": role}).execute()
            return [r["chat_id"] for r in rows.data]
        except Exception:
            fallback = _FALLBACK_CHAT_IDS.get(role, [])
            if fallback:
                print(f"[NOTIFIER] using fallback chat_ids for role={role}: {fallback}", flush=True)
            return fallback

    def _get_chat_id(self, recipient: str) -> int | None:
        chat_ids = self._get_recipients_by_role(recipient)
        return chat_ids[0] if chat_ids else None

    def alert(self, role: str, payload: str) -> None:
        chat_ids = self._get_recipients_by_role(role)
        print(f"[NOTIFIER] alert role={role} recipients={chat_ids} msg={payload[:100]}", flush=True)
        for chat_id in chat_ids:
            self._send_http("/send", {"chat_id": chat_id, "text": payload})

    def notify(self, recipient: str, message: str) -> None:
        chat_id = self._get_chat_id(recipient)
        print(f"[NOTIFIER] notify recipient={recipient} chat_id={chat_id} msg={message[:100]}", flush=True)
        if chat_id:
            self._send_http("/send", {"chat_id": chat_id, "text": message})
