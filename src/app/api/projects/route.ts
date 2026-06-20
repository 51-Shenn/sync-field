import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("projects").insert({
    name: body.name.trim(), client: body.client?.trim() ?? "", location: body.location?.trim() ?? "", description: body.description?.trim() ?? "",
    status: body.status ?? "planning", start_date: body.startDate || null, end_date: body.endDate || null,
    manager_id: body.managerId || null, color: body.color || "#f97316", site_id: body.siteId || null,
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
