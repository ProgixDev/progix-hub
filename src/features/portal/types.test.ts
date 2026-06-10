import { describe, expect, it } from "vitest";
import {
  blockInputSchema,
  cardInputSchema,
  clientCommentSchema,
  clientProposalSchema,
} from "./types";

const blockId = "11111111-1111-4111-8111-111111111111";

describe("blockInputSchema (AC-1)", () => {
  it("accepts a name and rejects a blank or oversized one", () => {
    expect(blockInputSchema.safeParse({ name: "App" }).success).toBe(true);
    expect(blockInputSchema.safeParse({ name: "  " }).success).toBe(false);
    expect(blockInputSchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });
});

describe("cardInputSchema (AC-1)", () => {
  const base = { block_id: blockId, title: "Auth", description: "", status: "delivered" };
  it("accepts a valid card and rejects a bad status", () => {
    expect(cardInputSchema.safeParse(base).success).toBe(true);
    expect(cardInputSchema.safeParse({ ...base, status: "done" }).success).toBe(false);
    expect(cardInputSchema.safeParse({ ...base, title: "" }).success).toBe(false);
  });
});

describe("clientCommentSchema (AC-4)", () => {
  it("requires a name and a body within caps", () => {
    expect(clientCommentSchema.safeParse({ author_name: "Eve", body: "Love it" }).success).toBe(
      true,
    );
    expect(clientCommentSchema.safeParse({ author_name: "", body: "x" }).success).toBe(false);
    expect(
      clientCommentSchema.safeParse({ author_name: "Eve", body: "x".repeat(4001) }).success,
    ).toBe(false);
  });
});

describe("clientProposalSchema (AC-6)", () => {
  it("accepts a proposal with or without a block", () => {
    const base = { author_name: "Eve", title: "Dark mode", description: "" };
    expect(clientProposalSchema.safeParse({ ...base, block_id: blockId }).success).toBe(true);
    expect(clientProposalSchema.safeParse({ ...base, block_id: null }).success).toBe(true);
    expect(clientProposalSchema.safeParse({ ...base, block_id: "nope" }).success).toBe(false);
  });
});
