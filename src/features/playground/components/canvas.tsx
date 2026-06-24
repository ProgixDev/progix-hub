"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  createLinkAction,
  deleteLinkAction,
  deletePlanItemAction,
  updatePlanItemAction,
} from "../actions";
import { usePlaygroundStore } from "../provider";
import type { PlanItem, Status } from "../types";

const STATUS_DOT: Record<Status, string> = {
  backlog: "bg-text-3",
  in_progress: "bg-blue",
  in_review: "bg-amber",
  done: "bg-green",
};

const CARD_W = 210;
const CARD_H = 96;
const PHASE_W = 360;
const PHASE_H = 280;

function dims(it: PlanItem) {
  if (it.type === "phase") return { w: it.width ?? PHASE_W, h: it.height ?? PHASE_H };
  return { w: CARD_W, h: CARD_H };
}
function pathD(sx: number, sy: number, tx: number, ty: number) {
  const dx = (tx - sx) * 0.5;
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

const Card = memo(function Card({
  item,
  selected,
  dimmed,
  blocked,
  editing,
  onPointerDown,
  onStartLink,
  onStartEdit,
  onCommitTitle,
  remote,
}: {
  item: PlanItem;
  selected: boolean;
  dimmed: boolean;
  blocked: boolean;
  editing: boolean;
  onPointerDown: (e: React.PointerEvent, item: PlanItem) => void;
  onStartLink: (e: React.PointerEvent, item: PlanItem) => void;
  onStartEdit: (item: PlanItem) => void;
  onCommitTitle: (id: string, title: string) => void;
  remote: { color: string; name: string } | null;
}) {
  return (
    <div
      data-card={item.id}
      onPointerDown={(e) => onPointerDown(e, item)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEdit(item);
      }}
      className={cn(
        "group glass absolute top-0 left-0 rounded-xl p-3 [will-change:transform]",
        "shadow-[0_6px_18px_-10px_rgba(0,0,0,0.7)]",
        selected && "ring-blue-ring ring-2",
        blocked && !selected && "ring-amber/60 ring-1",
        dimmed ? "opacity-30" : "opacity-100",
      )}
      style={{
        transform: `translate3d(${item.pos_x}px, ${item.pos_y}px, 0)`,
        width: CARD_W,
        background: item.type === "note" ? "rgba(224,165,59,0.1)" : undefined,
        boxShadow: remote ? `0 0 0 2px ${remote.color}, 0 0 22px -6px ${remote.color}` : undefined,
      }}
    >
      {remote && (
        <span
          className="absolute -top-5 left-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: remote.color }}
        >
          {remote.name}
        </span>
      )}
      {item.type === "task" && (
        <span className={cn("mb-1.5 inline-block size-2 rounded-full", STATUS_DOT[item.status])} />
      )}
      {editing ? (
        <input
          defaultValue={item.title}
          autoFocus
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={(e) => onCommitTitle(item.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="border-line-blue text-text w-full rounded-md border bg-transparent px-1.5 py-0.5 text-[13px] font-medium outline-none"
        />
      ) : (
        <p className="text-text text-[13px] leading-snug font-medium break-words">
          {item.title || (item.type === "note" ? "Note" : "Untitled")}
        </p>
      )}
      {item.type === "task" && item.estimate_hours != null && (
        <p className="text-text-3 mt-1 font-mono text-[11px]">{item.estimate_hours}h</p>
      )}
      {/* connector handle — drag to another card to draw a dependency */}
      <span
        onPointerDown={(e) => onStartLink(e, item)}
        title="Drag to link"
        className="border-blue bg-bg absolute top-1/2 -right-[7px] size-3.5 -translate-y-1/2 cursor-crosshair rounded-full border-2 opacity-0 transition-opacity group-hover:opacity-100"
      />
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

/** Remote collaborators' live cursors (isolated so it re-renders on cursor updates, not the canvas). */
function Cursors() {
  const cursors = usePlaygroundStore((s) => s.cursors);
  const zoom = usePlaygroundStore((s) => s.zoom);
  return (
    <>
      {cursors.map((c) => (
        <div
          key={c.userId}
          className="pointer-events-none absolute top-0 left-0 z-20"
          style={{ transform: `translate3d(${c.x}px, ${c.y}px, 0) scale(${1 / zoom})` }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M1 1 L1 13 L4.6 9.6 L7 14 L9 13 L6.6 8.6 L11 8.6 Z"
              fill={c.color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          <span
            className="-mt-1 ml-3 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: c.color }}
          >
            {c.name}
          </span>
        </div>
      ))}
    </>
  );
}

export function Canvas({
  projectId,
  broadcastCursor,
}: {
  projectId: string;
  broadcastCursor: (x: number, y: number) => void;
}) {
  const items = usePlaygroundStore((s) => s.items);
  const peers = usePlaygroundStore((s) => s.peers);
  const links = usePlaygroundStore((s) => s.links);
  const selectedId = usePlaygroundStore((s) => s.selectedId);
  const selectedLinkId = usePlaygroundStore((s) => s.selectedLinkId);
  const editingId = usePlaygroundStore((s) => s.editingId);
  const focusedPhaseId = usePlaygroundStore((s) => s.focusedPhaseId);
  const select = usePlaygroundStore((s) => s.select);
  const selectLink = usePlaygroundStore((s) => s.selectLink);
  const setEditing = usePlaygroundStore((s) => s.setEditing);
  const focusPhase = usePlaygroundStore((s) => s.focusPhase);
  const patchItem = usePlaygroundStore((s) => s.patchItem);
  const removeItem = usePlaygroundStore((s) => s.removeItem);
  const addLink = usePlaygroundStore((s) => s.addLink);
  const removeLink = usePlaygroundStore((s) => s.removeLink);
  const setViewport = usePlaygroundStore((s) => s.setViewport);
  const zoom = usePlaygroundStore((s) => s.zoom);
  const panX = usePlaygroundStore((s) => s.panX);
  const panY = usePlaygroundStore((s) => s.panY);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tempRef = useRef<SVGPathElement>(null);
  const g = useRef<{
    mode: "pan" | "card" | "link";
    id?: string;
    el?: HTMLElement | null;
    z: number;
    rectX: number;
    rectY: number;
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    cx: number;
    cy: number;
    w: number;
    h: number;
    moved: boolean;
  } | null>(null);

  const phases = items.filter((i) => i.type === "phase");
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const centerOf = useCallback((it: PlanItem) => {
    const d = dims(it);
    return { x: it.pos_x + d.w / 2, y: it.pos_y + d.h / 2 };
  }, []);

  // Tasks blocked by an un-done prerequisite (incoming link from a non-done source).
  const blocked = useMemo(() => {
    const set = new Set<string>();
    for (const l of links) {
      const src = byId.get(l.source_id);
      if (src && src.status !== "done") set.add(l.target_id);
    }
    return set;
  }, [links, byId]);

  const progressOf = useCallback(
    (phaseId: string) => {
      const kids = items.filter((i) => i.parent_id === phaseId && i.type === "task");
      if (kids.length === 0) return 0;
      return Math.round((kids.filter((k) => k.status === "done").length / kids.length) * 100);
    },
    [items],
  );

  const redrawLinks = useCallback(
    (id: string, liveCx: number, liveCy: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      for (const l of links) {
        if (l.source_id !== id && l.target_id !== id) continue;
        const s = l.source_id === id ? { x: liveCx, y: liveCy } : byCenter(l.source_id);
        const t = l.target_id === id ? { x: liveCx, y: liveCy } : byCenter(l.target_id);
        if (!s || !t) continue;
        const d = pathD(s.x, s.y, t.x, t.y);
        svg.querySelector(`[data-link="${l.id}"]`)?.setAttribute("d", d);
        svg.querySelector(`[data-hit="${l.id}"]`)?.setAttribute("d", d);
      }
      function byCenter(itemId: string) {
        const it = byId.get(itemId);
        return it ? centerOf(it) : null;
      }
    },
    [links, byId, centerOf],
  );

  const lastCursorMs = useRef(0);
  const remoteByItem = useMemo(() => {
    const m = new Map<string, { color: string; name: string }>();
    for (const p of peers) if (p.selectedId) m.set(p.selectedId, { color: p.color, name: p.name });
    return m;
  }, [peers]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Broadcast our cursor (throttled) — even when just hovering.
      const now = Date.now();
      if (now - lastCursorMs.current > 45) {
        lastCursorMs.current = now;
        const rect = surfaceRef.current?.getBoundingClientRect();
        if (rect) {
          broadcastCursor(
            (e.clientX - rect.left - panX) / zoom,
            (e.clientY - rect.top - panY) / zoom,
          );
        }
      }
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
        redrawLinks(d.id!, d.cx + d.w / 2, d.cy + d.h / 2);
      } else if (d.mode === "link") {
        const tx = (e.clientX - d.rectX - panX) / d.z;
        const ty = (e.clientY - d.rectY - panY) / d.z;
        tempRef.current?.setAttribute("d", pathD(d.ox, d.oy, tx, ty));
      }
    },
    [panX, panY, zoom, redrawLinks, broadcastCursor],
  );

  const endGesture = useCallback(
    (e: React.PointerEvent) => {
      const d = g.current;
      g.current = null;
      if (!d) return;
      if (d.mode === "pan") {
        if (d.moved) setViewport({ panX: d.cx, panY: d.cy });
        return;
      }
      if (d.mode === "link") {
        tempRef.current?.setAttribute("d", "");
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const targetId = el?.closest<HTMLElement>("[data-card]")?.dataset.card;
        if (targetId && targetId !== d.id) {
          void createLinkAction(projectId, d.id!, targetId).then((res) => {
            if (res.ok) addLink(res.link);
          });
        }
        return;
      }
      if (d.mode === "card" && d.id && d.moved) {
        const it = byId.get(d.id);
        if (!it) return;
        let parent_id = it.parent_id;
        if (it.type === "task") {
          const cx = d.cx + CARD_W / 2;
          const cy = d.cy + CARD_H / 2;
          const host = phases.find((p) => {
            const pd = dims(p);
            return cx >= p.pos_x && cx <= p.pos_x + pd.w && cy >= p.pos_y && cy <= p.pos_y + pd.h;
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
    },
    [byId, phases, patchItem, setViewport, addLink, projectId],
  );

  const startCardDrag = useCallback(
    (e: React.PointerEvent, it: PlanItem) => {
      e.stopPropagation();
      select(it.id);
      const d = dims(it);
      g.current = {
        mode: "card",
        id: it.id,
        el: e.currentTarget as HTMLElement,
        z: zoom,
        rectX: 0,
        rectY: 0,
        startX: e.clientX,
        startY: e.clientY,
        ox: it.pos_x,
        oy: it.pos_y,
        cx: it.pos_x,
        cy: it.pos_y,
        w: d.w,
        h: d.h,
        moved: false,
      };
      surfaceRef.current?.setPointerCapture(e.pointerId);
    },
    [select, zoom],
  );

  const startLink = useCallback(
    (e: React.PointerEvent, it: PlanItem) => {
      e.stopPropagation();
      const rect = surfaceRef.current?.getBoundingClientRect();
      const c = centerOf(it);
      g.current = {
        mode: "link",
        id: it.id,
        z: zoom,
        rectX: rect?.left ?? 0,
        rectY: rect?.top ?? 0,
        startX: e.clientX,
        startY: e.clientY,
        ox: c.x,
        oy: c.y,
        cx: c.x,
        cy: c.y,
        w: 0,
        h: 0,
        moved: false,
      };
      surfaceRef.current?.setPointerCapture(e.pointerId);
    },
    [zoom, centerOf],
  );

  const startPan = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      select(null);
      g.current = {
        mode: "pan",
        z: zoom,
        rectX: 0,
        rectY: 0,
        startX: e.clientX,
        startY: e.clientY,
        ox: panX,
        oy: panY,
        cx: panX,
        cy: panY,
        w: 0,
        h: 0,
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedLinkId) {
          e.preventDefault();
          const id = selectedLinkId;
          removeLink(id);
          void deleteLinkAction(id);
        } else if (selectedId) {
          e.preventDefault();
          const id = selectedId;
          removeItem(id);
          void deletePlanItemAction(id);
        }
      } else if (e.key === "Escape") {
        select(null);
        selectLink(null);
        focusPhase(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selectedLinkId, removeItem, removeLink, select, selectLink, focusPhase]);

  const commitTitle = useCallback(
    (id: string, title: string) => {
      patchItem(id, { title });
      setEditing(null);
      void updatePlanItemAction(id, { title });
    },
    [patchItem, setEditing],
  );

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
        {/* Dependency arrows (behind cards) */}
        <svg
          ref={svgRef}
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          width="1"
          height="1"
        >
          <defs>
            <marker
              id="pg-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10 z" fill="var(--blue)" />
            </marker>
          </defs>
          {links.map((l) => {
            const s = byId.get(l.source_id);
            const t = byId.get(l.target_id);
            if (!s || !t) return null;
            const sc = centerOf(s);
            const tc = centerOf(t);
            const d = pathD(sc.x, sc.y, tc.x, tc.y);
            return (
              <g key={l.id}>
                <path
                  data-hit={l.id}
                  d={d}
                  className="pointer-events-auto cursor-pointer"
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    selectLink(l.id);
                  }}
                />
                <path
                  data-link={l.id}
                  d={d}
                  fill="none"
                  stroke={l.id === selectedLinkId ? "var(--blue-bright)" : "var(--blue)"}
                  strokeWidth={l.id === selectedLinkId ? 2.5 : 1.75}
                  strokeOpacity={0.8}
                  markerEnd="url(#pg-arrow)"
                />
              </g>
            );
          })}
          <path
            ref={tempRef}
            d=""
            fill="none"
            stroke="var(--blue)"
            strokeWidth={1.75}
            strokeDasharray="5 4"
          />
        </svg>

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
              blocked={blocked.has(it.id)}
              editing={editingId === it.id}
              onPointerDown={startCardDrag}
              onStartLink={startLink}
              onStartEdit={(item) => setEditing(item.id)}
              onCommitTitle={commitTitle}
              remote={remoteByItem.get(it.id) ?? null}
            />
          ))}

        <Cursors />
      </div>

      {items.length === 0 && (
        <div className="text-text-3 pointer-events-none absolute inset-0 flex items-center justify-center text-[13px]">
          Add a phase, task, or note to start planning.
        </div>
      )}
    </div>
  );
}
