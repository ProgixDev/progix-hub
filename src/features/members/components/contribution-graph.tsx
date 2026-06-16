import { useTranslations } from "next-intl";
import type { ContributionCalendar, ContributionLevel } from "../types";

const LEVEL_CLASS: Record<ContributionLevel, string> = {
  0: "bg-bg-3",
  1: "bg-green/30",
  2: "bg-green/50",
  3: "bg-green/70",
  4: "bg-green",
};

/**
 * The familiar GitHub contribution heatmap (spec 011 AC-3). Pure + presentational: weeks are
 * columns, days are cells coloured by level. When `calendar` is null the integration isn't
 * configured or the member has no linked GitHub — we say so rather than break.
 */
export function ContributionGraph({ calendar }: { calendar: ContributionCalendar | null }) {
  const t = useTranslations("members");
  if (!calendar) {
    return (
      <p className="text-text-3 border-line/60 rounded-lg border border-dashed px-4 py-6 text-center text-[12.5px]">
        {t("activityUnavailable")}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-text-2 text-[12.5px]">
        {t("contributionsTotal", { count: calendar.total })}
      </p>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {calendar.weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <span
                key={day.date}
                title={`${day.date}: ${day.count}`}
                data-level={day.level}
                className={`size-[11px] flex-none rounded-[2px] ${LEVEL_CLASS[day.level]}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
