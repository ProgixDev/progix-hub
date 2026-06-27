import { useTranslations } from "next-intl";
import type { TimeMember } from "../types";

function hm(s: number): string {
  if (s <= 0) return "0h";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Time insights: per-member hours this week (with a 7-day sparkline) + this month (spec 042). */
export function TimePanel({ rows }: { rows: TimeMember[] }) {
  const t = useTranslations("overview");
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => b.weekSeconds - a.weekSeconds);
  const teamWeek = sorted.reduce((a, r) => a + r.weekSeconds, 0);
  const max = Math.max(1, ...sorted.flatMap((r) => r.weekDaily));

  return (
    <section className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-text text-[15px] font-semibold">{t("timeTitle")}</h2>
          <p className="text-text-3 mt-0.5 text-[12.5px]">{t("timeSubtitle")}</p>
        </div>
        <span className="text-text-3 flex-none text-[12px]">
          {t("teamWeek", { h: hm(teamWeek) })}
        </span>
      </div>
      <ul className="glass divide-line/60 mt-3 divide-y rounded-2xl">
        {sorted.map((r) => (
          <li key={r.userId} className="flex items-center gap-3 px-4 py-2.5">
            <span className="bg-bg-inset text-text-2 grid size-8 flex-none place-items-center rounded-full text-[11px] font-semibold">
              {initials(r.name)}
            </span>
            <span className="text-text min-w-0 flex-1 truncate text-[13.5px] font-medium">
              {r.name}
            </span>
            <span className="hidden h-7 items-end gap-0.5 sm:flex" aria-hidden>
              {r.weekDaily.map((s, i) => (
                <span
                  key={i}
                  className="bg-blue/70 w-1.5 rounded-sm"
                  style={{ height: `${Math.max(3, Math.round((s / max) * 100))}%` }}
                  title={hm(s)}
                />
              ))}
            </span>
            <span className="text-text w-20 flex-none text-right text-[13px] font-medium tabular-nums">
              {hm(r.weekSeconds)}
            </span>
            <span className="text-text-3 hidden w-24 flex-none text-right text-[12px] tabular-nums md:block">
              {t("monthValue", { h: hm(r.monthSeconds) })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
