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

type IdentityLike = { provider?: string; identity_data?: Record<string, unknown> | null };

/**
 * The GitHub username from a user's linked identities (spec 012 AC-1) — GitHub populates
 * `user_name`/`preferred_username` in the identity data. Returns null when no GitHub identity is
 * linked, so the callback only stamps a real login.
 */
export function githubLoginFromIdentities(
  identities: IdentityLike[] | null | undefined,
): string | null {
  const gh = (identities ?? []).find((i) => i.provider === "github");
  const data = gh?.identity_data ?? {};
  const login = data["user_name"] ?? data["preferred_username"];
  return typeof login === "string" && login.length > 0 ? login : null;
}
