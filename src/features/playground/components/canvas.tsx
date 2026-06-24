"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { updatePlanItemAction } from "../actions";
import { usePlaygroundStore } from "../provider";
import type { PlanItem, Status } from "../types";

const STATUS_DOT: Record<Status, string> = {
  backlog: "bg-text-3",
  in_progress: "bg-blue",
  in_review: "bg-amber",
  done: "bg-green",
};

const CARD_W = 210;
const PHASE_W = 360;
const PHASE_H = 280;

/** Center point of an item's box (cards use CARD_W; phases use their width/height). */
function centerOf(it: PlanItem) {
  const w = it.type === "phase" ? (it.width ?? PHASE_W) : CARD_W;
  const h = it.type === "phase" ? (it.height ?? PHASE_H) : 96;
  return { cx: it.pos_x + w / 2, cy: it.pos_y + h / 2 };
}

export function Canvas() {
  const items = usePlaygroundStore((s) => s.items);
  const selectedId = usePlaygroundStore((s) => s.selectedId);
  const focusedPhaseId = usePlaygroundStore((s) => s.focusedPhaseId);
  const select = usePlaygroundStore((s) => s.select);
  const focusPhase = usePlaygroundStore((s) => s.focusPhase);
  const patchItem = usePlaygroundStore((s) => s.patchItem);
  const setViewport = usePlaygroundStore((s) => s.setViewport);
  const zoom = usePlaygroundStore((s) => s.zoom);
  const panX = usePlaygroundStore((s) => s.panX);
  const panY = usePlaygroundStore((s) => s.panY);

  const surfaceRef = useRef<HTMLDivElement>(null);
  // Mutable drag scratch (avoids re-render per pointer move for the gesture bookkeeping).
  const drag = useRef<{
    mode: "pan" | "card";
    id?: string;
    startX: number;
    startY: number;
    orig: number;
    orig2: number;
  } | null>(null);

  const phases = items.filter((i) => i.type === "phase");

  function progressOf(phaseId: string) {
    const kids = items.filter((i) => i.parent_id === phaseId && i.type === "task");
    if (kids.length === 0) return 0;
    return Math.round((kids.filter((k) => k.status === "done").length / kids.length) * 100);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (d.mode === "pan") {
      setViewport({
        panX: d.orig + (e.clientX - d.startX),
        panY: d.orig2 + (e.clientY - d.startY),
      });
    } else if (d.mode === "card" && d.id) {
      patchItem(d.id, {
        pos_x: d.orig + (e.clientX - d.startX) / zoom,
        pos_y: d.orig2 + (e.clientY - d.startY) / zoom,
      });
    }
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d || d.mode !== "card" || !d.id) return;
    const it = items.find((i) => i.id === d.id);
    if (!it) return;
    // Drop-into-phase: a task whose center lands in a phase frame belongs to it.
    let parent_id = it.parent_id;
    if (it.type === "task") {
      const c = centerOf(it);
      const host = phases.find((p) => {
        const w = p.width ?? PHASE_W;
        const h = p.height ?? PHASE_H;
        return c.cx >= p.pos_x && c.cx <= p.pos_x + w && c.cy >= p.pos_y && c.cy <= p.pos_y + h;
      });
      parent_id = host?.id ?? null;
      if (parent_id !== it.parent_id) patchItem(it.id, { parent_id });
    }
    void updatePlanItemAction(it.id, {
      pos_x: Math.round(it.pos_x),
      pos_y: Math.round(it.pos_y),
      ...(it.type === "task" ? { parent_id } : {}),
    });
  }

  function startCardDrag(e: React.PointerEvent, it: PlanItem) {
    e.stopPropagation();
    select(it.id);
    drag.current = {
      mode: "card",
      id: it.id,
      startX: e.clientX,
      startY: e.clientY,
      orig: it.pos_x,
      orig2: it.pos_y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function startPan(e: React.PointerEvent) {
    if (e.button !== 0) return;
    select(null);
    drag.current = { mode: "pan", startX: e.clientX, startY: e.clientY, orig: panX, orig2: panY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) {
      setViewport({ panX: panX - e.deltaX, panY: panY - e.deltaY });
      return;
    }
    const rect = surfaceRef.current?.getBoundingClientRect();
    const ox = e.clientX - (rect?.left ?? 0);
    const oy = e.clientY - (rect?.top ?? 0);
    const next = Math.min(2, Math.max(0.35, zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
    // keep the cursor point stable while zooming
    setViewport({
      zoom: next,
      panX: ox - ((ox - panX) * next) / zoom,
      panY: oy - ((oy - panY) * next) / zoom,
    });
  }

  return (
    <div
      ref={surfaceRef}
      className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      onPointerDown={startPan}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
      >
        {/* Phase frames (behind cards) */}
        {phases.map((p) => {
          const dim = focusedPhaseId && focusedPhaseId !== p.id;
          return (
            <div
              key={p.id}
              onPointerDown={(e) => startCardDrag(e, p)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                focusPhase(focusedPhaseId === p.id ? null : p.id);
              }}
              className={cn(
                "absolute rounded-2xl border border-dashed transition-opacity",
                p.id === selectedId ? "border-line-blue" : "border-line-strong",
                dim ? "opacity-30" : "opacity-100",
              )}
              style={{
                left: p.pos_x,
                top: p.pos_y,
                width: p.width ?? PHASE_W,
                height: p.height ?? PHASE_H,
                background: "rgba(76,130,251,0.04)",
              }}
            >
              <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
                <span className="text-text-1 truncate text-[12.5px] font-semibold">
                  {p.title || "Phase"}
                </span>
                <span className="text-text-3 font-mono text-[11px]">{progressOf(p.id)}%</span>
              </div>
              <div className="bg-bg-3 mx-3 mt-1.5 h-1 overflow-hidden rounded-full">
                <div
                  className="bg-blue h-full rounded-full"
                  style={{ width: `${progressOf(p.id)}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Cards: tasks + notes */}
        {items
          .filter((i) => i.type !== "phase")
          .map((it) => {
            const dim = focusedPhaseId && it.parent_id !== focusedPhaseId;
            return (
              <div
                key={it.id}
                onPointerDown={(e) => startCardDrag(e, it)}
                className={cn(
                  "glass absolute rounded-xl p-3 shadow-[0_6px_18px_-10px_rgba(0,0,0,0.7)] transition-opacity",
                  it.id === selectedId && "ring-blue-ring ring-2",
                  dim ? "opacity-30" : "opacity-100",
                )}
                style={{
                  left: it.pos_x,
                  top: it.pos_y,
                  width: CARD_W,
                  background: it.type === "note" ? "rgba(224,165,59,0.1)" : undefined,
                }}
              >
                {it.type === "task" && (
                  <span
                    className={cn("mb-1.5 inline-block size-2 rounded-full", STATUS_DOT[it.status])}
                  />
                )}
                <p className="text-text text-[13px] leading-snug font-medium break-words">
                  {it.title || (it.type === "note" ? "Note" : "Untitled")}
                </p>
                {it.type === "task" && it.estimate_hours != null && (
                  <p className="text-text-3 mt-1 font-mono text-[11px]">{it.estimate_hours}h</p>
                )}
              </div>
            );
          })}
      </div>

      {items.length === 0 && (
        <div className="text-text-3 pointer-events-none absolute inset-0 flex items-center justify-center text-[13px]">
          Add a phase, task, or note to start planning.
        </div>
      )}
    </div>
  );
}
