"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

const setLeadSchema = z.object({ userId: z.uuid(), makeLead: z.boolean() });
const setGlobalPmSchema = z.object({ userId: z.uuid(), makeGlobalPm: z.boolean() });

/**
 * Promote/demote an org member to "lead" (spec 011 AC-2). Superadmin-only — the check runs
 * server-side before the admin client is touched (AC-5). Superadmins are never altered here.
 */
export async function setMemberLeadAction(input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user || !user.isSuperadmin) return { ok: false, error: t("errors.notAuthorized") };

  const parsed = setLeadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("errors.fixFields") };
  if (parsed.data.userId === user.id) return { ok: false, error: t("members.errorSelf") };

  const admin = createAdminClient();
  const { data: target, error: getError } = await admin.auth.admin.getUserById(parsed.data.userId);
  if (getError || !target?.user) return { ok: false, error: t("members.errorGeneric") };

  const appMeta = (target.user.app_metadata ?? {}) as Record<string, unknown>;
  if (appMeta.is_superadmin === true) return { ok: false, error: t("members.errorSuperadmin") };

  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    app_metadata: { ...appMeta, is_lead: parsed.data.makeLead },
  });
  if (error) return { ok: false, error: t("members.errorGeneric") };
  revalidatePath("/members");
  return { ok: true };
}

/**
 * Grant/revoke org "global PM" standing (spec 014 AC-2). Superadmin-only, checked before the admin
 * client is touched (AC-4); a superadmin target and self-target are rejected. Grants PM-level access
 * everywhere via the is_global_pm JWT flag — never superadmin abilities (AC-5).
 */
export async function setGlobalPmAction(input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user || !user.isSuperadmin) return { ok: false, error: t("errors.notAuthorized") };

  const parsed = setGlobalPmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("errors.fixFields") };
  if (parsed.data.userId === user.id) return { ok: false, error: t("members.errorSelf") };

  const admin = createAdminClient();
  const { data: target, error: getError } = await admin.auth.admin.getUserById(parsed.data.userId);
  if (getError || !target?.user) return { ok: false, error: t("members.errorGeneric") };

  const appMeta = (target.user.app_metadata ?? {}) as Record<string, unknown>;
  if (appMeta.is_superadmin === true) return { ok: false, error: t("members.errorSuperadmin") };

  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    app_metadata: { ...appMeta, is_global_pm: parsed.data.makeGlobalPm },
  });
  if (error) return { ok: false, error: t("members.errorGeneric") };
  revalidatePath("/members");
  return { ok: true };
}
