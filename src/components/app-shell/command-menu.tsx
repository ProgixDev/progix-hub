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

type Command = { id: string; label: string; icon: React.ReactNode; run: () => void };

/**
 * The ⌘K command menu — navigate the app + quick actions from anywhere. Opened by ⌘/Ctrl-K,
 * the top-bar Commands button, or the sidebar search. Navigation only; no backend.
 */
export function CommandMenu({ showMembers }: { showMembers?: boolean }) {
  const t = useTranslations("nav");
  const tc = useTranslations("commands");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);

  // Open/close from event handlers (not effect bodies) so resets + focus stay side-effect clean.
  function openMenu() {
    setQuery("");
    setActive(0);
    openRef.current = true;
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }
  function closeMenu() {
    openRef.current = false;
    setOpen(false);
  }

  const commands = useMemo<Command[]>(() => {
    const all: Command[] = [
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
    return q ? all.filter((c) => c.label.toLowerCase().includes(q)) : all;
  }, [query, showMembers, router, t]);

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
    // openMenu/closeMenu are stable (only setState + refs); listeners bind once.
     
  }, []);

  if (!open) return null;

  function choose(i: number) {
    const c = commands[i];
    if (!c) return;
    closeMenu();
    c.run();
  }

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
        </div>
        <ul className="max-h-[52vh] overflow-auto p-2">
          {commands.length === 0 ? (
            <li className="text-text-3 px-3 py-6 text-center text-[13px]">{tc("empty")}</li>
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
                  <span className="text-text-2">{c.icon}</span>
                  {c.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
