"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createProjectsStore, type ProjectsState, type ProjectsStore } from "./store";

const ProjectsStoreContext = createContext<ProjectsStore | null>(null);

/** One store per mount (SSR-safe — never a module singleton). */
export function ProjectsStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createProjectsStore);
  return <ProjectsStoreContext.Provider value={store}>{children}</ProjectsStoreContext.Provider>;
}

export function useProjectsStore<T>(selector: (state: ProjectsState) => T): T {
  const store = useContext(ProjectsStoreContext);
  if (!store) {
    throw new Error("useProjectsStore must be used within a ProjectsStoreProvider");
  }
  return useStore(store, selector);
}
