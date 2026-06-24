"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { platformInputSchema } from "./lib";

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

/** Only superadmins and global PMs may write the registry (spec 015 AC-4); RLS is the backstop. */
async function assertManager(t: Translate): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user || !(user.isSuperadmin || user.isGlobalPm)) {
    return { ok: false, error: t("errors.notAuthorized") };
  }
  return null;
}

/** Map validated input to a clean row — cross-pattern fields are nulled so only the chosen
 * pattern's data is persisted. */
function rowFrom(d: z.infer<typeof platformInputSchema>) {
  const invite = d.access_pattern === "invite_collaborator";
  const key = d.access_pattern === "store_key";
  return {
    name: d.name,
    service_id: d.service_id,
    access_pattern: d.access_pattern,
    critical: d.critical,
    steps: d.steps,
    invite_url: invite ? d.invite_url : null,
    invite_role: invite ? d.invite_role : null,
    invite_email: invite ? d.invite_email : null,
    key_label: key ? d.key_label : null,
  };
}

/** Replace a platform's attached tutorials with the chosen set (spec 020). */
async function syncTutorials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  platformId: string,
  tutorials: z.infer<typeof platformInputSchema>["tutorials"],
): Promise<void> {
  await supabase.from("platform_tutorials").delete().eq("platform_id", platformId);
  if (tutorials.length === 0) return;
  await supabase.from("platform_tutorials").insert(
    tutorials.map((tut, i) => ({
      platform_id: platformId,
      tutorial_id: tut.tutorial_id,
      label: tut.label,
      position: i,
    })),
  );
}

export async function createPlatformAction(input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const denied = await assertManager(t);
  if (denied) return denied;

  const parsed = platformInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t("errors.fixFields"), fieldErrors: fieldErrorsOf(parsed.error, t) };
  }

  const supabase = await createClient();
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("platforms")
    .insert({ ...rowFrom(parsed.data), created_by: user!.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: t("errors.tryAgain") };
  await syncTutorials(supabase, data.id as string, parsed.data.tutorials);

  revalidatePath("/settings/platforms");
  return { ok: true };
}

export async function updatePlatformAction(id: string, input: unknown): Promise<ActionResult> {
  const t = await getTranslations();
  const denied = await assertManager(t);
  if (denied) return denied;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("errors.fixFields") };

  const parsed = platformInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t("errors.fixFields"), fieldErrors: fieldErrorsOf(parsed.error, t) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("platforms").update(rowFrom(parsed.data)).eq("id", id);
  if (error) return { ok: false, error: t("errors.tryAgain") };
  await syncTutorials(supabase, id, parsed.data.tutorials);

  revalidatePath("/settings/platforms");
  return { ok: true };
}

export async function setPlatformDisabledAction(
  id: string,
  disabled: boolean,
): Promise<ActionResult> {
  const t = await getTranslations();
  const denied = await assertManager(t);
  if (denied) return denied;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("errors.fixFields") };

  const supabase = await createClient();
  const { error } = await supabase.from("platforms").update({ disabled }).eq("id", id);
  if (error) return { ok: false, error: t("errors.tryAgain") };

  revalidatePath("/settings/platforms");
  return { ok: true };
}

export async function deletePlatformAction(id: string): Promise<ActionResult> {
  const t = await getTranslations();
  const denied = await assertManager(t);
  if (denied) return denied;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("errors.fixFields") };

  const supabase = await createClient();
  const { error } = await supabase.from("platforms").delete().eq("id", id);
  if (error) return { ok: false, error: t("errors.tryAgain") };

  revalidatePath("/settings/platforms");
  return { ok: true };
}
