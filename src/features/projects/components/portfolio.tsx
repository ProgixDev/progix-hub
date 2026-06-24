"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GridIcon, PlusIcon, RowsIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { ProjectsStoreProvider, useProjectsStore } from "../provider";
import { filterProjects, statusCounts } from "../lib";
import type { Project, ProjectStatus, ProjectView, StatusFilter } from "../types";
import { ProjectCard } from "./project-card";
import { ProjectForm } from "./project-form";
import { ProjectRow } from "./project-row";

const FILTER_KEYS: { key: StatusFilter; labelKey: string }[] = [
  { key: "all", labelKey: "filterAll" },
  { key: "active", labelKey: "statusActive" },
  { key: "at_risk", labelKey: "statusAtRisk" },
  { key: "archived", labelKey: "statusArchived" },
];

const STATUS_KEY = {
  active: "statusActive",
  at_risk: "statusAtRisk",
  archived: "statusArchived",
} as const satisfies Record<ProjectStatus, string>;

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
  const t = useTranslations("projects");
  const filter = useProjectsStore((s) => s.filter);
  const setFilter = useProjectsStore((s) => s.setFilter);
  const view = useProjectsStore((s) => s.view);
  const setView = useProjectsStore((s) => s.setView);
  const openCreate = useProjectsStore((s) => s.openCreate);
  const router = useRouter();
  const params = useSearchParams();

  // The sidebar "New project" action navigates to /?new=1 — open the create modal, then clean the URL.
  useEffect(() => {
    if (params.get("new") === "1") {
      openCreate();
      router.replace("/", { scroll: false });
    }
  }, [params, openCreate, router]);

  const counts = statusCounts(projects);
  const visible = filterProjects(projects, filter);
  const empty = projects.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="spotlight flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="t-eyebrow">{t("portfolio")}</p>
          <h1 className="text-text mt-1 text-[26px] font-semibold tracking-tight">
            {t("heading")}
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex h-9 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium transition-all"
        >
          <PlusIcon className="size-4" />
          {t("newProject")}
        </button>
      </div>

      {!empty && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {FILTER_KEYS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
                  filter === f.key
                    ? "border-line-blue bg-blue-tint text-text shadow-[0_0_20px_-9px_var(--blue-glow)]"
                    : "text-text-2 hover:bg-bg-2 hover:text-text border-transparent",
                )}
              >
                {t(f.labelKey)}
                <span className="text-text-3 font-mono text-[11px]">{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
      )}

      {empty ? (
        <EmptyState onCreate={openCreate} />
      ) : visible.length === 0 ? (
        <p className="text-text-2 py-12 text-center text-[13.5px]">
          {filter === "all"
            ? t("noProjects")
            : t("noFilteredProjects", { status: t(STATUS_KEY[filter]).toLowerCase() })}
        </p>
      ) : view === "grid" ? (
        <div className="stagger mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="stagger mt-5 flex flex-col gap-2">
          {visible.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ProjectView; onChange: (v: ProjectView) => void }) {
  const t = useTranslations("projects");
  const options: { value: ProjectView; labelKey: string; Icon: typeof GridIcon }[] = [
    { value: "grid", labelKey: "viewGrid", Icon: GridIcon },
    { value: "list", labelKey: "viewList", Icon: RowsIcon },
  ];
  return (
    <div className="border-line-1 flex items-center gap-0.5 rounded-full border p-0.5" role="group">
      {options.map(({ value, labelKey, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-label={t(labelKey)}
          aria-pressed={view === value}
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-colors",
            view === value
              ? "bg-blue-tint text-blue-text shadow-[0_0_16px_-8px_var(--blue-glow)]"
              : "text-text-3 hover:text-text",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("projects");
  return (
    <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-[var(--line-strong)] py-16 text-center">
      <h2 className="text-text text-[16px] font-semibold">{t("emptyTitle")}</h2>
      <p className="text-text-2 mt-1 max-w-sm text-[13.5px]">{t("emptyBody")}</p>
      <button
        type="button"
        onClick={onCreate}
        className="btn-primary mt-5 flex h-9 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium transition-all"
      >
        <PlusIcon className="size-4" />
        {t("newProject")}
      </button>
    </div>
  );
}
