import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { OperationsCommandInput } from "@/lib/operations-types";

const allowedCommands = new Set<OperationsCommandInput["commandType"]>([
  "task.create", "task.update", "task.delete", "task.transition", "task.assign",
  "technician.absence", "project.delete", "project.instantiate_template",
]);

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

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("task_commands").insert({
    command_type: body.commandType,
    task_id: body.taskId ?? null,
    project_id: body.projectId ?? null,
    payload: body.payload ?? {},
    requested_by: session.user.id,
  }).select("id,status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commandId: data.id, status: data.status }, { status: 202 });
}
