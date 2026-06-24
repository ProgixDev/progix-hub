"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { CommandMenu } from "./command-menu";
import { Sidebar, type RecentProject } from "./sidebar";
import { TopBar } from "./top-bar";

/** Client chrome that owns the mobile nav-drawer state (spec 007). */
export function AppFrame({
  title,
  recent,
  userSlot,
  clockSlot,
  showMembers,
  children,
}: {
  title: string;
  recent: RecentProject[];
  userSlot?: React.ReactNode;
  clockSlot?: React.ReactNode;
  showMembers?: boolean;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="flex h-dvh overflow-hidden">
      <CommandMenu showMembers={showMembers} />
      <Sidebar
        recent={recent}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        showMembers={showMembers}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          userSlot={userSlot}
          clockSlot={clockSlot}
          onMenu={() => setNavOpen(true)}
        />
        <main className="min-h-0 flex-1 overflow-auto">
          <div key={pathname} className="page-enter min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
