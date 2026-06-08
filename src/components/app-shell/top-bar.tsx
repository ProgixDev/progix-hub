"use client";

import { ClockIcon, CommandIcon, GridIcon } from "@/components/ui/icons";

export function TopBar({ title, userSlot }: { title: string; userSlot?: React.ReactNode }) {
  return (
    <header className="border-line flex h-14 flex-none items-center gap-3 border-b px-5">
      <GridIcon className="text-text-2 size-[18px]" />
      <span className="text-text truncate text-[13.5px] font-medium">{title}</span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text flex h-9 items-center gap-2 rounded-md border px-3 text-[12.5px] font-medium transition-colors"
        >
          <CommandIcon className="size-4" />
          Commands
        </button>
        <button
          type="button"
          aria-label="Recent activity"
          className="text-text-2 hover:bg-bg-3 hover:text-text flex size-9 items-center justify-center rounded-md transition-colors"
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
