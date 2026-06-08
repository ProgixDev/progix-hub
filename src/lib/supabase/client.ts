import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client (ADR-0006). Reads the public env vars inlined at build.
 * Used only in client components; never holds a secret.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
