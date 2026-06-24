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
