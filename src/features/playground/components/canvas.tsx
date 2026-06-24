"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { deletePlanItemAction, updatePlanItemAction } from "../actions";
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

/** Memoized card — only re-renders when its own item/selected/dimmed change (not on every drag frame). */
const Card = memo(function Card({
  item,
  selected,
  dimmed,
  onPointerDown,
}: {
  item: PlanItem;
  selected: boolean;
  dimmed: boolean;
  onPointerDown: (e: React.PointerEvent, item: PlanItem) => void;
}) {
  return (
    <div
      data-card={item.id}
      onPointerDown={(e) => onPointerDown(e, item)}
      className={cn(
        "glass absolute top-0 left-0 rounded-xl p-3 [will-change:transform]",
        "shadow-[0_6px_18px_-10px_rgba(0,0,0,0.7)]",
        selected && "ring-blue-ring ring-2",
        dimmed ? "opacity-30" : "opacity-100",
      )}
      style={{
        transform: `translate3d(${item.pos_x}px, ${item.pos_y}px, 0)`,
        width: CARD_W,
        background: item.type === "note" ? "rgba(224,165,59,0.1)" : undefined,
      }}
    >
      {item.type === "task" && (
        <span className={cn("mb-1.5 inline-block size-2 rounded-full", STATUS_DOT[item.status])} />
      )}
      <p className="text-text text-[13px] leading-snug font-medium break-words">
        {item.title || (item.type === "note" ? "Note" : "Untitled")}
      </p>
      {item.type === "task" && item.estimate_hours != null && (
        <p className="text-text-3 mt-1 font-mono text-[11px]">{item.estimate_hours}h</p>
      )}
    </div>
  );
});

