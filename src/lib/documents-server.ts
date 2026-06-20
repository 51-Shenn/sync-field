import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { DocumentFile } from "@/lib/document-types";

export async function getDocuments(): Promise<DocumentFile[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("documents").select("*").order("uploaded_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    type: String(row.type) as DocumentFile["type"],
    projectId: String(row.project_id),
    uploadedBy: String(row.uploaded_by),
    uploadedAt: String(row.uploaded_at),
    sizeKb: Number(row.size_kb),
  }));
}
