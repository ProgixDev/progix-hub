/** An org member as the directory sees them (spec 011). */
export type OrgMember = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  github_login: string | null;
  is_superadmin: boolean;
  is_lead: boolean;
  created_at: string;
};

/** Org standing derived from the flags — superadmin outranks lead outranks member. */
export type OrgStanding = "superadmin" | "lead" | "member";

export function standingOf(member: Pick<OrgMember, "is_superadmin" | "is_lead">): OrgStanding {
  if (member.is_superadmin) return "superadmin";
  if (member.is_lead) return "lead";
  return "member";
}

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;
export type ContributionDay = { date: string; count: number; level: ContributionLevel };
export type ContributionCalendar = { total: number; weeks: ContributionDay[][] };

/** One commit a member authored in an org repo (spec 012 AC-5). `message` is the subject line. */
export type OrgCommit = {
  sha: string;
  message: string;
  repo: string;
  url: string;
  date: string;
};
