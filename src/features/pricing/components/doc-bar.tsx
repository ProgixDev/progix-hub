"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

/** Top action bar for a document page — hidden when printing. */
export function DocBar() {
  const t = useTranslations("estimateDoc");
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-2.5 backdrop-blur print:hidden">
      <Link
        href="/pricing/estimates"
        className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← {t("back")}
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-zinc-900 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-zinc-700"
      >
        {t("print")}
      </button>
    </div>
  );
}
