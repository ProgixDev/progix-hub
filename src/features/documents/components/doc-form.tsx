"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addLinkDocumentAction,
  addNoteDocumentAction,
  updateDocumentAction,
  type ActionResult,
} from "../actions";
import { useDocumentsStore } from "../provider";
import type { ProjectDocument } from "../types";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

type Mode = "add-link" | "add-note" | "edit";

export function DocForm({ projectId }: { projectId: string }) {
  const modal = useDocumentsStore((s) => s.modal);
  const close = useDocumentsStore((s) => s.closeModal);
  if (modal.mode === "closed") return null;
  const editing = modal.mode === "edit" ? modal.doc : null;
  // Only links and notes are editable in this form (files are re-uploaded, not edited).
  if (editing && editing.kind === "file") return null;
  const kind: "link" | "note" =
    modal.mode === "add-link"
      ? "link"
      : modal.mode === "add-note"
        ? "note"
        : (editing!.kind as "link" | "note"); // file is excluded by the guard above
  return (
    <DocFormModal
      key={editing?.id ?? modal.mode}
      projectId={projectId}
      mode={modal.mode as Mode}
      kind={kind}
      editing={editing}
      onClose={close}
    />
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-text-1 text-[12.5px] font-medium">{label}</span>
      {children}
      {error && <span className="text-[12px] text-[#FFB6A2]">{error}</span>}
    </label>
  );
}

function DocFormModal({
  projectId,
  kind,
  editing,
  onClose,
}: {
  projectId: string;
  mode: Mode;
  kind: "link" | "note";
  editing: ProjectDocument | null;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const heading = editing
    ? kind === "link"
      ? "Edit link"
      : "Edit note"
    : kind === "link"
      ? "New link"
      : "New note";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const input = Object.fromEntries(fd.entries());
    start(async () => {
      let res: ActionResult;
      if (editing) {
        res = await updateDocumentAction(editing.id, projectId, kind, input);
      } else if (kind === "link") {
        res = await addLinkDocumentAction(projectId, input);
      } else {
        res = await addNoteDocumentAction(projectId, input);
      }
      if (res.ok) {
        onClose();
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 px-4 py-[7vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        className="bg-card border-line-1 w-full max-w-lg rounded-xl border shadow-2xl"
      >
        <div className="border-line flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-text text-[15px] font-semibold">{heading}</h2>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {formError && (
            <p className="border-red/30 bg-red-tint rounded-md border px-3 py-2 text-[13px] text-[#FFB6A2]">
              {formError}
            </p>
          )}

          <Field label="Title" error={errors.title}>
            <input
              name="title"
              defaultValue={editing?.title ?? ""}
              className={inputCls}
              required
              autoFocus
            />
          </Field>

          {kind === "link" ? (
            <Field label="URL" error={errors.url}>
              <input
                name="url"
                type="url"
                defaultValue={editing?.url ?? ""}
                placeholder="https://…"
                className={`${inputCls} font-mono text-[13px]`}
                required
              />
            </Field>
          ) : (
            <Field label="Note" error={errors.body}>
              <textarea
                name="body"
                defaultValue={editing?.body ?? ""}
                rows={8}
                placeholder={"# Heading\n\n- bullet\n- **bold**, _italic_, [link](https://…)"}
                className={`${inputCls} font-mono text-[13px]`}
                required
              />
            </Field>
          )}
        </div>

        <div className="border-line flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-md px-3 text-[13.5px] font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-4 text-[13.5px] font-medium transition-colors disabled:opacity-60"
          >
            {pending ? "Saving…" : editing ? "Save changes" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
