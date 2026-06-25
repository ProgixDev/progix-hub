"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  createLinkAction,
  createPlanItemAction,
  createStrokeAction,
  deleteLinkAction,
  deletePlanItemAction,
  groupIntoPhaseAction,
  updatePlanItemAction,
} from "../actions";
import { BLOCK_BY_KEY, checklistFor, DRAG_MIME, monogram } from "../feature-catalog";
import { usePlaygroundStore } from "../provider";
import type { PlanItem, PlanStroke, Status } from "../types";

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
/** A polyline SVG path from flattened [x0,y0,x1,y1,…] sketch points. */
function strokePath(pts: number[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0]} ${pts[1]}`;
  for (let i = 2; i < pts.length; i += 2) d += ` L ${pts[i]} ${pts[i + 1]}`;
  return d;
}

const Card = memo(function Card({
  item,
  selected,
  multi,
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
  multi: boolean;
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
        multi && !selected && "ring-blue ring-2",
        blocked && !selected && !multi && "ring-amber/60 ring-1",
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
      {item.meta?.feature && (
        <div className="mb-2 flex items-center gap-2">
          <span
            className="flex size-7 flex-none items-center justify-center rounded-lg text-[11px] font-bold text-white"
            style={{ background: item.meta.color || "#4c82fb" }}
          >
            {monogram(item.title)}
          </span>
          <span className="border-line-1 text-text-3 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
            {item.meta.category}
          </span>
        </div>
      )}
      {item.type === "task" && !item.meta?.feature && (
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
      {item.type === "task" && item.estimate_hours != null && !item.meta?.feature && (
        <p className="text-text-3 mt-1 font-mono text-[11px]">{item.estimate_hours}h</p>
      )}
      {item.meta?.feature && (item.meta.checklist?.length ?? 0) > 0 && (
        <div className="mt-2">
          <div className="bg-line-1 h-1 w-full overflow-hidden rounded-full">
            <div
              className="bg-blue h-full rounded-full transition-[width]"
              style={{
                width: `${(item.meta.checklist!.filter((c) => c.done).length / item.meta.checklist!.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-text-3 mt-1 text-[10px]">
            {item.meta.checklist!.filter((c) => c.done).length}/{item.meta.checklist!.length} steps
          </p>
        </div>
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
  broadcastDrag,
  broadcastStroke,
  drawMode,
  drawColor,
}: {
  projectId: string;
  broadcastCursor: (x: number, y: number) => void;
  broadcastDrag: (id: string, x: number, y: number) => void;
  broadcastStroke: (stroke: PlanStroke) => void;
  drawMode: boolean;
  drawColor: string;
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
  const addItem = usePlaygroundStore((s) => s.addItem);
  const addStroke = usePlaygroundStore((s) => s.addStroke);
  const addLink = usePlaygroundStore((s) => s.addLink);
  const removeLink = usePlaygroundStore((s) => s.removeLink);
  const multiIds = usePlaygroundStore((s) => s.multiIds);
  const setMulti = usePlaygroundStore((s) => s.setMulti);
  const setViewport = usePlaygroundStore((s) => s.setViewport);
  const zoom = usePlaygroundStore((s) => s.zoom);
  const panX = usePlaygroundStore((s) => s.panX);
  const panY = usePlaygroundStore((s) => s.panY);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tempRef = useRef<SVGPathElement>(null);
  const drawTempRef = useRef<SVGPathElement>(null);
  const lassoRef = useRef<HTMLDivElement>(null);
  const strokes = usePlaygroundStore((s) => s.strokes);
  const multiSet = useMemo(() => new Set(multiIds), [multiIds]);
  const g = useRef<{
    mode: "pan" | "card" | "link" | "lasso" | "draw";
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
    pts?: number[];
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
        broadcastDrag(d.id!, d.cx, d.cy);
      } else if (d.mode === "draw" && d.pts) {
        const x = (e.clientX - d.rectX - panX) / zoom;
        const y = (e.clientY - d.rectY - panY) / zoom;
        const n = d.pts.length;
        const dx = x - d.pts[n - 2]!;
        const dy = y - d.pts[n - 1]!;
        // Skip near-duplicate points to keep strokes light; cap total length.
        if ((dx * dx + dy * dy > 4 || n < 4) && n < 3800) {
          d.pts.push(x, y);
          drawTempRef.current?.setAttribute("d", strokePath(d.pts));
        }
      } else if (d.mode === "link") {
        const tx = (e.clientX - d.rectX - panX) / d.z;
        const ty = (e.clientY - d.rectY - panY) / d.z;
        tempRef.current?.setAttribute("d", pathD(d.ox, d.oy, tx, ty));
      } else if (d.mode === "lasso") {
        d.cx = e.clientX - d.rectX;
        d.cy = e.clientY - d.rectY;
        const el = lassoRef.current;
        if (el) {
          el.style.display = "block";
          el.style.left = `${Math.min(d.ox, d.cx)}px`;
          el.style.top = `${Math.min(d.oy, d.cy)}px`;
          el.style.width = `${Math.abs(d.cx - d.ox)}px`;
          el.style.height = `${Math.abs(d.cy - d.oy)}px`;
        }
      }
    },
    [panX, panY, zoom, redrawLinks, broadcastCursor, broadcastDrag],
  );

  const commitStroke = useCallback(
    (pts: number[]) => {
      const points = pts.map((n) => Math.round(n));
      void createStrokeAction(projectId, { points, color: drawColor, width: 2.5 }).then((res) => {
        if (res.ok) {
          addStroke(res.stroke);
          broadcastStroke(res.stroke);
        }
      });
    },
    [projectId, drawColor, addStroke, broadcastStroke],
  );

  const endGesture = useCallback(
    (e: React.PointerEvent) => {
      const d = g.current;
      g.current = null;
      if (!d) return;
      if (d.mode === "draw") {
        drawTempRef.current?.setAttribute("d", "");
        if (d.pts && d.pts.length >= 4) commitStroke(d.pts);
        return;
      }
      if (d.mode === "pan") {
        if (d.moved) setViewport({ panX: d.cx, panY: d.cy });
        return;
      }
      if (d.mode === "lasso") {
        if (lassoRef.current) lassoRef.current.style.display = "none";
        const cx1 = (Math.min(d.ox, d.cx) - panX) / zoom;
        const cy1 = (Math.min(d.oy, d.cy) - panY) / zoom;
        const cx2 = (Math.max(d.ox, d.cx) - panX) / zoom;
        const cy2 = (Math.max(d.oy, d.cy) - panY) / zoom;
        const hit = items
          .filter((it) => it.type !== "phase")
          .filter(
            (it) =>
              it.pos_x < cx2 &&
              it.pos_x + CARD_W > cx1 &&
              it.pos_y < cy2 &&
              it.pos_y + CARD_H > cy1,
          )
          .map((it) => it.id);
        setMulti(hit);
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
    [
      byId,
      phases,
      patchItem,
      setViewport,
      addLink,
      projectId,
      items,
      panX,
      panY,
      zoom,
      setMulti,
      commitStroke,
    ],
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
      // Draw mode: every empty-canvas drag is a freehand stroke.
      if (drawMode) {
        const rect = surfaceRef.current?.getBoundingClientRect();
        const rx = rect?.left ?? 0;
        const ry = rect?.top ?? 0;
        g.current = {
          mode: "draw",
          z: zoom,
          rectX: rx,
          rectY: ry,
          startX: e.clientX,
          startY: e.clientY,
          ox: 0,
          oy: 0,
          cx: 0,
          cy: 0,
          w: 0,
          h: 0,
          moved: false,
          pts: [(e.clientX - rx - panX) / zoom, (e.clientY - ry - panY) / zoom],
        };
        surfaceRef.current?.setPointerCapture(e.pointerId);
        return;
      }
      // Shift+drag on empty canvas = lasso multi-select; plain drag = pan.
      if (e.shiftKey) {
        const rect = surfaceRef.current?.getBoundingClientRect();
        const rx = rect?.left ?? 0;
        const ry = rect?.top ?? 0;
        g.current = {
          mode: "lasso",
          z: zoom,
          rectX: rx,
          rectY: ry,
          startX: e.clientX,
          startY: e.clientY,
          ox: e.clientX - rx,
          oy: e.clientY - ry,
          cx: e.clientX - rx,
          cy: e.clientY - ry,
          w: 0,
          h: 0,
          moved: false,
        };
        surfaceRef.current?.setPointerCapture(e.pointerId);
        return;
      }
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
    [select, zoom, panX, panY, drawMode],
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
        if (multiIds.length > 0) {
          e.preventDefault();
          for (const id of multiIds) {
            removeItem(id);
            void deletePlanItemAction(id);
          }
          setMulti([]);
        } else if (selectedLinkId) {
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
        setMulti([]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedId,
    selectedLinkId,
    multiIds,
    removeItem,
    removeLink,
    select,
    selectLink,
    focusPhase,
    setMulti,
  ]);

  const commitTitle = useCallback(
    (id: string, title: string) => {
      patchItem(id, { title });
      setEditing(null);
      void updatePlanItemAction(id, { title });
    },
    [patchItem, setEditing],
  );

  function makePhase() {
    const sel = items.filter((i) => multiSet.has(i.id));
    if (sel.length === 0) return;
    const minX = Math.min(...sel.map((i) => i.pos_x));
    const minY = Math.min(...sel.map((i) => i.pos_y));
    const maxX = Math.max(...sel.map((i) => i.pos_x + CARD_W));
    const maxY = Math.max(...sel.map((i) => i.pos_y + CARD_H));
    const box = {
      pos_x: Math.round(minX - 20),
      pos_y: Math.round(minY - 44),
      width: Math.round(Math.max(240, maxX - minX + 40)),
      height: Math.round(Math.max(180, maxY - minY + 64)),
    };
    const childIds = sel.filter((i) => i.type === "task").map((i) => i.id);
    void groupIntoPhaseAction(projectId, childIds, box, "Phase").then((res) => {
      if (!res.ok) return;
      setMulti([]);
      addItem(res.item);
      childIds.forEach((id) => patchItem(id, { parent_id: res.item.id }));
    });
  }

  function bulkDelete() {
    for (const id of multiIds) {
      removeItem(id);
      void deletePlanItemAction(id);
    }
    setMulti([]);
  }

  // A block dropped from the palette becomes a feature card at the drop point, adopted by whatever
  // phase it lands in.
  function dropBlock(e: React.DragEvent) {
    const key = e.dataTransfer.getData(DRAG_MIME);
    const block = key ? BLOCK_BY_KEY.get(key) : undefined;
    if (!block) return;
    e.preventDefault();
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left - panX) / zoom;
    const cy = (e.clientY - rect.top - panY) / zoom;
    const x = Math.round(cx - CARD_W / 2);
    const y = Math.round(cy - CARD_H / 2);
    const parent = items.find(
      (it) =>
        it.type === "phase" &&
        cx >= it.pos_x &&
        cx <= it.pos_x + (it.width ?? PHASE_W) &&
        cy >= it.pos_y &&
        cy <= it.pos_y + (it.height ?? PHASE_H),
    );
    void createPlanItemAction(projectId, {
      type: "task",
      title: block.name,
      pos_x: x,
      pos_y: y,
      parent_id: parent?.id ?? null,
      meta: {
        feature: block.key,
        category: block.category,
        color: block.color,
        checklist: checklistFor(block),
      },
    }).then((res) => {
      if (res.ok) {
        addItem(res.item);
        select(res.item.id);
      }
    });
  }

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "relative min-h-0 flex-1 touch-none overflow-hidden select-none",
        drawMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing",
      )}
      onPointerDown={startPan}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onWheel={onWheel}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_MIME)) e.preventDefault();
      }}
      onDrop={dropBlock}
    >
      <div
        ref={layerRef}
        className="absolute top-0 left-0 origin-top-left [will-change:transform]"
        style={{
          transform: `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`,
          // In draw mode the whole layer is pass-through so strokes land on the surface, over cards.
          pointerEvents: drawMode ? "none" : undefined,
        }}
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
          {/* freehand sketch strokes */}
          {strokes.map((s) => (
            <path
              key={s.id}
              d={strokePath(s.points)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          <path
            ref={drawTempRef}
            d=""
            fill="none"
            stroke={drawColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
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
              multi={multiSet.has(it.id)}
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

      {/* Lasso selection rectangle (screen coords) */}
      <div
        ref={lassoRef}
        className="border-blue bg-blue-tint pointer-events-none absolute z-30 rounded-md border"
        style={{ display: "none" }}
      />

      {/* Bulk action bar for a lasso selection */}
      {multiIds.length > 0 && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="glass-strong absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full py-1.5 pr-2 pl-3 text-[12.5px]"
        >
          <span className="text-text-2">{multiIds.length} selected</span>
          <button
            type="button"
            onClick={makePhase}
            className="btn-primary ml-1 h-8 rounded-full px-3 font-medium transition-all"
          >
            Make phase
          </button>
          <button
            type="button"
            onClick={bulkDelete}
            className="text-red-text hover:bg-red-tint h-8 rounded-full px-3 font-medium transition-colors"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setMulti([])}
            className="text-text-2 hover:text-text h-8 rounded-full px-2"
          >
            Clear
          </button>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-text-3 pointer-events-none absolute inset-0 flex items-center justify-center text-[13px]">
          Add a phase, task, or note to start planning. Shift-drag to select.
        </div>
      )}
    </div>
  );
}
