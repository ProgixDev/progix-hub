"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createEnvVarsStore, type EnvVarsState, type EnvVarsStore } from "./store";

const EnvVarsStoreContext = createContext<EnvVarsStore | null>(null);

/** One store per mount (SSR-safe — never a module singleton). */
export function EnvVarsStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createEnvVarsStore);
  return <EnvVarsStoreContext.Provider value={store}>{children}</EnvVarsStoreContext.Provider>;
}

export function useEnvVarsStore<T>(selector: (state: EnvVarsState) => T): T {
  const store = useContext(EnvVarsStoreContext);
  if (!store) {
    throw new Error("useEnvVarsStore must be used within an EnvVarsStoreProvider");
  }
  return useStore(store, selector);
}
