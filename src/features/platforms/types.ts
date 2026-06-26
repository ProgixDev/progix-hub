/** How a client grants Progix access for a platform (spec 015). */
export const ACCESS_PATTERNS = ["invite_collaborator", "store_key", "diy"] as const;
export type AccessPattern = (typeof ACCESS_PATTERNS)[number];

/** A tutorial attached to a platform, with its purpose label (spec 020). `title` is for display. */
export type PlatformTutorial = { tutorial_id: string; label: string | null; title?: string };

/** A configured platform in the org-wide registry. */
export type Platform = {
  id: string;
  name: string;
  /** Logo key from the known service set, or null (lettered fallback). */
  service_id: string | null;
  access_pattern: AccessPattern;
  critical: boolean;
  /** Ordered instruction steps the client follows. */
  steps: string[];
  /** Tutorials attached from the library, each labeled by purpose (spec 020). */
  tutorials: PlatformTutorial[];
  /** How many attached tutorials are client-visible AND have a written guide (coverage, spec 033). */
  clientGuides: number;
  // invite_collaborator pattern:
  invite_url: string | null;
  invite_role: string | null;
  invite_email: string | null;
  // store_key pattern:
  key_label: string | null;
  disabled: boolean;
  created_at: string;
  updated_at: string;
};
