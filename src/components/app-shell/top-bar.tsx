"use client";

import { useTranslations } from "next-intl";
import { ClockIcon, CommandIcon, GridIcon } from "@/components/ui/icons";

export function TopBar({
  title,
  userSlot,
  onMenu,
}: {
  title: string;
  userSlot?: React.ReactNode;
  onMenu: () => void;
}) {
  const t = useTranslations("topbar");
  const tNav = useTranslations("nav");
  return (
    <header className="border-line flex h-14 flex-none items-center gap-2 border-b px-3 sm:gap-3 sm:px-5">
      <button
        type="button"
        onClick={onMenu}
        aria-label={tNav("openMenu")}
        className="text-text-2 hover:bg-bg-3 hover:text-text -ml-1 flex size-9 flex-none items-center justify-center rounded-md transition-colors md:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 6h18M3 12h18M3 18h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <GridIcon className="text-text-2 hidden size-[18px] flex-none md:block" />
      <span className="text-text min-w-0 truncate text-[13.5px] font-medium">{title}</span>

      <div className="ml-auto flex flex-none items-center gap-2">
        <button
          type="button"
          className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text hidden h-9 items-center gap-2 rounded-md border px-3 text-[12.5px] font-medium transition-colors sm:flex"
        >
          <CommandIcon className="size-4" />
          <span className="hidden md:inline">{t("commands")}</span>
        </button>
        <button
          type="button"
          aria-label={t("recentActivity")}
          className="text-text-2 hover:bg-bg-3 hover:text-text hidden size-9 items-center justify-center rounded-md transition-colors sm:flex"
        >
          <ClockIcon className="size-[18px]" />
        </button>
        {userSlot ?? (
          <span className="bg-blue-deep border-line-blue text-blue-text flex size-9 items-center justify-center rounded-full border text-[12px] font-semibold">
            AR
          </span>
        )}
      </div>
    </header>
  );
}
