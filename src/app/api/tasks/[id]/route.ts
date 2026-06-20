import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { title, status, priority, assigneeId, dueDate } = body;
  const task = await db.task.update({ where: { id }, data: { title, status, priority, assigneeId, dueDate }, include: { subtasks: true } });
  return NextResponse.json(task);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
