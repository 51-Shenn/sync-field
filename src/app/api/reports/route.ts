import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getSiteReports, createSiteReport } from "@/lib/reports-server";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const reports = await getSiteReports();
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const report = await createSiteReport(body);
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
