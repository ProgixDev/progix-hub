"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { type ActionResult, createPlatformAction, updatePlatformAction } from "../actions";
import { PLATFORM_SERVICES } from "../lib";
import { usePlatformsStore } from "../provider";
import { ACCESS_PATTERNS, type AccessPattern, type Platform } from "../types";

const PATTERN_KEY: Record<AccessPattern, string> = {
  invite_collaborator: "patternInvite",
  store_key: "patternKey",
  diy: "patternDiy",
};

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function PlatformForm() {
  const modal = usePlatformsStore((s) => s.modal);
  const close = usePlatformsStore((s) => s.closeModal);
  if (modal.mode === "closed") return null;
  const editing = modal.mode === "edit" ? modal.platform : null;
  return <PlatformFormModal key={editing?.id ?? "new"} editing={editing} onClose={close} />;
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

function PlatformFormModal({
  editing,
  onClose,
}: {
  editing: Platform | null;
  onClose: () => void;
}) {
  const t = useTranslations("platforms");
  const tCommon = useTranslations("common");
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pattern, setPattern] = useState<AccessPattern>(
    editing?.access_pattern ?? "invite_collaborator",
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const str = (k: string) => {
      const v = String(fd.get(k) ?? "").trim();
      return v.length > 0 ? v : undefined;
    };
    const input = {
      name: str("name"),
      service_id: str("service_id"),
      access_pattern: pattern,
      critical: fd.get("critical") === "on",
      steps: String(fd.get("steps") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      video_url: str("video_url"),
      invite_url: str("invite_url"),
      invite_role: str("invite_role"),
      invite_email: str("invite_email"),
      key_label: str("key_label"),
    };
    start(async () => {
      const res: ActionResult = editing
        ? await updatePlatformAction(editing.id, input)
        : await createPlatformAction(input);
      if (res.ok) onClose();
      else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 px-4 py-[6vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? t("editPlatform") : t("newPlatform")}
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
            {editing ? t("editPlatform") : t("newPlatform")}
          </h2>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {formError && (
            <p className="border-red/30 bg-red-tint text-red-text rounded-md border px-3 py-2 text-[13px]">
              {formError}
            </p>
          )}

          <Field label={t("fieldName")} error={errors.name} required>
            <input
              name="name"
              defaultValue={editing?.name ?? ""}
              className={inputCls}
              required
              autoFocus
            />
          </Field>

          <Field label={t("fieldLogo")}>
            <select name="service_id" defaultValue={editing?.service_id ?? ""} className={inputCls}>
              <option value="">{t("logoNone")}</option>
              {PLATFORM_SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("fieldAccessPattern")}>
            <select
              name="access_pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value as AccessPattern)}
              className={inputCls}
            >
              {ACCESS_PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {t(PATTERN_KEY[p])}
                </option>
              ))}
            </select>
          </Field>

          {pattern === "invite_collaborator" && (
            <>
              <Field label={t("fieldInviteUrl")} error={errors.invite_url} required>
                <input
                  name="invite_url"
                  defaultValue={editing?.invite_url ?? ""}
                  placeholder="https://dashboard.stripe.com/settings/team"
                  className={`${inputCls} font-mono text-[13px]`}
                />
              </Field>
              <Field label={t("fieldInviteRole")} error={errors.invite_role} required>
                <input
                  name="invite_role"
                  defaultValue={editing?.invite_role ?? ""}
                  className={inputCls}
                />
              </Field>
              <Field label={t("fieldInviteEmail")} error={errors.invite_email} required>
                <input
                  name="invite_email"
                  type="email"
                  defaultValue={editing?.invite_email ?? ""}
                  placeholder="dev@progix.com"
                  className={inputCls}
                />
              </Field>
            </>
          )}

          {pattern === "store_key" && (
            <Field label={t("fieldKeyLabel")} error={errors.key_label} required>
              <input
                name="key_label"
                defaultValue={editing?.key_label ?? ""}
                placeholder="STRIPE_SECRET_KEY"
                className={`${inputCls} font-mono text-[13px]`}
              />
            </Field>
          )}

          <Field label={t("fieldSteps")} error={errors.steps}>
            <textarea
              name="steps"
              defaultValue={(editing?.steps ?? []).join("\n")}
              rows={4}
              placeholder={t("stepsHint")}
              className={inputCls}
            />
          </Field>

          <Field label={t("fieldVideo")} error={errors.video_url}>
            <input
              name="video_url"
              defaultValue={editing?.video_url ?? ""}
              placeholder="https://youtu.be/…"
              className={`${inputCls} font-mono text-[13px]`}
            />
          </Field>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="critical"
              defaultChecked={editing?.critical ?? false}
              className="size-4"
            />
            <span className="text-text-1 text-[13px]">{t("fieldCritical")}</span>
          </label>
        </div>

        <div className="border-line flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-md px-3 text-[13.5px] font-medium transition-colors"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-4 text-[13.5px] font-medium transition-colors disabled:opacity-60"
          >
            {pending ? tCommon("saving") : editing ? tCommon("save") : t("add")}
          </button>
        </div>
      </form>
    </div>
  );
}
