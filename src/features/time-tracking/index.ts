// Public API for the time-tracking slice. Other layers import only from here.
// NOTE: listWorkStatus is SERVER-ONLY (data.ts imports "server-only").
export { ClockWidget } from "./components/clock-widget";
export { listWorkStatus } from "./data";
export { statusOf, workedSeconds, formatDuration } from "./lib";
export type { WorkStatus, WorkState } from "./types";
