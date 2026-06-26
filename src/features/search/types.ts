/** A single global-search hit across the surfaces a member can reach (spec 041). */
export type SearchKind = "project" | "document" | "spec" | "task" | "tutorial" | "member";

export type SearchResult = {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string | null;
  /** The owning project (for navigation), or null for org-wide hits (tutorials, members). */
  project_id: string | null;
};
