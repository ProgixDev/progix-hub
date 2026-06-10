import { z } from "zod";

export const CARD_STATUSES = ["delivered", "in_progress", "planned", "proposed"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export type PortalBlock = {
  id: string;
  project_id: string;
  name: string;
  position: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PortalCard = {
  id: string;
  project_id: string;
  block_id: string | null;
  title: string;
  description: string;
  status: CardStatus;
  origin: "team" | "client";
  client_author: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PortalComment = {
  id: string;
  card_id: string;
  author_kind: "member" | "client";
  author_name: string;
  body: string;
  created_at: string;
};

export type PortalAttachment = {
  id: string;
  card_id: string;
  file_path?: string;
  file_name: string;
  file_size: number;
  file_mime: string;
  author_name: string;
  created_at: string;
};

export type ShareLink = {
  id: string;
  project_id: string;
  revoked_at: string | null;
  created_at: string;
};

/** The JSON tree `portal_public_view` returns to the share page. */
export type PublicPortal = {
  project_name: string;
  blocks: Pick<PortalBlock, "id" | "name" | "position">[];
  cards: (Omit<PortalCard, "project_id" | "archived_at" | "updated_at"> & {
    comments: PortalComment[];
    attachments: PortalAttachment[];
  })[];
};

/**
 * Client attachments: 10 MB, same whitelist as documents (bucket re-enforces both).
 * `image/svg+xml` is allowed ONLY because every download is served with
 * `Content-Disposition: attachment` (`createSignedUrl(..., { download: true })`), so an
 * uploaded SVG can never render-and-run-script inline. If that download flag is ever
 * dropped, remove SVG from this list and the bucket whitelist (ADR-0010).
 */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_MIME: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
  "image/svg+xml": "SVG",
  "application/zip": "ZIP",
  "application/x-zip-compressed": "ZIP",
};

export const blockInputSchema = z.object({
  name: z.string().trim().min(1, { error: "portal.errorNameRequired" }).max(100),
});

export const cardInputSchema = z.object({
  block_id: z.uuid({ error: "portal.errorUnknownBlock" }),
  title: z.string().trim().min(1, { error: "portal.errorTitleRequired" }).max(200),
  description: z.string().trim().max(2000),
  status: z.enum(CARD_STATUSES),
});

export const clientNameSchema = z
  .string()
  .trim()
  .min(1, { error: "portal.errorNameRequired" })
  .max(80);

export const clientCommentSchema = z.object({
  author_name: clientNameSchema,
  body: z.string().trim().min(1, { error: "portal.errorBodyRequired" }).max(4000),
});

export const clientProposalSchema = z.object({
  author_name: clientNameSchema,
  block_id: z.uuid().nullable(),
  title: z.string().trim().min(1, { error: "portal.errorTitleRequired" }).max(200),
  description: z.string().trim().max(2000),
});
