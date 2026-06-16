import { describe, expect, it } from "vitest";
import { formatDuration, statusOf, totalSeconds, workedSeconds } from "./lib";
import type { WorkSession } from "./types";

const base: WorkSession = {
  id: "s1",
  user_id: "u1",
  started_at: "2026-06-16T09:00:00.000Z",
  ended_at: null,
  break_started_at: null,
  break_seconds: 0,
};
const at = (iso: string) => Date.parse(iso);

describe("statusOf (spec 013 AC-1)", () => {
  it("maps the session to off / working / paused", () => {
    expect(statusOf(null)).toBe("off");
    expect(statusOf({ ...base, ended_at: "2026-06-16T17:00:00.000Z" })).toBe("off");
    expect(statusOf(base)).toBe("working");
    expect(statusOf({ ...base, break_started_at: "2026-06-16T12:00:00.000Z" })).toBe("paused");
  });
});

describe("workedSeconds (spec 013 AC-3)", () => {
  it("counts elapsed time for an open working session", () => {
    expect(workedSeconds(base, at("2026-06-16T10:00:00.000Z"))).toBe(3600);
  });

  it("excludes accumulated break time", () => {
    expect(workedSeconds({ ...base, break_seconds: 600 }, at("2026-06-16T10:00:00.000Z"))).toBe(
      3000,
    );
  });

  it("excludes an in-progress break", () => {
    const paused: WorkSession = { ...base, break_started_at: "2026-06-16T09:45:00.000Z" };
    // 1h elapsed at 10:00, minus the 15min ongoing break = 45min.
    expect(workedSeconds(paused, at("2026-06-16T10:00:00.000Z"))).toBe(2700);
  });

  it("uses ended_at for a closed session and never goes negative", () => {
    const closed: WorkSession = {
      ...base,
      ended_at: "2026-06-16T09:30:00.000Z",
      break_seconds: 9999,
    };
    expect(workedSeconds(closed, at("2026-06-16T20:00:00.000Z"))).toBe(0);
  });

  it("returns 0 for no session", () => {
    expect(workedSeconds(null, Date.now())).toBe(0);
  });
});

describe("totalSeconds (spec 013 AC-3)", () => {
  it("sums worked time across a day's sessions", () => {
    const morning: WorkSession = {
      ...base,
      ended_at: "2026-06-16T11:00:00.000Z",
    };
    const afternoon: WorkSession = {
      ...base,
      id: "s2",
      started_at: "2026-06-16T13:00:00.000Z",
      ended_at: "2026-06-16T14:30:00.000Z",
    };
    expect(totalSeconds([morning, afternoon], at("2026-06-16T20:00:00.000Z"))).toBe(
      2 * 3600 + 1.5 * 3600,
    );
  });
});

describe("formatDuration", () => {
  it("renders H/M/S compactly", () => {
    expect(formatDuration(2 * 3600 + 5 * 60)).toBe("2h 05m");
    expect(formatDuration(7 * 60 + 3)).toBe("7m 03s");
    expect(formatDuration(12)).toBe("12s");
    expect(formatDuration(-5)).toBe("0s");
  });
});
