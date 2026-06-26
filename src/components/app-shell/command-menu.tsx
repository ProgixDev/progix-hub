"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GridIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** Fire this to open the command menu (the top-bar "Commands" button + sidebar search dispatch it). */
export const COMMANDS_EVENT = "pg:commands";

type Command = {
  id: string;
  label: string;
  sublabel?: string | null;
  icon: React.ReactNode;
  run: () => void;
};

/** A search hit from /api/search (kept local — components can't import feature types). */
type SearchHit = {
  kind: "project" | "document" | "spec" | "task" | "tutorial" | "member";
  id: string;
  title: string;
  subtitle: string | null;
  project_id: string | null;
};

function destFor(h: SearchHit): string {
  switch (h.kind) {
    case "project":
      return `/projects/${h.id}`;
    case "document":
      return `/projects/${h.project_id}`;
    case "spec":
    case "task":
      return `/projects/${h.project_id}/playground`;
    case "member":
      return `/members/${h.id}`;
    case "tutorial":
      return "/tutorials";
  }
}

/**
 * The ⌘K command menu — navigate the app, quick actions, and global search from anywhere. Opened by
 * ⌘/Ctrl-K, the top-bar Commands button, or the sidebar search. Typing ≥2 chars searches projects,
 * docs, specs, tasks, members, and tutorials via /api/search (RLS-scoped server-side).
 */
export function CommandMenu({ showMembers }: { showMembers?: boolean }) {
  const t = useTranslations("nav");
  const tc = useTranslations("commands");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);

  function openMenu() {
    setQuery("");
    setActive(0);
    setHits([]);
    openRef.current = true;
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }
  function closeMenu() {
    openRef.current = false;
    setOpen(false);
  }

  // Debounced global search — only when open and the query is meaningful. State is set inside the
  // deferred callback (never synchronously in the effect body) to avoid cascading renders.
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) return;
    const ctrl = new AbortController();
    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = (await res.json()) as { results?: SearchHit[] };
          setHits(data.results ?? []);
        }
      } catch {
        /* aborted or offline — keep prior hits */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(id);
      ctrl.abort();
    };
  }, [query, open]);

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = [
      {
        id: "new",
        label: t("newProject"),
        icon: <PlusIcon className="size-4" />,
        run: () => router.push("/?new=1"),
      },
      {
        id: "projects",
        label: t("projects"),
        icon: <GridIcon className="size-4" />,
        run: () => router.push("/"),
      },
      ...(showMembers
        ? [
            {
              id: "members",
              label: t("members"),
              icon: <UsersIcon className="size-4" />,
              run: () => router.push("/members"),
            },
          ]
        : []),
      {
        id: "tutorials",
        label: t("tutorials"),
        icon: <VideoIcon className="size-4" />,
        run: () => router.push("/tutorials"),
      },
      {
        id: "settings",
        label: t("settings"),
        icon: <SettingsIcon className="size-4" />,
        run: () => router.push("/settings"),
      },
    ];
    const q = query.trim().toLowerCase();
    const navFiltered = q ? nav.filter((c) => c.label.toLowerCase().includes(q)) : nav;

    // Only surface backend hits once the query is meaningful; ignore stale hits for short queries.
    const showHits = q.length >= 2;
    const hitCommands: Command[] = (showHits ? hits : []).map((h) => ({
      id: `${h.kind}:${h.id}`,
      label: h.title,
      sublabel: h.subtitle,
      icon: (
        <span className="bg-bg-inset text-text-2 grid h-5 min-w-[36px] place-items-center rounded px-1 text-[9.5px] font-semibold tracking-wide uppercase">
          {tc(`kind_${h.kind}` as "kind_project")}
        </span>
      ),
      run: () => router.push(destFor(h)),
    }));

    return [...navFiltered, ...hitCommands];
  }, [query, hits, showMembers, router, t, tc]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) closeMenu();
        else openMenu();
      } else if (e.key === "Escape") {
        closeMenu();
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMANDS_EVENT, openMenu);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMANDS_EVENT, openMenu);
    };
    // openMenu/closeMenu only touch setState + refs, so binding once is correct.
  }, []);

  if (!open) return null;

  function choose(i: number) {
    const c = commands[i];
    if (!c) return;
    closeMenu();
    c.run();
  }

  const hasQuery = query.trim().length >= 2;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={tc("title")}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="glass-strong w-full max-w-lg overflow-hidden rounded-2xl">
        <div className="border-line flex items-center gap-2.5 border-b px-4">
          <SearchIcon className="text-text-2 size-4 flex-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, commands.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(active);
              }
            }}
            placeholder={tc("placeholder")}
            aria-label={tc("placeholder")}
            className="placeholder:text-text-3 text-text h-12 w-full bg-transparent text-[14px] outline-none"
          />
          {loading && <span className="text-text-3 flex-none text-[11px]">{tc("searching")}</span>}
        </div>
        <ul className="max-h-[52vh] overflow-auto p-2">
          {commands.length === 0 ? (
            <li className="text-text-3 px-3 py-6 text-center text-[13px]">
              {hasQuery && !loading ? tc("noResults") : tc("empty")}
            </li>
          ) : (
            commands.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors",
                    i === active
                      ? "bg-blue-tint text-text shadow-[0_0_20px_-10px_var(--blue-glow)]"
                      : "text-text-1 hover:bg-bg-2",
                  )}
                >
                  <span className="text-text-2 flex-none">{c.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  {c.sublabel && (
                    <span className="text-text-3 flex-none truncate text-[11.5px]">
                      {c.sublabel}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
