import "server-only";

import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: any = null;

export function getSupabaseAdmin() {
  if (_adminClient) return _adminClient;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required");
  }

  _adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _adminClient;
}
