"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import {
  finishWorkAction,
  loadMySessionAction,
  pauseWorkAction,
  resumeWorkAction,
  startWorkAction,
  type WorkActionResult,
} from "../actions";
import { formatDuration, statusOf, workedSeconds } from "../lib";
import type { WorkSession } from "../types";

/**
 * The global work clock (spec 013). On desktop it's an inline pill in the top bar. On mobile
 * (spec 013 mobile pass) it's a sticky bottom control that expands to a full-screen timer and
 * collapses back — the header is too tight for the running controls on a phone. One component,
 * one session state; the `sm:hidden` / `hidden sm:flex` split keeps each surface out of the other's
 * accessibility tree (so e2e at desktop width only sees the inline controls).
 */
export function ClockWidget() {
  const t = useTranslations("clock");
  const [session, setSession] = useState<WorkSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    loadMySessionAction()
      .then(setSession)
      .finally(() => setLoaded(true));
  }, []);

  const state = statusOf(session);

  useEffect(() => {
    if (state !== "working") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state]);

  function run(action: () => Promise<WorkActionResult>, opts?: { collapse?: boolean }) {
    start(async () => {
      const res = await action();
      if (res.ok) {
        setSession(res.session);
        setNow(Date.now());
        if (opts?.collapse) setExpanded(false);
      }
    });
  }

  if (!loaded) return <div className="hidden h-9 w-28 sm:block" aria-hidden />;

  const elapsed = formatDuration(workedSeconds(session, now));
  const working = state === "working";
  const off = state === "off";

  return (
    <>
      {/* Desktop — inline header pill */}
      <div className="hidden sm:flex">
        {off ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(startWorkAction)}
            className="bg-green/15 text-green border-green/30 hover:bg-green/25 flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors disabled:opacity-60"
          >
            <span className="bg-green size-2 rounded-full" />
            {t("start")}
          </button>
        ) : (
          <div className="border-line-1 bg-bg-2 flex h-9 items-center gap-1 rounded-full border pr-1 pl-2.5">
            <span
              className={`size-2 flex-none rounded-full ${working ? "bg-green animate-pulse" : "bg-amber"}`}
              aria-hidden
            />
            <span className="text-text mr-1 font-mono text-[12.5px] tabular-nums" aria-live="off">
              {elapsed}
            </span>
            {working ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(pauseWorkAction)}
                className="text-text-2 hover:bg-bg-3 hover:text-text h-7 rounded-full px-2 text-[12px] font-medium transition-colors disabled:opacity-60"
              >
                {t("pause")}
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(resumeWorkAction)}
                className="text-green hover:bg-bg-3 h-7 rounded-full px-2 text-[12px] font-medium transition-colors disabled:opacity-60"
              >
                {t("resume")}
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => run(finishWorkAction)}
              className="text-red-text hover:bg-red-tint h-7 rounded-full px-2 text-[12px] font-medium transition-colors disabled:opacity-60"
            >
              {t("finish")}
            </button>
          </div>
        )}
      </div>

      {/* Mobile — sticky bottom control + full-screen sheet */}
      <div className="sm:hidden">
        {off ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setExpanded(true);
              run(startWorkAction);
            }}
            className="bg-green/15 text-green border-green/30 fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex h-12 items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold shadow-lg backdrop-blur disabled:opacity-60"
          >
            <span className="bg-green size-2.5 rounded-full" />
            {t("start")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={t("expand")}
            className="border-line-1 bg-bg-2 fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex h-12 items-center gap-3 rounded-xl border px-4 shadow-lg"
          >
            <span
              className={`size-2.5 flex-none rounded-full ${working ? "bg-green animate-pulse" : "bg-amber"}`}
            />
            <span className="text-text font-mono text-[15px] tabular-nums">{elapsed}</span>
            <span className="text-text-2 text-[13px]">{working ? t("working") : t("paused")}</span>
            <ChevronUpGlyph className="text-text-3 ml-auto" />
          </button>
        )}

        {expanded && !off && (
          <div className="bg-bg fixed inset-0 z-50 flex flex-col px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label={t("collapse")}
                className="text-text-2 hover:bg-bg-3 hover:text-text flex size-10 items-center justify-center rounded-full transition-colors"
              >
                <ChevronDownGlyph />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <span
                className={`size-3 rounded-full ${working ? "bg-green animate-pulse" : "bg-amber"}`}
              />
              <p className="text-text-2 text-[14px]">{working ? t("working") : t("paused")}</p>
              <p className="text-text font-mono text-[64px] leading-none tabular-nums">{elapsed}</p>
            </div>
            <div className="flex gap-3">
              {working ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(pauseWorkAction)}
                  className="border-line-1 bg-bg-2 text-text flex h-12 flex-1 items-center justify-center rounded-xl border text-[15px] font-medium transition-colors disabled:opacity-60"
                >
                  {t("pause")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(resumeWorkAction)}
                  className="bg-green/15 text-green border-green/30 flex h-12 flex-1 items-center justify-center rounded-xl border text-[15px] font-semibold transition-colors disabled:opacity-60"
                >
                  {t("resume")}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => run(finishWorkAction, { collapse: true })}
                className="bg-red-tint text-red-text flex h-12 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold transition-colors disabled:opacity-60"
              >
                {t("finish")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ChevronUpGlyph({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 15l6-6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronDownGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
