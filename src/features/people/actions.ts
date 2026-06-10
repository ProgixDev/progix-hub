"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { addMemberSchema, PROJECT_ROLES } from "./types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Map a People-RPC raise to friendly, localized copy. */
async function friendlyError(message: string): Promise<string> {
  const t = await getTranslations("people");
  if (message.includes("not authorized")) return t("errorNotAuthorized");
  if (message.includes("no_account")) return t("errorNoAccount");
  if (message.includes("last_pm")) return t("errorLastPm");
  if (message.includes("invalid role")) return t("errorInvalidRole");
  return t("errorGeneric");
}

/** Add a member by email or change their role (PM / superadmin only — enforced by the RPC). */
export async function setProjectMemberAction(
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat.fieldErrors)) {
      const list = v as string[] | undefined;
      if (list?.[0]) fieldErrors[k] = t(list[0]);
    }
    return { ok: false, error: t("errors.fixFields"), fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_project_member", {
    p_project: projectId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (error) return { ok: false, error: await friendlyError(error.message) };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

const changeRoleSchema = z.object({ userId: z.uuid(), role: z.enum(PROJECT_ROLES) });

/** Change an existing member's role by user id (PM / superadmin only). */
export async function changeMemberRoleAction(
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("errors.fixFields") };

  const supabase = await createClient();
  // Resolve the user's email so we can reuse set_project_member (which takes email).
  const { data: roster } = await supabase.rpc("list_project_members", { p_project: projectId });
  const target = (roster ?? []).find(
    (m: { user_id: string; email: string | null }) => m.user_id === parsed.data.userId,
  );
  if (!target?.email) return { ok: false, error: await friendlyError("no_account") };

  const { error } = await supabase.rpc("set_project_member", {
    p_project: projectId,
    p_email: target.email,
    p_role: parsed.data.role,
  });
  if (error) return { ok: false, error: await friendlyError(error.message) };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Remove a member from a project (PM / superadmin only; can't remove the last PM). */
export async function removeProjectMemberAction(
  projectId: string,
  userId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(userId).success) return { ok: false, error: t("people.errorGeneric") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_project_member", {
    p_project: projectId,
    p_user: userId,
  });
  if (error) return { ok: false, error: await friendlyError(error.message) };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
