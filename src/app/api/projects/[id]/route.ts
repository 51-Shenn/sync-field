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
  const { data, error } = await getSupabaseAdmin().from("task_commands").insert({
    command_type: "project.delete", project_id: id, payload: {}, requested_by: session.user.id,
  }).select("id,status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commandId: data.id, status: data.status }, { status: 202 });
}
