import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/api-auth";
import { getOperationsSnapshot } from "@/lib/operations-server";
import type { OperationsSnapshot } from "@/lib/operations-types";

let _cached: { snapshot: OperationsSnapshot; at: number } | null = null;
const CACHE_MS = 5_000;

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const now = Date.now();
    if (_cached && now - _cached.at < CACHE_MS) {
      return NextResponse.json(_cached.snapshot, {
        headers: { "X-Snapshot-Cache": "HIT" },
      });
    }
    const snapshot = await getOperationsSnapshot();
    _cached = { snapshot, at: now };
    return NextResponse.json(snapshot, {
      headers: {
        "X-Snapshot-Cache": "MISS",
        "Cache-Control": "public, max-age=5, stale-while-revalidate=3",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load operations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
