"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { createPlanItemAction } from "../actions";
import { usePlaygroundPresence } from "../presence";
import { PlaygroundStoreProvider, usePlaygroundStore } from "../provider";
import type { ItemType, MemberOption, PlanItem, PlanLink } from "../types";
import { BlocksCommand, BlocksDrawer } from "./blocks-palette";
import { Board } from "./board";
import { Canvas } from "./canvas";
import { Inspector } from "./inspector";
import { PresenceBar } from "./presence-bar";
import { SnapshotsPanel } from "./snapshots-panel";

type Me = { id: string; name: string; initials: string };

export function Playground({
  projectId,
  projectName,
  backHref,
  items,
  links,
  assignees,
  me,
}: {
  projectId: string;
  projectName: string;
  backHref: string;
  items: PlanItem[];
  links: PlanLink[];
  assignees: MemberOption[];
  me: Me;
}) {
  return (
    <PlaygroundStoreProvider items={items} links={links}>
      <Shell
        projectId={projectId}
        projectName={projectName}
        backHref={backHref}
        assignees={assignees}
        me={me}
      />
    </PlaygroundStoreProvider>
  );
}

function Shell({
  projectId,
  projectName,
  backHref,
  assignees,
  me,
}: {
  projectId: string;
  projectName: string;
  backHref: string;
  assignees: MemberOption[];
  me: Me;
}) {
  const { broadcastCursor, broadcastDrag } = usePlaygroundPresence({ projectId, me });
  const [blocksOpen, setBlocksOpen] = useState(false);
  const lens = usePlaygroundStore((s) => s.lens);
  const setLens = usePlaygroundStore((s) => s.setLens);
  const addItem = usePlaygroundStore((s) => s.addItem);
  const zoom = usePlaygroundStore((s) => s.zoom);
  const panX = usePlaygroundStore((s) => s.panX);
  const panY = usePlaygroundStore((s) => s.panY);
  const setViewport = usePlaygroundStore((s) => s.setViewport);
  const count = usePlaygroundStore((s) => s.items.length);
  const [pending, start] = useTransition();

  function add(type: ItemType) {
    const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 600;
    const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 360;
    // Stagger new items diagonally so they don't stack on the same spot.
    const jitter = (count % 7) * 34;
    const pos_x = (-panX + cx - 150) / zoom + jitter;
    const pos_y = (-panY + cy - 120) / zoom + jitter;
    start(async () => {
      const res = await createPlanItemAction(projectId, {
        type,
        pos_x,
        pos_y,
        ...(type === "phase" ? { width: 360, height: 280 } : {}),
      });
      if (res.ok) {
        addItem(res.item);
        if (lens === "board" && type !== "task") setLens("canvas");
      }
    });
  }

  return (
    <div className="bg-bg text-text fixed inset-0 flex flex-col">
      {/* Top strip */}
      <header className="border-line flex h-14 flex-none items-center gap-3 border-b px-3 sm:px-4">
        <Link
          href={backHref}
          className="text-text-2 hover:bg-bg-3 hover:text-text flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-colors"
        >
          ← <span className="hidden sm:inline">Exit</span>
        </Link>
        <div className="hidden sm:block">
          <Wordmark size={18} />
        </div>
        <span className="text-text min-w-0 truncate text-[13.5px] font-medium">
          {projectName} · Playground
        </span>

        {/* lens toggle */}
        <div className="border-line-1 ml-auto flex items-center gap-0.5 rounded-full border p-0.5">
          {(["canvas", "board"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLens(l)}
              aria-pressed={lens === l}
              className={cn(
                "h-8 rounded-full px-3.5 text-[12.5px] font-medium capitalize transition-colors",
                lens === l ? "bg-blue-tint text-blue-text" : "text-text-2 hover:text-text",
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <PresenceBar />
        <SnapshotsPanel projectId={projectId} />

        {/* add actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setBlocksOpen((v) => !v)}
            aria-pressed={blocksOpen}
            className={cn(
              "hidden h-9 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors sm:flex",
              blocksOpen
                ? "border-line-blue bg-blue-tint text-blue-text"
                : "border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text",
            )}
          >
            ◳ Blocks
          </button>
          <button
            type="button"
            onClick={() => add("task")}
            disabled={pending}
            className="btn-primary flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition-all disabled:opacity-60"
          >
            + Task
          </button>
          <button
            type="button"
            onClick={() => add("note")}
            disabled={pending}
            className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text hidden h-9 items-center rounded-full border px-3 text-[12.5px] font-medium transition-colors sm:flex"
          >
            + Note
          </button>
          <button
            type="button"
            onClick={() => add("phase")}
            disabled={pending}
            className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text hidden h-9 items-center rounded-full border px-3 text-[12.5px] font-medium transition-colors sm:flex"
          >
            + Phase
          </button>
        </div>
      </header>

      <BlocksCommand projectId={projectId} />

      <div className="relative flex min-h-0 flex-1">
        {lens === "canvas" ? (
          <>
            <Canvas
              projectId={projectId}
              broadcastCursor={broadcastCursor}
              broadcastDrag={broadcastDrag}
            />
            <BlocksDrawer open={blocksOpen} onClose={() => setBlocksOpen(false)} />
          </>
        ) : (
          <Board />
        )}
        <Inspector assignees={assignees} />

        {/* zoom reset (canvas only) */}
        {lens === "canvas" && (
          <button
            type="button"
            onClick={() => setViewport({ zoom: 1, panX: 0, panY: 0 })}
            className="border-line-1 bg-bg-2/80 text-text-2 hover:text-text absolute bottom-4 left-4 flex h-9 items-center rounded-full border px-3.5 text-[12px] font-medium backdrop-blur-md transition-colors"
          >
            Reset view · {Math.round(zoom * 100)}%
          </button>
        )}
      </div>
    </div>
  );
}
