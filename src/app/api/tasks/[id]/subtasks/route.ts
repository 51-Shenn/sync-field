import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: taskId } = await params; const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("subtasks").insert({ task_id: taskId, title: body.title.trim(), status: body.status ?? "todo", assignee_id: body.assigneeId || null, due_date: body.dueDate || null }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
