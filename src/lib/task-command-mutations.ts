import type { TaskState } from "@/lib/operations-types";

type TaskCommandPayload = Record<string, unknown> | undefined;

type TaskCreateCommand = {
  projectId?: string;
  payload?: Record<string, unknown>;
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function buildTaskCreateRow(command: TaskCreateCommand, taskId: string, now: string) {
  const payload = command.payload ?? {};
  const state = (typeof payload.state === "string" ? payload.state : "READY") as TaskState;
  return {
    id: taskId,
    project_id: command.projectId,
    task_name: typeof payload.title === "string" ? payload.title.trim() : "Untitled task",
    state,
    dependencies: stringArray(payload.dependencies),
    assigned_to: optionalString(payload.assigneeId),
    deadline: optionalString(payload.deadline),
    priority: typeof payload.priority === "string" ? payload.priority : "medium",
    estimated_duration_hours: typeof payload.estimatedDurationHours === "number" ? payload.estimatedDurationHours : 2,
    required_skills: stringArray(payload.requiredSkills),
    blocked_since: state === "BLOCKED" ? now : null,
    updated_at: now,
  };
}

export function buildTaskUpdate(payload: TaskCommandPayload, now: string) {
  const source = payload ?? {};
  const fields: Record<string, unknown> = {};
  if (typeof source.title === "string") fields.task_name = source.title.trim();
  if ("deadline" in source) fields.deadline = optionalString(source.deadline);
  if (typeof source.priority === "string") fields.priority = source.priority;
  if (typeof source.estimatedDurationHours === "number") fields.estimated_duration_hours = source.estimatedDurationHours;
  if (Array.isArray(source.dependencies)) fields.dependencies = stringArray(source.dependencies);
  if (Array.isArray(source.requiredSkills)) fields.required_skills = stringArray(source.requiredSkills);
  fields.updated_at = now;
  return fields;
}

export function buildTaskTransitionUpdate(currentState: TaskState, targetState: TaskState, now: string) {
  const fields: Record<string, unknown> = { state: targetState, updated_at: now };
  if (targetState === "BLOCKED") fields.blocked_since = now;
  else if (currentState === "BLOCKED") fields.blocked_since = null;
  if (targetState === "COMPLETE") {
    fields.attempt_count = 0;
    fields.failure_category = null;
  }
  return fields;
}
