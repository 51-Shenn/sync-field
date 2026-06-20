import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("projects").update({
    name: body.name?.trim(), client: body.client?.trim(), location: body.location?.trim(), description: body.description?.trim(),
    status: body.status, start_date: body.startDate || null, end_date: body.endDate || null,
    manager_id: body.managerId || null, color: body.color, site_id: body.siteId || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const sb = getSupabaseAdmin();
  const { data: taskRows } = await sb.from("tasks").select("id").eq("project_id", id);
  const taskIds = (taskRows as { id: string }[] | null)?.map((t) => t.id) ?? [];
  if (taskIds.length) {
    await sb.from("task_events").delete().in("task_id", taskIds);
    await sb.from("alerts").delete().in("task_id", taskIds);
    await sb.from("processed_messages").delete().in("task_id", taskIds);
  }
  const { error: taskErr } = await sb.from("tasks").delete().eq("project_id", id);
  if (taskErr) return NextResponse.json({ error: taskErr.message }, { status: 500 });
  const { error } = await sb.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
