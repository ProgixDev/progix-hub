"use client";

import { PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { ProjectsStoreProvider, useProjectsStore } from "../provider";
import { filterProjects, statusCounts } from "../lib";
import type { Project, StatusFilter } from "../types";
import { ProjectCard } from "./project-card";
import { ProjectForm } from "./project-form";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "at_risk", label: "At risk" },
  { key: "archived", label: "Archived" },
];

/** The projects portfolio (AC-3). Server passes the real project list in via props. */
export function ProjectsPortfolio({ projects }: { projects: Project[] }) {
  return (
    <ProjectsStoreProvider>
      <PortfolioInner projects={projects} />
      <ProjectForm />
    </ProjectsStoreProvider>
  );
}

function PortfolioInner({ projects }: { projects: Project[] }) {
  const filter = useProjectsStore((s) => s.filter);
  const setFilter = useProjectsStore((s) => s.setFilter);
  const openCreate = useProjectsStore((s) => s.openCreate);

  const counts = statusCounts(projects);
  const visible = filterProjects(projects, filter);
  const empty = projects.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="t-eyebrow">Portfolio</p>
          <h1 className="text-text mt-1 text-[26px] font-semibold tracking-tight">Projects</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-blue text-primary-foreground hover:bg-blue-hover flex h-9 items-center gap-2 rounded-md px-3.5 text-[13.5px] font-medium shadow-[0_6px_18px_rgba(76,130,251,0.28)] transition-colors"
        >
          <PlusIcon className="size-4" />
          New project
        </button>
      </div>

      {!empty && (
        <div className="mt-6 flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors",
                filter === f.key
                  ? "bg-bg-2 text-text"
                  : "text-text-2 hover:bg-bg-2 hover:text-text",
              )}
            >
              {f.label}
              <span className="text-text-3 font-mono text-[11px]">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      )}

      {empty ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {visible.length === 0 && (
            <p className="text-text-2 col-span-full py-12 text-center text-[13.5px]">
              No {filter === "all" ? "" : filter.replace("_", " ")} projects.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-[var(--line-strong)] py-16 text-center">
      <h2 className="text-text text-[16px] font-semibold">No projects yet</h2>
      <p className="text-text-2 mt-1 max-w-sm text-[13.5px]">
        Create your first project, then link its Notion, Slack, GitHub, and live site.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="bg-blue text-primary-foreground hover:bg-blue-hover mt-5 flex h-9 items-center gap-2 rounded-md px-3.5 text-[13.5px] font-medium transition-colors"
      >
        <PlusIcon className="size-4" />
        New project
      </button>
    </div>
  );
}
