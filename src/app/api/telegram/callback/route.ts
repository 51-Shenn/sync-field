import { NextRequest, NextResponse } from "next/server"

const AUTH_TOKEN = process.env.HTTP_AUTH_TOKEN ?? ""

export async function POST(request: NextRequest) {
  const token = request.headers.get("X-Auth-Token") ?? ""
  if (token !== AUTH_TOKEN) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { shift_id, action, user_id, user_name } = body

  console.log(`[telegram-callback] shift=${shift_id} action=${action} user=${user_name}(${user_id})`)

  return NextResponse.json({ ok: true })
}
