import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-server";
import type {
  OperationsAlert,
  OperationsProject,
  OperationsSnapshot,
  OperationsSubtask,
  OperationsTask,
  OperationsTechnician,
  ProcessedMessage,
  TaskCommand,
  TaskEvent,
  TaskState,
} from "@/lib/operations-types";
import type { SiteReport } from "@/lib/report-types";
import type { DocumentFile } from "@/lib/document-types";

type Row = Record<string, unknown>;

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function projectStatus(value: unknown): OperationsProject["status"] {
  if (value === "active") return "in_progress";
  if (value === "complete") return "completed";
  if (value === "planned") return "planning";
  return (["planning", "in_progress", "on_hold", "completed"].includes(String(value)) ? value : "planning") as OperationsProject["status"];
}

export async function getOperationsSnapshot(): Promise<OperationsSnapshot> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.rpc("get_operations_snapshot");
  if (error) throw new Error(error.message);

  const snap = data as Record<string, Row[]>;
  const rawTasks     = snap.tasks || [];
  const rawSubtasks  = snap.subtasks || [];
  const rawSiteReports = snap.site_reports || [];
  const rawDocuments = snap.documents || [];

  const completedByProject = new Map<string, { complete: number; total: number }>();
  for (const task of rawTasks) {
    const projectId = stringValue(task.project_id);
    const count = completedByProject.get(projectId) ?? { complete: 0, total: 0 };
    count.total += 1;
    if (task.state === "COMPLETE") count.complete += 1;
    completedByProject.set(projectId, count);
  }

  const projects: OperationsProject[] = (snap.projects || []).map((row: Row) => {
    const site = row.sites && typeof row.sites === "object" ? row.sites as Row : {};
    const counts = completedByProject.get(stringValue(row.id)) ?? { complete: 0, total: 0 };
    return {
      id: stringValue(row.id), name: stringValue(row.name), client: stringValue(row.client),
      description: stringValue(row.description), status: projectStatus(row.status),
      startDate: stringValue(row.start_date), endDate: stringValue(row.end_date),
      managerId: stringValue(row.manager_id), color: stringValue(row.color, "#f97316"),
      siteId: typeof row.site_id === "string" ? row.site_id : null,
      location: stringValue(row.location) || stringValue(site.address) || stringValue(site.name),
      progress: counts.total ? Math.round((counts.complete / counts.total) * 100) : 0,
    };
  });

  const tasks: OperationsTask[] = rawTasks.map((row) => ({
    id: stringValue(row.id), projectId: stringValue(row.project_id), title: stringValue(row.task_name),
    state: stringValue(row.state, "LOCKED") as TaskState,
    dependencies: Array.isArray(row.dependencies) ? row.dependencies.map(String) : [],
    assigneeId: stringValue(row.assigned_to), failureCategory: typeof row.failure_category === "string" ? row.failure_category : null,
    attemptCount: numberValue(row.attempt_count), scheduledStart: typeof row.scheduled_start === "string" ? row.scheduled_start : null,
    earliestStart: typeof row.earliest_start === "string" ? row.earliest_start : null,
    deadline: typeof row.deadline === "string" ? row.deadline : null,
    etaConfidence: stringValue(row.eta_confidence, "UNKNOWN"),
    priority: stringValue(row.priority, "medium") as OperationsTask["priority"],
    estimatedDurationHours: numberValue(row.estimated_duration_hours, 2),
  }));

  const subtasks: OperationsSubtask[] = rawSubtasks.map((row) => ({
    id: stringValue(row.id), taskId: stringValue(row.taskId || row.task_id), title: stringValue(row.title),
    status: stringValue(row.status, "todo") as OperationsSubtask["status"],
    assigneeId: stringValue(row.assigneeId || row.assignee_id), dueDate: stringValue(row.dueDate || row.due_date),
  }));

  const technicians: OperationsTechnician[] = (snap.technicians || []).map((row) => ({
    id: stringValue(row.id), name: stringValue(row.name), phone: stringValue(row.phone), role: stringValue(row.role),
    skills: Array.isArray(row.skills) ? row.skills.map(String) : [], status: stringValue(row.status),
    email: stringValue(row.email), projectIds: Array.isArray(row.project_ids) ? row.project_ids.map(String) : [],
    managerId: typeof row.manager_id === "string" ? row.manager_id : null,
    lat: typeof row.lat === "number" ? row.lat : null, lng: typeof row.lng === "number" ? row.lng : null,
  }));

  const taskEvents: TaskEvent[] = (snap.task_events || []).map((row) => ({
    id: stringValue(row.id), taskId: stringValue(row.task_id), oldState: typeof row.old_state === "string" ? row.old_state : null,
    newState: stringValue(row.new_state), reason: stringValue(row.reason), triggeredBy: stringValue(row.triggered_by),
    depth: numberValue(row.depth), createdAt: stringValue(row.created_at),
  }));
  const alerts: OperationsAlert[] = (snap.alerts || []).map((row) => ({
    id: stringValue(row.id), taskId: typeof row.task_id === "string" ? row.task_id : null,
    category: stringValue(row.category), message: stringValue(row.message), status: stringValue(row.status), createdAt: stringValue(row.created_at),
  }));
  const processedMessages: ProcessedMessage[] = (snap.processed_messages || []).map((row) => ({
    id: stringValue(row.id), taskId: typeof row.task_id === "string" ? row.task_id : null,
    label: typeof row.label === "string" ? row.label : null, status: typeof row.status === "string" ? row.status : null,
    note: typeof row.note === "string" ? row.note : null, confidence: typeof row.confidence === "number" ? row.confidence : null,
    createdAt: stringValue(row.created_at),
  }));
  const commands: TaskCommand[] = (snap.task_commands || []).map((row) => ({
    id: stringValue(row.id), commandType: stringValue(row.command_type), taskId: typeof row.task_id === "string" ? row.task_id : null,
    projectId: typeof row.project_id === "string" ? row.project_id : null,
    status: stringValue(row.status, "pending") as TaskCommand["status"],
    result: row.result && typeof row.result === "object" ? row.result as Record<string, unknown> : null,
    error: typeof row.error === "string" ? row.error : null, createdAt: stringValue(row.created_at),
  }));
  const reports: SiteReport[] = rawSiteReports.map((row) => ({
    id: stringValue(row.id), projectId: stringValue(row.project_id), title: stringValue(row.title),
    type: stringValue(row.report_type, "update") as SiteReport["type"],
    description: stringValue(row.description ?? ""), status: stringValue(row.status, "open") as SiteReport["status"],
    createdBy: stringValue(row.created_by), createdAt: stringValue(row.created_at),
    attachments: Array.isArray(row.attachments) ? row.attachments.map(String) : [],
  }));
  const documents: DocumentFile[] = rawDocuments.map((row) => ({
    id: stringValue(row.id), name: stringValue(row.name),
    type: stringValue(row.document_type, "pdf") as DocumentFile["type"],
    projectId: stringValue(row.project_id), uploadedBy: stringValue(row.uploaded_by),
    uploadedAt: stringValue(row.created_at), sizeKb: numberValue(row.size_kb),
  }));

  return { projects, tasks, subtasks, technicians, taskEvents, alerts, processedMessages, commands, reports, documents };
}
