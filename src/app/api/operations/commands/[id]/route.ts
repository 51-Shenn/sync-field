import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await getSupabaseAdmin().from("task_commands")
    .select("id,status,result,error,created_at,started_at,completed_at").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json(data);
}
