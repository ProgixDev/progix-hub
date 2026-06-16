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
 * The global work clock (spec 013). Self-loads the member's open session, ticks a display timer
 * while working, and offers Start / Pause / Resume / Finish. All math + transition guards live in
 * the server RPCs; this is presentation + a local 1s tick.
 */
export function ClockWidget() {
  const t = useTranslations("clock");
  const [session, setSession] = useState<WorkSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [pending, start] = useTransition();

  useEffect(() => {
    loadMySessionAction()
      .then(setSession)
      .finally(() => setLoaded(true));
  }, []);

  const state = statusOf(session);

  // Tick once a second only while the timer is actually running.
  useEffect(() => {
    if (state !== "working") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state]);

  function run(action: () => Promise<WorkActionResult>) {
    start(async () => {
      const res = await action();
      if (res.ok) {
        setSession(res.session);
        setNow(Date.now());
      }
    });
  }

  if (!loaded) return <div className="h-9 w-28" aria-hidden />;

  const elapsed = formatDuration(workedSeconds(session, now));

  if (state === "off") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => run(startWorkAction)}
        className="bg-green/15 text-green border-green/30 hover:bg-green/25 flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors disabled:opacity-60"
      >
        <span className="bg-green size-2 rounded-full" />
        {t("start")}
      </button>
    );
  }

  const working = state === "working";
  return (
    <div className="border-line-1 bg-bg-2 flex h-9 items-center gap-0.5 rounded-md border pr-1 pl-2 sm:gap-1 sm:pl-2.5">
      <span
        className={`size-2 flex-none rounded-full ${working ? "bg-green animate-pulse" : "bg-amber"}`}
        aria-hidden
      />
      <span
        className="text-text mr-0.5 font-mono text-[12px] tabular-nums sm:mr-1 sm:text-[12.5px]"
        aria-live="off"
      >
        {elapsed}
      </span>
      {working ? (
        <button
          type="button"
          disabled={pending}
          aria-label={t("pause")}
          onClick={() => run(pauseWorkAction)}
          className="text-text-2 hover:bg-bg-3 hover:text-text flex h-7 items-center gap-1.5 rounded px-1.5 text-[12px] font-medium transition-colors disabled:opacity-60 sm:px-2"
        >
          <PauseGlyph />
          <span className="hidden sm:inline">{t("pause")}</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          aria-label={t("resume")}
          onClick={() => run(resumeWorkAction)}
          className="text-green hover:bg-bg-3 flex h-7 items-center gap-1.5 rounded px-1.5 text-[12px] font-medium transition-colors disabled:opacity-60 sm:px-2"
        >
          <PlayGlyph />
          <span className="hidden sm:inline">{t("resume")}</span>
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        aria-label={t("finish")}
        onClick={() => run(finishWorkAction)}
        className="text-red-text hover:bg-red-tint flex h-7 items-center gap-1.5 rounded px-1.5 text-[12px] font-medium transition-colors disabled:opacity-60 sm:px-2"
      >
        <StopGlyph />
        <span className="hidden sm:inline">{t("finish")}</span>
      </button>
    </div>
  );
}

function PauseGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function PlayGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5l12 7-12 7V5z" />
    </svg>
  );
}
function StopGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}
