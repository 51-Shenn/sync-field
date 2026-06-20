import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { title, status, assigneeId, dueDate } = body;
  const subtask = await db.subtask.update({ where: { id }, data: { title, status, assigneeId, dueDate } });
  return NextResponse.json(subtask);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.subtask.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
