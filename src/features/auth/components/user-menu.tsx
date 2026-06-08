"use client";

import { useState } from "react";
import { signOutAction } from "../actions";

/** Avatar button with a small popover holding the signed-in identity + Sign out. */
export function UserMenu({
  initials,
  name,
  email,
}: {
  initials: string;
  name: string | null;
  email: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="bg-blue-deep border-line-blue text-blue-text flex size-9 items-center justify-center rounded-full border text-[12px] font-semibold"
      >
        {initials}
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="bg-popover border-line-1 absolute right-0 z-20 mt-2 w-56 rounded-lg border p-1.5 shadow-xl">
            <div className="px-2.5 py-2">
              <p className="text-text truncate text-[13px] font-medium">{name ?? "Signed in"}</p>
              {email && <p className="text-text-2 truncate text-[12px]">{email}</p>}
            </div>
            <div className="bg-line my-1 h-px" />
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-text-1 hover:bg-bg-3 hover:text-text flex h-9 w-full items-center rounded-md px-2.5 text-[13px] transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
