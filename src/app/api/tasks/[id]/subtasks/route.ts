import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  const body = await request.json();
  const { title, status, assigneeId, dueDate } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const subtask = await db.subtask.create({ data: { taskId, title, status, assigneeId, dueDate } });
  return NextResponse.json(subtask, { status: 201 });
}
