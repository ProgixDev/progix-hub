import { ALLOWED_MIME, MAX_FILE_BYTES, type DocumentTab, type ProjectDocument } from "./types";

/** Client + server file gate (AC-5): returns an error message, or null if the file is allowed. */
export function validateFile(file: { size: number; type: string }): string | null {
  if (!(file.type in ALLOWED_MIME)) {
    return "Unsupported file type — use PDF, DOCX, an image, or ZIP.";
  }
  if (file.size > MAX_FILE_BYTES) return "File is too large — the limit is 50 MB.";
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

export function mimeLabel(mime: string | null): string {
  return (mime && ALLOWED_MIME[mime]) || "File";
}
