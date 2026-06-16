import { describe, expect, it } from "vitest";
import { standingOf } from "./types";

describe("standingOf (spec 014 AC-3)", () => {
  it("ranks superadmin > global PM > lead > member", () => {
    expect(standingOf({ is_superadmin: true, is_global_pm: true, is_lead: true })).toBe(
      "superadmin",
    );
    expect(standingOf({ is_superadmin: false, is_global_pm: true, is_lead: true })).toBe(
      "global_pm",
    );
    expect(standingOf({ is_superadmin: false, is_global_pm: false, is_lead: true })).toBe("lead");
    expect(standingOf({ is_superadmin: false, is_global_pm: false, is_lead: false })).toBe(
      "member",
    );
  });
});
