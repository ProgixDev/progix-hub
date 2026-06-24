import { describe, expect, it } from "vitest";
import { dossierInputSchema } from "./lib";

describe("dossierInputSchema (spec 018 AC-4)", () => {
  it("accepts a complete dossier and normalizes empties to null", () => {
    const r = dossierInputSchema.safeParse({
      contact_name: "Jane",
      contact_email: "jane@client.com",
      it_savviness: "4",
      company: "",
      notes: "Prefers email, anxious about deadlines.",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.it_savviness).toBe(4);
      expect(r.data.company).toBeNull();
    }
  });

  it("treats an empty IT-savviness as null", () => {
    const r = dossierInputSchema.safeParse({ it_savviness: "" });
    expect(r.success && r.data.it_savviness).toBeNull();
  });

  it("rejects an out-of-range IT-savviness", () => {
    expect(dossierInputSchema.safeParse({ it_savviness: "7" }).success).toBe(false);
    expect(dossierInputSchema.safeParse({ it_savviness: "0" }).success).toBe(false);
  });

  it("rejects a malformed contact email", () => {
    const r = dossierInputSchema.safeParse({ contact_email: "not-an-email" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "contact_email")).toBe(true);
  });
});
