import { createStore } from "zustand/vanilla";
import type { EnvVarMeta } from "./types";

export type EnvVarModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; envVar: EnvVarMeta };

export type EnvVarsState = {
  modal: EnvVarModalState;
  /** Whether the bulk-import dialog is open (spec 009). */
  importOpen: boolean;
  /** Plaintext values held only after an explicit reveal — in memory, never persisted. */
  revealed: Record<string, string>;
  openCreate: () => void;
  openEdit: (envVar: EnvVarMeta) => void;
  closeModal: () => void;
  openImport: () => void;
  closeImport: () => void;
  setRevealed: (id: string, value: string) => void;
  hideValue: (id: string) => void;
  hideAll: () => void;
};

/** UI-only store (create/edit modal, import dialog, and which values are currently revealed). */
export function createEnvVarsStore() {
  return createStore<EnvVarsState>((set) => ({
    modal: { mode: "closed" },
    importOpen: false,
    revealed: {},
    openCreate: () => set({ modal: { mode: "create" } }),
    openEdit: (envVar) => set({ modal: { mode: "edit", envVar } }),
    closeModal: () => set({ modal: { mode: "closed" } }),
    openImport: () => set({ importOpen: true }),
    closeImport: () => set({ importOpen: false }),
    setRevealed: (id, value) => set((s) => ({ revealed: { ...s.revealed, [id]: value } })),
    hideValue: (id) =>
      set((s) => {
        const next = { ...s.revealed };
        delete next[id];
        return { revealed: next };
      }),
    hideAll: () => set({ revealed: {} }),
  }));
}

export type EnvVarsStore = ReturnType<typeof createEnvVarsStore>;
