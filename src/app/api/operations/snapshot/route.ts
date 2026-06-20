import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getOperationsSnapshot } from "@/lib/operations-server";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await getOperationsSnapshot());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load operations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
