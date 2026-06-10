"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { projectInputSchema } from "./types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

type Translate = Awaited<ReturnType<typeof getTranslations>>;

/** Resolve each zod field-error message — now a translation key — through next-intl. */
function fieldErrorsOf(error: z.ZodError, t: Translate): Record<string, string> {
  const flat = z.flattenError(error);
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    const list = messages as string[] | undefined;
    if (list && list.length > 0) out[key] = t(list[0]!);
  }
  return out;
}

/** Create a project (AC-3, AC-4). Authorized to verified members; RLS is the backstop. */
export async function createProjectAction(input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("errors.fixFields"),
      fieldErrors: fieldErrorsOf(parsed.error, t),
    };
  }

  // Create through the SECURITY DEFINER RPC so the row + the creator's PM membership are
  // seated atomically and read back without the projects-SELECT carve-out (spec 008 review).
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_project", {
    p_name: parsed.data.name,
    p_status: parsed.data.status,
    p_description: parsed.data.description ?? null,
    p_notion_url: parsed.data.notion_url ?? null,
    p_slack_url: parsed.data.slack_url ?? null,
    p_github_url: parsed.data.github_url ?? null,
    p_live_url: parsed.data.live_url ?? null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}

/** Edit a project (AC-5). */
export async function updateProjectAction(id: string, input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };

  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("errors.unknownProject") };

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("errors.fixFields"),
      fieldErrors: fieldErrorsOf(parsed.error, t),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

/** Archive a project (AC-5) — reversible; there is no hard delete. */
export async function archiveProjectAction(id: string): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };

  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("errors.unknownProject") };

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status: "archived" }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}
