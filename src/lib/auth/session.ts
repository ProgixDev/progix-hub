import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EffectiveRole } from "./roles";

export type MemberUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  initials: string;
  /** Org owner — full access to every project, bypasses per-project roles (spec 008). */
  isSuperadmin: boolean;
  /** Org lead — read-only visibility into every project (spec 011). */
  isLead: boolean;
  /** Org global PM — PM-level access to every project, incl. future ones (spec 014). */
  isGlobalPm: boolean;
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

  const appMeta = (claims.app_metadata ?? {}) as {
    is_member?: boolean;
    is_superadmin?: boolean;
    is_lead?: boolean;
    is_global_pm?: boolean;
  };
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
    isSuperadmin: appMeta.is_superadmin === true,
    isLead: appMeta.is_lead === true,
    isGlobalPm: appMeta.is_global_pm === true,
  };
}

/** Server guard for pages and actions: the current member, or null. */
export async function requireMember(): Promise<MemberUser | null> {
  return getCurrentUser();
}

/** The caller's effective role on a project ('superadmin' | role | null), resolved by the DB. */
export async function getProjectRole(projectId: string): Promise<EffectiveRole | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_project_role", { p_project: projectId });
  return (data as EffectiveRole | null) ?? null;
}
