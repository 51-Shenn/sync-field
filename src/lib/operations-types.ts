import type { SiteReport } from "@/lib/report-types";
import type { DocumentFile } from "@/lib/document-types";
import type { AuditLog } from "@/lib/audit-types";

export const taskStates = ["LOCKED", "READY", "ACTIVE", "BLOCKED", "REGRESSED", "COMPLETE", "FAILED"] as const;
export type TaskState = (typeof taskStates)[number];

export const legalTaskTransitions: Record<TaskState, TaskState[]> = {
  LOCKED: ["READY"],
  READY: ["ACTIVE", "LOCKED"],
  ACTIVE: ["COMPLETE", "BLOCKED", "FAILED", "READY"],
  BLOCKED: ["ACTIVE", "FAILED"],
  COMPLETE: ["REGRESSED"],
  REGRESSED: ["ACTIVE"],
  FAILED: [],
};

export type OperationsProject = {
  id: string;
  name: string;
  client: string;
  description: string;
  status: "planning" | "in_progress" | "on_hold" | "completed";
  startDate: string;
  endDate: string;
  managerId: string;
  color: string;
  siteId: string | null;
  location: string;
  progress: number;
};

export type OperationsTask = {
  id: string;
  projectId: string;
  title: string;
  state: TaskState;
  dependencies: string[];
  assigneeId: string;
  failureCategory: string | null;
  attemptCount: number;
  scheduledStart: string | null;
  earliestStart: string | null;
  deadline: string | null;
  etaConfidence: string;
  priority: "low" | "medium" | "high";
  estimatedDurationHours: number;
};

export type OperationsSubtask = {
  id: string;
  taskId: string;
  title: string;
  status: "todo" | "done";
  assigneeId: string;
  dueDate: string;
};

export type OperationsTechnician = {
  id: string;
  name: string;
  phone: string;
  role: string;
  skills: string[];
  status: string;
  email: string;
  projectIds: string[];
  managerId: string | null;
  lat: number | null;
  lng: number | null;
};

export type TaskEvent = {
  id: string;
  taskId: string;
  oldState: string | null;
  newState: string;
  reason: string;
  triggeredBy: string;
  depth: number;
  createdAt: string;
};

export type OperationsAlert = {
  id: string;
  taskId: string | null;
  category: string;
  message: string;
  status: string;
  createdAt: string;
};

export type ProcessedMessage = {
  id: string;
  taskId: string | null;
  label: string | null;
  status: string | null;
  note: string | null;
  confidence: number | null;
  createdAt: string;
};

export type TaskCommand = {
  id: string;
  commandType: string;
  taskId: string | null;
  projectId: string | null;
  status: "pending" | "processing" | "succeeded" | "failed";
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
};

export type OperationsSnapshot = {
  projects: OperationsProject[];
  tasks: OperationsTask[];
  subtasks: OperationsSubtask[];
  technicians: OperationsTechnician[];
  taskEvents: TaskEvent[];
  alerts: OperationsAlert[];
  processedMessages: ProcessedMessage[];
  commands: TaskCommand[];
  reports: SiteReport[];
  documents: DocumentFile[];
  auditLogs: AuditLog[];
};

export type OperationsCommandInput = {
  commandType:
    | "task.create"
    | "task.update"
    | "task.delete"
    | "task.transition"
    | "task.assign"
    | "technician.absence"
    | "project.delete"
    | "project.instantiate_template";
  taskId?: string;
  projectId?: string;
  payload?: Record<string, unknown>;
};
