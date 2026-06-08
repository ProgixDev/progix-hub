"use client";

import { useState, useTransition } from "react";
import { createProjectAction, updateProjectAction, type ActionResult } from "../actions";
import { useProjectsStore } from "../provider";
import { PROJECT_STATUSES, type Project, type ProjectStatus } from "../types";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  at_risk: "At risk",
  archived: "Archived",
};

const LINK_FIELDS = [
  { name: "notion_url", label: "Notion", placeholder: "https://www.notion.so/…" },
  { name: "slack_url", label: "Slack", placeholder: "https://app.slack.com/…" },
  { name: "github_url", label: "GitHub", placeholder: "https://github.com/DigitariaWebs/…" },
  { name: "live_url", label: "Live", placeholder: "https://…" },
] as const;

export function ProjectForm() {
  const modal = useProjectsStore((s) => s.modal);
  const close = useProjectsStore((s) => s.closeModal);
  if (modal.mode === "closed") return null;
  const editing = modal.mode === "edit" ? modal.project : null;
  return <ProjectFormModal key={editing?.id ?? "new"} editing={editing} onClose={close} />;
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

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

function ProjectFormModal({ editing, onClose }: { editing: Project | null; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const input = Object.fromEntries(fd.entries());
    start(async () => {
      const res: ActionResult = editing
        ? await updateProjectAction(editing.id, input)
        : await createProjectAction(input);
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
      aria-label={editing ? "Edit project" : "New project"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        className="bg-card border-line-1 w-full max-w-lg rounded-xl border shadow-2xl"
      >
        <div className="border-line flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-text text-[15px] font-semibold">
            {editing ? "Edit project" : "New project"}
          </h2>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {formError && (
            <p className="border-red/30 bg-red-tint rounded-md border px-3 py-2 text-[13px] text-[#FFB6A2]">
              {formError}
            </p>
          )}

          <Field label="Name" error={errors.name}>
            <input name="name" defaultValue={editing?.name ?? ""} className={inputCls} autoFocus />
          </Field>

          <Field label="Description" error={errors.description}>
            <textarea
              name="description"
              defaultValue={editing?.description ?? ""}
              rows={2}
              className={inputCls}
            />
          </Field>

          <Field label="Status">
            <select name="status" defaultValue={editing?.status ?? "active"} className={inputCls}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>

          {LINK_FIELDS.map((f) => (
            <Field key={f.name} label={f.label} error={errors[f.name]}>
              <input
                name={f.name}
                defaultValue={(editing?.[f.name] as string | null) ?? ""}
                placeholder={f.placeholder}
                className={`${inputCls} font-mono text-[13px]`}
              />
            </Field>
          ))}
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
            {pending ? "Saving…" : editing ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}
