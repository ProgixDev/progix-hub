"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { BellIcon } from "@/components/ui/icons";
import { loadNotificationsAction, markNotificationsReadAction } from "../actions";
import type { ActivityEvent } from "../types";

const KIND_GLYPH: Record<string, string> = { report: "📝", setup: "🚀" };

/** Top-bar notifications bell: unread badge + a dropdown of recent activity. Opening marks read.
 *  Self-fetching client component (mirrors ClockWidget) so pages just drop it in a slot. spec 039. */
export function NotificationsBell() {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<ActivityEvent[]>([]);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotificationsAction().then((p) => {
      setUnread(p.unread);
      setItems(p.items);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      start(async () => {
        await markNotificationsReadAction();
      });
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={t("aria")}
        className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text relative flex size-9 items-center justify-center rounded-full border transition-colors"
      >
        <BellIcon className="size-[18px]" />
        {unread > 0 && (
          <span className="bg-red text-bg absolute -top-0.5 -right-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[10px] font-semibold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass border-line absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border shadow-xl">
          <div className="border-line text-text-2 border-b px-4 py-2.5 text-[12px] font-semibold tracking-wide uppercase">
            {t("title")}
          </div>
          {items.length === 0 ? (
            <p className="text-text-3 px-4 py-6 text-center text-[13px]">{t("empty")}</p>
          ) : (
            <ul className="divide-line/60 max-h-[60vh] divide-y overflow-y-auto">
              {items.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/projects/${e.project_id}`}
                    onClick={() => setOpen(false)}
                    className="hover:bg-bg-inset flex items-start gap-2.5 px-3.5 py-2.5 transition-colors"
                  >
                    <span className="bg-bg-inset grid size-7 flex-none place-items-center rounded-full text-[13px]">
                      {KIND_GLYPH[e.kind] ?? "•"}
                    </span>
                    <span className="min-w-0 flex-1 text-[12.5px]">
                      <span className="text-text font-medium">{e.actor_label}</span>{" "}
                      <span className="text-text-2">{e.summary}</span>
                      <span className="text-text-3 mt-0.5 block text-[11px]">
                        {e.project_name} · {e.created_at.slice(5, 16).replace("T", " ")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/activity"
            onClick={() => setOpen(false)}
            className="text-text-1 hover:bg-bg-3 hover:text-text border-line block border-t px-4 py-2.5 text-center text-[12.5px] font-medium transition-colors"
          >
            {t("viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}
