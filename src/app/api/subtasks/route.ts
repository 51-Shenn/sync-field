import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.taskId || !body.title?.trim()) return NextResponse.json({ error: "taskId and title are required" }, { status: 400 });
  const sb = getSupabaseAdmin();
  const { data: parent } = await sb.from("tasks").select("id").eq("id", body.taskId).maybeSingle();
  if (!parent) return NextResponse.json({ error: "Parent task no longer exists" }, { status: 404 });
  const { data, error } = await sb.from("subtasks").insert({
    task_id: body.taskId, title: body.title.trim(), status: body.status ?? "todo",
    assignee_id: body.assigneeId || null, due_date: body.dueDate || null,
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
