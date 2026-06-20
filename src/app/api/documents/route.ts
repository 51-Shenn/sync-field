import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getDocuments } from "@/lib/documents-server";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const documents = await getDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
