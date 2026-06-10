import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import type { MemberPortal } from "../data";
import { PortalSection } from "./portal-section";

vi.mock("../actions", () => ({
  createPortalBlockAction: vi.fn(),
  updatePortalBlockAction: vi.fn(),
  archivePortalBlockAction: vi.fn(),
  createPortalCardAction: vi.fn(),
  updatePortalCardAction: vi.fn(),
  archivePortalCardAction: vi.fn(),
  addMemberCommentAction: vi.fn(),
  createShareLinkAction: vi.fn(),
  revokeShareLinkAction: vi.fn(),
  getMemberAttachmentUrlAction: vi.fn(),
}));

const projectId = "11111111-1111-4111-8111-111111111111";

const empty: MemberPortal = {
  blocks: [],
  cards: [],
  comments: [],
  attachments: [],
  shareLink: null,
};

const filled: MemberPortal = {
  blocks: [
    {
      id: "b1",
      project_id: projectId,
      name: "App",
      position: 0,
      archived_at: null,
      created_at: "2026-06-10T00:00:00Z",
      updated_at: "2026-06-10T00:00:00Z",
    },
  ],
  cards: [
    {
      id: "c1",
      project_id: projectId,
      block_id: "b1",
      title: "Authentication",
      description: "GitHub OAuth, org-gated.",
      status: "delivered",
      origin: "team",
      client_author: null,
      archived_at: null,
      created_at: "2026-06-10T00:00:00Z",
      updated_at: "2026-06-10T00:00:00Z",
    },
    {
      id: "c2",
      project_id: projectId,
      block_id: null,
      title: "Dark mode everywhere",
      description: "",
      status: "proposed",
      origin: "client",
      client_author: "Eve",
      archived_at: null,
      created_at: "2026-06-10T00:00:00Z",
      updated_at: "2026-06-10T00:00:00Z",
    },
  ],
  comments: [
    {
      id: "m1",
      card_id: "c1",
      author_kind: "client",
      author_name: "Eve",
      body: "Works great!",
      created_at: "2026-06-10T00:00:00Z",
    },
  ],
  attachments: [],
  shareLink: { id: "s1", project_id: projectId, revoked_at: null, created_at: "2026-06-10" },
};

describe("PortalSection (member side)", () => {
  it("shows the empty state and the create-link button (AC-1/AC-2)", () => {
    renderWithIntl(<PortalSection projectId={projectId} portal={empty} />);
    expect(screen.getByText(/no blocks yet/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /create share link/i })).toBeTruthy();
  });

  it("renders blocks, cards, statuses, client comments, and the proposals inbox", () => {
    renderWithIntl(<PortalSection projectId={projectId} portal={filled} />);
    expect(screen.getByRole("heading", { name: /App/ })).toBeTruthy();
    expect(screen.getByText("Authentication")).toBeTruthy();
    expect(screen.getAllByText("Delivered").length).toBeGreaterThan(0);
    expect(screen.getByText(/works great!/i)).toBeTruthy();
    // Active link → rotate/revoke instead of create.
    expect(screen.getByRole("button", { name: /rotate/i })).toBeTruthy();
    // The unassigned client proposal lands in the inbox.
    expect(screen.getByRole("heading", { name: /client proposals/i })).toBeTruthy();
    expect(screen.getByText("Dark mode everywhere")).toBeTruthy();
  });
});
