"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createEnvVarAction, updateEnvVarAction, type ActionResult } from "../actions";
import { detectScope, detectService, SERVICES } from "../lib";
import { useEnvVarsStore } from "../provider";
import { ENV_SCOPES, type EnvScope, type EnvVarMeta } from "../types";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function EnvVarForm({ projectId }: { projectId: string }) {
  const modal = useEnvVarsStore((s) => s.modal);
  const close = useEnvVarsStore((s) => s.closeModal);
  if (modal.mode === "closed") return null;
  const editing = modal.mode === "edit" ? modal.envVar : null;
  return (
    <EnvVarFormModal
      key={editing?.id ?? "new"}
      projectId={projectId}
      editing={editing}
      onClose={close}
    />
  );
}

function Field({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-text-1 text-[12.5px] font-medium">
        {label}
        {required && <span className="text-red-text"> *</span>}
        {hint && <span className="text-text-3 font-normal"> — {hint}</span>}
      </span>
      {children}
      {error && <span className="text-red-text text-[12px]">{error}</span>}
    </label>
  );
}

function EnvVarFormModal({
  projectId,
  editing,
  onClose,
}: {
  projectId: string;
  editing: EnvVarMeta | null;
  onClose: () => void;
}) {
  const t = useTranslations("envVars");
  const tCommon = useTranslations("common");
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [key, setKey] = useState(editing?.key ?? "");
  const [service, setService] = useState<string>(editing?.service ?? "");
  const [serviceTouched, setServiceTouched] = useState(Boolean(editing?.service));
  const [scope, setScope] = useState<EnvScope>(editing?.scope ?? "backend");
  const [scopeTouched, setScopeTouched] = useState(Boolean(editing));

  // Auto-detect the service + scope from the key until the user overrides them (AC-1/AC-2).
  const detectedService = useMemo(() => detectService(key), [key]);
  const detectedScope = useMemo(() => detectScope(key), [key]);
  const effectiveService = serviceTouched ? service : (detectedService ?? "");
  const effectiveScope = scopeTouched ? scope : detectedScope;

  const scopeLabel: Record<EnvScope, string> = {
    backend: t("scopeBackend"),
    frontend: t("scopeFrontend"),
  };

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

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const input = {
      key: fd.get("key"),
      value: fd.get("value"),
      service: effectiveService,
      scope: effectiveScope,
    };
    start(async () => {
      const res: ActionResult = editing
        ? await updateEnvVarAction(editing.id, projectId, input)
        : await createEnvVarAction(projectId, input);
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/70 px-4 py-[7vh] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? t("editVariable") : t("newVariable")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form onSubmit={onSubmit} className="glass-strong w-full max-w-lg rounded-2xl">
        <div className="border-line flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-text text-[15px] font-semibold">
            {editing ? t("editVariable") : t("newVariable")}
          </h2>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {formError && (
            <p className="border-red/30 bg-red-tint text-red-text rounded-md border px-3 py-2 text-[13px]">
              {formError}
            </p>
          )}

          <Field label={t("fieldKey")} error={errors.key} required>
            <input
              name="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="STRIPE_SECRET_KEY"
              className={`${inputCls} font-mono text-[13px]`}
              required
              aria-required="true"
              autoFocus
            />
          </Field>

          <Field
            label={t("fieldValue")}
            error={errors.value}
            required={!editing}
            hint={editing ? t("hintKeepValue") : undefined}
          >
            <input
              name="value"
              type="password"
              autoComplete="off"
              placeholder={editing ? "••••••••" : t("placeholderValue")}
              className={`${inputCls} font-mono text-[13px]`}
              required={!editing}
            />
          </Field>

          <Field label={t("fieldScope")} hint={t("hintScope")}>
            <select
              value={effectiveScope}
              onChange={(e) => {
                setScope(e.target.value as EnvScope);
                setScopeTouched(true);
              }}
              className={inputCls}
              aria-label={t("fieldScope")}
            >
              {ENV_SCOPES.map((s) => (
                <option key={s} value={s}>
                  {scopeLabel[s]}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("fieldService")} hint={t("hintLogo")}>
            <select
              value={effectiveService}
              onChange={(e) => {
                setService(e.target.value);
                setServiceTouched(true);
              }}
              className={inputCls}
            >
              <option value="">{t("otherNone")}</option>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="border-line flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full px-3 text-[13.5px] font-medium transition-colors"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-60"
          >
            {pending ? tCommon("saving") : editing ? tCommon("save") : t("addVariable")}
          </button>
        </div>
      </form>
    </div>
  );
}
