import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "./project-card";
import type { Project } from "../types";

const base: Project = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Atlas Commerce",
  status: "active",
  description: "Storefront",
  notion_url: null,
  slack_url: null,
  github_url: "https://github.com/DigitariaWebs/atlas",
  live_url: null,
  created_at: "2026-06-08T00:00:00Z",
  updated_at: "2026-06-08T00:00:00Z",
};

describe("ProjectCard (AC-6)", () => {
  it("renders a set link as a new-tab anchor", () => {
    render(<ProjectCard project={base} />);
    const link = screen.getByRole("link", { name: /GitHub \(opens in a new tab\)/i });
    expect(link).toHaveAttribute("href", base.github_url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("renders an unset link as a non-link empty slot, never a broken anchor", () => {
    render(<ProjectCard project={base} />);
    expect(screen.queryByRole("link", { name: /Notion/i })).toBeNull();
    expect(screen.getByLabelText(/Notion not linked/i)).toBeInTheDocument();
  });

  it("shows the status", () => {
    render(<ProjectCard project={base} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
