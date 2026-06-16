import { createStore } from "zustand/vanilla";
import type { Project, ProjectView, StatusFilter } from "./types";

export type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; project: Project };

export type ProjectsState = {
  filter: StatusFilter;
  view: ProjectView;
  modal: ModalState;
  setFilter: (filter: StatusFilter) => void;
  setView: (view: ProjectView) => void;
  openCreate: () => void;
  openEdit: (project: Project) => void;
  closeModal: () => void;
};

/** UI-only store (filter + layout + create/edit modal). Server data is passed in via props, not cached here. */
export function createProjectsStore() {
  return createStore<ProjectsState>((set) => ({
    filter: "all",
    view: "grid",
    modal: { mode: "closed" },
    setFilter: (filter) => set({ filter }),
    setView: (view) => set({ view }),
    openCreate: () => set({ modal: { mode: "create" } }),
    openEdit: (project) => set({ modal: { mode: "edit", project } }),
    closeModal: () => set({ modal: { mode: "closed" } }),
  }));
}

export type ProjectsStore = ReturnType<typeof createProjectsStore>;
