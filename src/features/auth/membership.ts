/**
 * GitHub org-membership gate (spec 002, AC-2). Pure decision + the GitHub API read,
 * deliberately free of `server-only` so the decision is unit-testable. The provider
 * token is only ever passed in server code (the OAuth callback).
 */

// The org's canonical GitHub login is `ProgixDev` (it was renamed from `DigitariaWebs`,
// which now 404s on the membership API). Overridable via env for other deployments.
export const PROGIX_ORG = process.env.PROGIX_GITHUB_ORG ?? "ProgixDev";

/** Shape of the GitHub `GET /user/memberships/orgs/{org}` response we care about. */
export type OrgMembership = { state?: string } | null;

/** Pure decision: membership counts only when the user is an *active* org member. */
export function isAllowedMember(membership: OrgMembership): boolean {
  return membership?.state === "active";
}

/**
 * Reads the caller's org membership using their GitHub OAuth token (needs `read:org`).
 * Returns null on any non-200 (404 = not a member, 403 = token lacks scope).
 */
export async function fetchOrgMembership(
  providerToken: string,
  org: string = PROGIX_ORG,
): Promise<OrgMembership> {
  const res = await fetch(`https://api.github.com/user/memberships/orgs/${org}`, {
    headers: {
      Authorization: `Bearer ${providerToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status !== 200) return null;
  return (await res.json()) as OrgMembership;
}
