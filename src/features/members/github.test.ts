import { describe, expect, it } from "vitest";
import { buildCalendar, levelFromCount } from "./github";

describe("levelFromCount (spec 011)", () => {
  it("buckets a day's count into the 5 heatmap levels", () => {
    expect(levelFromCount(0)).toBe(0);
    expect(levelFromCount(1)).toBe(1);
    expect(levelFromCount(2)).toBe(1);
    expect(levelFromCount(4)).toBe(2);
    expect(levelFromCount(8)).toBe(3);
    expect(levelFromCount(20)).toBe(4);
  });
});

describe("buildCalendar (spec 011)", () => {
  it("maps GitHub weeks into a leveled grid and keeps the total", () => {
    const cal = buildCalendar({
      totalContributions: 3,
      weeks: [
        {
          contributionDays: [
            { date: "2026-01-01", contributionCount: 0 },
            { date: "2026-01-02", contributionCount: 3 },
          ],
        },
      ],
    });
    expect(cal.total).toBe(3);
    expect(cal.weeks).toHaveLength(1);
    expect(cal.weeks[0]!.map((d) => d.level)).toEqual([0, 2]);
  });
});
