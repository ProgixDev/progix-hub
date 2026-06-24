"use client";

import { deletePlanItemAction, updatePlanItemAction } from "../actions";
import { usePlaygroundStore } from "../provider";
import { STATUSES, type MemberOption, type PlanItem, type Status } from "../types";

const fieldCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

const STATUS_LABEL: Record<Status, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-text-2 text-[11.5px] font-medium tracking-wide uppercase">{label}</span>
      {children}
    </label>
  );
}

export function Inspector({ assignees }: { assignees: MemberOption[] }) {
  const selectedId = usePlaygroundStore((s) => s.selectedId);
  const items = usePlaygroundStore((s) => s.items);
  const select = usePlaygroundStore((s) => s.select);
  const patchItem = usePlaygroundStore((s) => s.patchItem);
  const removeItem = usePlaygroundStore((s) => s.removeItem);

  const item = items.find((i) => i.id === selectedId) ?? null;
  if (!item) return null;

  function patch(p: Partial<PlanItem>, persist = true) {
    patchItem(item!.id, p);
    if (persist) void updatePlanItemAction(item!.id, p);
  }

  function onDelete() {
    const id = item!.id;
    removeItem(id);
    void deletePlanItemAction(id);
  }

  return (
    <aside className="border-line bg-bg-1/70 absolute inset-y-0 right-0 z-10 flex w-[300px] max-w-[85vw] flex-col gap-4 border-l p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-text-3 font-mono text-[11px] tracking-wide uppercase">
          {item.type}
        </span>
        <button
          type="button"
          onClick={() => select(null)}
          aria-label="Close"
          className="text-text-2 hover:bg-bg-3 hover:text-text flex size-7 items-center justify-center rounded-full text-[18px] leading-none"
        >
          ×
        </button>
      </div>

      <Row label="Title">
        <input
          value={item.title}
          onChange={(e) => patchItem(item.id, { title: e.target.value })}
          onBlur={(e) => void updatePlanItemAction(item.id, { title: e.target.value })}
          className={fieldCls}
          autoFocus
        />
      </Row>

      {item.type === "task" && (
        <>
          <Row label="Status">
            <select
              value={item.status}
              onChange={(e) => patch({ status: e.target.value as Status })}
              className={fieldCls}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Assignee">
            <select
              value={item.assignee ?? ""}
              onChange={(e) => patch({ assignee: e.target.value || null })}
              className={fieldCls}
            >
              <option value="">Unassigned</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Estimate (hours)">
            <input
              type="number"
              min={0}
              step={0.5}
              value={item.estimate_hours ?? ""}
              onChange={(e) =>
                patch({ estimate_hours: e.target.value === "" ? null : Number(e.target.value) })
              }
              className={fieldCls}
            />
          </Row>
        </>
      )}

      {(item.type === "note" || item.type === "task") && (
        <Row label={item.type === "note" ? "Note" : "Details"}>
          <textarea
            value={item.body ?? ""}
            onChange={(e) => patchItem(item.id, { body: e.target.value })}
            onBlur={(e) => void updatePlanItemAction(item.id, { body: e.target.value || null })}
            rows={5}
            className={`${fieldCls} resize-y`}
          />
        </Row>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="border-red/30 text-red-text hover:bg-red-tint mt-auto h-9 rounded-full border text-[13px] font-medium transition-colors"
      >
        Delete
      </button>
    </aside>
  );
}
