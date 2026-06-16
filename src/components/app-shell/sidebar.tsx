"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Wordmark } from "@/components/brand/logo";
import { GridIcon, PlusIcon, SearchIcon, SettingsIcon, UsersIcon } from "@/components/ui/icons";
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

/** The sidebar's inner content — shared by the desktop aside and the mobile drawer. */
function SidebarNav({
  recent,
  onNavigate,
  showMembers,
}: {
  recent: RecentProject[];
  onNavigate?: () => void;
  showMembers?: boolean;
}) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const projectsActive = pathname === "/" || pathname.startsWith("/projects");
  const settingsActive = pathname.startsWith("/settings");
  const membersActive = pathname.startsWith("/members");
  return (
    <>
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
            className="placeholder:text-text-3 w-full min-w-0 bg-transparent text-[13.5px] outline-none"
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
          onClick={onNavigate}
          aria-current={projectsActive ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-md px-3 text-[13.5px] font-medium",
            projectsActive ? navActive : navIdle,
          )}
        >
          <GridIcon className="size-[18px]" />
          {t("projects")}
        </Link>
        {showMembers && (
          <Link
            href="/members"
            onClick={onNavigate}
            aria-current={membersActive ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-md px-3 text-[13.5px] font-medium",
              membersActive ? navActive : navIdle,
            )}
          >
            <UsersIcon className="size-[18px]" />
            {t("members")}
          </Link>
        )}
        <Link
          href="/settings"
          onClick={onNavigate}
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

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-3">
        <p className="t-eyebrow px-3 pb-2">{t("recent")}</p>
        <ul className="flex flex-col gap-0.5">
          {recent.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                onClick={onNavigate}
                className="nav-proj hover:bg-bg-2 text-text-1 hover:text-text flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] transition-colors"
              >
                <span className="bg-bg-3 border-line-1 text-text-2 flex size-5 flex-none items-center justify-center rounded-[5px] border font-mono text-[9px] font-medium">
                  {p.initials}
                </span>
                <span className="min-w-0 truncate">{p.name}</span>
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
    </>
  );
}

/**
 * Desktop: a static 240px aside (≥ md). Mobile (< md): hidden; opens as a slide-in drawer
 * over a backdrop, controlled by the parent `AppFrame` (spec 007).
 */
export function Sidebar({
  recent,
  open,
  onClose,
  showMembers,
}: {
  recent: RecentProject[];
  open: boolean;
  onClose: () => void;
  showMembers?: boolean;
}) {
  const t = useTranslations("nav");
  const panelRef = useRef<HTMLElement>(null);

  // Modal drawer a11y (spec 007 review): lock body scroll, move focus into the drawer,
  // trap Tab within it, close on Escape, and restore focus to the opener on close.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus?.();
    };
  }, [open, onClose]);

  return (
    <>
      {/* Desktop — unchanged */}
      <aside className="bg-bg-sidebar border-line hidden h-dvh w-60 flex-none flex-col border-r md:flex">
        <SidebarNav recent={recent} showMembers={showMembers} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={onClose}
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
          className={cn(
            "bg-bg-sidebar border-line absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col border-r shadow-2xl transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Mounted only while open so the nav + recent list aren't duplicated in the DOM
              (the static desktop aside is the canonical copy). */}
          {open && (
            <>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeMenu")}
                className="text-text-2 hover:bg-bg-3 hover:text-text absolute top-2.5 right-2.5 z-10 flex size-9 items-center justify-center rounded-md text-[20px] leading-none transition-colors"
              >
                ×
              </button>
              <SidebarNav recent={recent} onNavigate={onClose} showMembers={showMembers} />
            </>
          )}
        </aside>
      </div>
    </>
  );
}
