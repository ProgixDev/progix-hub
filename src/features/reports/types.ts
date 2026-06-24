/** A daily report posted against a project (spec 021). Markdown, team-only. */
export type ProjectReport = {
  id: string;
  project_id: string;
  content_md: string;
  created_at: string;
  /** Author name/email, denormalized at write time. */
  author_label: string | null;
};

/** A project the current member may post a report to (for the picker). */
export type ReportableProject = { id: string; name: string };
