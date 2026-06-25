import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ChecklistStatus = {
  projectId: string;
  githubUrl: string | null;
  envCount: number;
  specs: number;
  docs: number;
  reports: number;
  hasSetup: boolean;
  portalActive: boolean;
};

/** Project setup checklist — what's configured (GitHub, env, specs, docs, setup, portal, reports). */
export function ProjectChecklist({ status }: { status: ChecklistStatus }) {
  const t = useTranslations("projects");
  const items: { label: string; done: boolean; detail: string; href?: string }[] = [
    {
      label: t("ck_github"),
      done: !!status.githubUrl,
      detail: status.githubUrl
        ? status.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "")
        : t("ck_todo"),
      href: status.githubUrl ?? undefined,
    },
    {
      label: t("ck_env"),
      done: status.envCount > 0,
      detail: status.envCount > 0 ? t("ck_count", { n: status.envCount }) : t("ck_todo"),
    },
    {
      label: t("ck_specs"),
      done: status.specs > 0,
      detail: status.specs > 0 ? t("ck_count", { n: status.specs }) : t("ck_todo"),
    },
    {
      label: t("ck_docs"),
      done: status.docs > 0,
      detail: status.docs > 0 ? t("ck_count", { n: status.docs }) : t("ck_todo"),
    },
    {
      label: t("ck_setup"),
      done: status.hasSetup,
      detail: status.hasSetup ? t("ck_done") : t("ck_todo"),
    },
    {
      label: t("ck_portal"),
      done: status.portalActive,
      detail: status.portalActive ? t("ck_done") : t("ck_todo"),
      href: `/projects/${status.projectId}/portal`,
    },
    {
      label: t("ck_reports"),
      done: status.reports > 0,
      detail: status.reports > 0 ? t("ck_count", { n: status.reports }) : t("ck_todo"),
    },
  ];
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-2 sm:px-6">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-text text-[15px] font-semibold">{t("checklistTitle")}</h2>
          <span className="text-text-2 text-[12.5px] font-medium">
            {t("checklistConfigured", { done, total: items.length })}
          </span>
        </div>
        <div className="bg-line-1 mt-2.5 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-green h-full rounded-full transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
          {items.map((item) => {
            const inner = (
              <>
                <span
                  className={cn(
                    "grid size-5 flex-none place-items-center rounded-full text-[11px]",
                    item.done
                      ? "bg-green/15 text-green-text"
                      : "border-line-strong text-text-3 border",
                  )}
                >
                  {item.done ? "✓" : ""}
                </span>
                <span className="text-text min-w-0 flex-1 truncate text-[13px]">{item.label}</span>
                <span className="text-text-3 flex-none truncate text-[11.5px]">{item.detail}</span>
              </>
            );
            return (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="hover:bg-bg-inset flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 px-2 py-1.5">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
