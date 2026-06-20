import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { legalTaskTransitions, taskStates, type OperationsCommandInput, type TaskState } from "@/lib/operations-types";
import { buildTaskCreateRow, buildTaskTransitionUpdate, buildTaskUpdate } from "@/lib/task-command-mutations";

const allowedCommands = new Set<OperationsCommandInput["commandType"]>([
  "task.create", "task.update", "task.delete", "task.transition", "task.assign",
  "technician.absence", "project.delete", "project.instantiate_template",
]);

const serverlessTaskCommands = new Set<OperationsCommandInput["commandType"]>([
  "task.create", "task.update", "task.delete", "task.transition", "task.assign",
]);

function commandError(reason: unknown) {
  return reason instanceof Error ? reason.message : "Task command failed";
}

async function executeTaskCommand(sb: ReturnType<typeof getSupabaseAdmin>, command: OperationsCommandInput, actor: string) {
  const now = new Date().toISOString();

  if (command.commandType === "task.create") {
    const taskId = `T_${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const { error } = await sb.from("tasks").insert(buildTaskCreateRow(command, taskId, now));
    if (error) throw new Error(error.message);
    return { taskId };
  }

  if (!command.taskId) throw new Error("taskId is required");

  if (command.commandType === "task.update") {
    const update = buildTaskUpdate(command.payload, now);
    if (Object.keys(update).length === 1) throw new Error("No supported task fields supplied");
    const { error } = await sb.from("tasks").update(update).eq("id", command.taskId);
    if (error) throw new Error(error.message);
    return { taskId: command.taskId, updated: Object.keys(update).filter((field) => field !== "updated_at") };
  }

  if (command.commandType === "task.delete") {
    const { error } = await sb.from("tasks").delete().eq("id", command.taskId);
    if (error) throw new Error(error.message);
    return { taskId: command.taskId, deleted: true };
  }

  if (command.commandType === "task.assign") {
    const technicianId = typeof command.payload?.technicianId === "string" && command.payload.technicianId
      ? command.payload.technicianId
      : null;
    const { error } = await sb.from("tasks").update({ assigned_to: technicianId, updated_at: now }).eq("id", command.taskId);
    if (error) throw new Error(error.message);
    return { taskId: command.taskId, technicianId };
  }

  if (command.commandType === "task.transition") {
    const targetState = command.payload?.state as TaskState;
    if (!taskStates.includes(targetState)) throw new Error("Invalid task state");
    const { data: task, error: taskError } = await sb.from("tasks").select("state").eq("id", command.taskId).single();
    if (taskError) throw new Error(taskError.message);
    const currentState = task.state as TaskState;
    if (!legalTaskTransitions[currentState]?.includes(targetState)) {
      throw new Error(`${currentState} cannot transition directly to ${targetState}`);
    }
    const { error: updateError } = await sb.from("tasks")
      .update(buildTaskTransitionUpdate(currentState, targetState, now))
      .eq("id", command.taskId);
    if (updateError) throw new Error(updateError.message);
    const { error: eventError } = await sb.from("task_events").insert({
      task_id: command.taskId,
      old_state: currentState,
      new_state: targetState,
      reason: `Dashboard command by ${actor}`,
      triggered_by: actor,
      depth: 0,
    });
    return { taskId: command.taskId, oldState: currentState, newState: targetState, eventWarning: eventError?.message ?? null };
  }

  throw new Error("Unsupported task command");
}

export async function POST(request: Request) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as OperationsCommandInput;
  if (!allowedCommands.has(body.commandType)) {
    return NextResponse.json({ error: "Unsupported command type" }, { status: 400 });
  }
  if (body.commandType.startsWith("task.") && body.commandType !== "task.create" && !body.taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }
  if (body.commandType === "task.create") {
    const state = body.payload?.state;
    if (!body.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    if (state !== undefined && (typeof state !== "string" || !taskStates.some((taskState) => taskState === state))) {
      return NextResponse.json({ error: "Invalid task state" }, { status: 400 });
    }
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("task_commands").insert({
    command_type: body.commandType,
    task_id: body.taskId ?? null,
    project_id: body.projectId ?? null,
    payload: body.payload ?? {},
    requested_by: session.user.id,
  }).select("id,status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (serverlessTaskCommands.has(body.commandType)) {
    try {
      const result = await executeTaskCommand(sb, body, session.user.id);
      const { error: completionError } = await sb.from("task_commands").update({
        status: "succeeded", result, error: null, started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
      }).eq("id", data.id);
      if (completionError) throw new Error(completionError.message);
      return NextResponse.json({ commandId: data.id, status: "succeeded" }, { status: 201 });
    } catch (reason) {
      const message = commandError(reason);
      await sb.from("task_commands").update({
        status: "failed", error: message, completed_at: new Date().toISOString(),
      }).eq("id", data.id);
      return NextResponse.json({ error: message, commandId: data.id }, { status: 400 });
    }
  }

  return NextResponse.json({ commandId: data.id, status: data.status }, { status: 202 });
}
