export const LANGUAGES = ["en", "fr"] as const;
export type Language = (typeof LANGUAGES)[number];

/** A how-to video in the library (spec 016). v1 is embed-only (YouTube/Loom/Vimeo). */
export type Tutorial = {
  id: string;
  title: string;
  description: string | null;
  /** Optional tag referencing a platform's service key (spec 015). */
  platform_service_id: string | null;
  /** The original pasted link; the player derives a safe embed src from it. */
  embed_url: string;
  language: Language | null;
  visible_to_clients: boolean;
  created_at: string;
  updated_at: string;
};
