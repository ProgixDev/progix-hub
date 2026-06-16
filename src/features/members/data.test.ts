import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { getCurrentUser } from "@/lib/auth/session";
import { canViewOrgMembers } from "./data";

const mockGetCurrentUser = vi.mocked(getCurrentUser);

const member = {
  id: "00000000-0000-4000-8000-000000000009",
  email: "dev@progix.test",
  name: "Dev",
  avatarUrl: null,
  initials: "D",
  isSuperadmin: false,
  isLead: false,
};

describe("canViewOrgMembers (spec 012 AC-4)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lets any signed-in org member view the directory", async () => {
    mockGetCurrentUser.mockResolvedValue(member);
    expect(await canViewOrgMembers()).toBe(true);
  });

  it("refuses a signed-out / non-member viewer", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    expect(await canViewOrgMembers()).toBe(false);
  });
});
