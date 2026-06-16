"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { setMemberLeadAction } from "../actions";
import { type OrgMember, standingOf } from "../types";

const STANDING = {
  superadmin: { key: "standingSuperadmin", tone: "blue" },
  lead: { key: "standingLead", tone: "amber" },
  member: { key: "standingMember", tone: "neutral" },
} as const;

/** Org members directory (spec 011). A superadmin can toggle a member's "lead" standing. */
export function MembersDirectory({
  members,
  canPromote,
}: {
  members: OrgMember[];
  canPromote: boolean;
}) {
  const t = useTranslations("members");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleLead(member: OrgMember) {
    setError(null);
    start(async () => {
      const res = await setMemberLeadAction({ userId: member.user_id, makeLead: !member.is_lead });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6">
      <div className="mb-3">
        <h2 className="text-text text-[15px] font-semibold">{t("title")}</h2>
        <p className="text-text-3 text-[12px]">{t("subtitle")}</p>
      </div>
      {error && (
        <p role="alert" className="text-red-text mb-3 max-w-full text-[12px]">
          {error}
        </p>
      )}
      {members.length === 0 ? (
        <div className="border-line/60 text-text-3 rounded-lg border border-dashed px-4 py-10 text-center text-[13px]">
          {t("empty")}
        </div>
      ) : (
        <ul className="divide-line/60 border-line-1 divide-y rounded-xl border">
          {members.map((member) => {
            const standing = standingOf(member);
            return (
              <li
                key={member.user_id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/members/${member.user_id}`}
                    className="text-text hover:text-blue-text text-[13.5px] font-medium"
                  >
                    {member.display_name ?? member.email}
                  </Link>
                  {member.email && member.display_name && (
                    <p className="text-text-3 truncate text-[11.5px]">{member.email}</p>
                  )}
                </div>
                <div className="flex flex-none items-center gap-2">
                  <Badge tone={STANDING[standing].tone}>{t(STANDING[standing].key)}</Badge>
                  {canPromote && !member.is_superadmin && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggleLead(member)}
                      className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60"
                    >
                      {member.is_lead ? t("removeLead") : t("makeLead")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
