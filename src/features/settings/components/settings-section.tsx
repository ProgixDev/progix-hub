import { getTranslations } from "next-intl/server";
import { getServerPrefs } from "@/lib/settings/server";
import { SettingsControls } from "./settings-controls";

/** The Settings page body (spec 005): language + theme, seeded with the member's current prefs. */
export async function SettingsSection() {
  const t = await getTranslations("settings");
  const prefs = await getServerPrefs();
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-text text-[20px] font-semibold">{t("title")}</h1>
      <p className="text-text-3 mt-1 text-[13px]">{t("subtitle")}</p>
      <div className="glass mt-8 rounded-2xl p-4 sm:p-6">
        <SettingsControls current={prefs} />
      </div>
    </section>
  );
}
