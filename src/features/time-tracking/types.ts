/** One work session for a member (spec 013). Times are ISO strings; break_seconds is accumulated. */
export type WorkSession = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  break_started_at: string | null;
  break_seconds: number;
};

/** A member's clock state. */
export type WorkState = "off" | "working" | "paused";

/** A member's live work status for the org directory (spec 013 AC-4). */
export type WorkStatus = {
  user_id: string;
  state: WorkState;
  seconds_today: number;
};
