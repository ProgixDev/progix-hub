import { useTranslations } from "next-intl";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CommitList } from "./commit-list";
import { ConnectGitHubButton } from "./connect-github-button";
import { ContributionGraph } from "./contribution-graph";
import { type ContributionCalendar, type OrgCommit, type OrgMember, standingOf } from "../types";

const STANDING_KEY = {
  superadmin: "standingSuperadmin",
  global_pm: "standingGlobalPm",
  lead: "standingLead",
  member: "standingMember",
} as const;
const STANDING_TONE = {
  superadmin: "blue",
  global_pm: "green",
  lead: "amber",
  member: "neutral",
} as const;

/**
 * A member's org profile + their org-scoped GitHub activity (spec 011 AC-3, spec 012 AC-3/AC-5).
 * On the viewer's own profile (`isOwnProfile`) an unlinked GitHub shows a Connect button instead
 * of "no GitHub", and `linkConflict` surfaces the already-linked error (AC-7).
 */
export function MemberProfile({
  member,
  calendar,
  commits,
  isOwnProfile = false,
  linkConflict = false,
}: {
  member: OrgMember;
  calendar: ContributionCalendar | null;
  commits: OrgCommit[];
  isOwnProfile?: boolean;
  linkConflict?: boolean;
}) {
  const t = useTranslations("members");
  const standing = standingOf(member);
  const showConnect = isOwnProfile && !member.github_login;
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6">
      <Link href="/members" className="text-text-2 hover:text-text text-[12.5px]">
        ← {t("back")}
      </Link>
      <div className="spotlight glass mt-3 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-text text-[16px] font-semibold break-all">
              {member.display_name ?? member.email}
            </h2>
            {member.email && <p className="text-text-3 text-[12.5px]">{member.email}</p>}
          </div>
          <Badge tone={STANDING_TONE[standing]}>{t(STANDING_KEY[standing])}</Badge>
        </div>
        <p className="text-text-2 mt-3 text-[12.5px]">
          {t("githubLabel")}:{" "}
          {member.github_login ? (
            <span className="text-text font-mono">{member.github_login}</span>
          ) : (
            <span className="text-text-3">{t("noGithub")}</span>
          )}
        </p>
        {showConnect && (
          <div className="mt-3">
            {linkConflict && (
              <p role="alert" className="text-red-text mb-2 text-[12px]">
                {t("linkConflict")}
              </p>
            )}
            <ConnectGitHubButton />
          </div>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-text-2 mb-2 text-[12px] font-semibold tracking-wide uppercase">
          {t("activityTitle")}
        </h3>
        <ContributionGraph calendar={calendar} />
      </div>

      <div className="mt-5">
        <h3 className="text-text-2 mb-2 text-[12px] font-semibold tracking-wide uppercase">
          {t("commitsTitle")}
        </h3>
        <CommitList commits={commits} />
      </div>
    </section>
  );
}
