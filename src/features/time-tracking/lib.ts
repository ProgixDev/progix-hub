import type { WorkSession, WorkState } from "./types";

/** Current clock state from an (open or closed/absent) session. Pure (AC-1). */
export function statusOf(session: WorkSession | null): WorkState {
  if (!session || session.ended_at) return "off";
  return session.break_started_at ? "paused" : "working";
}

/**
 * Worked seconds for a session at `nowMs`, excluding accumulated breaks and any in-progress break
 * (AC-3). Closed sessions use their `ended_at`; open ones use `nowMs`. Never negative.
 */
export function workedSeconds(session: WorkSession | null, nowMs: number): number {
  if (!session) return 0;
  const start = Date.parse(session.started_at);
  const end = session.ended_at ? Date.parse(session.ended_at) : nowMs;
  let worked = Math.floor((end - start) / 1000) - session.break_seconds;
  if (!session.ended_at && session.break_started_at) {
    worked -= Math.floor((nowMs - Date.parse(session.break_started_at)) / 1000);
  }
  return Math.max(0, worked);
}

/** Sum worked seconds across a set of a day's sessions (AC-3). */
export function totalSeconds(sessions: WorkSession[], nowMs: number): number {
  return sessions.reduce((sum, s) => sum + workedSeconds(s, nowMs), 0);
}

/** Compact H/M/S display, e.g. `2h 05m`, `7m 03s`, `12s`. */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}
