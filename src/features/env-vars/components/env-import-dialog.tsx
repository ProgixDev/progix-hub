"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { importEnvVarsAction } from "../actions";
import { detectScope, detectService, parseDotenv, scopeFromFilename } from "../lib";
import { useEnvVarsStore } from "../provider";
import { ENV_SCOPES, type EnvScope } from "../types";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

type ParsedFile = { name: string; text: string };
type Summary = { created: number; skipped: number; failed: number };

export function EnvImportDialog({
  projectId,
  existingKeys,
}: {
  projectId: string;
  existingKeys: string[];
}) {
  const open = useEnvVarsStore((s) => s.importOpen);
  const close = useEnvVarsStore((s) => s.closeImport);
  if (!open) return null;
  return <EnvImportModal projectId={projectId} existingKeys={existingKeys} onClose={close} />;
}

function EnvImportModal({
  projectId,
  existingKeys,
  onClose,
}: {
  projectId: string;
  existingKeys: string[];
  onClose: () => void;
}) {
  const t = useTranslations("envVars");
  const tCommon = useTranslations("common");
  const [pending, start] = useTransition();
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [pasted, setPasted] = useState("");
  const [dragging, setDragging] = useState(false);
  const [includeOverride, setIncludeOverride] = useState<Record<string, boolean>>({});
  const [scopeOverride, setScopeOverride] = useState<Record<string, EnvScope>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existing = useMemo(() => new Set(existingKeys), [existingKeys]);

  // Parse all sources (files first, pasted text last so it wins), last-value-wins per key (AC-2).
  const rows = useMemo(() => {
    const merged = new Map<string, { key: string; value: string; scope: EnvScope }>();
    for (const file of files) {
      const hint = scopeFromFilename(file.name);
      for (const entry of parseDotenv(file.text)) {
        merged.set(entry.key, {
          key: entry.key,
          value: entry.value,
          scope: detectScope(entry.key, hint),
        });
      }
    }
    for (const entry of parseDotenv(pasted)) {
      merged.set(entry.key, { key: entry.key, value: entry.value, scope: detectScope(entry.key) });
    }
    return [...merged.values()];
  }, [files, pasted]);

  async function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const read = await Promise.all(
      Array.from(fileList).map(
        (file) =>
          new Promise<ParsedFile>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, text: String(reader.result ?? "") });
            reader.onerror = () => resolve({ name: file.name, text: "" });
            reader.readAsText(file);
          }),
      ),
    );
    setFiles((prev) => [...prev, ...read]);
  }

  function includeOf(key: string) {
    return includeOverride[key] ?? true;
  }
  function scopeOf(key: string, fallback: EnvScope) {
    return scopeOverride[key] ?? fallback;
  }

  function onSubmit() {
    setError(null);
    const items = rows
      .filter((row) => includeOf(row.key))
      .map((row) => ({
        key: row.key,
        value: row.value,
        scope: scopeOf(row.key, row.scope),
        service: detectService(row.key) ?? undefined,
      }));
    if (items.length === 0) {
      setError(t("importNoneSelected"));
      return;
    }
    start(async () => {
      const res = await importEnvVarsAction(projectId, { items });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSummary({
        created: res.created.length,
        skipped: res.skipped.length,
        failed: res.failed.length,
      });
    });
  }

  const includedCount = rows.filter((row) => includeOf(row.key)).length;

  return (
    <Modal
      title={t("importTitle")}
      onClose={onClose}
      size="lg"
      footer={
        summary ? (
          <button
            type="button"
            onClick={onClose}
            className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all"
          >
            {tCommon("close")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              className="text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full px-3.5 text-[13.5px] font-medium transition-colors"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={pending || includedCount === 0}
              className="btn-primary h-9 rounded-full px-4 text-[13.5px] font-medium transition-all disabled:opacity-60"
            >
              {pending ? tCommon("saving") : t("importSubmit", { count: includedCount })}
            </button>
          </>
        )
      }
    >
      {summary ? (
        <p className="text-text text-[13.5px]">
          {t("importSummary", {
            created: summary.created,
            skipped: summary.skipped,
            failed: summary.failed,
          })}
        </p>
      ) : (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void addFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center ${
              dragging ? "border-line-blue bg-blue-tint" : "border-line/60"
            }`}
          >
            <p className="text-text-2 text-[13px]">{t("importDropzone")}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text h-8 rounded-full border px-3 text-[12.5px] font-medium transition-colors"
            >
              {t("importChoose")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              aria-label={t("importChoose")}
              onChange={(e) => {
                void addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {files.length > 0 && (
              <p className="text-text-3 text-[11.5px]">
                {files.map((file) => file.name).join(", ")}
              </p>
            )}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-text-1 text-[12.5px] font-medium">{t("importPaste")}</span>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={4}
              placeholder={
                "STRIPE_SECRET_KEY=sk_live_…\nNEXT_PUBLIC_API_URL=https://api.example.com"
              }
              className={`${inputCls} font-mono`}
              aria-label={t("importPaste")}
            />
          </label>

          {rows.length === 0 ? (
            <p className="text-text-3 border-line/60 rounded-md border border-dashed px-3 py-4 text-center text-[12.5px]">
              {t("importEmpty")}
            </p>
          ) : (
            <div className="border-line-1 overflow-hidden rounded-lg border">
              <div className="text-text-3 bg-bg-2 grid grid-cols-[auto_1fr_auto] gap-2 px-3 py-2 text-[11px] font-medium">
                <span>{t("importColInclude")}</span>
                <span>{t("importColKey")}</span>
                <span>{t("fieldScope")}</span>
              </div>
              <ul className="divide-line/60 divide-y">
                {rows.map((row) => {
                  const isShown = shown[row.key] ?? false;
                  const alreadyExists = existing.has(row.key);
                  return (
                    <li
                      key={row.key}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={includeOf(row.key)}
                        aria-label={`${t("importColInclude")} ${row.key}`}
                        onChange={(e) =>
                          setIncludeOverride((prev) => ({ ...prev, [row.key]: e.target.checked }))
                        }
                      />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="text-text font-mono text-[12.5px] break-all">
                            {row.key}
                          </span>
                          {alreadyExists && <Badge tone="amber">{t("importExists")}</Badge>}
                        </p>
                        <p className="text-text-2 truncate font-mono text-[11.5px]">
                          <button
                            type="button"
                            className="hover:text-text mr-2 underline"
                            onClick={() => setShown((prev) => ({ ...prev, [row.key]: !isShown }))}
                          >
                            {isShown ? t("hide") : t("reveal")}
                          </button>
                          {isShown ? row.value : "••••••••"}
                        </p>
                      </div>
                      <select
                        value={scopeOf(row.key, row.scope)}
                        aria-label={`${t("fieldScope")} ${row.key}`}
                        onChange={(e) =>
                          setScopeOverride((prev) => ({
                            ...prev,
                            [row.key]: e.target.value as EnvScope,
                          }))
                        }
                        className="border-line-1 bg-bg-inset text-text-1 h-8 rounded-xl border px-2 text-[12px]"
                      >
                        {ENV_SCOPES.map((scope) => (
                          <option key={scope} value={scope}>
                            {scope === "frontend" ? t("scopeFrontend") : t("scopeBackend")}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {error && (
            <p role="alert" className="text-red-text max-w-full text-[12px]">
              {error}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
