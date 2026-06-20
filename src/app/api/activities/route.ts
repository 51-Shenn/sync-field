import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getActivities } from "@/lib/activities-server";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const activities = await getActivities();
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
