import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOrgCommits, parseCommits } from "./commits";

describe("parseCommits (spec 012 AC-5)", () => {
  it("maps items to commits, keeps only the subject line, sorts newest-first, caps the list", () => {
    const commits = parseCommits({
      items: [
        {
          sha: "aaa1111",
          html_url: "https://github.com/ProgixDev/hub/commit/aaa1111",
          commit: { message: "fix: older\n\nbody text", author: { date: "2026-02-01T10:00:00Z" } },
          repository: { name: "hub", full_name: "ProgixDev/hub" },
        },
        {
          sha: "bbb2222",
          html_url: "https://github.com/ProgixDev/hub/commit/bbb2222",
          commit: { message: "feat: newer", author: { date: "2026-03-01T10:00:00Z" } },
          repository: { name: "hub", full_name: "ProgixDev/hub" },
        },
      ],
    });
    expect(commits.map((c) => c.sha)).toEqual(["bbb2222", "aaa1111"]); // newest first
    expect(commits[0]!.message).toBe("feat: newer");
    expect(commits[1]!.message).toBe("fix: older"); // body stripped
    expect(commits[0]!.repo).toBe("ProgixDev/hub");
  });

  it("drops items without a sha and tolerates missing fields", () => {
    const commits = parseCommits({
      items: [{ commit: { message: "no sha" } }, { sha: "ccc3333" }],
    });
    expect(commits).toHaveLength(1);
    expect(commits[0]!.sha).toBe("ccc3333");
    expect(commits[0]!.message).toBe("ccc3333".slice(0, 7)); // falls back to short sha
  });

  it("returns an empty array for no items", () => {
    expect(parseCommits({})).toEqual([]);
  });
});

describe("fetchOrgCommits (spec 012 AC-6 — fail soft)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GITHUB_TOKEN;
  });

  it("returns [] and makes no request when GITHUB_TOKEN is absent", async () => {
    delete process.env.GITHUB_TOKEN;
    expect(await fetchOrgCommits("octocat", 2026)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns [] and makes no request when the member has no linked GitHub", async () => {
    process.env.GITHUB_TOKEN = "t";
    expect(await fetchOrgCommits(null, 2026)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns [] without a request for a malformed login (defense in depth)", async () => {
    process.env.GITHUB_TOKEN = "t";
    expect(await fetchOrgCommits("bad login!; org:evil", 2026)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns [] on a non-200 response", async () => {
    process.env.GITHUB_TOKEN = "t";
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    expect(await fetchOrgCommits("octocat", 2026)).toEqual([]);
  });

  it("returns [] on a network error", async () => {
    process.env.GITHUB_TOKEN = "t";
    fetchMock.mockRejectedValue(new Error("network"));
    expect(await fetchOrgCommits("octocat", 2026)).toEqual([]);
  });

  it("scopes the query to the org, author, and the year start", async () => {
    process.env.GITHUB_TOKEN = "t";
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    await fetchOrgCommits("octocat", 2026);
    const calledUrl = decodeURIComponent(String(fetchMock.mock.calls[0]![0]));
    expect(calledUrl).toContain("author:octocat");
    expect(calledUrl).toContain("author-date:>=2026-01-01");
    expect(calledUrl).toContain("org:");
  });
});
