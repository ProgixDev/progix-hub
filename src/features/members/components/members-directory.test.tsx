import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import type { OrgMember } from "../types";
import { MembersDirectory } from "./members-directory";

vi.mock("../actions", () => ({ setMemberLeadAction: vi.fn() }));

const base: OrgMember = {
  user_id: "11111111-1111-1111-1111-111111111111",
  email: "dev@progix.test",
  display_name: "Dev One",
  github_login: "devone",
  is_superadmin: false,
  is_lead: false,
  created_at: "2026-06-01T00:00:00Z",
};
const boss: OrgMember = {
  ...base,
  user_id: "22222222-2222-2222-2222-222222222222",
  display_name: "Boss",
  is_superadmin: true,
};

describe("MembersDirectory (spec 011)", () => {
  it("lists members with standing and a lead toggle for non-superadmins when allowed", () => {
    renderWithIntl(<MembersDirectory members={[base, boss]} canPromote />);
    expect(screen.getByText("Dev One")).toBeTruthy();
    expect(screen.getByText("Boss")).toBeTruthy();
    expect(screen.getByText("Superadmin")).toBeTruthy();
    // a Make-lead button for the normal member, but not for the superadmin row
    expect(screen.getByRole("button", { name: /make lead/i })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /make lead/i })).toHaveLength(1);
  });

  it("hides toggles when the viewer can't promote", () => {
    renderWithIntl(<MembersDirectory members={[base]} canPromote={false} />);
    expect(screen.queryByRole("button", { name: /make lead/i })).toBeNull();
  });
});
