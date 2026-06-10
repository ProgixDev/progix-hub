import { ALLOWED_MIME, MAX_FILE_BYTES, type DocumentTab, type ProjectDocument } from "./types";

/** Why a file failed the client gate — the caller maps each code to a translated message (spec 005). */
export type FileError = "type" | "size";

/** Client + server file gate (AC-5): returns a reason code, or null if the file is allowed. */
export function validateFile(file: { size: number; type: string }): FileError | null {
  if (!(file.type in ALLOWED_MIME)) return "type";
  if (file.size > MAX_FILE_BYTES) return "size";
  return null;
}

/** Filter documents by the active tab (AC-4). */
export function byTab(docs: ProjectDocument[], tab: DocumentTab): ProjectDocument[] {
  return tab === "all" ? docs : docs.filter((d) => d.kind === tab);
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Acronym label for a known MIME type (PDF, DOCX, …), or null — the component renders the fallback. */
export function mimeLabel(mime: string | null): string | null {
  return (mime && ALLOWED_MIME[mime]) || null;
}
