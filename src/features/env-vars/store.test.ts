import { describe, expect, it } from "vitest";
import { createEnvVarsStore } from "./store";
import type { EnvVarMeta } from "./types";

const sampleVar: EnvVarMeta = {
  id: "11111111-1111-1111-1111-111111111111",
  project_id: "22222222-2222-2222-2222-222222222222",
  key: "STRIPE_SECRET_KEY",
  service: "stripe",
  scope: "backend",
  created_at: "2026-06-09T00:00:00Z",
  updated_at: "2026-06-09T00:00:00Z",
};

describe("env-vars store", () => {
  it("opens the create modal and closes it", () => {
    const store = createEnvVarsStore();
    store.getState().openCreate();
    expect(store.getState().modal).toEqual({ mode: "create" });
    store.getState().closeModal();
    expect(store.getState().modal).toEqual({ mode: "closed" });
  });

  it("opens the edit modal for a given variable", () => {
    const store = createEnvVarsStore();
    store.getState().openEdit(sampleVar);
    expect(store.getState().modal).toEqual({ mode: "edit", envVar: sampleVar });
  });

  it("opens and closes the import dialog (spec 009)", () => {
    const store = createEnvVarsStore();
    expect(store.getState().importOpen).toBe(false);
    store.getState().openImport();
    expect(store.getState().importOpen).toBe(true);
    store.getState().closeImport();
    expect(store.getState().importOpen).toBe(false);
  });

  it("reveals and hides a value without leaking it across ids", () => {
    const store = createEnvVarsStore();
    store.getState().setRevealed(sampleVar.id, "sk_live_123");
    expect(store.getState().revealed[sampleVar.id]).toBe("sk_live_123");
    store.getState().hideValue(sampleVar.id);
    expect(store.getState().revealed[sampleVar.id]).toBeUndefined();
  });
});
