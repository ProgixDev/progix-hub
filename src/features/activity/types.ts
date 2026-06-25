/** A recorded activity event with its project name (spec 028). */
export type ActivityEvent = {
  id: string;
  project_id: string;
  project_name: string;
  actor_label: string;
  kind: string;
  summary: string;
  created_at: string;
};
