"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { GridIcon, PlusIcon, SearchIcon, SettingsIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type RecentProject = {
  id: string;
  name: string;
  initials: string;
  tone: "green" | "amber" | "blue" | "neutral";
};

const toneDot: Record<RecentProject["tone"], string> = {
  green: "bg-green",
  amber: "bg-amber",
  blue: "bg-blue",
  neutral: "bg-text-3",
};

const navActive = "border-line-blue bg-blue-tint text-text border";
const navIdle =
  "nav-proj border border-transparent hover:bg-bg-2 text-text-1 hover:text-text transition-colors";

export function Sidebar({ recent }: { recent: RecentProject[] }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const projectsActive = pathname === "/" || pathname.startsWith("/projects");
  const settingsActive = pathname.startsWith("/settings");
  return (
    <aside className="bg-bg-sidebar border-line flex h-dvh w-60 flex-none flex-col border-r">
      <div className="px-4 pt-4 pb-3">
        <Wordmark />
      </div>

      <div className="px-3 pb-2">
        <label className="border-line-1 bg-bg-inset focus-within:border-line-blue flex h-9 items-center gap-2.5 rounded-md border px-3 transition-colors">
          <SearchIcon className="text-text-2 size-4 flex-none" />
          <input
            type="search"
            placeholder={tCommon("search")}
            aria-label={tCommon("searchLabel")}
            className="placeholder:text-text-3 w-full bg-transparent text-[13.5px] outline-none"
          />
          <kbd className="text-text-1 bg-bg-3 border-line-1 hidden h-[18px] min-w-[18px] items-center justify-center rounded border px-1 font-mono text-[11px] sm:inline-flex">
            ⌘
          </kbd>
          <kbd className="text-text-1 bg-bg-3 border-line-1 hidden h-[18px] min-w-[18px] items-center justify-center rounded border px-1 font-mono text-[11px] sm:inline-flex">
            K
          </kbd>
        </label>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        <Link
          href="/"
          aria-current={projectsActive ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-md px-3 text-[13.5px] font-medium",
            projectsActive ? navActive : navIdle,
          )}
        >
          <GridIcon className="size-[18px]" />
          {t("projects")}
        </Link>
        <Link
          href="/settings"
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-md px-3 text-[13.5px] font-medium",
            settingsActive ? navActive : navIdle,
          )}
        >
          <SettingsIcon className="size-[18px]" />
          {t("settings")}
        </Link>
      </nav>

      <div className="mt-5 px-3">
        <p className="t-eyebrow px-3 pb-2">{t("recent")}</p>
        <ul className="flex flex-col gap-0.5">
          {recent.map((p) => (
            <li key={p.id}>
              <Link
                href="/"
                className="nav-proj hover:bg-bg-2 text-text-1 hover:text-text flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] transition-colors"
              >
                <span className="bg-bg-3 border-line-1 text-text-2 flex size-5 flex-none items-center justify-center rounded-[5px] border font-mono text-[9px] font-medium">
                  {p.initials}
                </span>
                <span className="truncate">{p.name}</span>
                <span className={cn("ml-auto size-1.5 flex-none rounded-full", toneDot[p.tone])} />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto p-3">
        <button
          type="button"
          className="bg-blue text-primary-foreground hover:bg-blue-hover flex h-10 w-full items-center justify-center gap-2 rounded-md text-[13.5px] font-medium shadow-[0_6px_18px_rgba(76,130,251,0.28)] transition-colors"
        >
          <PlusIcon className="size-4" />
          {t("newProject")}
        </button>
      </div>
    </aside>
  );
}
