"use client";

import Link from "next/link";

export default function Error() {
  return (
    <div className="bg-bg fixed inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-text text-[15px] font-semibold">Couldn’t open the playground</p>
      <Link
        href="/"
        className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all"
      >
        Back to projects
      </Link>
    </div>
  );
}
