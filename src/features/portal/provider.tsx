"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createPortalStore, type PortalState, type PortalStore } from "./store";

const PortalStoreContext = createContext<PortalStore | null>(null);

/** One store per mount (SSR-safe — never a module singleton). */
export function PortalStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createPortalStore);
  return <PortalStoreContext.Provider value={store}>{children}</PortalStoreContext.Provider>;
}

export function usePortalStore<T>(selector: (state: PortalState) => T): T {
  const store = useContext(PortalStoreContext);
  if (!store) {
    throw new Error("usePortalStore must be used within a PortalStoreProvider");
  }
  return useStore(store, selector);
}
