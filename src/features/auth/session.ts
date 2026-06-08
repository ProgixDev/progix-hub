import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MemberUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  initials: string;
};

function initialsFrom(name: string | null, email: string | null): string {
  const src = name?.trim() || email?.split("@")[0] || "?";
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  const a = parts[0] ?? src;
  const b = parts[1];
  const letters = b ? a.charAt(0) + b.charAt(0) : a.slice(0, 2);
  return letters.toUpperCase();
}

/**
 * The signed-in Progix member, or null if signed-out or not a verified member.
 * Uses `getClaims()` (validates the JWT signature) — never `getSession()` — for the
 * authorization decision, and reads `is_member` from `app_metadata` (not user-editable).
 */
export async function getCurrentUser(): Promise<MemberUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) return null;

  const appMeta = (claims.app_metadata ?? {}) as { is_member?: boolean };
  if (appMeta.is_member !== true) return null;

  const userMeta = (claims.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    user_name?: string;
    avatar_url?: string;
  };
  const name = userMeta.full_name ?? userMeta.name ?? userMeta.user_name ?? null;
  const email = (claims.email as string | undefined) ?? null;

  return {
    id: claims.sub as string,
    email,
    name,
    avatarUrl: userMeta.avatar_url ?? null,
    initials: initialsFrom(name, email),
  };
}

/** Server guard for pages and actions: the current member, or null. */
export async function requireMember(): Promise<MemberUser | null> {
  return getCurrentUser();
}
