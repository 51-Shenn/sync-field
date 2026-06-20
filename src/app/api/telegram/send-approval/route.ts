import { NextRequest, NextResponse } from "next/server"

const BOT_HTTP_URL = process.env.BOT_HTTP_URL ?? "http://localhost:8765"
const HTTP_AUTH_TOKEN = process.env.HTTP_AUTH_TOKEN ?? ""

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { chat_id, shift_id, title, body: bodyText } = body

  if (!chat_id || !shift_id) {
    return NextResponse.json({ ok: false, error: "chat_id and shift_id required" }, { status: 400 })
  }

  const res = await fetch(`${BOT_HTTP_URL}/send_approval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": HTTP_AUTH_TOKEN,
    },
    body: JSON.stringify({ chat_id, shift_id, title, body: bodyText }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