const PhaseFrame = memo(function PhaseFrame({
  item,
  selected,
  dimmed,
  progress,
  onPointerDown,
  onDoubleClick,
}: {
  item: PlanItem;
  selected: boolean;
  dimmed: boolean;
  progress: number;
  onPointerDown: (e: React.PointerEvent, item: PlanItem) => void;
  onDoubleClick: (item: PlanItem) => void;
}) {
  return (
    <div
      data-card={item.id}
      onPointerDown={(e) => onPointerDown(e, item)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(item);
      }}
      className={cn(
        "absolute top-0 left-0 rounded-2xl border border-dashed [will-change:transform]",
        selected ? "border-line-blue" : "border-line-strong",
        dimmed ? "opacity-30" : "opacity-100",
      )}
      style={{
        transform: `translate3d(${item.pos_x}px, ${item.pos_y}px, 0)`,
        width: item.width ?? PHASE_W,
        height: item.height ?? PHASE_H,
        background: "rgba(76,130,251,0.04)",
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <span className="text-text-1 truncate text-[12.5px] font-semibold">
          {item.title || "Phase"}
        </span>
        <span className="text-text-3 font-mono text-[11px]">{progress}%</span>
      </div>
      <div className="bg-bg-3 mx-3 mt-1.5 h-1 overflow-hidden rounded-full">
        <div className="bg-blue h-full rounded-full" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
});

export function Canvas() {
  const items = usePlaygroundStore((s) => s.items);
  const selectedId = usePlaygroundStore((s) => s.selectedId);
  const focusedPhaseId = usePlaygroundStore((s) => s.focusedPhaseId);
  const select = usePlaygroundStore((s) => s.select);
  const focusPhase = usePlaygroundStore((s) => s.focusPhase);
  const patchItem = usePlaygroundStore((s) => s.patchItem);
  const removeItem = usePlaygroundStore((s) => s.removeItem);
  const setViewport = usePlaygroundStore((s) => s.setViewport);
  const zoom = usePlaygroundStore((s) => s.zoom);
  const panX = usePlaygroundStore((s) => s.panX);
  const panY = usePlaygroundStore((s) => s.panY);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  // Live gesture scratch — mutated per pointer move WITHOUT setState (no re-render mid-drag).
  const g = useRef<{
    mode: "pan" | "card";
    id?: string;
    el?: HTMLElement | null;
    z: number;
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    cx: number;
    cy: number;
    moved: boolean;
  } | null>(null);

  const phases = items.filter((i) => i.type === "phase");

  const progressOf = useCallback(
    (phaseId: string) => {
      const kids = items.filter((i) => i.parent_id === phaseId && i.type === "task");
      if (kids.length === 0) return 0;
      return Math.round((kids.filter((k) => k.status === "done").length / kids.length) * 100);
    },
    [items],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = g.current;
    if (!d) return;
    d.moved = true;
    if (d.mode === "pan") {
      d.cx = d.ox + (e.clientX - d.startX);
      d.cy = d.oy + (e.clientY - d.startY);
      if (layerRef.current)
        layerRef.current.style.transform = `translate3d(${d.cx}px, ${d.cy}px, 0) scale(${d.z})`;
    } else if (d.mode === "card" && d.el) {
      d.cx = d.ox + (e.clientX - d.startX) / d.z;
      d.cy = d.oy + (e.clientY - d.startY) / d.z;
      d.el.style.transform = `translate3d(${d.cx}px, ${d.cy}px, 0)`;
    }
  }, []);

  const endGesture = useCallback(() => {
    const d = g.current;
    g.current = null;
    if (!d) return;
    if (d.mode === "pan") {
      if (d.moved) setViewport({ panX: d.cx, panY: d.cy });
      return;
    }
    if (d.mode === "card" && d.id) {
      if (!d.moved) return; // a click, not a drag
      const it = items.find((i) => i.id === d.id);
      if (!it) return;
      let parent_id = it.parent_id;
      if (it.type === "task") {
        const cx = d.cx + CARD_W / 2;
        const cy = d.cy + 48;
        const host = phases.find((p) => {
          const w = p.width ?? PHASE_W;
          const h = p.height ?? PHASE_H;
          return cx >= p.pos_x && cx <= p.pos_x + w && cy >= p.pos_y && cy <= p.pos_y + h;
        });
        parent_id = host?.id ?? null;
      }
      patchItem(d.id, { pos_x: Math.round(d.cx), pos_y: Math.round(d.cy), parent_id });
      void updatePlanItemAction(d.id, {
        pos_x: Math.round(d.cx),
        pos_y: Math.round(d.cy),
        ...(it.type === "task" ? { parent_id } : {}),
      });
    }
  }, [items, phases, patchItem, setViewport]);

  const startCardDrag = useCallback(
    (e: React.PointerEvent, it: PlanItem) => {
      e.stopPropagation();
      select(it.id);
      g.current = {
        mode: "card",
        id: it.id,
        el: e.currentTarget as HTMLElement,
        z: zoom,
        startX: e.clientX,
        startY: e.clientY,
        ox: it.pos_x,
        oy: it.pos_y,
        cx: it.pos_x,
        cy: it.pos_y,
        moved: false,
      };
      surfaceRef.current?.setPointerCapture(e.pointerId);
    },
    [select, zoom],
  );

  const startPan = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      select(null);
      g.current = {
        mode: "pan",
        z: zoom,
        startX: e.clientX,
        startY: e.clientY,
        ox: panX,
        oy: panY,
        cx: panX,
        cy: panY,
        moved: false,
      };
      surfaceRef.current?.setPointerCapture(e.pointerId);
    },
    [select, zoom, panX, panY],
  );

  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) {
      setViewport({ panX: panX - e.deltaX, panY: panY - e.deltaY });
      return;
    }
    const rect = surfaceRef.current?.getBoundingClientRect();
    const ox = e.clientX - (rect?.left ?? 0);
    const oy = e.clientY - (rect?.top ?? 0);
    const next = Math.min(2, Math.max(0.35, zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
    setViewport({
      zoom: next,
      panX: ox - ((ox - panX) * next) / zoom,
      panY: oy - ((oy - panY) * next) / zoom,
    });
  }

  // Keyboard: Delete removes the selected card; Escape clears selection/focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        const id = selectedId;
        removeItem(id);
        void deletePlanItemAction(id);
      } else if (e.key === "Escape") {
        select(null);
        focusPhase(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, removeItem, select, focusPhase]);

  return (
    <div
      ref={surfaceRef}
      className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing"
      onPointerDown={startPan}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onWheel={onWheel}
    >
      <div
        ref={layerRef}
        className="absolute top-0 left-0 origin-top-left [will-change:transform]"
        style={{ transform: `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})` }}
      >
        {phases.map((p) => (
          <PhaseFrame
            key={p.id}
            item={p}
            selected={p.id === selectedId}
            dimmed={Boolean(focusedPhaseId && focusedPhaseId !== p.id)}
            progress={progressOf(p.id)}
            onPointerDown={startCardDrag}
            onDoubleClick={(it) => focusPhase(focusedPhaseId === it.id ? null : it.id)}
          />
        ))}
        {items
          .filter((i) => i.type !== "phase")
          .map((it) => (
            <Card
              key={it.id}
              item={it}
              selected={it.id === selectedId}
              dimmed={Boolean(focusedPhaseId && it.parent_id !== focusedPhaseId)}
              onPointerDown={startCardDrag}
            />
          ))}
      </div>

      {items.length === 0 && (
        <div className="text-text-3 pointer-events-none absolute inset-0 flex items-center justify-center text-[13px]">
          Add a phase, task, or note to start planning.
        </div>
      )}
    </div>
  );
}
