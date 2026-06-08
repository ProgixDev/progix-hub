import { createStore } from "zustand/vanilla";
import type { Project, StatusFilter } from "./types";

export type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; project: Project };

export type ProjectsState = {
  filter: StatusFilter;
  modal: ModalState;
  setFilter: (filter: StatusFilter) => void;
  openCreate: () => void;
  openEdit: (project: Project) => void;
  closeModal: () => void;
};

/** UI-only store (filter + create/edit modal). Server data is passed in via props, not cached here. */
export function createProjectsStore() {
  return createStore<ProjectsState>((set) => ({
    filter: "all",
    modal: { mode: "closed" },
    setFilter: (filter) => set({ filter }),
    openCreate: () => set({ modal: { mode: "create" } }),
    openEdit: (project) => set({ modal: { mode: "edit", project } }),
    closeModal: () => set({ modal: { mode: "closed" } }),
  }));
}

export type ProjectsStore = ReturnType<typeof createProjectsStore>;
