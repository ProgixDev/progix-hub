import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProjectHealth } from "../types";

const STATUS_DOT: Record<string, string> = {
  active: "bg-green",
  at_risk: "bg-amber",
  archived: "bg-text-3",
};

/** Cross-project oversight: every project's progress + config + activity in one grid (spec 036). */
export function HealthBoard({ rows }: { rows: ProjectHealth[] }) {
  const t = useTranslations("overview");
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <p className="t-eyebrow">{t("eyebrow")}</p>
      <h1 className="text-text text-[26px] font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-text-3 mt-1 text-[13px]">{t("subtitle")}</p>

      {rows.length === 0 ? (
        <div className="border-line-1 mt-6 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-text-3 text-[13px]">{t("empty")}</p>
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-2xl">
          {/* header */}
          <div className="text-text-3 border-line hidden grid-cols-[1.6fr_1.3fr_repeat(4,0.7fr)] items-center gap-3 border-b px-4 py-2.5 text-[11px] font-medium tracking-wide uppercase lg:grid">
            <span>{t("colProject")}</span>
            <span>{t("colRoadmap")}</span>
            <span>{t("colSpecs")}</span>
            <span>{t("colReports")}</span>
            <span>{t("colClient")}</span>
            <span>{t("colTeam")}</span>
          </div>
          <ul className="divide-line/60 divide-y">
            {rows.map((r) => {
              const pct = r.task_total > 0 ? Math.round((r.task_done / r.task_total) * 100) : 0;
              return (
                <li key={r.id}>
                  <Link
                    href={`/projects/${r.id}`}
                    className="hover:bg-bg-inset grid grid-cols-2 items-center gap-3 px-4 py-3 transition-colors lg:grid-cols-[1.6fr_1.3fr_repeat(4,0.7fr)]"
                  >
                    {/* project */}
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 flex-none rounded-full",
                          STATUS_DOT[r.status] ?? "bg-text-3",
                        )}
                      />
                      <span className="text-text min-w-0 truncate text-[13.5px] font-medium">
                        {r.name}
                      </span>
                      {r.overdue > 0 && (
                        <span className="bg-red-tint text-red-text flex-none rounded-full px-1.5 py-0.5 text-[10.5px] font-medium">
                          {t("overdue", { n: r.overdue })}
                        </span>
                      )}
                    </div>
                    {/* roadmap */}
                    <div className="flex items-center gap-2">
                      <div className="bg-line-1 h-1.5 flex-1 overflow-hidden rounded-full">
                        <div className="bg-blue h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-text-3 flex-none text-[11px]">
                        {r.task_done}/{r.task_total}
                      </span>
                    </div>
                    {/* specs */}
                    <span className="text-text-2 hidden text-[12.5px] lg:block">{r.specs}</span>
                    {/* reports */}
                    <span className="text-text-2 hidden text-[12.5px] lg:block">
                      {r.last_report ? r.last_report.slice(0, 10) : "—"}
                    </span>
                    {/* client (setup + portal) */}
                    <span className="hidden items-center gap-1 text-[12px] lg:flex">
                      <span
                        title="Setup"
                        className={r.has_setup ? "text-green-text" : "text-text-3"}
                      >
                        {r.has_setup ? "✓" : "○"}
                      </span>
                      <span
                        title="Portal"
                        className={r.has_portal ? "text-green-text" : "text-text-3"}
                      >
                        {r.has_portal ? "✓" : "○"}
                      </span>
                    </span>
                    {/* team */}
                    <span className="text-text-2 hidden text-[12.5px] lg:block">{r.members}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
