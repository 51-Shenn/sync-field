import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { SiteReport } from "@/lib/report-types";

export async function getSiteReports(): Promise<SiteReport[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("site_reports").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    type: String(row.report_type) as SiteReport["type"],
    description: String(row.description ?? ""),
    status: String(row.status) as SiteReport["status"],
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
    attachments: Array.isArray(row.attachments) ? row.attachments.map(String) : [],
  }));
}

export async function createSiteReport(input: Omit<SiteReport, "id" | "createdAt"> & { creatorName?: string }): Promise<SiteReport> {
  const { data, error } = await getSupabaseAdmin()
    .from("site_reports").insert({
      project_id: input.projectId, title: input.title, report_type: input.type,
      description: input.description, status: input.status, created_by: input.createdBy,
      creator_name: input.creatorName ?? "", attachments: input.attachments,
    }).select("*").single();
  if (error) throw new Error(error.message);
  return {
    id: String(data.id), projectId: String(data.project_id), title: String(data.title),
    type: String(data.report_type) as SiteReport["type"], description: String(data.description ?? ""),
    status: String(data.status) as SiteReport["status"], createdBy: String(data.created_by),
    createdAt: String(data.created_at),
    attachments: Array.isArray(data.attachments) ? (data.attachments as string[]).map(String) : [],
  };
}

export async function updateSiteReport(id: string, input: Partial<SiteReport>): Promise<SiteReport> {
  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.projectId !== undefined) updates.project_id = input.projectId;
  if (input.type !== undefined) updates.report_type = input.type;
  if (input.status !== undefined) updates.status = input.status;
  if (input.description !== undefined) updates.description = input.description;
  if (input.attachments !== undefined) updates.attachments = input.attachments;
  const { data, error } = await getSupabaseAdmin()
    .from("site_reports").update(updates).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return {
    id: String(data.id), projectId: String(data.project_id), title: String(data.title),
    type: String(data.report_type) as SiteReport["type"], description: String(data.description ?? ""),
    status: String(data.status) as SiteReport["status"], createdBy: String(data.created_by),
    createdAt: String(data.created_at),
    attachments: Array.isArray(data.attachments) ? (data.attachments as string[]).map(String) : [],
  };
}

export async function deleteSiteReport(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("site_reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
