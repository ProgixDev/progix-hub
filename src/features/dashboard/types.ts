/** A plan item assigned to the current user, with its project name (Today dashboard). */
export type MyTask = {
  id: string;
  title: string;
  status: string;
  project_id: string;
  project_name: string;
};

/** A recent daily report across the user's projects. */
export type RecentReport = {
  id: string;
  project_id: string;
  project_name: string;
  author_label: string | null;
  created_at: string;
  snippet: string;
};
