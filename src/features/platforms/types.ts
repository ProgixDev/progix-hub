/** How a client grants Progix access for a platform (spec 015). */
export const ACCESS_PATTERNS = ["invite_collaborator", "store_key", "diy"] as const;
export type AccessPattern = (typeof ACCESS_PATTERNS)[number];

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
  video_url: string | null;
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
