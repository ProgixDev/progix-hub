"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateToken, hashToken } from "@/lib/mcp/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CreateTokenResult = { ok: true; token: string } | { ok: false };
export type ActionResult = { ok: true } | { ok: false };

/** Mint a personal MCP token. The raw token is returned ONCE; only its hash is stored. */
export async function createTokenAction(label: string): Promise<CreateTokenResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const raw = generateToken();
  const supabase = await createClient();
  const { error } = await supabase.from("mcp_tokens").insert({
    user_id: user.id,
    token_hash: hashToken(raw),
    label: (label || "MCP token").slice(0, 80),
  });
  if (error) return { ok: false };
  revalidatePath("/settings");
  return { ok: true, token: raw };
}

/** Revoke a token (RLS scopes to the owner). */
export async function revokeTokenAction(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false };
  if (!(await getCurrentUser())) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error || !data || data.length === 0) return { ok: false };
  revalidatePath("/settings");
  return { ok: true };
}
