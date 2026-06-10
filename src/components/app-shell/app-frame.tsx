"use client";

import { useState } from "react";
import { Sidebar, type RecentProject } from "./sidebar";
import { TopBar } from "./top-bar";

/** Client chrome that owns the mobile nav-drawer state (spec 007). */
export function AppFrame({
  title,
  recent,
  userSlot,
  children,
}: {
  title: string;
  recent: RecentProject[];
  userSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="bg-bg flex h-dvh overflow-hidden">
      <Sidebar recent={recent} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} userSlot={userSlot} onMenu={() => setNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
