import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { OrgMember } from "./types";

/** Every org member with their standing + GitHub login, via the access-gated RPC (AC-1). */
export async function listOrgMembers(): Promise<OrgMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_org_members");
  if (error) throw new Error(error.message);
  return (data ?? []) as OrgMember[];
}

/** One org member by id (or null) — reuses the gated RPC, so authorization is the same. */
export async function getOrgMember(userId: string): Promise<OrgMember | null> {
  const members = await listOrgMembers();
  return members.find((m) => m.user_id === userId) ?? null;
}

/**
 * Whether the current viewer may see the Members area (spec 012 AC-4): any signed-in org member.
 * `getCurrentUser()` already returns null for signed-out or non-member sessions, so membership is
 * the whole check. Promoting a member to lead stays superadmin-only (enforced in the directory +
 * the set-lead action), independent of viewing.
 */
export async function canViewOrgMembers(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}
