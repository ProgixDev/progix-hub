import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "../types";

// project-form imports the server-action module; mock it so this client test doesn't
// pull `server-only` (the real app compiles the action boundary via Next).
vi.mock("../actions", () => ({
  createProjectAction: vi.fn(),
  updateProjectAction: vi.fn(),
  archiveProjectAction: vi.fn(),
}));

import { ProjectsPortfolio } from "./portfolio";

const project: Project = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Atlas Commerce",
  status: "active",
  description: "Storefront",
  notion_url: null,
  slack_url: null,
  github_url: null,
  live_url: null,
  created_at: "2026-06-08T00:00:00Z",
  updated_at: "2026-06-08T00:00:00Z",
};

describe("ProjectsPortfolio (AC-3)", () => {
  it("shows the empty state when there are no projects", () => {
    render(<ProjectsPortfolio projects={[]} />);
    expect(screen.getByRole("heading", { name: "No projects yet" })).toBeInTheDocument();
  });

  it("renders project cards when there are projects", () => {
    render(<ProjectsPortfolio projects={[project]} />);
    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Atlas Commerce" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No projects yet" })).toBeNull();
  });
});
