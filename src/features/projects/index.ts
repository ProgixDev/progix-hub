// Public API for the projects slice. Other layers import only from here.
// NOTE: listProjects/getProject are SERVER-ONLY entry points (data.ts imports "server-only").
// Import them only from Server Components / route handlers. Client islands in this slice use
// relative imports and never pull this barrel, so the server-only guard is never tripped.
export { listProjects, getProject } from "./data";
export { ProjectsPortfolio } from "./components/portfolio";
export { ProjectDetail } from "./components/project-detail";
export type { Project, ProjectStatus } from "./types";
