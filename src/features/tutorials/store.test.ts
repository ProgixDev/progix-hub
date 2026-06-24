import { describe, expect, it } from "vitest";
import { createTutorialsStore } from "./store";
import type { Tutorial } from "./types";

const tutorial: Tutorial = {
  id: "t1",
  title: "Set up Stripe",
  description: null,
  platform_service_id: "stripe",
  source_type: "embed",
  embed_url: "https://youtu.be/8VLGMiM-mm8",
  storage_path: null,
  language: null,
  visible_to_clients: true,
  created_at: "2026-06-24T00:00:00Z",
  updated_at: "2026-06-24T00:00:00Z",
};

describe("tutorials store", () => {
  it("opens create/edit and closes", () => {
    const store = createTutorialsStore();
    expect(store.getState().modal.mode).toBe("closed");
    store.getState().openCreate();
    expect(store.getState().modal.mode).toBe("create");
    store.getState().openEdit(tutorial);
    const modal = store.getState().modal;
    expect(modal.mode === "edit" && modal.tutorial.id).toBe("t1");
    store.getState().closeModal();
    expect(store.getState().modal.mode).toBe("closed");
  });
});
