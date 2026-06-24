"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import {
  createSnapshotAction,
  deleteSnapshotAction,
  listSnapshotsAction,
  restoreSnapshotAction,
} from "../actions";
import { usePlaygroundStore } from "../provider";
import type { PlanSnapshot } from "../types";

const fieldCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-9 w-full rounded-full border px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 8v4l2.5 2.5M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4 4v3h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Snapshots / save-states for the plan — save the current plan, restore or delete a version. */
export function SnapshotsPanel({ projectId }: { projectId: string }) {
  const replaceAll = usePlaygroundStore((s) => s.replaceAll);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<PlanSnapshot[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function refresh() {
    return listSnapshotsAction(projectId).then(setList);
  }

  function openPanel() {
    start(async () => {
      await refresh();
      setLabel("");
      setOpen(true);
    });
  }

  function save() {
    start(async () => {
      const res = await createSnapshotAction(projectId, label.trim() || "Snapshot");
      if (res.ok) {
        setLabel("");
        await refresh();
      }
    });
  }

  function restore(id: string) {
    setBusy(id);
    start(async () => {
      const res = await restoreSnapshotAction(projectId, id);
      setBusy(null);
      if (res.ok) {
        replaceAll(res.items, res.links);
        setOpen(false);
      }
    });
  }

  function remove(id: string) {
    setBusy(id);
    start(async () => {
      await deleteSnapshotAction(id);
      setBusy(null);
      await refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label="Snapshots"
        title="Snapshots"
        className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text flex size-9 items-center justify-center rounded-full border transition-colors"
      >
        <HistoryIcon className="size-4" />
      </button>

      {open && (
        <Modal
          title="Snapshots"
          description="Save a version of this plan, then restore it anytime. Restoring backs up the current plan first."
          onClose={() => setOpen(false)}
        >
          <div className="flex items-center gap-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
              placeholder="Name this snapshot…"
              className={fieldCls}
            />
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="btn-primary h-9 flex-none rounded-full px-4 text-[13px] font-medium transition-all disabled:opacity-60"
            >
              Save
            </button>
          </div>

          {list.length === 0 ? (
            <p className="text-text-3 py-6 text-center text-[13px]">No snapshots yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {list.map((s) => (
                <li
                  key={s.id}
                  className="border-line-1 flex items-center gap-3 rounded-xl border px-3.5 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-text truncate text-[13px] font-medium">{s.label}</p>
                    <p className="text-text-3 text-[11.5px]">
                      {s.created_at.slice(0, 10)}
                      {s.author_label ? ` · ${s.author_label}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restore(s.id)}
                    disabled={busy === s.id}
                    className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text h-8 flex-none rounded-full border px-3 text-[12.5px] font-medium transition-colors disabled:opacity-60"
                  >
                    {busy === s.id ? "…" : "Restore"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    disabled={busy === s.id}
                    aria-label="Delete snapshot"
                    className="text-text-3 hover:text-red-text flex-none px-1 text-[16px] leading-none disabled:opacity-60"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}
