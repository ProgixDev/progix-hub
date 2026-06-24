import { createStore } from "zustand/vanilla";
import type { Lens, PlanItem, PlanLink } from "./types";

export type PlaygroundState = {
  items: PlanItem[];
  links: PlanLink[];
  selectedId: string | null;
  selectedLinkId: string | null;
  editingId: string | null;
  lens: Lens;
  zoom: number;
  panX: number;
  panY: number;
  focusedPhaseId: string | null;
  setLens: (lens: Lens) => void;
  select: (id: string | null) => void;
  selectLink: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  setViewport: (v: { zoom?: number; panX?: number; panY?: number }) => void;
  focusPhase: (id: string | null) => void;
  addItem: (item: PlanItem) => void;
  patchItem: (id: string, patch: Partial<PlanItem>) => void;
  removeItem: (id: string) => void;
  addLink: (link: PlanLink) => void;
  removeLink: (id: string) => void;
};

/** Holds the plan items + links (seeded from the server) + canvas/board UI state. One per mount. */
export function createPlaygroundStore(initial: PlanItem[], initialLinks: PlanLink[]) {
  return createStore<PlaygroundState>((set) => ({
    items: initial,
    links: initialLinks,
    selectedId: null,
    selectedLinkId: null,
    editingId: null,
    lens: "canvas",
    zoom: 1,
    panX: 0,
    panY: 0,
    focusedPhaseId: null,
    setLens: (lens) => set({ lens }),
    select: (selectedId) => set({ selectedId, selectedLinkId: null }),
    selectLink: (selectedLinkId) => set({ selectedLinkId, selectedId: null }),
    setEditing: (editingId) => set({ editingId }),
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
        links: s.links.filter((l) => l.source_id !== id && l.target_id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
        editingId: s.editingId === id ? null : s.editingId,
      })),
    addLink: (link) =>
      set((s) => ({
        links: s.links.some((l) => l.source_id === link.source_id && l.target_id === link.target_id)
          ? s.links
          : [...s.links, link],
      })),
    removeLink: (id) =>
      set((s) => ({
        links: s.links.filter((l) => l.id !== id),
        selectedLinkId: s.selectedLinkId === id ? null : s.selectedLinkId,
      })),
  }));
}

export type PlaygroundStore = ReturnType<typeof createPlaygroundStore>;
