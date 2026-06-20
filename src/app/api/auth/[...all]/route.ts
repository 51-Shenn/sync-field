import { auth } from "@/lib/auth"; // path to auth file
import { toNextJsHandler } from "better-auth/next-js";

// Prisma + pg require the Node runtime, and better-auth's catch-all must not be
// statically analyzed (Next 16/Turbopack crashes generating static paths for it).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { POST, GET } = toNextJsHandler(auth);