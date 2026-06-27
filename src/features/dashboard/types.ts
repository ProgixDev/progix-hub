/** A plan item assigned to the current user, with its project name (Today dashboard). */
export type MyTask = {
  id: string;
  title: string;
  status: string;
  project_id: string;
  project_name: string;
};

/** One project's health row for the cross-project board. */
export type ProjectHealth = {
  id: string;
  name: string;
  status: string;
  task_total: number;
  task_done: number;
  specs: number;
  reports: number;
  last_report: string | null;
  has_setup: boolean;
  has_portal: boolean;
  members: number;
};

/** A team member's load: clock state + open assigned tasks (workload view). */
export type WorkloadRow = {
  userId: string;
  name: string;
  state: "working" | "paused" | "off";
  secondsToday: number;
  openTasks: number;
};

/** A team member's worked-hours summary (time insights). */
export type TimeMember = {
  userId: string;
  name: string;
  weekSeconds: number;
  monthSeconds: number;
  /** Last 7 days, oldest → newest, seconds per day (for the bar sparkline). */
  weekDaily: number[];
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
