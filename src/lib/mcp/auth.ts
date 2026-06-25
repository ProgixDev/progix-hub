import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const PREFIX = "pgx_mcp_";

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** A fresh personal token (shown once). 32 random bytes, base64url, prefixed. */
export function generateToken(): string {
  return PREFIX + randomBytes(32).toString("base64url");
}

/**
 * Resolve a raw MCP token to its user id, or null. Service-role lookup (the token holder has no
 * Supabase session). Rejects unknown/revoked tokens; stamps last_used_at.
 */
export async function resolveMcpUser(token: string | undefined): Promise<string | null> {
  if (!token || !token.startsWith(PREFIX)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("mcp_tokens")
    .select("id,user_id")
    .eq("token_hash", hashToken(token))
    .is("revoked_at", null)
    .maybeSingle();
  if (!data) return null;
  await admin
    .from("mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);
  return data.user_id as string;
}

/**
 * Resolve any MCP bearer to a user id: a personal token (pgx_mcp_…) OR a Supabase-issued OAuth /
 * session access token (validated against Supabase Auth). Lets Claude authenticate via the OAuth
 * 2.1 flow (Supabase is the authorization server) while personal tokens keep working.
 */
export async function resolveBearerUser(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  if (token.startsWith(PREFIX)) return resolveMcpUser(token);
  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  // Defense in depth: only a genuine authenticated end-user resolves (never a service/anon token).
  if (error || !data.user || data.user.aud !== "authenticated") return null;
  return data.user.id;
}
