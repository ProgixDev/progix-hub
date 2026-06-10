"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createDocumentsStore, type DocumentsState, type DocumentsStore } from "./store";

const DocumentsStoreContext = createContext<DocumentsStore | null>(null);

/** One store per mount (SSR-safe — never a module singleton). */
export function DocumentsStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createDocumentsStore);
  return <DocumentsStoreContext.Provider value={store}>{children}</DocumentsStoreContext.Provider>;
}

export function useDocumentsStore<T>(selector: (state: DocumentsState) => T): T {
  const store = useContext(DocumentsStoreContext);
  if (!store) {
    throw new Error("useDocumentsStore must be used within a DocumentsStoreProvider");
  }
  return useStore(store, selector);
}
