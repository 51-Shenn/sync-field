import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getRequiredSession } from "@/lib/api-auth";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return NextResponse.json({ error: "Realtime signing is not configured" }, { status: 503 });

  const token = await new SignJWT({ role: "authenticated", email: session.user.email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(session.user.id)
    .setAudience("authenticated")
    .setIssuer("supabase")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));
  return NextResponse.json({ token, expiresIn: 300 });
}
