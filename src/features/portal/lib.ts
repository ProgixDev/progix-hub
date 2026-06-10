import { ATTACHMENT_MIME, MAX_ATTACHMENT_BYTES, type PortalCard } from "./types";

export type AttachmentError = "type" | "size";

/** Client + server attachment gate (AC-5): a reason code, or null if allowed. */
export function validateAttachment(file: { size: number; type: string }): AttachmentError | null {
  if (!(file.type in ATTACHMENT_MIME)) return "type";
  if (file.size > MAX_ATTACHMENT_BYTES) return "size";
  return null;
}

/** Cards for one block (or the unassigned-proposals group when blockId is null). */
export function cardsForBlock<T extends Pick<PortalCard, "block_id">>(
  cards: T[],
  blockId: string | null,
): T[] {
  return cards.filter((c) => c.block_id === blockId);
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mimeLabel(mime: string | null): string | null {
  return (mime && ATTACHMENT_MIME[mime]) || null;
}
