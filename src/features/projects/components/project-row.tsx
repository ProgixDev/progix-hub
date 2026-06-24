"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { StatusBadge, type BadgeProps } from "@/components/ui/badge";
import type { Project, ProjectStatus } from "../types";
import { projectSurfaces } from "./project-card";

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0] ?? name;
  const b = parts[1];
  return (b ? a.charAt(0) + b.charAt(0) : a.slice(0, 3)).toUpperCase();
}

/** A project as a compact list row (list view). Same data as the card, denser layout. */
export function ProjectRow({ project }: { project: Project }) {
  const t = useTranslations("projects");
  return (
    <article className="card-hover bg-card border-line hover:border-line-strong flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors">
      <span className="bg-bg-3 text-text-1 border-line-1 flex size-8 flex-none items-center justify-center rounded-md border text-[10.5px] font-semibold">
        {initials(project.name)}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={`/projects/${project.id}`}
          className="text-text hover:text-blue-text block truncate text-[14px] font-semibold transition-colors"
        >
          {project.name}
        </Link>
        {project.description && (
          <p className="text-text-2 hidden truncate text-[12.5px] sm:block">
            {project.description}
          </p>
        )}
      </div>
      <div
        className="hidden flex-none items-center gap-1.5 sm:flex"
        aria-label={t("linkedSurfaces")}
      >
        {projectSurfaces(project).map(({ key, url, Glyph, label }) =>
          url ? (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (${t("opensNewTab")})`}
              className="bg-bg-2 border-line-1 hover:border-line-strong flex size-7 items-center justify-center rounded-md border transition-colors"
            >
              <Glyph size={13} />
            </a>
          ) : null,
        )}
      </div>
      <StatusBadge tone={STATUS_TONE[project.status]} className="flex-none">
        {t(STATUS_KEY[project.status])}
      </StatusBadge>
    </article>
  );
}
