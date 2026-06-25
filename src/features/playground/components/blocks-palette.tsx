"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { createPlanItemAction } from "../actions";
import {
  checklistFor,
  DRAG_MIME,
  FEATURE_BLOCKS,
  FEATURE_CATEGORIES,
  type FeatureBlock,
  monogram,
} from "../feature-catalog";
import { usePlaygroundStoreApi } from "../provider";

function Tile({ block, size = 28 }: { block: FeatureBlock; size?: number }) {
  return (
    <span
      className="flex flex-none items-center justify-center rounded-lg font-bold text-white"
      style={{ background: block.color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {monogram(block.name)}
    </span>
  );
}

/** Place a card from the focused phase (if any), else into the current viewport. */
function useAddFeatureCard(projectId: string) {
  const storeApi = usePlaygroundStoreApi();
  return (block: FeatureBlock) => {
    const { items, focusedPhaseId, panX, panY, zoom, addItem, select } = storeApi.getState();
    const phase = focusedPhaseId ? items.find((i) => i.id === focusedPhaseId) : null;
    let pos_x: number, pos_y: number;
    if (phase) {
      const siblings = items.filter((i) => i.parent_id === phase.id).length;
      pos_x = phase.pos_x + 20;
      pos_y = phase.pos_y + 54 + siblings * 116;
    } else {
      const stagger = (items.length % 6) * 28;
      pos_x = Math.round(-panX / zoom + 240 + stagger);
      pos_y = Math.round(-panY / zoom + 150 + stagger);
    }
    void createPlanItemAction(projectId, {
      type: "task",
      title: block.name,
      pos_x,
      pos_y,
      parent_id: phase?.id ?? null,
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
  };
}

/** Browsable side drawer: search + category filter; drag a block onto a phase. */
export function BlocksDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const blocks = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FEATURE_BLOCKS.filter(
      (b) =>
        (!cat || b.category === cat) &&
        (!needle ||
          b.name.toLowerCase().includes(needle) ||
          b.category.toLowerCase().includes(needle)),
    );
  }, [q, cat]);

  if (!open) return null;
  return (
    <div className="glass-strong absolute top-0 right-0 z-20 flex h-full w-72 animate-[fade-in_0.15s_ease] flex-col border-l border-[var(--line-1)]">
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <p className="text-text text-[13px] font-semibold">Feature blocks</p>
        <button
          type="button"
          onClick={onClose}
          className="text-text-3 hover:text-text grid size-6 place-items-center rounded-full text-[15px]"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="px-3.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 110+ blocks…"
          className="bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-8 w-full rounded-full border px-3 text-[12.5px] outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-1 px-3.5 py-2">
        <button
          type="button"
          onClick={() => setCat(null)}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10.5px] font-medium transition-colors",
            cat === null
              ? "border-line-blue text-blue-text bg-blue-tint"
              : "border-line-1 text-text-3 hover:text-text",
          )}
        >
          All
        </button>
        {FEATURE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c === cat ? null : c)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10.5px] font-medium transition-colors",
              cat === c
                ? "border-line-blue text-blue-text bg-blue-tint"
                : "border-line-1 text-text-3 hover:text-text",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        {blocks.map((b) => (
          <div
            key={b.key}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_MIME, b.key);
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="hover:bg-bg-inset flex cursor-grab items-center gap-2.5 rounded-lg px-2 py-1.5 active:cursor-grabbing"
          >
            <Tile block={b} />
            <div className="min-w-0">
              <p className="text-text truncate text-[12.5px] font-medium">{b.name}</p>
              <p className="text-text-3 text-[10.5px]">{b.category}</p>
            </div>
          </div>
        ))}
        {blocks.length === 0 && (
          <p className="text-text-3 px-2 py-6 text-center text-[12px]">No blocks match.</p>
        )}
      </div>
      <p className="text-text-3 border-t border-[var(--line-1)] px-3.5 py-2 text-[10.5px]">
        Drag a block onto a phase — or press <kbd className="text-text">⌘K</kbd>.
      </p>
    </div>
  );
}

/** Command palette: ⌘K → type → Enter adds a block into the focused phase or the viewport. */
export function BlocksCommand({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const add = useAddFeatureCard(projectId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setI(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? FEATURE_BLOCKS.filter(
          (b) => b.name.toLowerCase().includes(needle) || b.category.toLowerCase().includes(needle),
        )
      : FEATURE_BLOCKS;
    return list.slice(0, 50);
  }, [q]);

  if (!open || typeof document === "undefined") return null;
  const pick = (b: FeatureBlock | undefined) => {
    if (!b) return;
    add(b);
    setOpen(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[18vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-strong w-full max-w-md overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setI(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setI((p) => Math.min(p + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setI((p) => Math.max(p - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(results[i]);
            }
          }}
          placeholder="Add a feature block…"
          className="text-text placeholder:text-text-3 h-12 w-full border-b border-[var(--line-1)] bg-transparent px-4 text-[14px] outline-none"
        />
        <div className="max-h-[46vh] overflow-y-auto p-1.5">
          {results.map((b, idx) => (
            <button
              key={b.key}
              type="button"
              onMouseEnter={() => setI(idx)}
              onClick={() => pick(b)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left",
                idx === i ? "bg-bg-inset" : "",
              )}
            >
              <Tile block={b} size={24} />
              <span className="text-text flex-1 text-[13px] font-medium">{b.name}</span>
              <span className="text-text-3 text-[11px]">{b.category}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="text-text-3 px-3 py-6 text-center text-[12.5px]">No blocks match.</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
