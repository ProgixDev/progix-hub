"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { deleteEstimateAction } from "../actions";
import type { Estimate } from "../types";

const STATUS_CLS: Record<string, string> = {
  draft: "bg-bg-inset text-text-3",
  sent: "bg-blue-tint text-blue-text",
  accepted: "bg-green-tint text-green-text",
  rejected: "bg-red-tint text-red-text",
};

export function EstimatesList({ estimates: initial }: { estimates: Estimate[] }) {
  const t = useTranslations("pricing");
  const router = useRouter();
  const [estimates, setEstimates] = useState(initial);
  const [, start] = useTransition();

  function remove(id: string) {
    setEstimates((arr) => arr.filter((e) => e.id !== id));
    start(async () => {
      await deleteEstimateAction(id);
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="t-eyebrow">{t("wizardEyebrow")}</p>
          <h1 className="text-text text-[24px] font-semibold tracking-tight">
            {t("estimatesTitle")}
          </h1>
          <p className="text-text-3 mt-1 text-[13px]">{t("estimatesSubtitle")}</p>
        </div>
        <Link
          href="/pricing/estimates/new"
          className="btn-primary flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium"
        >
          <PlusIcon className="size-4" />
          {t("newEstimate")}
        </Link>
      </div>

      {estimates.length === 0 ? (
        <div className="border-line-1 mt-6 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-text-2 text-[13.5px]">{t("estimatesEmpty")}</p>
          <Link
            href="/pricing/estimates/new"
            className="btn-primary mt-3 inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium"
          >
            {t("newEstimate")}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {estimates.map((e) => (
            <li key={e.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
              <Link href={`/pricing/estimates/${e.id}`} className="min-w-0 flex-1">
                <p className="text-text truncate text-[14px] font-medium">{e.name}</p>
                <p className="text-text-3 truncate text-[12px]">
                  {[e.client_name, e.project_type].filter(Boolean).join(" · ") || t("noClient")}
                </p>
              </Link>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  STATUS_CLS[e.status] ?? STATUS_CLS.draft,
                )}
              >
                {t(`status_${e.status}` as "status_draft")}
              </span>
              <div className="text-right">
                <p className="text-text text-[14px] font-semibold tabular-nums">
                  ${e.total_price.toLocaleString()}
                </p>
                <p className="text-text-3 text-[11px] tabular-nums">
                  {t("daysShort", { d: e.total_days })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/pricing/estimates/${e.id}/quote`}
                  className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors"
                >
                  {t("quoteLink")}
                </Link>
                <Link
                  href={`/pricing/estimates/${e.id}/spec`}
                  className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors"
                >
                  {t("specLink")}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => remove(e.id)}
                aria-label={t("delete")}
                className="text-text-3 hover:text-red-text grid size-8 place-items-center rounded-full text-[16px]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
