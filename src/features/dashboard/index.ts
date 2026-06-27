// Public API for the dashboard slice. data fns are SERVER-ONLY (data.ts).
export {
  getMyOpenTasks,
  listRecentReports,
  getProjectHealth,
  getTeamWorkload,
  getTimeInsights,
} from "./data";
export { TodayPanel } from "./components/today-panel";
export { HealthBoard } from "./components/health-board";
export { WorkloadPanel } from "./components/workload-panel";
export { TimePanel } from "./components/time-panel";
export type { MyTask, ProjectHealth, RecentReport, WorkloadRow, TimeMember } from "./types";
