import { createStore } from "zustand/vanilla";
import type { Tutorial } from "./types";

export type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; tutorial: Tutorial };

export type TutorialsState = {
  modal: ModalState;
  openCreate: () => void;
  openEdit: (tutorial: Tutorial) => void;
  closeModal: () => void;
};

/** UI-only store for the create/edit modal. Server data is passed via props. */
export function createTutorialsStore() {
  return createStore<TutorialsState>((set) => ({
    modal: { mode: "closed" },
    openCreate: () => set({ modal: { mode: "create" } }),
    openEdit: (tutorial) => set({ modal: { mode: "edit", tutorial } }),
    closeModal: () => set({ modal: { mode: "closed" } }),
  }));
}

export type TutorialsStore = ReturnType<typeof createTutorialsStore>;
