import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { WorkloadRow } from "../types";

const STATE_TONE: Record<WorkloadRow["state"], string> = {
  working: "bg-green",
  paused: "bg-amber",
  off: "bg-text-3",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function hours(s: number): string {
  if (s <= 0) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Team workload: each member's clock state + hours today + open assigned tasks (spec 037). */
export function WorkloadPanel({ rows }: { rows: WorkloadRow[] }) {
  const t = useTranslations("overview");
  if (rows.length === 0) return null;
  // Most-loaded first, then those currently working.
  const sorted = [...rows].sort(
    (a, b) => b.openTasks - a.openTasks || b.secondsToday - a.secondsToday,
  );
  return (
    <section className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6">
      <h2 className="text-text text-[15px] font-semibold">{t("workloadTitle")}</h2>
      <p className="text-text-3 mt-0.5 text-[12.5px]">{t("workloadSubtitle")}</p>
      <ul className="glass divide-line/60 mt-3 divide-y rounded-2xl">
        {sorted.map((r) => (
          <li key={r.userId} className="flex items-center gap-3 px-4 py-2.5">
            <span className="bg-bg-inset text-text-2 grid size-8 flex-none place-items-center rounded-full text-[11px] font-semibold">
              {initials(r.name)}
            </span>
            <span className="text-text min-w-0 flex-1 truncate text-[13.5px] font-medium">
              {r.name}
            </span>
            <span className="flex flex-none items-center gap-1.5 text-[12px]">
              <span className={cn("size-2 rounded-full", STATE_TONE[r.state])} />
              <span className="text-text-3">
                {t(`state_${r.state}` as "state_off")} · {hours(r.secondsToday)}
              </span>
            </span>
            <span className="text-text-2 w-20 flex-none text-right text-[12.5px]">
              {t("openTasks", { n: r.openTasks })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
