import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client (ADR-0006) for RSC, route handlers, and server actions.
 * Auth flows through the session cookie (not the service role); RLS applies.
 * The `setAll` try/catch is intentional: Server Components cannot write cookies —
 * the middleware refreshes the session, so it is safe to ignore there.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — the middleware refreshes the session.
          }
        },
      },
    },
  );
}
