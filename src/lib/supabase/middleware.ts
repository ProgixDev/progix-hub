import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request and gates access: a signed-out
 * visitor is redirected to /sign-in (AC-1). Public paths (/sign-in, /auth/*) pass through.
 *
 * Per @supabase/ssr: do not run code between client creation and getClaims(), and return
 * the `supabaseResponse` unmodified so the browser/server cookies stay in sync.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const appMeta = (claims?.app_metadata ?? {}) as { is_member?: boolean };
  const isMember = appMeta.is_member === true;

  const path = request.nextUrl.pathname;
  // /api/health is the secrets-config canary (ADR-0007) — it must answer to an unauthenticated
  // monitor, so it stays public alongside the sign-in/auth routes.
  const isPublic =
    path.startsWith("/sign-in") || path.startsWith("/auth") || path.startsWith("/api/health");

  // The gate enforces membership, not just "signed in": a signed-in non-member is bounced
  // to the access-denied screen, so the database RLS isn't the only thing standing guard.
  if (!isPublic && !isMember) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    if (claims) url.searchParams.set("error", "access_denied");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
