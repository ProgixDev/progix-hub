import { describe, expect, it } from "vitest";
import { createProjectsStore } from "./store";
import { filterProjects } from "./lib";
import type { Project } from "./types";

function project(overrides: Partial<Project>): Project {
  return {
    id: "1",
    name: "X",
    status: "active",
    description: null,
    notion_url: null,
    slack_url: null,
    github_url: null,
    live_url: null,
    created_at: "2026-06-08T00:00:00Z",
    updated_at: "2026-06-08T00:00:00Z",
    ...overrides,
  };
}

describe("projects store", () => {
  it("defaults to the all filter, modal closed", () => {
    const s = createProjectsStore().getState();
    expect(s.filter).toBe("all");
    expect(s.modal.mode).toBe("closed");
  });

  it("opens create and edit modals and closes them", () => {
    const store = createProjectsStore();
    store.getState().openCreate();
    expect(store.getState().modal.mode).toBe("create");
    const p = project({ id: "9" });
    store.getState().openEdit(p);
    const modal = store.getState().modal;
    expect(modal.mode === "edit" && modal.project.id).toBe("9");
    store.getState().closeModal();
    expect(store.getState().modal.mode).toBe("closed");
  });
});

describe("filterProjects (AC-5)", () => {
  const projects = [
    project({ id: "a", status: "active" }),
    project({ id: "b", status: "at_risk" }),
    project({ id: "c", status: "archived" }),
  ];

  it("returns everything for 'all'", () => {
    expect(filterProjects(projects, "all")).toHaveLength(3);
  });

  it("archiving removes a project from the active view", () => {
    expect(filterProjects(projects, "active").map((p) => p.id)).toEqual(["a"]);
    expect(filterProjects(projects, "archived").map((p) => p.id)).toEqual(["c"]);
  });
});
