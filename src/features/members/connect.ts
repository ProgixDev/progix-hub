// Pure helpers for the Connect-GitHub link flow (spec 012). No "server-only" and no Supabase
// import so they're unit-testable and usable from both the client button and the server callback.

/**
 * Where GitHub returns after a Connect-GitHub attempt: the shared OAuth callback, tagged as a
 * link flow so the callback stamps github_login rather than treating it as a fresh sign-in.
 */
export function linkCallbackUrl(origin: string): string {
  return `${origin}/auth/callback?flow=link`;
}

/**
 * Supabase rejects linking a GitHub identity that already belongs to another user (spec 012 AC-7).
 * Match its error code, with message fallbacks for resilience across versions.
 */
export function isIdentityAlreadyLinked(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === "identity_already_exists") return true;
  const msg = (error.message ?? "").toLowerCase();
  return (
    (msg.includes("already") && msg.includes("linked")) ||
    msg.includes("already been registered") ||
    msg.includes("identity is already")
  );
}
