import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");
  return (
    <div className="text-text-3 mx-auto w-full max-w-5xl px-6 py-12 text-[13px]">
      {t("loading")}
    </div>
  );
}
