import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");
  return (
    <div className="bg-bg text-text-2 flex h-dvh items-center justify-center text-[13.5px]">
      <span className="inline-flex items-center gap-2">
        <span className="border-line-strong size-4 animate-spin rounded-full border-2 border-t-[var(--blue)]" />
        {t("loading")}
      </span>
    </div>
  );
}
