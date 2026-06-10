import { createStore } from "zustand/vanilla";
import type { DocumentTab, ProjectDocument } from "./types";

export type DocModalState =
  | { mode: "closed" }
  | { mode: "add-link" }
  | { mode: "add-note" }
  | { mode: "edit"; doc: ProjectDocument };

export type DocumentsState = {
  tab: DocumentTab;
  modal: DocModalState;
  setTab: (tab: DocumentTab) => void;
  openAddLink: () => void;
  openAddNote: () => void;
  openEdit: (doc: ProjectDocument) => void;
  closeModal: () => void;
};

/** UI-only store (active tab + add/edit modal). Server data is passed in via props. */
export function createDocumentsStore() {
  return createStore<DocumentsState>((set) => ({
    tab: "all",
    modal: { mode: "closed" },
    setTab: (tab) => set({ tab }),
    openAddLink: () => set({ modal: { mode: "add-link" } }),
    openAddNote: () => set({ modal: { mode: "add-note" } }),
    openEdit: (doc) => set({ modal: { mode: "edit", doc } }),
    closeModal: () => set({ modal: { mode: "closed" } }),
  }));
}

export type DocumentsStore = ReturnType<typeof createDocumentsStore>;
