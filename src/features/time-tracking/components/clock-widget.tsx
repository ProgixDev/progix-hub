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
    <div className="border-line-1 bg-bg-2 flex h-9 items-center gap-1 rounded-md border pr-1 pl-2.5">
      <span
        className={`size-2 rounded-full ${working ? "bg-green animate-pulse" : "bg-amber"}`}
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
          className="text-text-2 hover:bg-bg-3 hover:text-text h-7 rounded px-2 text-[12px] font-medium transition-colors disabled:opacity-60"
        >
          {t("pause")}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(resumeWorkAction)}
          className="text-green hover:bg-bg-3 h-7 rounded px-2 text-[12px] font-medium transition-colors disabled:opacity-60"
        >
          {t("resume")}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(finishWorkAction)}
        className="text-red-text hover:bg-red-tint h-7 rounded px-2 text-[12px] font-medium transition-colors disabled:opacity-60"
      >
        {t("finish")}
      </button>
    </div>
  );
}
