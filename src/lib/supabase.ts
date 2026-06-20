import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getRealtimeToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const response = await fetch("/api/operations/realtime-token", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to authenticate Realtime");
  const data = await response.json() as { token: string; expiresIn: number };
  cachedToken = { value: data.token, expiresAt: Date.now() + data.expiresIn * 1000 };
  return data.token;
}

export function getSupabaseBrowser() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  browserClient = createClient(url, anonKey, {
    accessToken: getRealtimeToken,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return browserClient;
}
