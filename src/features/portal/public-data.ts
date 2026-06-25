import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PortalPhase, PublicPortal } from "./types";

/** Tokens we mint are 43-char base64url; reject anything else before touching the DB. */
export function isTokenShaped(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,80}$/.test(token);
}

/**
 * The client's entire read surface: one RPC, anon role, token-validated inside the
 * function (ADR-0010). Invalid/revoked → null → the inactive-link screen.
 */
export async function getPublicPortal(token: string): Promise<PublicPortal | null> {
  if (!isTokenShaped(token)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("portal_public_view", { p_token: token });
  if (error || !data) return null;
  return data as PublicPortal;
}

/** The client-facing roadmap: playground phases + their task progress (whitelisted, token-gated). */
export async function getPublicRoadmap(token: string): Promise<PortalPhase[]> {
  if (!isTokenShaped(token)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("portal_roadmap", { p_token: token });
  if (error || !data) return [];
  return data as PortalPhase[];
}
