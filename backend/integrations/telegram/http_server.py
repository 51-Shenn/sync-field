import json
from aiohttp import web

from integrations.telegram import config
from integrations.telegram.sender import send_message, send_approval


def _resolve_chat_id(chat_id: str | int) -> str | int:
    if isinstance(chat_id, int):
        return chat_id
    try:
        return int(chat_id)
    except (ValueError, TypeError):
        return str(chat_id).strip()


def _check_auth(request: web.Request) -> str | None:
    token = request.headers.get("X-Auth-Token", "")
    if token != config.HTTP_AUTH_TOKEN:
        return "Forbidden"
    return None


async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({"ok": True})


async def handle_send(request: web.Request) -> web.Response:
    err = _check_auth(request)
    if err:
        return web.json_response({"ok": False, "error": err}, status=403)

    body = await request.json()
    chat_id = body.get("chat_id")
    text = body.get("text")
    if not chat_id or not text:
        return web.json_response({"ok": False, "error": "chat_id and text required"}, status=400)

    client = request.app["telegram_client"]
    result = await send_message(client, _resolve_chat_id(chat_id), text)
    return web.json_response(result)


async def handle_send_approval(request: web.Request) -> web.Response:
    err = _check_auth(request)
    if err:
        return web.json_response({"ok": False, "error": err}, status=403)

    body = await request.json()
    chat_id = body.get("chat_id")
    shift_id = body.get("shift_id")
    title = body.get("title", "排班审批")
    body_text = body.get("body", "")

    if not chat_id or not shift_id:
        return web.json_response({"ok": False, "error": "chat_id and shift_id required"}, status=400)

    client = request.app["telegram_client"]
    result = await send_approval(client, _resolve_chat_id(chat_id), shift_id, title, body_text)
    return web.json_response(result)


async def start_http_server(client) -> web.TCPSite:
    app = web.Application()
    app["telegram_client"] = client

    app.router.add_get("/health", handle_health)
    app.router.add_post("/send", handle_send)
    app.router.add_post("/send_approval", handle_send_approval)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", config.HTTP_PORT)
    await site.start()
    print(f"HTTP server listening on port {config.HTTP_PORT}")
    return site
