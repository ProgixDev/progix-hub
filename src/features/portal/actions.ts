"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { blockInputSchema, cardInputSchema } from "./types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type ShareLinkResult = { ok: true; token: string } | { ok: false; error: string };

async function fieldErrorsOf(error: z.ZodError): Promise<Record<string, string>> {
  const t = await getTranslations();
  const flat = z.flattenError(error);
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    const list = messages as string[] | undefined;
    if (list && list.length > 0) out[key] = t(list[0]!);
  }
  return out;
}

function portalPath(projectId: string): string {
  return `/projects/${projectId}/portal`;
}

/** Add a block (AC-1). */
export async function createPortalBlockAction(
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const parsed = blockInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("errors.fixFields"),
      fieldErrors: await fieldErrorsOf(parsed.error),
    };
  }
  const supabase = await createClient();
  const { count } = await supabase
    .from("portal_blocks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .is("archived_at", null);
  const { error } = await supabase.from("portal_blocks").insert({
    project_id: projectId,
    name: parsed.data.name,
    position: count ?? 0,
  });
  if (error) return { ok: false, error: t("portal.errorGeneric") };
  revalidatePath(portalPath(projectId));
  return { ok: true };
}

/** Rename a block (AC-1). */
export async function updatePortalBlockAction(
  id: string,
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("portal.errorUnknownBlock") };

  const parsed = blockInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("errors.fixFields"),
      fieldErrors: await fieldErrorsOf(parsed.error),
    };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("portal_blocks")
    .update({ name: parsed.data.name })
    .match({ id, project_id: projectId });
  if (error) return { ok: false, error: t("portal.errorGeneric") };
  revalidatePath(portalPath(projectId));
  return { ok: true };
}

/** Archive a block — its cards stay (they keep block_id; archived blocks just stop rendering). */
export async function archivePortalBlockAction(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("portal.errorUnknownBlock") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("portal_blocks")
    .update({ archived_at: new Date().toISOString() })
    .match({ id, project_id: projectId });
  if (error) return { ok: false, error: t("portal.errorGeneric") };
  revalidatePath(portalPath(projectId));
  return { ok: true };
}

/** Add a feature card (AC-1). */
export async function createPortalCardAction(
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const parsed = cardInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("errors.fixFields"),
      fieldErrors: await fieldErrorsOf(parsed.error),
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("portal_cards").insert({
    project_id: projectId,
    block_id: parsed.data.block_id,
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    origin: "team",
    created_by: member.id,
  });
  if (error) return { ok: false, error: t("portal.errorGeneric") };
  revalidatePath(portalPath(projectId));
  return { ok: true };
}

const cardPatchSchema = cardInputSchema.partial();

/** Edit a card / change its status / triage a proposal into a block (AC-1, AC-6). */
export async function updatePortalCardAction(
  id: string,
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("portal.errorUnknownCard") };

  const parsed = cardPatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("errors.fixFields"),
      fieldErrors: await fieldErrorsOf(parsed.error),
    };
  }
  if (Object.keys(parsed.data).length === 0) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase
    .from("portal_cards")
    .update(parsed.data)
    .match({ id, project_id: projectId });
  if (error) return { ok: false, error: t("portal.errorGeneric") };
  revalidatePath(portalPath(projectId));
  return { ok: true };
}

/** Archive a card (soft delete — there is no hard delete). */
export async function archivePortalCardAction(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: t("portal.errorUnknownCard") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("portal_cards")
    .update({ archived_at: new Date().toISOString() })
    .match({ id, project_id: projectId });
  if (error) return { ok: false, error: t("portal.errorGeneric") };
  revalidatePath(portalPath(projectId));
  return { ok: true };
}

const memberCommentSchema = z.object({
  body: z.string().trim().min(1, { error: "portal.errorBodyRequired" }).max(4000),
});

/** A member replies on a card — keeps the dialogue with the client in one place. */
export async function addMemberCommentAction(
  cardId: string,
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(cardId).success)
    return { ok: false, error: t("portal.errorUnknownCard") };

  const parsed = memberCommentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: t("errors.fixFields"),
      fieldErrors: await fieldErrorsOf(parsed.error),
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("portal_comments").insert({
    project_id: projectId,
    card_id: cardId,
    author_kind: "member",
    author_name: member.name ?? member.email ?? "Progix",
    body: parsed.data.body,
    created_by: member.id,
  });
  if (error) return { ok: false, error: t("portal.errorGeneric") };
  revalidatePath(portalPath(projectId));
  return { ok: true };
}

/**
 * Create (or rotate) the share link (AC-2): revoke any active link, mint a fresh 256-bit
 * token, store ONLY its SHA-256. The raw token is returned exactly once — to the member's
 * screen — and never persisted.
 */
export async function createShareLinkAction(projectId: string): Promise<ShareLinkResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");

  const supabase = await createClient();
  const { error: revokeError } = await supabase
    .from("portal_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .is("revoked_at", null);
  if (revokeError) return { ok: false, error: t("portal.errorGeneric") };

  const { error } = await supabase.from("portal_share_links").insert({
    project_id: projectId,
    token_hash: tokenHash,
    created_by: member.id,
    created_by_email: member.email,
  });
  if (error) return { ok: false, error: t("portal.errorGeneric") };
  revalidatePath(portalPath(projectId));
  return { ok: true, token };
}

/** Revoke the active link (AC-2) — the portal goes dark for the client. */
export async function revokeShareLinkAction(projectId: string): Promise<ActionResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(projectId).success)
    return { ok: false, error: t("errors.unknownProject") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("portal_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .is("revoked_at", null);
  if (error) return { ok: false, error: t("portal.errorGeneric") };
  revalidatePath(portalPath(projectId));
  return { ok: true };
}

export type DownloadResult = { ok: true; url: string } | { ok: false; error: string };

/** Member downloads a client attachment via their own RLS-policied signed URL. */
export async function getMemberAttachmentUrlAction(attachmentId: string): Promise<DownloadResult> {
  const t = await getTranslations();
  const member = await requireMember();
  if (!member) return { ok: false, error: t("errors.notAuthorized") };
  if (!z.uuid().safeParse(attachmentId).success) {
    return { ok: false, error: t("portal.errorGeneric") };
  }
  const supabase = await createClient();
  const { data: attachment, error: readError } = await supabase
    .from("portal_attachments")
    .select("file_path")
    .eq("id", attachmentId)
    .maybeSingle();
  if (readError || !attachment?.file_path) return { ok: false, error: t("portal.errorGeneric") };

  const { data, error } = await supabase.storage
    .from("portal-attachments")
    .createSignedUrl(attachment.file_path as string, 60 * 60, { download: true });
  if (error || !data) return { ok: false, error: t("portal.errorGeneric") };
  return { ok: true, url: data.signedUrl };
}
