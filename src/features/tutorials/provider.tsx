"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createTutorialsStore, type TutorialsState, type TutorialsStore } from "./store";

const TutorialsStoreContext = createContext<TutorialsStore | null>(null);

export function TutorialsStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createTutorialsStore);
  return <TutorialsStoreContext.Provider value={store}>{children}</TutorialsStoreContext.Provider>;
}

export function useTutorialsStore<T>(selector: (state: TutorialsState) => T): T {
  const store = useContext(TutorialsStoreContext);
  if (!store) throw new Error("useTutorialsStore must be used within a TutorialsStoreProvider");
  return useStore(store, selector);
}
