export type AuditLog = {
  id: string; action: "created" | "updated" | "deleted"; entity: string;
  entityId: string; entityName: string; performedBy: string; timestamp: string; details: string;
};
