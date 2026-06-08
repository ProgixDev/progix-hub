import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client (ADR-0006) — uses the service-role key, which BYPASSES RLS.
 * Use only in narrowly-scoped server code that genuinely needs it (e.g. stamping a
 * verified GitHub org membership into a user's app_metadata after OAuth). Never as a
 * general query client, and never reachable from a client component (`server-only`).
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — admin client unavailable.");
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
