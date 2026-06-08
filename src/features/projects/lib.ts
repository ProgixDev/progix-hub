import type { Project, StatusFilter } from "./types";

/** Filter a project list by the active status tab (AC-5). */
export function filterProjects(projects: Project[], filter: StatusFilter): Project[] {
  return filter === "all" ? projects : projects.filter((p) => p.status === filter);
}

/** Counts per status for the filter pills. */
export function statusCounts(projects: Project[]) {
  return {
    all: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    at_risk: projects.filter((p) => p.status === "at_risk").length,
    archived: projects.filter((p) => p.status === "archived").length,
  };
}
