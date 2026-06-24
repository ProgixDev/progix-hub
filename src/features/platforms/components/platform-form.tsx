"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { type ActionResult, createPlatformAction, updatePlatformAction } from "../actions";
import { PLATFORM_SERVICES } from "../lib";
import { usePlatformsStore } from "../provider";
import {
  ACCESS_PATTERNS,
  type AccessPattern,
  type Platform,
  type PlatformTutorial,
} from "../types";

export type TutorialOption = { id: string; title: string };

const PATTERN_KEY: Record<AccessPattern, string> = {
  invite_collaborator: "patternInvite",
  store_key: "patternKey",
  diy: "patternDiy",
};

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function PlatformForm({ tutorialOptions }: { tutorialOptions: TutorialOption[] }) {
  const modal = usePlatformsStore((s) => s.modal);
  const close = usePlatformsStore((s) => s.closeModal);
  if (modal.mode === "closed") return null;
  const editing = modal.mode === "edit" ? modal.platform : null;
  return (
    <PlatformFormModal
      key={editing?.id ?? "new"}
      editing={editing}
      tutorialOptions={tutorialOptions}
      onClose={close}
    />
  );
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
  tutorialOptions,
  onClose,
}: {
  editing: Platform | null;
  tutorialOptions: TutorialOption[];
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
  const [videos, setVideos] = useState<PlatformTutorial[]>(editing?.tutorials ?? []);
  const [picking, setPicking] = useState(false);

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
      invite_url: str("invite_url"),
      invite_role: str("invite_role"),
      invite_email: str("invite_email"),
      key_label: str("key_label"),
      tutorials: videos.map((v) => ({ tutorial_id: v.tutorial_id, label: v.label ?? undefined })),
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

  const available = tutorialOptions.filter((o) => !videos.some((v) => v.tutorial_id === o.id));

  return (
    <>
      {picking && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-auto bg-black/70 px-4 py-[8vh] backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={t("pickTutorial")}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPicking(false);
          }}
        >
          <div className="glass-strong w-full max-w-md rounded-2xl">
            <div className="border-line flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-text text-[15px] font-semibold">{t("pickTutorial")}</h2>
            </div>
            <div className="max-h-[50vh] overflow-auto p-2">
              {available.length === 0 ? (
                <p className="text-text-3 px-3 py-6 text-center text-[13px]">
                  {t("noTutorialsLeft")}
                </p>
              ) : (
                available.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setVideos((prev) => [
                        ...prev,
                        { tutorial_id: o.id, label: null, title: o.title },
                      ]);
                      setPicking(false);
                    }}
                    className="text-text hover:bg-bg-3 flex w-full items-center rounded-md px-3 py-2 text-left text-[13.5px] transition-colors"
                  >
                    {o.title}
                  </button>
                ))
              )}
            </div>
            <div className="border-line flex justify-end border-t px-5 py-3">
              <button
                type="button"
                onClick={() => setPicking(false)}
                className="text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-md px-3 text-[13.5px] font-medium transition-colors"
              >
                {tCommon("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/70 px-4 py-[6vh] backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? t("editPlatform") : t("newPlatform")}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <form onSubmit={onSubmit} className="glass-strong w-full max-w-lg rounded-2xl">
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
              <select
                name="service_id"
                defaultValue={editing?.service_id ?? ""}
                className={inputCls}
              >
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

            <div className="flex flex-col gap-2">
              <span className="text-text-1 text-[12.5px] font-medium">{t("fieldVideos")}</span>
              {videos.length === 0 ? (
                <p className="text-text-3 text-[12px]">{t("noVideos")}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {videos.map((v, i) => (
                    <li
                      key={v.tutorial_id}
                      className="border-line-1 flex items-center gap-2 rounded-md border p-2"
                    >
                      <span className="text-text min-w-0 flex-none truncate text-[12.5px]">
                        {v.title ??
                          tutorialOptions.find((o) => o.id === v.tutorial_id)?.title ??
                          v.tutorial_id}
                      </span>
                      <input
                        value={v.label ?? ""}
                        onChange={(e) =>
                          setVideos((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                          )
                        }
                        placeholder={t("videoLabelHint")}
                        className={`${inputCls} h-8 flex-1 py-1 text-[12.5px]`}
                      />
                      <button
                        type="button"
                        onClick={() => setVideos((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={tCommon("delete")}
                        className="text-text-3 hover:text-red-text flex-none px-1 text-[16px]"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="border-line-1 bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text h-8 w-fit rounded-full border px-3 text-[12.5px] font-medium transition-colors"
              >
                + {t("addVideo")}
              </button>
            </div>

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
              className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-60"
            >
              {pending ? tCommon("saving") : editing ? tCommon("save") : t("add")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
