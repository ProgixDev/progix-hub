"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { type ActionResult, createTutorialAction, updateTutorialAction } from "../actions";
import { useTutorialsStore } from "../provider";
import type { SourceType, Tutorial } from "../types";

export type PlatformOption = { value: string; label: string };

const VIDEO_BUCKET = "tutorial-videos";
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function TutorialForm({ platformOptions }: { platformOptions: PlatformOption[] }) {
  const modal = useTutorialsStore((s) => s.modal);
  const close = useTutorialsStore((s) => s.closeModal);
  if (modal.mode === "closed") return null;
  const editing = modal.mode === "edit" ? modal.tutorial : null;
  return (
    <Modal
      key={editing?.id ?? "new"}
      editing={editing}
      platformOptions={platformOptions}
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

function Modal({
  editing,
  platformOptions,
  onClose,
}: {
  editing: Tutorial | null;
  platformOptions: PlatformOption[];
  onClose: () => void;
}) {
  const t = useTranslations("tutorials");
  const tCommon = useTranslations("common");
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [source, setSource] = useState<SourceType>(editing?.source_type ?? "embed");
  const fileRef = useRef<HTMLInputElement>(null);

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
    start(async () => {
      setErrors({});
      setFormError(null);

      // For an upload source, push the file to the private bucket first, then record the path.
      let storagePath = editing?.storage_path ?? undefined;
      if (source === "upload") {
        const file = fileRef.current?.files?.[0];
        if (file) {
          if (!file.type.startsWith("video/"))
            return setErrors({ storage_path: t("errorFileType") });
          if (file.size > MAX_VIDEO_BYTES) return setErrors({ storage_path: t("errorFileSize") });
          const supabase = createClient();
          const path = `${crypto.randomUUID()}/${file.name}`;
          const up = await supabase.storage
            .from(VIDEO_BUCKET)
            .upload(path, file, { contentType: file.type });
          if (up.error) return setFormError(t("errorUpload"));
          storagePath = path;
        }
        if (!storagePath) return setErrors({ storage_path: t("errorFile") });
      }

      const input = {
        title: str("title"),
        description: str("description"),
        platform_service_id: str("platform_service_id"),
        language: str("language"),
        visible_to_clients: fd.get("visible_to_clients") === "on",
        source_type: source,
        embed_url: source === "embed" ? str("embed_url") : undefined,
        storage_path: source === "upload" ? storagePath : undefined,
      };
      const res: ActionResult = editing
        ? await updateTutorialAction(editing.id, input)
        : await createTutorialAction(input);
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
      aria-label={editing ? t("editTutorial") : t("newTutorial")}
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
            {editing ? t("editTutorial") : t("newTutorial")}
          </h2>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {formError && (
            <p className="border-red/30 bg-red-tint text-red-text rounded-md border px-3 py-2 text-[13px]">
              {formError}
            </p>
          )}

          <Field label={t("fieldTitle")} error={errors.title} required>
            <input
              name="title"
              defaultValue={editing?.title ?? ""}
              className={inputCls}
              required
              autoFocus
            />
          </Field>

          <Field label={t("fieldSource")}>
            <div className="border-line-1 flex w-fit items-center gap-0.5 rounded-md border p-0.5">
              {(["embed", "upload"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`h-8 rounded px-3 text-[12.5px] font-medium transition-colors ${
                    source === s ? "bg-bg-2 text-text" : "text-text-3 hover:text-text"
                  }`}
                >
                  {t(s === "embed" ? "sourceEmbed" : "sourceUpload")}
                </button>
              ))}
            </div>
          </Field>

          {source === "embed" ? (
            <Field label={t("fieldLink")} error={errors.embed_url} required>
              <input
                name="embed_url"
                defaultValue={editing?.embed_url ?? ""}
                placeholder="https://youtu.be/…"
                className={`${inputCls} font-mono text-[13px]`}
              />
            </Field>
          ) : (
            <Field
              label={t("fieldFile")}
              error={errors.storage_path}
              required={!editing?.storage_path}
            >
              <input ref={fileRef} type="file" accept="video/*" className={inputCls} />
              {editing?.storage_path && (
                <span className="text-text-3 text-[11.5px]">{t("fileKeepHint")}</span>
              )}
            </Field>
          )}

          <Field label={t("fieldPlatform")}>
            <select
              name="platform_service_id"
              defaultValue={editing?.platform_service_id ?? ""}
              className={inputCls}
            >
              <option value="">{t("platformNone")}</option>
              {platformOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("fieldLanguage")}>
            <select name="language" defaultValue={editing?.language ?? ""} className={inputCls}>
              <option value="">{t("languageBoth")}</option>
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
          </Field>

          <Field label={t("fieldDescription")} error={errors.description}>
            <textarea
              name="description"
              defaultValue={editing?.description ?? ""}
              rows={2}
              className={inputCls}
            />
          </Field>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="visible_to_clients"
              defaultChecked={editing?.visible_to_clients ?? false}
              className="size-4"
            />
            <span className="text-text-1 text-[13px]">{t("fieldVisibleToClients")}</span>
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
