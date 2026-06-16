import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    const value = key
      .split(".")
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], en);
    return typeof value === "string" ? value : key;
  }),
}));

import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMemberAccountAction } from "./actions";

const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCreateAdminClient = vi.mocked(createAdminClient);

const superadmin = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "boss@progix.test",
  name: "Boss",
  avatarUrl: null,
  initials: "B",
  isSuperadmin: true,
  isLead: false,
  isGlobalPm: false,
};
const plainMember = { ...superadmin, isSuperadmin: false };

function adminWith(createUser: ReturnType<typeof vi.fn>) {
  mockCreateAdminClient.mockReturnValue({
    auth: { admin: { createUser } },
  } as unknown as ReturnType<typeof createAdminClient>);
  return createUser;
}

const validInput = {
  name: "Jordan Lee",
  email: "Jordan@Progix.test",
  password: "correct-horse-battery",
};

beforeEach(() => vi.clearAllMocks());

describe("createMemberAccountAction — authorization (AC-6)", () => {
  it("refuses a signed-out caller before touching the admin client", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const createUser = adminWith(vi.fn());
    const res = await createMemberAccountAction(validInput);
    expect(res.ok).toBe(false);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("refuses a non-superadmin member before touching the admin client (AC-2)", async () => {
    mockGetCurrentUser.mockResolvedValue(plainMember);
    const createUser = adminWith(vi.fn());
    const res = await createMemberAccountAction(validInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/authorized/i);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });
});

describe("createMemberAccountAction — happy path (AC-3)", () => {
  beforeEach(() => mockGetCurrentUser.mockResolvedValue(superadmin));

  it("creates a confirmed org member with normalized email and never returns the password", async () => {
    const createUser = adminWith(vi.fn().mockResolvedValue({ data: { user: {} }, error: null }));
    const res = await createMemberAccountAction(validInput);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.email).toBe("jordan@progix.test");
      expect(JSON.stringify(res)).not.toContain(validInput.password);
    }
    expect(createUser).toHaveBeenCalledWith({
      email: "jordan@progix.test",
      password: validInput.password,
      email_confirm: true,
      user_metadata: { full_name: "Jordan Lee" },
      app_metadata: { is_member: true },
    });
  });

  it("maps a duplicate email to a field error", async () => {
    adminWith(
      vi.fn().mockResolvedValue({
        data: { user: null },
        error: {
          message: "A user with this email address has already been registered",
          code: "email_exists",
        },
      }),
    );
    const res = await createMemberAccountAction(validInput);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/already exists/i);
      expect(res.fieldErrors?.email).toBeTruthy();
    }
  });
});

describe("createMemberAccountAction — validation (AC-3)", () => {
  beforeEach(() => mockGetCurrentUser.mockResolvedValue(superadmin));

  it("rejects a bad email without calling createUser", async () => {
    const createUser = adminWith(vi.fn());
    const res = await createMemberAccountAction({ ...validInput, email: "not-an-email" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.email).toBeTruthy();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rejects a short password without calling createUser", async () => {
    const createUser = adminWith(vi.fn());
    const res = await createMemberAccountAction({ ...validInput, password: "short" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.password).toBeTruthy();
    expect(createUser).not.toHaveBeenCalled();
  });
});
