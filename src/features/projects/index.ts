// Public API for the projects slice. Other layers import only from here.
export { listProjects, getProject } from "./data";
export { ProjectsPortfolio } from "./components/portfolio";
export { ProjectDetail } from "./components/project-detail";
export type { Project, ProjectStatus } from "./types";
