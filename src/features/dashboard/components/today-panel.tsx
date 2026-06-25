import { useTranslations } from "next-intl";
import Link from "next/link";
import type { MyTask, RecentReport } from "../types";

const STATUS_DOT: Record<string, string> = {
  backlog: "bg-text-3",
  in_progress: "bg-blue",
  in_review: "bg-amber",
  done: "bg-green",
};

/** Personalised "Today" strip on the home page: what's assigned to me + the team's recent reports. */
export function TodayPanel({
  name,
  tasks,
  reports,
}: {
  name: string | null;
  tasks: MyTask[];
  reports: RecentReport[];
}) {
  const t = useTranslations("dashboard");
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
      <p className="t-eyebrow">{t("eyebrow")}</p>
      <h1 className="text-text text-[26px] font-semibold tracking-tight">
        {name ? t("welcomeName", { name }) : t("welcome")}
      </h1>

      <div className="stagger mt-5 grid gap-4 lg:grid-cols-2">
        {/* Assigned to me */}
        <div className="glass rounded-2xl p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-text text-[14px] font-semibold">{t("myTasks")}</h2>
            <span className="border-line-1 text-text-2 rounded-full border px-2 py-0.5 text-[11px] font-medium">
              {tasks.length}
            </span>
          </div>
          {tasks.length === 0 ? (
            <p className="text-text-3 py-6 text-center text-[12.5px]">{t("noTasks")}</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {tasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/projects/${task.project_id}/playground`}
                    className="hover:bg-bg-inset group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors"
                  >
                    <span
                      className={`size-2 flex-none rounded-full ${STATUS_DOT[task.status] ?? "bg-text-3"}`}
                    />
                    <span className="text-text min-w-0 flex-1 truncate text-[13px]">
                      {task.title}
                    </span>
                    <span className="text-text-3 flex-none text-[11.5px]">{task.project_name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent reports */}
        <div className="glass rounded-2xl p-4">
          <h2 className="text-text mb-2.5 text-[14px] font-semibold">{t("recentReports")}</h2>
          {reports.length === 0 ? (
            <p className="text-text-3 py-6 text-center text-[12.5px]">{t("noReports")}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {reports.map((report) => (
                <li key={report.id}>
                  <Link
                    href={`/projects/${report.project_id}`}
                    className="hover:bg-bg-inset block rounded-lg px-2 py-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-text truncate text-[12.5px] font-medium">
                        {report.project_name}
                      </span>
                      <span className="text-text-3 flex-none text-[11px]">
                        {report.created_at.slice(0, 10)}
                      </span>
                    </div>
                    {report.snippet && (
                      <p className="text-text-3 mt-0.5 line-clamp-1 text-[12px]">
                        {report.snippet}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
