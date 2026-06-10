"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { GitHubGlyph, LiveGlyph, NotionGlyph, SlackGlyph } from "@/components/brand/surface-glyphs";
import { StatusBadge, type BadgeProps } from "@/components/ui/badge";
import type { Project, ProjectStatus } from "../types";

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

export function projectSurfaces(project: Project) {
  return [
    { key: "notion", url: project.notion_url, Glyph: NotionGlyph, label: "Notion" },
    { key: "slack", url: project.slack_url, Glyph: SlackGlyph, label: "Slack" },
    { key: "github", url: project.github_url, Glyph: GitHubGlyph, label: "GitHub" },
    { key: "live", url: project.live_url, Glyph: LiveGlyph, label: "Live" },
  ] as const;
}

export function ProjectCard({ project }: { project: Project }) {
  const t = useTranslations("projects");
  return (
    <article className="bg-card border-line hover:border-line-strong rounded-xl border p-4 transition-colors">
      <div className="flex items-start gap-3">
        <span className="bg-bg-3 text-text-1 border-line-1 flex size-9 flex-none items-center justify-center rounded-lg border text-[11px] font-semibold">
          {initials(project.name)}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/projects/${project.id}`}
            className="text-text hover:text-blue-text block truncate text-[15px] font-semibold transition-colors"
          >
            {project.name}
          </Link>
          <StatusBadge tone={STATUS_TONE[project.status]} className="mt-1">
            {t(STATUS_KEY[project.status])}
          </StatusBadge>
        </div>
      </div>

      {project.description && (
        <p className="text-text-2 mt-3 line-clamp-2 text-[13px]">{project.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={t("linkedSurfaces")}>
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
              <Glyph size={15} />
            </a>
          ) : (
            <span
              key={key}
              aria-label={`${label} ${t("notLinked")}`}
              className="border-line/60 flex size-7 items-center justify-center rounded-md border border-dashed opacity-40"
            >
              <Glyph size={15} />
            </span>
          ),
        )}
      </div>
    </article>
  );
}
