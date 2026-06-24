"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { tutorialInputSchema } from "./lib";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

type Translate = Awaited<ReturnType<typeof getTranslations>>;

function fieldErrorsOf(error: z.ZodError, t: Translate): Record<string, string> {
  const flat = z.flattenError(error);
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    const list = messages as string[] | undefined;
    if (list && list.length > 0) out[key] = t(list[0]!);
  }
  return out;
}

/** Tutorials are written only by superadmins / global PMs (spec 016 AC-4); RLS is the backstop. */
async function assertManager(t: Translate): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user || !(user.isSuperadmin || user.isGlobalPm)) {
    return { ok: false, error: t("errors.notAuthorized") };
  }
  return null;
}

function rowFrom(d: z.infer<typeof tutorialInputSchema>) {
  return {
    title: d.title,
    description: d.description,
    platform_service_id: d.platform_service_id,
    embed_url: d.embed_url,
    language: d.language,
    visible_to_clients: d.visible_to_clients,
  };
}

export async function createTutorialAction(input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const denied = await assertManager(t);
  if (denied) return denied;

  const parsed = tutorialInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t("errors.fixFields"), fieldErrors: fieldErrorsOf(parsed.error, t) };
  }

  const supabase = await createClient();
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("tutorials")
    .insert({ ...rowFrom(parsed.data), created_by: user!.id });
  if (error) return { ok: false, error: t("errors.tryAgain") };

  revalidatePath("/tutorials");
  return { ok: true };
}

export async function updateTutorialAction(id: string, input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const denied = await assertManager(t);
  if (denied) return denied;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("errors.fixFields") };

  const parsed = tutorialInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t("errors.fixFields"), fieldErrors: fieldErrorsOf(parsed.error, t) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tutorials").update(rowFrom(parsed.data)).eq("id", id);
  if (error) return { ok: false, error: t("errors.tryAgain") };

  revalidatePath("/tutorials");
  return { ok: true };
}

export async function deleteTutorialAction(id: string): Promise<ActionResult> {
  const t = await getTranslations();
  const denied = await assertManager(t);
  if (denied) return denied;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("errors.fixFields") };

  const supabase = await createClient();
  const { error } = await supabase.from("tutorials").delete().eq("id", id);
  if (error) return { ok: false, error: t("errors.tryAgain") };

  revalidatePath("/tutorials");
  return { ok: true };
}
