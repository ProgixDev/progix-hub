import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ActivityEvent } from "../types";

const KIND_GLYPH: Record<string, string> = {
  report: "📝",
  setup: "🚀",
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

/** The activity feed page body: events grouped by day, each linking to its project. */
export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const t = useTranslations("activity");

  const groups: { day: string; items: ActivityEvent[] }[] = [];
  for (const e of events) {
    const day = dayKey(e.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <p className="t-eyebrow">{t("eyebrow")}</p>
      <h1 className="text-text text-[26px] font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-text-3 mt-1 text-[13px]">{t("subtitle")}</p>

      {events.length === 0 ? (
        <div className="border-line-1 mt-6 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-text-3 text-[13px]">{t("empty")}</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.day}>
              <p className="text-text-3 mb-2 text-[11.5px] font-medium tracking-wide uppercase">
                {group.day}
              </p>
              <ul className="glass divide-line/60 divide-y rounded-2xl">
                {group.items.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/projects/${e.project_id}`}
                      className="hover:bg-bg-inset flex items-center gap-3 px-3.5 py-3 transition-colors"
                    >
                      <span className="bg-bg-inset grid size-8 flex-none place-items-center rounded-full text-[14px]">
                        {KIND_GLYPH[e.kind] ?? "•"}
                      </span>
                      <span className="min-w-0 flex-1 text-[13px]">
                        <span className="text-text font-medium">{e.actor_label}</span>{" "}
                        <span className="text-text-2">{e.summary}</span>{" "}
                        <span className="text-text-3">· {e.project_name}</span>
                      </span>
                      <span className="text-text-3 flex-none text-[11.5px]">
                        {e.created_at.slice(11, 16)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
