import { describe, expect, it } from "vitest";
import { capabilities } from "./roles";

describe("capabilities (ADR-0011 matrix)", () => {
  it("superadmin and PM can do everything", () => {
    for (const role of ["superadmin", "pm"] as const) {
      expect(capabilities(role)).toEqual({
        read: true,
        manageProject: true,
        managePeople: true,
        seeEnvVars: true,
        writeEnvVars: true,
        writeContent: true,
      });
    }
  });

  it("developer: full content + secrets, but no project/people management", () => {
    const c = capabilities("developer");
    expect(c.seeEnvVars && c.writeEnvVars && c.writeContent).toBe(true);
    expect(c.manageProject || c.managePeople).toBe(false);
  });

  it("video editor: content only — no env-var access at all", () => {
    const c = capabilities("video_editor");
    expect(c.writeContent).toBe(true);
    expect(c.seeEnvVars).toBe(false);
    expect(c.writeEnvVars).toBe(false);
    expect(c.manageProject || c.managePeople).toBe(false);
  });

  it("viewer: read-only — sees env-var keys but cannot write or reveal", () => {
    const c = capabilities("viewer");
    expect(c.read && c.seeEnvVars).toBe(true);
    expect(c.writeEnvVars || c.writeContent || c.manageProject || c.managePeople).toBe(false);
  });

  it("no role (not a member): nothing", () => {
    expect(capabilities(null).read).toBe(false);
  });
});
