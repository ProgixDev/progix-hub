"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { updatePlanItemAction } from "../actions";
import { usePlaygroundStore } from "../provider";
import { STATUSES, type Status } from "../types";

const COLUMN_LABEL: Record<Status, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};

const COLUMN_DOT: Record<Status, string> = {
  backlog: "bg-text-3",
  in_progress: "bg-blue",
  in_review: "bg-amber",
  done: "bg-green",
};

export function Board() {
  const items = usePlaygroundStore((s) => s.items);
  const select = usePlaygroundStore((s) => s.select);
  const selectedId = usePlaygroundStore((s) => s.selectedId);
  const patchItem = usePlaygroundStore((s) => s.patchItem);
  const [over, setOver] = useState<Status | null>(null);

  const tasks = items.filter((i) => i.type === "task");

  function drop(status: Status, id: string) {
    setOver(null);
    const it = items.find((i) => i.id === id);
    if (!it || it.status === status) return;
    patchItem(id, { status });
    void updatePlanItemAction(id, { status });
  }

  return (
    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6">
      <div className="flex h-full min-w-fit gap-4">
        {STATUSES.map((status) => {
          const col = tasks.filter((t) => t.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((o) => (o === status ? null : o))}
              onDrop={(e) => drop(status, e.dataTransfer.getData("text/plain"))}
              className={cn(
                "flex h-full w-[280px] flex-none flex-col rounded-2xl border p-3 transition-colors",
                over === status ? "border-line-blue bg-blue-tint/40" : "border-line-1 bg-bg-1/40",
              )}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={cn("size-2 rounded-full", COLUMN_DOT[status])} />
                <span className="text-text-1 text-[13px] font-semibold">
                  {COLUMN_LABEL[status]}
                </span>
                <span className="text-text-3 ml-auto font-mono text-[11px]">{col.length}</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
                {col.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                    onClick={() => select(t.id)}
                    className={cn(
                      "glass cursor-grab rounded-xl p-3 text-left active:cursor-grabbing",
                      t.id === selectedId && "ring-blue-ring ring-2",
                    )}
                  >
                    <p className="text-text text-[13px] leading-snug font-medium break-words">
                      {t.title || "Untitled"}
                    </p>
                    {t.estimate_hours != null && (
                      <p className="text-text-3 mt-1 font-mono text-[11px]">{t.estimate_hours}h</p>
                    )}
                  </button>
                ))}
                {col.length === 0 && (
                  <p className="text-text-3 px-1 py-6 text-center text-[12px]">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
