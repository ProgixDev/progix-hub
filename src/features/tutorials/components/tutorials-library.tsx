"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "@/components/ui/icons";
import { deleteTutorialAction } from "../actions";
import { TutorialsStoreProvider, useTutorialsStore } from "../provider";
import type { Tutorial } from "../types";
import { type PlatformOption, TutorialForm } from "./tutorial-form";
import { TutorialPlayer } from "./tutorial-player";

/** Tutorials library (spec 016). Any member watches; managers add/edit/delete. */
export function TutorialsLibrary({
  tutorials,
  canManage,
  platformOptions,
  videoUrls = {},
}: {
  tutorials: Tutorial[];
  canManage: boolean;
  platformOptions: PlatformOption[];
  videoUrls?: Record<string, string>;
}) {
  return (
    <TutorialsStoreProvider>
      <Inner
        tutorials={tutorials}
        canManage={canManage}
        platformOptions={platformOptions}
        videoUrls={videoUrls}
      />
      {canManage && <TutorialForm platformOptions={platformOptions} />}
    </TutorialsStoreProvider>
  );
}

function Inner({
  tutorials,
  canManage,
  platformOptions,
  videoUrls,
}: {
  tutorials: Tutorial[];
  canManage: boolean;
  platformOptions: PlatformOption[];
  videoUrls: Record<string, string>;
}) {
  const t = useTranslations("tutorials");
  const tCommon = useTranslations("common");
  const openCreate = useTutorialsStore((s) => s.openCreate);
  const openEdit = useTutorialsStore((s) => s.openEdit);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const labelFor = (id: string | null) =>
    id ? (platformOptions.find((o) => o.value === id)?.label ?? id) : null;

  function remove(item: Tutorial) {
    setError(null);
    if (!window.confirm(t("deleteConfirm", { title: item.title }))) return;
    start(async () => {
      const res = await deleteTutorialAction(item.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="t-eyebrow">{t("eyebrow")}</p>
          <h1 className="text-text mt-1 text-[22px] font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-text-3 mt-1 text-[12.5px]">{t("subtitle")}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-all"
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

      {tutorials.length === 0 ? (
        <div className="border-line/60 text-text-3 rounded-xl border border-dashed py-16 text-center text-[13.5px]">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {tutorials.map((item) => (
            <article key={item.id} className="glass card-hover flex flex-col gap-2 rounded-2xl p-3">
              <TutorialPlayer tutorial={item} videoUrl={videoUrls[item.id]} />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-text truncate text-[14px] font-semibold">{item.title}</h2>
                  {item.description && (
                    <p className="text-text-3 mt-0.5 line-clamp-2 text-[12.5px]">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-none items-center gap-1.5">
                  {labelFor(item.platform_service_id) && (
                    <Badge tone="blue">{labelFor(item.platform_service_id)}</Badge>
                  )}
                  {item.language && <Badge tone="neutral">{item.language.toUpperCase()}</Badge>}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-full border px-2.5 text-[12px] font-medium transition-colors"
                  >
                    {tCommon("edit")}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(item)}
                    className="border-line-1 text-red-text hover:bg-red-tint h-8 rounded-full border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60"
                  >
                    {tCommon("delete")}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
