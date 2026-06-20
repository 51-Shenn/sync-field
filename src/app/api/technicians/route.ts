import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Worker name is required" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("technicians").insert({
    name: body.name.trim(), role: body.role?.trim() || "technician", email: body.email?.trim() || null,
    phone: body.phone?.trim() || null, status: body.status || "active",
    project_ids: Array.isArray(body.projectIds) ? body.projectIds : [],
    manager_id: body.managerId || null,
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
