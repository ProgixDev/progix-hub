import { createStore } from "zustand/vanilla";
import type { PortalCard } from "./types";

export type PortalModalState =
  | { mode: "closed" }
  | { mode: "add-block" }
  | { mode: "add-card"; blockId: string }
  | { mode: "edit-card"; card: PortalCard };

export type PortalState = {
  modal: PortalModalState;
  openAddBlock: () => void;
  openAddCard: (blockId: string) => void;
  openEditCard: (card: PortalCard) => void;
  closeModal: () => void;
};

/** UI-only store (the add/edit modal). Server data is passed in via props. */
export function createPortalStore() {
  return createStore<PortalState>((set) => ({
    modal: { mode: "closed" },
    openAddBlock: () => set({ modal: { mode: "add-block" } }),
    openAddCard: (blockId) => set({ modal: { mode: "add-card", blockId } }),
    openEditCard: (card) => set({ modal: { mode: "edit-card", card } }),
    closeModal: () => set({ modal: { mode: "closed" } }),
  }));
}

export type PortalStore = ReturnType<typeof createPortalStore>;
