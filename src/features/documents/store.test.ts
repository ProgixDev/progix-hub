import { describe, expect, it } from "vitest";
import { createDocumentsStore } from "./store";
import type { ProjectDocument } from "./types";

const sample: ProjectDocument = {
  id: "11111111-1111-4111-8111-111111111111",
  project_id: "p",
  kind: "link",
  title: "Figma",
  file_path: null,
  file_size: null,
  file_mime: null,
  url: "https://figma.com",
  body: null,
  created_by: null,
  archived_at: null,
  created_at: "2026-06-09T00:00:00Z",
  updated_at: "2026-06-09T00:00:00Z",
};

describe("documents store", () => {
  it("switches the active tab (AC-4)", () => {
    const store = createDocumentsStore();
    expect(store.getState().tab).toBe("all");
    store.getState().setTab("file");
    expect(store.getState().tab).toBe("file");
  });

  it("opens add-link / add-note / edit and closes", () => {
    const store = createDocumentsStore();
    store.getState().openAddLink();
    expect(store.getState().modal).toEqual({ mode: "add-link" });
    store.getState().openAddNote();
    expect(store.getState().modal).toEqual({ mode: "add-note" });
    store.getState().openEdit(sample);
    expect(store.getState().modal).toEqual({ mode: "edit", doc: sample });
    store.getState().closeModal();
    expect(store.getState().modal).toEqual({ mode: "closed" });
  });
});
