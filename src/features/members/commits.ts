import type { OrgCommit } from "./types";

// The org's GitHub login for commit search (same default as the membership gate in
// features/auth/membership.ts; features can't import each other, so the constant is repeated).
const ORG_LOGIN = process.env.PROGIX_GITHUB_ORG ?? "ProgixDev";
const MAX_COMMITS = 30;
// GitHub usernames: alphanumeric + single hyphens, ≤39 chars. We only ever search for a value that
// matches this, so a malformed/spoofed github_login can't shape the search query (defense in depth).
const GITHUB_LOGIN_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

type RawSearchCommits = {
  items?: {
    sha?: string;
    html_url?: string;
    commit?: { message?: string; author?: { date?: string } };
    repository?: { name?: string; full_name?: string };
  }[];
};

/**
 * Pure transform of GitHub's search/commits response into our model (AC-5). Keeps only the
 * commit's subject line, sorts newest-first, and caps the list. Tolerant of missing fields —
 * any item without a sha is dropped rather than throwing.
 */
export function parseCommits(raw: RawSearchCommits): OrgCommit[] {
  const items = raw.items ?? [];
  return items
    .filter((it) => typeof it.sha === "string")
    .map((it) => ({
      sha: it.sha!,
      message: (it.commit?.message ?? "").split("\n")[0]!.trim() || it.sha!.slice(0, 7),
      repo: it.repository?.full_name ?? it.repository?.name ?? "",
      url: it.html_url ?? "",
      date: it.commit?.author?.date ?? "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_COMMITS);
}

/** ISO date for Jan 1 of the given year (UTC), e.g. `2026-01-01`. */
function startOfYear(year: number): string {
  return `${year}-01-01`;
}

/**
 * Fetch a member's commits across the org's repos for the current year, newest first (AC-5).
 * Env-gated on GITHUB_TOKEN and resilient (AC-6): missing config, an unlinked GitHub login, a
 * non-200, or a network error all return `[]` so the profile shows an empty state, never an error.
 */
export async function fetchOrgCommits(
  login: string | null,
  year: number = new Date().getFullYear(),
): Promise<OrgCommit[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!login || !token || !GITHUB_LOGIN_RE.test(login)) return [];
  const q = `org:${ORG_LOGIN} author:${login} author-date:>=${startOfYear(year)}`;
  const url =
    `https://api.github.com/search/commits?q=${encodeURIComponent(q)}` +
    `&sort=author-date&order=desc&per_page=${MAX_COMMITS}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return parseCommits((await res.json()) as RawSearchCommits);
  } catch {
    return [];
  }
}
