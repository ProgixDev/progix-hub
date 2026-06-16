"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { StatusBadge, type BadgeProps } from "@/components/ui/badge";
import { TrashIcon } from "@/components/ui/icons";
import { archiveProjectAction, deleteProjectAction } from "../actions";
import { ProjectsStoreProvider, useProjectsStore } from "../provider";
import type { Project, ProjectStatus } from "../types";
import { projectSurfaces } from "./project-card";
import { ProjectForm } from "./project-form";

const STATUS_TONE: Record<ProjectStatus, NonNullable<BadgeProps["tone"]>> = {
  active: "green",
  at_risk: "amber",
  archived: "neutral",
};

const STATUS_KEY = {
  active: "statusActive",
  at_risk: "statusAtRisk",
  archived: "statusArchived",
} as const satisfies Record<ProjectStatus, string>;

export function ProjectDetail({
  project,
  canManage = true,
}: {
  project: Project;
  canManage?: boolean;
}) {
  return (
    <ProjectsStoreProvider>
      <DetailInner project={project} canManage={canManage} />
      <ProjectForm />
    </ProjectsStoreProvider>
  );
}

function DetailInner({ project, canManage }: { project: Project; canManage: boolean }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const openEdit = useProjectsStore((s) => s.openEdit);
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();

  function onDelete() {
    if (!window.confirm(t("deleteConfirm", { name: project.name }))) return;
    startDelete(() =>
      deleteProjectAction(project.id).then((res) => {
        if (res.ok) router.push("/");
      }),
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="text-text-2 hover:text-text mb-5 inline-flex items-center gap-1 text-[13px]"
      >
        ← {t("back")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-text min-w-0 text-[22px] font-semibold tracking-tight break-words sm:text-[24px]">
              {project.name}
            </h1>
            <StatusBadge tone={STATUS_TONE[project.status]} className="flex-none">
              {t(STATUS_KEY[project.status])}
            </StatusBadge>
          </div>
          {project.description && (
            <p className="text-text-2 mt-1.5 max-w-2xl text-[14px]">{project.description}</p>
          )}
        </div>
        {canManage && (
          <div className="flex flex-none items-center gap-2">
            <button
              type="button"
              onClick={() => openEdit(project)}
              className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-md border px-3 text-[13px] font-medium transition-colors"
            >
              {tCommon("edit")}
            </button>
            {project.status !== "archived" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => start(() => archiveProjectAction(project.id).then(() => undefined))}
                className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-9 rounded-md border px-3 text-[13px] font-medium transition-colors disabled:opacity-60"
              >
                {pending ? t("archiving") : t("archive")}
              </button>
            )}
            <button
              type="button"
              disabled={deleting}
              onClick={onDelete}
              className="border-line-1 text-red-text hover:bg-red-tint flex h-9 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium transition-colors disabled:opacity-60"
            >
              <TrashIcon className="size-4" />
              {deleting ? t("deleting") : tCommon("delete")}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {projectSurfaces(project).map(({ key, url, Glyph, label }) =>
          url ? (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (${t("opensNewTab")})`}
              className="bg-bg-2 border-line-1 hover:border-line-strong flex min-w-0 items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors"
            >
              <span className="flex-none">
                <Glyph size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-text truncate text-[13px] font-semibold">{label}</p>
                <p className="text-text-2 truncate font-mono text-[11px]">{url}</p>
              </div>
            </a>
          ) : (
            <button
              key={key}
              type="button"
              onClick={() => openEdit(project)}
              aria-label={t("addLink", { service: label })}
              className="border-line/60 text-text-3 hover:border-line-blue hover:text-blue-text flex min-w-0 items-center gap-3 rounded-lg border border-dashed px-3.5 py-3 transition-colors"
            >
              <span className="flex-none">
                <Glyph size={22} />
              </span>
              <span className="min-w-0 truncate text-[13px] font-medium">
                {t("addLink", { service: label })}
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
