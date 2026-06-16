import type { ContributionCalendar, ContributionLevel } from "./types";

// Pure: bucket a day's commit count into the 5 heatmap levels (testable, client-safe — no
// "server-only" import so unit tests can load it).
export function levelFromCount(count: number): ContributionLevel {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

type RawCalendar = {
  totalContributions: number;
  weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
};

/** Pure transform of GitHub's contributionCalendar into our grid model (AC-3). */
export function buildCalendar(raw: RawCalendar): ContributionCalendar {
  const weeks = raw.weeks.map((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: levelFromCount(day.contributionCount),
    })),
  );
  return { total: raw.totalContributions, weeks };
}

/**
 * Fetch a member's contribution calendar scoped to the org (spec 011 AC-3). Env-gated on
 * GITHUB_TOKEN + GITHUB_ORG_ID and resilient: any missing config, network error, or unlinked
 * GitHub login returns null so the profile shows an "unavailable" state rather than breaking.
 */
export async function fetchOrgContributions(
  login: string | null,
): Promise<ContributionCalendar | null> {
  const token = process.env.GITHUB_TOKEN;
  const orgId = process.env.GITHUB_ORG_ID;
  if (!login || !token || !orgId) return null;
  const query =
    "query($login:String!,$org:ID!){user(login:$login){contributionsCollection(organizationID:$org){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}";
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { login, org: orgId } }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { user?: { contributionsCollection?: { contributionCalendar?: RawCalendar } } };
    };
    const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
    return calendar ? buildCalendar(calendar) : null;
  } catch {
    return null;
  }
}
