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
  const isUpload = d.source_type === "upload";
  return {
    title: d.title,
    description: d.description,
    platform_service_id: d.platform_service_id,
    source_type: d.source_type,
    // Exactly one source persisted; the other is nulled so a source swap can't leave stale data.
    embed_url: isUpload ? null : d.embed_url,
    storage_path: isUpload ? d.storage_path : null,
    language: d.language,
    visible_to_clients: d.visible_to_clients,
  };
}

const VIDEO_BUCKET = "tutorial-videos";

/** Best-effort removal of an uploaded video object (manager context satisfies the bucket policy). */
async function removeStoredVideo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null | undefined,
): Promise<void> {
  if (path) await supabase.storage.from(VIDEO_BUCKET).remove([path]);
}

/** The existing tutorial's stored video path (for cleanup on replace/delete), or null. */
async function existingStoragePath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("tutorials")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  return (data?.storage_path as string | null) ?? null;
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
  const oldPath = await existingStoragePath(supabase, id);
  const row = rowFrom(parsed.data);
  const { error } = await supabase.from("tutorials").update(row).eq("id", id);
  if (error) return { ok: false, error: t("errors.tryAgain") };

  // If the upload was replaced with a new file or swapped to an embed, delete the old object.
  if (oldPath && oldPath !== row.storage_path) await removeStoredVideo(supabase, oldPath);

  revalidatePath("/tutorials");
  return { ok: true };
}

export async function deleteTutorialAction(id: string): Promise<ActionResult> {
  const t = await getTranslations();
  const denied = await assertManager(t);
  if (denied) return denied;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("errors.fixFields") };

  const supabase = await createClient();
  const oldPath = await existingStoragePath(supabase, id);
  const { error } = await supabase.from("tutorials").delete().eq("id", id);
  if (error) return { ok: false, error: t("errors.tryAgain") };

  // Remove the orphaned video file from storage (best effort).
  await removeStoredVideo(supabase, oldPath);

  revalidatePath("/tutorials");
  return { ok: true };
}
