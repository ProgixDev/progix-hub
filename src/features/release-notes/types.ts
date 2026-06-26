/** A release-notes / changelog entry for a project (spec 040). */
export type ReleaseNote = {
  id: string;
  project_id: string;
  version: string | null;
  title: string;
  body_md: string;
  published: boolean;
  created_at: string;
};

/** Client-facing published entry shown on the portal (whitelisted fields). */
export type PublicReleaseNote = {
  id: string;
  version: string | null;
  title: string;
  body_md: string;
  created_at: string;
};
