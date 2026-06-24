"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "@/components/ui/icons";
import { deletePlatformAction, setPlatformDisabledAction } from "../actions";
import { PlatformsStoreProvider, usePlatformsStore } from "../provider";
import type { AccessPattern, Platform } from "../types";
import { PlatformForm, type TutorialOption } from "./platform-form";

const PATTERN_KEY: Record<AccessPattern, string> = {
  invite_collaborator: "patternInvite",
  store_key: "patternKey",
  diy: "patternDiy",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "?";
}

/** Settings → Platforms: the org-wide registry (spec 015). Managers can add/edit/disable/delete. */
export function PlatformsManager({
  platforms,
  canManage,
  tutorialOptions,
}: {
  platforms: Platform[];
  canManage: boolean;
  tutorialOptions: TutorialOption[];
}) {
  return (
    <PlatformsStoreProvider>
      <Inner platforms={platforms} canManage={canManage} />
      {canManage && <PlatformForm tutorialOptions={tutorialOptions} />}
    </PlatformsStoreProvider>
  );
}

function Inner({ platforms, canManage }: { platforms: Platform[]; canManage: boolean }) {
  const t = useTranslations("platforms");
  const tCommon = useTranslations("common");
  const openCreate = usePlatformsStore((s) => s.openCreate);
  const openEdit = usePlatformsStore((s) => s.openEdit);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function disable(p: Platform) {
    setError(null);
    start(async () => {
      const res = await setPlatformDisabledAction(p.id, !p.disabled);
      if (!res.ok) setError(res.error);
    });
  }

  function remove(p: Platform) {
    setError(null);
    if (!window.confirm(t("deleteConfirm", { name: p.name }))) return;
    start(async () => {
      const res = await deletePlatformAction(p.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-text text-[15px] font-semibold">{t("title")}</h2>
          <p className="text-text-3 text-[12px]">{t("subtitle")}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="bg-blue text-primary-foreground hover:bg-blue-hover flex h-9 items-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition-colors"
          >
            <PlusIcon className="size-4" />
            {t("add")}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-red-text mb-3 text-[12px]">
          {error}
        </p>
      )}

      {platforms.length === 0 ? (
        <div className="border-line/60 text-text-3 rounded-lg border border-dashed px-4 py-10 text-center text-[13px]">
          {t("empty")}
        </div>
      ) : (
        <ul className="divide-line/60 border-line-1 divide-y rounded-xl border">
          {platforms.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="bg-bg-3 text-text-1 border-line-1 flex size-9 flex-none items-center justify-center rounded-lg border text-[11px] font-semibold">
                {initials(p.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-text truncate text-[13.5px] font-medium">{p.name}</p>
                <p className="text-text-3 truncate text-[11.5px]">
                  {t(PATTERN_KEY[p.access_pattern])}
                </p>
              </div>
              {p.critical && <Badge tone="amber">{t("criticalBadge")}</Badge>}
              {p.disabled && <Badge tone="neutral">{t("disabledBadge")}</Badge>}
              {canManage && (
                <div className="flex flex-none items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors"
                  >
                    {tCommon("edit")}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => disable(p)}
                    className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60"
                  >
                    {p.disabled ? t("enable") : t("disable")}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(p)}
                    className="border-line-1 text-red-text hover:bg-red-tint h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60"
                  >
                    {tCommon("delete")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
