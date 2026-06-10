"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { fileMetaSchema, linkInputSchema, noteInputSchema } from "./types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type DownloadResult = { ok: true; url: string } | { ok: false; error: string };

type Translate = Awaited<ReturnType<typeof getTranslations>>;

const SIGNED_URL_TTL = 60 * 60; // 1 hour

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

/** Add an external link (AC-2). */
export async function addLinkDocumentAction(
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const parsed = linkInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t("errors.fixFields"), fieldErrors: fieldErrorsOf(parsed.error, t) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    project_id: projectId,
    kind: "link",
    title: parsed.data.title,
    url: parsed.data.url,
    created_by: member.id,
    created_by_email: member.email,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Add a rich-text (Markdown) note (AC-3). */
export async function addNoteDocumentAction(
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const parsed = noteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t("errors.fixFields"), fieldErrors: fieldErrorsOf(parsed.error, t) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    project_id: projectId,
    kind: "note",
    title: parsed.data.title,
    body: parsed.data.body,
    created_by: member.id,
    created_by_email: member.email,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Record a file's metadata after the browser has uploaded it to Storage (AC-1). Re-validates size + MIME. */
export async function recordFileDocumentAction(
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const parsed = fileMetaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("documents.errorFileNotAllowed"),
      fieldErrors: fieldErrorsOf(parsed.error, t),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    project_id: projectId,
    kind: "file",
    title: parsed.data.title,
    file_path: parsed.data.file_path,
    file_size: parsed.data.file_size,
    file_mime: parsed.data.file_mime,
    created_by: member.id,
    created_by_email: member.email,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Edit a link or a note (AC-8). */
export async function updateDocumentAction(
  id: string,
  projectId: string,
  kind: "link" | "note",
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("documents.errorUnknownDoc") };

  const schema = kind === "link" ? linkInputSchema : noteInputSchema;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t("errors.fixFields"), fieldErrors: fieldErrorsOf(parsed.error, t) };
  }
  const patch =
    kind === "link"
      ? {
          title: (parsed.data as z.infer<typeof linkInputSchema>).title,
          url: (parsed.data as z.infer<typeof linkInputSchema>).url,
        }
      : {
          title: (parsed.data as z.infer<typeof noteInputSchema>).title,
          body: (parsed.data as z.infer<typeof noteInputSchema>).body,
        };

  const supabase = await createClient();
  // Bind the mutation to (id, project_id) so a mismatched projectId can't edit a row
  // in another project (and leave that project's cache stale). RLS still applies.
  const { error } = await supabase
    .from("documents")
    .update(patch)
    .match({ id, project_id: projectId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Archive a document (AC-7) — soft delete; there is no hard delete. */
export async function archiveDocumentAction(id: string, projectId: string): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("documents.errorUnknownDoc") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ archived_at: new Date().toISOString() })
    .match({ id, project_id: projectId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Restore an archived document (AC-7). */
export async function restoreDocumentAction(id: string, projectId: string): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("documents.errorUnknownDoc") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ archived_at: null })
    .match({ id, project_id: projectId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/** Member-only download: a short-lived signed URL for the private file (AC-1, AC-6). */
export async function getDocumentDownloadUrlAction(id: string): Promise<DownloadResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("documents.errorUnknownDoc") };

  const supabase = await createClient();
  const { data: doc, error: readErr } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!doc?.file_path) return { ok: false, error: t("documents.errorFileNotFound") };

  const { data, error } = await supabase.storage
    .from("project-documents")
    // `download: true` forces Content-Disposition: attachment, so an uploaded SVG/HTML
    // can never render (and run script) inline in the storage origin — it only downloads.
    .createSignedUrl(doc.file_path as string, SIGNED_URL_TTL, { download: true });
  if (error || !data) return { ok: false, error: t("documents.errorDownload") };
  return { ok: true, url: data.signedUrl };
}
