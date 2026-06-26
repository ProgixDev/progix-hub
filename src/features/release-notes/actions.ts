"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { aiConfigured, chatComplete } from "@/lib/ai/openai";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type RNResult = { ok: true } | { ok: false; error: string };
export type DraftResult = { ok: true; body: string } | { ok: false; error: string };

type Client = Awaited<ReturnType<typeof createClient>>;
type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

const idSchema = z.string().uuid();
const inputSchema = z.object({
  version: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v.trim() : null),
    z.string().max(40).nullable(),
  ),
  title: z.string().trim().min(1).max(160),
  body_md: z.string().trim().min(1).max(20000),
  published: z.boolean(),
});

/** PM access (matches the write RLS: superadmin / global-PM / project PM). */
async function isPm(supabase: Client, user: SessionUser, projectId: string): Promise<boolean> {
  if (user.isSuperadmin || user.isGlobalPm) return true;
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as { role?: string } | null)?.role === "pm";
}

export async function createReleaseNoteAction(
  rawProjectId: string,
  input: unknown,
): Promise<RNResult> {
  const t = await getTranslations("releaseNotes");
  const pid = idSchema.safeParse(rawProjectId);
  const parsed = inputSchema.safeParse(input);
  if (!pid.success || !parsed.success) return { ok: false, error: t("errorInvalid") };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const supabase = await createClient();
  if (!(await isPm(supabase, user, pid.data))) return { ok: false, error: t("errorNotAuthorized") };

  const { error } = await supabase
    .from("release_notes")
    .insert({ project_id: pid.data, ...parsed.data, created_by: user.id });
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath(`/projects/${pid.data}`);
  return { ok: true };
}

export async function updateReleaseNoteAction(
  rawId: string,
  rawProjectId: string,
  input: unknown,
): Promise<RNResult> {
  const t = await getTranslations("releaseNotes");
  const id = idSchema.safeParse(rawId);
  const pid = idSchema.safeParse(rawProjectId);
  const parsed = inputSchema.safeParse(input);
  if (!id.success || !pid.success || !parsed.success)
    return { ok: false, error: t("errorInvalid") };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const supabase = await createClient();
  if (!(await isPm(supabase, user, pid.data))) return { ok: false, error: t("errorNotAuthorized") };

  const { error } = await supabase
    .from("release_notes")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("project_id", pid.data);
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath(`/projects/${pid.data}`);
  return { ok: true };
}

export async function deleteReleaseNoteAction(
  rawId: string,
  rawProjectId: string,
): Promise<RNResult> {
  const t = await getTranslations("releaseNotes");
  const id = idSchema.safeParse(rawId);
  const pid = idSchema.safeParse(rawProjectId);
  if (!id.success || !pid.success) return { ok: false, error: t("errorInvalid") };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const supabase = await createClient();
  if (!(await isPm(supabase, user, pid.data))) return { ok: false, error: t("errorNotAuthorized") };

  const { error } = await supabase
    .from("release_notes")
    .delete()
    .eq("id", id.data)
    .eq("project_id", pid.data);
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath(`/projects/${pid.data}`);
  return { ok: true };
}

const RN_SYSTEM = [
  "You draft a client-facing release note for a software project.",
  "Write in warm, plain language for a non-technical client — what's new and what it means for them.",
  "Use GitHub-flavored markdown: a short intro line, then a bulleted list of the changes.",
  "Ground every point ONLY in the data given — never invent features. Keep it under ~150 words.",
  "Use sentence case and curly quotes (“ ” ’). Do not include a heading or a version number.",
].join(" ");

/** Draft a release note body from the project's recent shipped work (AI). PM only. */
export async function draftReleaseNoteAction(rawProjectId: string): Promise<DraftResult> {
  const t = await getTranslations("releaseNotes");
  const pid = idSchema.safeParse(rawProjectId);
  if (!pid.success) return { ok: false, error: t("errorInvalid") };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const supabase = await createClient();
  if (!(await isPm(supabase, user, pid.data))) return { ok: false, error: t("errorNotAuthorized") };
  if (!aiConfigured()) return { ok: false, error: t("errorNotConfigured") };

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const [doneRes, actRes] = await Promise.all([
    supabase
      .from("plan_items")
      .select("title,updated_at")
      .eq("project_id", pid.data)
      .eq("type", "task")
      .eq("status", "done")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("activity_events")
      .select("summary,created_at")
      .eq("project_id", pid.data)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const done = ((doneRes.data ?? []) as { title: string }[]).map((d) => d.title).filter(Boolean);
  const acts = ((actRes.data ?? []) as { summary: string }[]).map((a) => a.summary).filter(Boolean);
  if (done.length === 0 && acts.length === 0) return { ok: false, error: t("errorNoActivity") };

  const userPrompt = [
    "Recently completed tasks:",
    ...(done.length ? done.map((d) => `- ${d}`) : ["(none)"]),
    "",
    "Recent activity:",
    ...(acts.length ? acts.map((a) => `- ${a}`) : ["(none)"]),
  ].join("\n");

  try {
    const body = await chatComplete(RN_SYSTEM, userPrompt, 500);
    return { ok: true, body };
  } catch {
    return { ok: false, error: t("errorFailed") };
  }
}
