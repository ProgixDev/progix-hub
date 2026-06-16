import { useTranslations } from "next-intl";
import type { OrgCommit } from "../types";

/**
 * A member's recent org commits (spec 012 AC-5). Presentational: repo · subject · date, each
 * linking to GitHub. An empty list (no linked GitHub, no activity, or unconfigured integration)
 * shows a clear unavailable state rather than nothing (AC-6).
 */
export function CommitList({ commits }: { commits: OrgCommit[] }) {
  const t = useTranslations("members");
  if (commits.length === 0) {
    return (
      <p className="text-text-3 border-line/60 rounded-lg border border-dashed px-4 py-6 text-center text-[12.5px]">
        {t("commitsUnavailable")}
      </p>
    );
  }
  return (
    <ul className="border-line-1 divide-line/60 divide-y rounded-lg border">
      {commits.map((commit) => (
        <li key={commit.sha} className="flex items-baseline justify-between gap-3 px-3.5 py-2.5">
          <div className="min-w-0">
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text hover:text-blue-text block truncate text-[13px]"
            >
              {commit.message}
            </a>
            {commit.repo && (
              <p className="text-text-3 truncate font-mono text-[11.5px]">{commit.repo}</p>
            )}
          </div>
          <time dateTime={commit.date} className="text-text-3 flex-none text-[11.5px] tabular-nums">
            {commit.date.slice(0, 10)}
          </time>
        </li>
      ))}
    </ul>
  );
}
