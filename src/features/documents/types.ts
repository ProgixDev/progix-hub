import { z } from "zod";

export type DocumentKind = "file" | "link" | "note";
export type DocumentTab = "all" | DocumentKind;

/** A document row as stored. */
export type ProjectDocument = {
  id: string;
  project_id: string;
  kind: DocumentKind;
  title: string;
  file_path: string | null;
  file_size: number | null;
  file_mime: string | null;
  url: string | null;
  body: string | null;
  created_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Allowed uploads — mirrors the `project-documents` Storage bucket whitelist (defense in depth). */
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_MIME: Record<string, string> = {
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

export const linkInputSchema = z.object({
  title: z.string().trim().min(1, { error: "Title is required" }).max(300),
  url: z.url({ error: "Enter a valid URL (including https://)" }),
});
export type LinkInput = z.infer<typeof linkInputSchema>;

export const noteInputSchema = z.object({
  title: z.string().trim().min(1, { error: "Title is required" }).max(300),
  body: z.string().trim().min(1, { error: "Write something first" }).max(50_000),
});
export type NoteInput = z.infer<typeof noteInputSchema>;

/** Server-side metadata recorded after the browser uploads to Storage — re-validates size + MIME. */
export const fileMetaSchema = z.object({
  title: z.string().trim().min(1).max(300),
  file_path: z.string().trim().min(1),
  file_size: z.number().int().positive().max(MAX_FILE_BYTES),
  file_mime: z.string().refine((m) => m in ALLOWED_MIME, { error: "Unsupported file type" }),
});
export type FileMeta = z.infer<typeof fileMetaSchema>;
