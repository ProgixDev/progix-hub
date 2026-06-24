"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createPlaygroundStore, type PlaygroundState, type PlaygroundStore } from "./store";
import type { PlanItem, PlanLink } from "./types";

const PlaygroundStoreContext = createContext<PlaygroundStore | null>(null);

/** One store per mount, seeded with the server's plan items + links (SSR-safe — never a singleton). */
export function PlaygroundStoreProvider({
  items,
  links,
  children,
}: {
  items: PlanItem[];
  links: PlanLink[];
  children: React.ReactNode;
}) {
  const [store] = useState(() => createPlaygroundStore(items, links));
  return (
    <PlaygroundStoreContext.Provider value={store}>{children}</PlaygroundStoreContext.Provider>
  );
}

export function usePlaygroundStore<T>(selector: (state: PlaygroundState) => T): T {
  const store = useContext(PlaygroundStoreContext);
  if (!store) throw new Error("usePlaygroundStore must be used within a PlaygroundStoreProvider");
  return useStore(store, selector);
}
