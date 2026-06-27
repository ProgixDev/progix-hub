"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import {
  BellIcon,
  CalculatorIcon,
  GridIcon,
  PlusIcon,
  PulseIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { COMMANDS_EVENT } from "./command-menu";

function openCommands() {
  window.dispatchEvent(new Event(COMMANDS_EVENT));
}

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

const STORAGE_KEY = "pg-sidebar-collapsed";
const COLLAPSE_EVENT = "pg-sidebar-toggle";

// Collapse pref lives in localStorage; read via useSyncExternalStore (SSR-safe, no setState-in-effect).
function subscribeCollapse(cb: () => void) {
  window.addEventListener(COLLAPSE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function getCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
function getServerCollapsed() {
  return false;
}
function setCollapsedPref(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore (private mode / unavailable)
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

// Active nav row — solid blue edge + glow (Skyway selected state); idle is quiet.
const navActive =
  "border-line-blue bg-blue-tint text-text border shadow-[0_0_24px_-9px_var(--blue-glow)]";
const navIdle =
  "border border-transparent text-text-1 hover:bg-bg-2 hover:text-text transition-colors";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M14 7l-5 5 5 5" : "M10 7l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "flex h-9 items-center rounded-lg text-[13.5px] font-medium",
        collapsed ? "justify-center" : "gap-2.5 px-3",
        active ? navActive : navIdle,
      )}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

/** The sidebar's inner content — shared by the desktop aside and the mobile drawer. */
function SidebarNav({
  recent,
  onNavigate,
  showMembers,
  collapsed = false,
  onToggle,
}: {
  recent: RecentProject[];
  onNavigate?: () => void;
  showMembers?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const projectsActive = pathname === "/" || pathname.startsWith("/projects");

  const items = [
    {
      href: "/",
      label: t("projects"),
      icon: <GridIcon className="size-[18px] flex-none" />,
      active: projectsActive,
      show: true,
    },
    {
      href: "/members",
      label: t("members"),
      icon: <UsersIcon className="size-[18px] flex-none" />,
      active: pathname.startsWith("/members"),
      show: !!showMembers,
    },
    {
      href: "/overview",
      label: t("overview"),
      icon: <PulseIcon className="size-[18px] flex-none" />,
      active: pathname.startsWith("/overview"),
      show: true,
    },
    {
      href: "/pricing",
      label: t("pricing"),
      icon: <CalculatorIcon className="size-[18px] flex-none" />,
      active: pathname.startsWith("/pricing"),
      show: !!showMembers,
    },
    {
      href: "/activity",
      label: t("activity"),
      icon: <BellIcon className="size-[18px] flex-none" />,
      active: pathname.startsWith("/activity"),
      show: true,
    },
    {
      href: "/tutorials",
      label: t("tutorials"),
      icon: <VideoIcon className="size-[18px] flex-none" />,
      active: pathname.startsWith("/tutorials"),
      show: true,
    },
    {
      href: "/settings",
      label: t("settings"),
      icon: <SettingsIcon className="size-[18px] flex-none" />,
      active: pathname.startsWith("/settings"),
      show: true,
    },
  ].filter((i) => i.show);

  return (
    <>
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          "flex items-center pt-4 pb-3",
          collapsed ? "flex-col gap-3 px-0" : "justify-between px-4",
        )}
      >
        {collapsed ? <LogoMark size={26} /> : <Wordmark size={24} />}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? t("expand") : t("collapse")}
            className="text-text-2 hover:bg-bg-2 hover:text-text flex size-7 flex-none items-center justify-center rounded-full transition-colors"
          >
            <Chevron dir={collapsed ? "right" : "left"} />
          </button>
        )}
      </div>

      {/* Search — full field, or an icon button when collapsed */}
      <div className="px-3 pb-2">
        {collapsed ? (
          <button
            type="button"
            onClick={openCommands}
            title={tCommon("search")}
            aria-label={tCommon("searchLabel")}
            className="border-line-1 bg-bg-inset hover:border-line-blue flex h-9 w-full items-center justify-center rounded-full border transition-colors"
          >
            <SearchIcon className="text-text-2 size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={openCommands}
            aria-label={tCommon("searchLabel")}
            className="border-line-1 bg-bg-inset hover:border-line-blue flex h-9 w-full items-center gap-2.5 rounded-full border px-3.5 text-left transition-colors"
          >
            <SearchIcon className="text-text-2 size-4 flex-none" />
            <span className="text-text-3 flex-1 truncate text-[13.5px]">{tCommon("search")}</span>
            <kbd className="text-text-1 bg-bg-3 border-line-1 hidden h-[18px] min-w-[18px] items-center justify-center rounded border px-1 font-mono text-[11px] sm:inline-flex">
              ⌘
            </kbd>
            <kbd className="text-text-1 bg-bg-3 border-line-1 hidden h-[18px] min-w-[18px] items-center justify-center rounded border px-1 font-mono text-[11px] sm:inline-flex">
              K
            </kbd>
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {items.map((i) => (
          <NavItem key={i.href} {...i} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Recent — only when expanded */}
      {collapsed ? (
        <div className="flex-1" />
      ) : (
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
          <p className="t-eyebrow px-3 pb-2">{t("recent")}</p>
          <ul className="flex flex-col gap-0.5">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  onClick={onNavigate}
                  className="hover:bg-bg-2 text-text-1 hover:text-text flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] transition-colors"
                >
                  <span className="bg-bg-3 border-line-1 text-text-2 flex size-5 flex-none items-center justify-center rounded-md border font-mono text-[9px] font-medium">
                    {p.initials}
                  </span>
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span
                    className={cn("ml-auto size-1.5 flex-none rounded-full", toneDot[p.tone])}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* New project — glowing pill, or a glow-orb when collapsed */}
      <div className="mt-auto p-3">
        {collapsed ? (
          <Link
            href="/?new=1"
            onClick={onNavigate}
            title={t("newProject")}
            aria-label={t("newProject")}
            className="glow-orb mx-auto flex size-11 items-center justify-center rounded-full transition-transform hover:scale-105"
          >
            <PlusIcon className="size-5" />
          </Link>
        ) : (
          <Link
            href="/?new=1"
            onClick={onNavigate}
            className="btn-primary flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13.5px] font-medium"
          >
            <PlusIcon className="size-4" />
            {t("newProject")}
          </Link>
        )}
      </div>
    </>
  );
}

/**
 * Desktop: a static aside (≥ md) that collapses to a 72px icon rail (persisted). Mobile (< md):
 * hidden; opens as a slide-in drawer over a backdrop, controlled by the parent `AppFrame`.
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
  const collapsed = useSyncExternalStore(subscribeCollapse, getCollapsed, getServerCollapsed);
  const toggleCollapsed = () => setCollapsedPref(!collapsed);

  // Modal drawer a11y (spec 007): lock body scroll, move focus in, trap Tab, Escape to close.
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
      {/* Desktop aside — collapsible icon rail */}
      <aside
        className={cn(
          "border-line hidden h-dvh flex-none flex-col border-r bg-[var(--bg-sidebar)]/80 backdrop-blur-xl transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <SidebarNav
          recent={recent}
          showMembers={showMembers}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />
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
            "absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
          className={cn(
            "border-line absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col border-r bg-[var(--bg-sidebar)]/95 shadow-2xl backdrop-blur-xl transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {open && (
            <>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeMenu")}
                className="text-text-2 hover:bg-bg-3 hover:text-text absolute top-2.5 right-2.5 z-10 flex size-9 items-center justify-center rounded-full text-[20px] leading-none transition-colors"
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
