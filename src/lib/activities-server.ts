import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export type Activity = { id: string; person: string; action: string; target: string; time: string };

export async function getActivities(): Promise<Activity[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("activities").select("*").order("time");
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    person: String(row.person),
    action: String(row.action),
    target: String(row.target),
    time: String(row.time),
  }));
}
