import { getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import type { ProjectReport } from "../types";

/** Project page: the project's daily reports, newest first, rendered as safe markdown (spec 021). */
export async function ReportsSection({ reports }: { reports: ProjectReport[] }) {
  const t = await getTranslations("reports");
  return (
    <section className="mx-auto mt-6 w-full max-w-5xl px-4 pb-12 sm:px-6">
      <div className="mb-3">
        <h2 className="text-text text-[15px] font-semibold">{t("sectionTitle")}</h2>
        <p className="text-text-2 text-[12.5px]">{t("sectionSubtitle")}</p>
      </div>

      {reports.length === 0 ? (
        <p className="border-line-1 text-text-3 rounded-2xl border border-dashed px-4 py-8 text-center text-[13px]">
          {t("none")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((r) => (
            <li key={r.id}>
              <details className="glass group rounded-2xl px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="text-text text-[13.5px] font-medium">
                    {r.created_at.slice(0, 10)}
                  </span>
                  <span className="text-text-3 flex items-center gap-2 text-[12px]">
                    {r.author_label}
                    <span className="transition-transform group-open:rotate-90" aria-hidden>
                      ›
                    </span>
                  </span>
                </summary>
                <div className="md-body border-line mt-3 border-t pt-3">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{r.content_md}</ReactMarkdown>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
