"use server";

import { randomUUID } from "node:crypto";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateAttachment } from "./lib";
import { clientCommentSchema, clientProposalSchema } from "./types";

export type PublicActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type PublicDownloadResult = { ok: true; url: string } | { ok: false; error: string };

const SIGNED_URL_TTL = 60 * 60; // 1 hour
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{20,80}$/;

/** Map RPC raise messages to friendly, localized copy — never leak raw errors (AC-8). */
async function friendlyRpcError(message: string): Promise<string> {
  const t = await getTranslations("portal");
  if (message.includes("portal_rate_limited")) return t("errorRateLimited");
  if (message.includes("portal_invalid_token")) return t("errorLinkInactive");
  if (message.includes("portal_cap_reached")) return t("errorCapReached");
  return t("errorGeneric");
}

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

/** Client comments on a card (AC-4). `website` is the honeypot — bots filling it are dropped. */
export async function submitPortalCommentAction(
  token: string,
  cardId: string,
  input: { author_name?: unknown; body?: unknown; website?: unknown },
): Promise<PublicActionResult> {
  const t = await getTranslations("portal");
  if (typeof input.website === "string" && input.website.length > 0) return { ok: true }; // bot
  if (!TOKEN_SHAPE.test(token) || !z.uuid().safeParse(cardId).success) {
    return { ok: false, error: t("errorLinkInactive") };
  }
  const parsed = clientCommentSchema.safeParse(input);
  if (!parsed.success) {
    const tAll = await getTranslations();
    return {
      ok: false,
      error: tAll("errors.fixFields"),
      fieldErrors: await fieldErrorsOf(parsed.error),
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("portal_public_comment", {
    p_token: token,
    p_card_id: cardId,
    p_author: parsed.data.author_name,
    p_body: parsed.data.body,
  });
  if (error) return { ok: false, error: await friendlyRpcError(error.message) };
  return { ok: true };
}

/** Client proposes a feature (AC-6) — lands as a Proposed card for the team to triage. */
export async function submitPortalProposalAction(
  token: string,
  input: {
    author_name?: unknown;
    block_id?: unknown;
    title?: unknown;
    description?: unknown;
    website?: unknown;
  },
): Promise<PublicActionResult> {
  const t = await getTranslations("portal");
  if (typeof input.website === "string" && input.website.length > 0) return { ok: true }; // bot
  if (!TOKEN_SHAPE.test(token)) return { ok: false, error: t("errorLinkInactive") };

  const parsed = clientProposalSchema.safeParse({
    ...input,
    block_id: input.block_id === "" || input.block_id == null ? null : input.block_id,
    description: input.description ?? "",
  });
  if (!parsed.success) {
    const tAll = await getTranslations();
    return {
      ok: false,
      error: tAll("errors.fixFields"),
      fieldErrors: await fieldErrorsOf(parsed.error),
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("portal_public_propose", {
    p_token: token,
    p_block_id: parsed.data.block_id,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_author: parsed.data.author_name,
  });
  if (error) return { ok: false, error: await friendlyRpcError(error.message) };
  return { ok: true };
}

/** Storage keys must stay tame regardless of the client's file name. */
function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\- ()]/g, "_").slice(-140);
  return cleaned.length > 0 ? cleaned : "file";
}

/**
 * Client attaches a file to a card (AC-5). The token is validated BEFORE the admin client
 * (which bypasses RLS) touches anything (ADR-0010); the RPC then re-validates everything
 * when recording the metadata, and the bucket re-enforces size + MIME.
 */
export async function submitPortalAttachmentAction(
  token: string,
  cardId: string,
  formData: FormData,
): Promise<PublicActionResult> {
  const t = await getTranslations("portal");
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.length > 0) return { ok: true }; // bot
  if (!TOKEN_SHAPE.test(token) || !z.uuid().safeParse(cardId).success) {
    return { ok: false, error: t("errorLinkInactive") };
  }
  const authorName = z.string().trim().min(1).max(80).safeParse(formData.get("author_name"));
  if (!authorName.success) return { ok: false, error: t("errorNameRequired") };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: t("errorFileType") };
  const invalid = validateAttachment(file);
  if (invalid === "type") return { ok: false, error: t("errorFileType") };
  if (invalid === "size") return { ok: false, error: t("errorFileSize") };

  // Resolve the token to its project (admin read of the hashed link — no data leaves here).
  const admin = (() => {
    try {
      return createAdminClient();
    } catch {
      return null;
    }
  })();
  if (!admin) return { ok: false, error: t("errorGeneric") };

  const { createHash } = await import("node:crypto");
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  const { data: link } = await admin
    .from("portal_share_links")
    .select("project_id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();
  if (!link) return { ok: false, error: t("errorLinkInactive") };

  const path = `${link.project_id}/${randomUUID()}/${safeFileName(file.name)}`;
  const uploaded = await admin.storage
    .from("portal-attachments")
    .upload(path, file, { contentType: file.type });
  if (uploaded.error) return { ok: false, error: t("errorUpload") };

  // The RPC is the canonical validator: token, card↔project, path prefix, MIME, limits.
  const supabase = await createClient();
  const { error } = await supabase.rpc("portal_public_record_attachment", {
    p_token: token,
    p_card_id: cardId,
    p_file_path: path,
    p_file_name: file.name.slice(0, 300),
    p_file_size: file.size,
    p_file_mime: file.type,
    p_author: authorName.data,
  });
  if (error) {
    await admin.storage.from("portal-attachments").remove([path]); // best-effort cleanup
    return { ok: false, error: await friendlyRpcError(error.message) };
  }
  return { ok: true };
}

/** Client downloads an attachment: token → project → signed URL (attachment-forced). */
export async function getPortalAttachmentUrlAction(
  token: string,
  attachmentId: string,
): Promise<PublicDownloadResult> {
  const t = await getTranslations("portal");
  if (!TOKEN_SHAPE.test(token) || !z.uuid().safeParse(attachmentId).success) {
    return { ok: false, error: t("errorLinkInactive") };
  }
  const admin = (() => {
    try {
      return createAdminClient();
    } catch {
      return null;
    }
  })();
  if (!admin) return { ok: false, error: t("errorGeneric") };

  const { createHash } = await import("node:crypto");
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  const { data: link } = await admin
    .from("portal_share_links")
    .select("project_id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();
  if (!link) return { ok: false, error: t("errorLinkInactive") };

  const { data: attachment } = await admin
    .from("portal_attachments")
    .select("file_path")
    .match({ id: attachmentId, project_id: link.project_id })
    .maybeSingle();
  if (!attachment) return { ok: false, error: t("errorGeneric") };

  const { data, error } = await admin.storage
    .from("portal-attachments")
    .createSignedUrl(attachment.file_path as string, SIGNED_URL_TTL, { download: true });
  if (error || !data) return { ok: false, error: t("errorGeneric") };
  return { ok: true, url: data.signedUrl };
}
