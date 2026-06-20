import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  const tasks = await db.task.findMany({ where: { projectId }, include: { subtasks: true }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId, title, status, priority, assigneeId, dueDate } = body;
  if (!projectId || !title) return NextResponse.json({ error: "projectId and title required" }, { status: 400 });
  const task = await db.task.create({ data: { projectId, title, status, priority, assigneeId, dueDate }, include: { subtasks: true } });
  return NextResponse.json(task, { status: 201 });
}
