import { useTranslations } from "next-intl";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ContributionGraph } from "./contribution-graph";
import { type ContributionCalendar, type OrgMember, standingOf } from "../types";

const STANDING_KEY = {
  superadmin: "standingSuperadmin",
  lead: "standingLead",
  member: "standingMember",
} as const;
const STANDING_TONE = { superadmin: "blue", lead: "amber", member: "neutral" } as const;

/** A member's org profile + their org-scoped GitHub activity (spec 011 AC-3). */
export function MemberProfile({
  member,
  calendar,
}: {
  member: OrgMember;
  calendar: ContributionCalendar | null;
}) {
  const t = useTranslations("members");
  const standing = standingOf(member);
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6">
      <Link href="/members" className="text-text-2 hover:text-text text-[12.5px]">
        ← {t("back")}
      </Link>
      <div className="border-line-1 mt-3 rounded-xl border p-5">
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
      </div>

      <div className="mt-5">
        <h3 className="text-text-2 mb-2 text-[12px] font-semibold tracking-wide uppercase">
          {t("activityTitle")}
        </h3>
        <ContributionGraph calendar={calendar} />
      </div>
    </section>
  );
}
