import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("tasks").select("*,subtasks(*)").eq("project_id", projectId).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.projectId || !body.title?.trim()) return NextResponse.json({ error: "projectId and title required" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("task_commands").insert({
    command_type: "task.create", project_id: body.projectId, payload: body, requested_by: session.user.id,
  }).select("id,status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commandId: data.id, status: data.status }, { status: 202 });
}
