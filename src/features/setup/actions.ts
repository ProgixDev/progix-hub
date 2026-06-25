"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getProjectRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { generatePasscode, generateToken } from "./lib";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateResult =
  | { ok: true; token: string; passcode: string }
  | { ok: false; error: string };

type Translate = Awaited<ReturnType<typeof getTranslations>>;

async function isManager(projectId: string): Promise<boolean> {
  const role = await getProjectRole(projectId);
  return role === "pm" || role === "superadmin";
}

async function buildSetup(
  projectId: string,
  platformIds: string[],
  t: Translate,
  rotate: boolean,
): Promise<CreateResult> {
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };
  if (!(await isManager(projectId))) return { ok: false, error: t("errors.notAuthorized") };
  if (!rotate && !z.array(z.uuid()).min(1).safeParse(platformIds).success) {
    return { ok: false, error: t("setup.errorPickPlatform") };
  }
  const token = generateToken();
  const passcode = generatePasscode();
  const supabase = await createClient();
  const { error } = rotate
    ? await supabase.rpc("rotate_project_setup", {
        p_project: projectId,
        p_token: token,
        p_passcode: passcode,
      })
    : await supabase.rpc("create_project_setup", {
        p_project: projectId,
        p_token: token,
        p_passcode: passcode,
        p_platform_ids: platformIds,
      });
  if (error) return { ok: false, error: t("errors.tryAgain") };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true, token, passcode };
}

/** Build the setup page from the chosen platforms; returns the link token + passcode ONCE (AC-1). */
export async function createSetupAction(
  projectId: string,
  platformIds: string[],
): Promise<CreateResult> {
  return buildSetup(projectId, platformIds, await getTranslations(), false);
}

/** Rotate the link + passcode, killing the old link (AC-5). */
export async function rotateSetupAction(projectId: string): Promise<CreateResult> {
  return buildSetup(projectId, [], await getTranslations(), true);
}

/**
 * Edit which platforms an existing setup includes. Reconciles steps in place — platforms that stay
 * keep their client progress, the link is untouched — so a PM can add/remove platforms after the
 * client has already started.
 */
export async function updateSetupAction(
  projectId: string,
  platformIds: string[],
): Promise<ActionResult> {
  const t = await getTranslations();
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };
  if (!(await isManager(projectId))) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.array(z.uuid()).min(1).safeParse(platformIds).success) {
    return { ok: false, error: t("setup.errorPickPlatform") };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_project_setup", {
    p_project: projectId,
    p_platform_ids: platformIds,
  });
  if (error) return { ok: false, error: t("errors.tryAgain") };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function setSetupEnabledAction(
  projectId: string,
  enabled: boolean,
): Promise<ActionResult> {
  const t = await getTranslations();
  if (!(await isManager(projectId))) return { ok: false, error: t("errors.notAuthorized") };
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_setups")
    .update({ enabled })
    .eq("project_id", projectId);
  if (error) return { ok: false, error: t("errors.tryAgain") };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Team marks a step verified (or back to client-done) — manual confirmation (AC-4). */
export async function verifyStepAction(
  projectId: string,
  stepId: string,
  verified: boolean,
): Promise<ActionResult> {
  const t = await getTranslations();
  if (!(await isManager(projectId))) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(stepId).success) return { ok: false, error: t("errors.fixFields") };
  const supabase = await createClient();
  const { error } = await supabase
    .from("setup_steps")
    .update({ status: verified ? "verified" : "client_done" })
    .eq("id", stepId)
    .eq("project_id", projectId);
  if (error) return { ok: false, error: t("errors.tryAgain") };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
