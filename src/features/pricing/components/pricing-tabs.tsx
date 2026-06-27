"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Tabs across the scoping admin: the feature catalog and the project types. */
export function PricingTabs() {
  const t = useTranslations("pricing");
  const path = usePathname();
  const tabs = [
    { href: "/pricing", label: t("tabFeatures") },
    { href: "/pricing/types", label: t("tabTypes") },
    { href: "/pricing/estimates", label: t("tabEstimates") },
  ];
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6">
      <div className="border-line-1 inline-flex items-center gap-0.5 rounded-full border p-0.5">
        {tabs.map((tb) => {
          const active = tb.href === "/pricing" ? path === "/pricing" : path.startsWith(tb.href);
          return (
            <Link
              key={tb.href}
              href={tb.href}
              className={cn(
                "h-8 rounded-full px-3.5 text-[12.5px] font-medium transition-colors",
                active ? "bg-bg-2 text-text" : "text-text-3 hover:text-text",
              )}
            >
              {tb.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
