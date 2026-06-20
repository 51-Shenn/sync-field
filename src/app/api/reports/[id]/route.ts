import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { updateSiteReport, deleteSiteReport } from "@/lib/reports-server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const report = await updateSiteReport(id, body, session.user.id);
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await deleteSiteReport(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
