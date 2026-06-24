"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createPlatformsStore, type PlatformsState, type PlatformsStore } from "./store";

const PlatformsStoreContext = createContext<PlatformsStore | null>(null);

/** One store per mount (SSR-safe — never a module singleton). */
export function PlatformsStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createPlatformsStore);
  return <PlatformsStoreContext.Provider value={store}>{children}</PlatformsStoreContext.Provider>;
}

export function usePlatformsStore<T>(selector: (state: PlatformsState) => T): T {
  const store = useContext(PlatformsStoreContext);
  if (!store) throw new Error("usePlatformsStore must be used within a PlatformsStoreProvider");
  return useStore(store, selector);
}
