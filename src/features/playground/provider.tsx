"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createPlaygroundStore, type PlaygroundState, type PlaygroundStore } from "./store";
import type { PlanItem } from "./types";

const PlaygroundStoreContext = createContext<PlaygroundStore | null>(null);

/** One store per mount, seeded with the server's plan items (SSR-safe — never a singleton). */
export function PlaygroundStoreProvider({
  items,
  children,
}: {
  items: PlanItem[];
  children: React.ReactNode;
}) {
  const [store] = useState(() => createPlaygroundStore(items));
  return (
    <PlaygroundStoreContext.Provider value={store}>{children}</PlaygroundStoreContext.Provider>
  );
}

export function usePlaygroundStore<T>(selector: (state: PlaygroundState) => T): T {
  const store = useContext(PlaygroundStoreContext);
  if (!store) throw new Error("usePlaygroundStore must be used within a PlaygroundStoreProvider");
  return useStore(store, selector);
}
