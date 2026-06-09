import { describe, expect, it } from "vitest";
import { createEnvVarsStore } from "./store";
import type { EnvVarMeta } from "./types";

const sampleVar: EnvVarMeta = {
  id: "11111111-1111-1111-1111-111111111111",
  project_id: "22222222-2222-2222-2222-222222222222",
  key: "STRIPE_SECRET_KEY",
  service: "stripe",
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

  it("reveals and hides a value without leaking it across ids", () => {
    const store = createEnvVarsStore();
    store.getState().setRevealed(sampleVar.id, "sk_live_123");
    expect(store.getState().revealed[sampleVar.id]).toBe("sk_live_123");
    store.getState().hideValue(sampleVar.id);
    expect(store.getState().revealed[sampleVar.id]).toBeUndefined();
  });
});
