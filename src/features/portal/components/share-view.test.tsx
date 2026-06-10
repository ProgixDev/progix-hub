import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import type { PublicPortal } from "../types";
import { ShareView } from "./share-view";

vi.mock("../public-actions", () => ({
  submitPortalCommentAction: vi.fn(),
  submitPortalProposalAction: vi.fn(),
  submitPortalAttachmentAction: vi.fn(),
  getPortalAttachmentUrlAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const token = "a".repeat(43);

const portal: PublicPortal = {
  project_name: "Acme site",
  blocks: [{ id: "b1", name: "Website", position: 0 }],
  cards: [
    {
      id: "c1",
      block_id: "b1",
      title: "Landing page",
      description: "Hero, pricing, contact form.",
      status: "delivered",
      origin: "team",
      client_author: null,
      created_at: "2026-06-10T00:00:00Z",
      comments: [
        {
          id: "m1",
          card_id: "c1",
          author_kind: "client",
          author_name: "Eve",
          body: "<script>alert(1)</script> nice work",
          created_at: "2026-06-10T00:00:00Z",
        },
      ],
      attachments: [],
    },
  ],
};

describe("ShareView (client side, AC-3/AC-8)", () => {
  it("renders the project, block, card, and status — and no member nav", () => {
    renderWithIntl(<ShareView portal={portal} token={token} />);
    expect(screen.getByRole("heading", { name: "Acme site" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Website" })).toBeTruthy();
    expect(screen.getByText("Landing page")).toBeTruthy();
    expect(screen.getByText("Delivered")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /projects/i })).toBeNull();
  });

  it("renders client-submitted text inert — never as markup (AC-8)", () => {
    const { container } = renderWithIntl(<ShareView portal={portal} token={token} />);
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText(/nice work/)).toBeTruthy();
  });

  it("offers comment, attach, and propose affordances (view + comment role)", () => {
    renderWithIntl(<ShareView portal={portal} token={token} />);
    expect(screen.getAllByPlaceholderText(/write a comment/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /attach a file/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /propose a feature/i })).toBeTruthy();
  });
});
