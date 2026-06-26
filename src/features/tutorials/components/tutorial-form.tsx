"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { createClient } from "@/lib/supabase/client";
import { type ActionResult, createTutorialAction, updateTutorialAction } from "../actions";
import { useTutorialsStore } from "../provider";
import type { SourceType, Tutorial } from "../types";

export type PlatformOption = { value: string; label: string };

const VIDEO_BUCKET = "tutorial-videos";
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function TutorialForm({ platformOptions }: { platformOptions: PlatformOption[] }) {
  const modal = useTutorialsStore((s) => s.modal);
  const close = useTutorialsStore((s) => s.closeModal);
  if (modal.mode === "closed") return null;
  const editing = modal.mode === "edit" ? modal.tutorial : null;
  return (
    <TutorialFormModal
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

function TutorialFormModal({
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
  const [body, setBody] = useState(editing?.body_md ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        body_md: str("body_md"),
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

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="bg-bg fixed inset-0 z-50 flex flex-col">
      <div className="glow-orb" aria-hidden />
      <form onSubmit={onSubmit} className="relative flex min-h-0 flex-1 flex-col">
        <header className="border-line flex flex-none items-center gap-3 border-b px-4 py-3 sm:px-5">
          <h1 className="text-text text-[15px] font-semibold">
            {editing ? t("editTutorial") : t("newTutorial")}
          </h1>
          <div className="ml-auto flex items-center gap-2">
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
              {pending ? tCommon("saving") : editing ? tCommon("save") : t("add")}
            </button>
          </div>
        </header>

        {formError && (
          <p className="border-red/30 bg-red-tint text-red-text mx-4 mt-3 rounded-xl border px-3.5 py-2.5 text-[13px] sm:mx-5">
            {formError}
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* metadata sidebar */}
          <aside className="border-line flex w-full flex-none flex-col gap-4 overflow-y-auto p-5 lg:w-[340px] lg:border-r">
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
          </aside>

          {/* guide editor + live preview */}
          <div className="grid min-h-0 flex-1 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col border-[var(--line)] lg:border-r">
              <p className="text-text-2 border-line flex-none border-b px-4 py-2 text-[11.5px] font-medium tracking-wide uppercase sm:px-5">
                {t("fieldGuide")}
              </p>
              <textarea
                name="body_md"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("guideHint")}
                className="text-text placeholder:text-text-3 min-h-0 flex-1 resize-none bg-transparent px-4 py-4 font-mono text-[13.5px] leading-relaxed outline-none sm:px-5"
              />
            </div>
            <div className="hidden min-h-0 overflow-y-auto px-5 py-4 lg:block">
              {body.trim() ? (
                <div className="md-body mx-auto max-w-2xl">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{body}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-text-3 text-[13px]">{t("guidePreviewHint")}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}
