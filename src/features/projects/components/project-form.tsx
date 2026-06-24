"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { createProjectAction, updateProjectAction, type ActionResult } from "../actions";
import { useProjectsStore } from "../provider";
import { PROJECT_STATUSES, type Project, type ProjectStatus } from "../types";

const STATUS_KEY = {
  active: "statusActive",
  at_risk: "statusAtRisk",
  archived: "statusArchived",
} as const satisfies Record<ProjectStatus, string>;

const LINK_FIELDS = [
  { name: "notion_url", label: "Notion", placeholder: "https://www.notion.so/…" },
  { name: "slack_url", label: "Slack", placeholder: "https://app.slack.com/…" },
  { name: "github_url", label: "GitHub", placeholder: "https://github.com/ProgixDev/…" },
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
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-text-1 text-[12.5px] font-medium">
        {label}
        {required && <span className="text-red-text"> *</span>}
      </span>
      {children}
      {error && <span className="text-red-text text-[12px]">{error}</span>}
    </label>
  );
}

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function ProjectFormModal({
  editing,
  onClose,
}: {
  editing: Project | null;
  onClose: () => void;
}) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
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
    <Modal
      title={editing ? t("editProject") : t("newProject")}
      onClose={onClose}
      onSubmit={onSubmit}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full px-3.5 text-[13.5px] font-medium transition-colors"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-60"
          >
            {pending ? tCommon("saving") : editing ? tCommon("save") : t("createProject")}
          </button>
        </>
      }
    >
      {formError && (
        <p className="border-red/30 bg-red-tint text-red-text rounded-xl border px-3.5 py-2.5 text-[13px]">
          {formError}
        </p>
      )}

      <Field label={t("fieldName")} error={errors.name} required>
        <input
          name="name"
          defaultValue={editing?.name ?? ""}
          className={inputCls}
          required
          aria-required="true"
          autoFocus
        />
      </Field>

      <Field label={t("fieldDescription")} error={errors.description}>
        <textarea
          name="description"
          defaultValue={editing?.description ?? ""}
          rows={2}
          className={inputCls}
        />
      </Field>

      <Field label={t("fieldStatus")}>
        <select name="status" defaultValue={editing?.status ?? "active"} className={inputCls}>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(STATUS_KEY[s])}
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
    </Modal>
  );
}
