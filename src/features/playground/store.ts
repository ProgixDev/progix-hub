import { createStore } from "zustand/vanilla";
import type { Lens, PlanItem } from "./types";

export type PlaygroundState = {
  items: PlanItem[];
  selectedId: string | null;
  lens: Lens;
  zoom: number;
  panX: number;
  panY: number;
  focusedPhaseId: string | null;
  setLens: (lens: Lens) => void;
  select: (id: string | null) => void;
  setViewport: (v: { zoom?: number; panX?: number; panY?: number }) => void;
  focusPhase: (id: string | null) => void;
  addItem: (item: PlanItem) => void;
  patchItem: (id: string, patch: Partial<PlanItem>) => void;
  removeItem: (id: string) => void;
};

/** Holds the plan items (seeded from the server) + canvas/board UI state. One per mount. */
export function createPlaygroundStore(initial: PlanItem[]) {
  return createStore<PlaygroundState>((set) => ({
    items: initial,
    selectedId: null,
    lens: "canvas",
    zoom: 1,
    panX: 0,
    panY: 0,
    focusedPhaseId: null,
    setLens: (lens) => set({ lens }),
    select: (selectedId) => set({ selectedId }),
    setViewport: (v) =>
      set((s) => ({
        zoom: v.zoom ?? s.zoom,
        panX: v.panX ?? s.panX,
        panY: v.panY ?? s.panY,
      })),
    focusPhase: (focusedPhaseId) => set({ focusedPhaseId }),
    addItem: (item) => set((s) => ({ items: [...s.items, item], selectedId: item.id })),
    patchItem: (id, patch) =>
      set((s) => ({ items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })),
    removeItem: (id) =>
      set((s) => ({
        items: s.items.filter((it) => it.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      })),
  }));
}

export type PlaygroundStore = ReturnType<typeof createPlaygroundStore>;
