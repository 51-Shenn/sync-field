import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { AuditLog } from "@/lib/audit-types";

export async function getAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("audit_logs").select("*").order("timestamp", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    action: String(row.action) as AuditLog["action"],
    entity: String(row.entity),
    entityId: String(row.entity_id),
    entityName: String(row.entity_name),
    performedBy: String(row.performed_by),
    timestamp: String(row.timestamp),
    details: String(row.details ?? ""),
  }));
}

export async function createAuditLog(input: Omit<AuditLog, "id">): Promise<AuditLog> {
  const id = `al${Date.now()}`;
  const { data, error } = await getSupabaseAdmin()
    .from("audit_logs").insert({
      id, action: input.action, entity: input.entity, entity_id: input.entityId,
      entity_name: input.entityName, performed_by: input.performedBy,
      timestamp: input.timestamp, details: input.details,
    }).select("*").single();
  if (error) throw new Error(error.message);
  return {
    id: String(data.id), action: String(data.action) as AuditLog["action"],
    entity: String(data.entity), entityId: String(data.entity_id),
    entityName: String(data.entity_name), performedBy: String(data.performed_by),
    timestamp: String(data.timestamp), details: String(data.details ?? ""),
  };
}
