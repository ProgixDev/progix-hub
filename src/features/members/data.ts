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

/** Whether the current user may see the Members area: a superadmin, a lead, or a PM (AC-1). */
export async function canManageOrgMembers(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.isSuperadmin || user.isLead) return true;
  const supabase = await createClient();
  const { count } = await supabase
    .from("project_members")
    .select("project_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "pm");
  return (count ?? 0) > 0;
}
