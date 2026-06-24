export const LANGUAGES = ["en", "fr"] as const;
export type Language = (typeof LANGUAGES)[number];

export type SourceType = "embed" | "upload";

/** A how-to video in the library (spec 016, +uploads in 019). Either an embed link or a stored file. */
export type Tutorial = {
  id: string;
  title: string;
  description: string | null;
  /** Optional tag referencing a platform's service key (spec 015). */
  platform_service_id: string | null;
  source_type: SourceType;
  /** Embed source: the original pasted link; the player derives a safe embed src from it. Null for uploads. */
  embed_url: string | null;
  /** Upload source: the private Storage object path. Null for embeds. Served via a signed URL. */
  storage_path: string | null;
  language: Language | null;
  visible_to_clients: boolean;
  created_at: string;
  updated_at: string;
};
