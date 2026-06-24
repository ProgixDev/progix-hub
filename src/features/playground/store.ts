import { createStore } from "zustand/vanilla";
import type { Lens, Peer, PlanItem, PlanLink, RemoteCursor } from "./types";

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
  /** Bumps on every LOCAL edit (not on remote sync) — the presence hook broadcasts on change. */
  localRev: number;
  peers: Peer[];
  cursors: RemoteCursor[];
  setPeers: (peers: Peer[]) => void;
  setCursors: (cursors: RemoteCursor[]) => void;
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
  replaceAll: (items: PlanItem[], links: PlanLink[]) => void;
  /** Apply a remote refetch WITHOUT bumping localRev or disturbing the local selection/editing. */
  syncPlan: (items: PlanItem[], links: PlanLink[]) => void;
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
    localRev: 0,
    peers: [],
    cursors: [],
    setPeers: (peers) => set({ peers }),
    setCursors: (cursors) => set({ cursors }),
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
    addItem: (item) =>
      set((s) => ({ items: [...s.items, item], selectedId: item.id, localRev: s.localRev + 1 })),
    patchItem: (id, patch) =>
      set((s) => ({
        items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        localRev: s.localRev + 1,
      })),
    removeItem: (id) =>
      set((s) => ({
        items: s.items.filter((it) => it.id !== id),
        links: s.links.filter((l) => l.source_id !== id && l.target_id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
        editingId: s.editingId === id ? null : s.editingId,
        localRev: s.localRev + 1,
      })),
    addLink: (link) =>
      set((s) => ({
        links: s.links.some((l) => l.source_id === link.source_id && l.target_id === link.target_id)
          ? s.links
          : [...s.links, link],
        localRev: s.localRev + 1,
      })),
    removeLink: (id) =>
      set((s) => ({
        links: s.links.filter((l) => l.id !== id),
        selectedLinkId: s.selectedLinkId === id ? null : s.selectedLinkId,
        localRev: s.localRev + 1,
      })),
    replaceAll: (items, links) =>
      set((s) => ({
        items,
        links,
        selectedId: null,
        selectedLinkId: null,
        editingId: null,
        localRev: s.localRev + 1,
      })),
    syncPlan: (items, links) => set({ items, links }),
  }));
}

export type PlaygroundStore = ReturnType<typeof createPlaygroundStore>;
