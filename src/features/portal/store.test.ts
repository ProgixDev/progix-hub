import { describe, expect, it } from "vitest";
import { createPortalStore } from "./store";
import type { PortalCard } from "./types";

const card: PortalCard = {
  id: "11111111-1111-4111-8111-111111111111",
  project_id: "p",
  block_id: "b",
  title: "Auth",
  description: "",
  status: "delivered",
  origin: "team",
  client_author: null,
  archived_at: null,
  created_at: "2026-06-10T00:00:00Z",
  updated_at: "2026-06-10T00:00:00Z",
};

describe("portal store", () => {
  it("opens add-block / add-card / edit-card and closes", () => {
    const store = createPortalStore();
    expect(store.getState().modal).toEqual({ mode: "closed" });
    store.getState().openAddBlock();
    expect(store.getState().modal).toEqual({ mode: "add-block" });
    store.getState().openAddCard("b");
    expect(store.getState().modal).toEqual({ mode: "add-card", blockId: "b" });
    store.getState().openEditCard(card);
    expect(store.getState().modal).toEqual({ mode: "edit-card", card });
    store.getState().closeModal();
    expect(store.getState().modal).toEqual({ mode: "closed" });
  });
});
