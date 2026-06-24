import { describe, expect, it } from "vitest";
import { createPlatformsStore } from "./store";
import type { Platform } from "./types";

const platform: Platform = {
  id: "p1",
  name: "Stripe",
  service_id: "stripe",
  access_pattern: "invite_collaborator",
  critical: true,
  steps: ["Open settings"],
  tutorials: [],
  invite_url: "https://x.com",
  invite_role: "Dev",
  invite_email: "dev@progix.com",
  key_label: null,
  disabled: false,
  created_at: "2026-06-24T00:00:00Z",
  updated_at: "2026-06-24T00:00:00Z",
};

describe("platforms store", () => {
  it("defaults to a closed modal and opens create/edit/close", () => {
    const store = createPlatformsStore();
    expect(store.getState().modal.mode).toBe("closed");
    store.getState().openCreate();
    expect(store.getState().modal.mode).toBe("create");
    store.getState().openEdit(platform);
    const modal = store.getState().modal;
    expect(modal.mode === "edit" && modal.platform.id).toBe("p1");
    store.getState().closeModal();
    expect(store.getState().modal.mode).toBe("closed");
  });
});
