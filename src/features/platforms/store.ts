import { createStore } from "zustand/vanilla";
import type { Platform } from "./types";

export type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; platform: Platform };

export type PlatformsState = {
  modal: ModalState;
  openCreate: () => void;
  openEdit: (platform: Platform) => void;
  closeModal: () => void;
};

/** UI-only store for the create/edit modal. Server data is passed via props, not cached here. */
export function createPlatformsStore() {
  return createStore<PlatformsState>((set) => ({
    modal: { mode: "closed" },
    openCreate: () => set({ modal: { mode: "create" } }),
    openEdit: (platform) => set({ modal: { mode: "edit", platform } }),
    closeModal: () => set({ modal: { mode: "closed" } }),
  }));
}

export type PlatformsStore = ReturnType<typeof createPlatformsStore>;
