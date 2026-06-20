import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function enqueue(id: string, commandType: string, payload: Record<string, unknown>, userId: string) {
  return getSupabaseAdmin().from("task_commands").insert({ command_type: commandType, task_id: id, payload, requested_by: userId }).select("id,status").single();
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; const body = await request.json();
  const target = body.state ?? body.status;
  const commandType = target ? "task.transition" : "task.update";
  const payload = target ? { ...body, state: target } : body;
  const { data, error } = await enqueue(id, commandType, payload, session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commandId: data.id, status: data.status }, { status: 202 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await enqueue(id, "task.delete", {}, session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commandId: data.id, status: data.status }, { status: 202 });
}
