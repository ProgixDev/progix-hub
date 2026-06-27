"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import {
  createProjectTypeAction,
  deleteProjectTypeAction,
  updateProjectTypeAction,
} from "../actions";
import type { ProjectType } from "../types";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 rounded-lg border px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

/** Leadership manages the project types the wizard offers — toggle active, add custom, delete. */
export function ProjectTypesManager({ types: initial }: { types: ProjectType[] }) {
  const t = useTranslations("pricing");
  const router = useRouter();
  const [types, setTypes] = useState<ProjectType[]>(initial);
  // Re-sync when the server data changes (after add/delete refresh); local toggles aren't clobbered.
  const sig = useMemo(() => initial.map((i) => `${i.id}:${i.active}`).join("|"), [initial]);
  const prevSig = useRef(sig);
  if (sig !== prevSig.current) {
    prevSig.current = sig;
    setTypes(initial);
  }
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const groups = useMemo(() => {
    const by = new Map<string, ProjectType[]>();
    for (const it of types) {
      const g = by.get(it.group_name) ?? [];
      g.push(it);
      by.set(it.group_name, g);
    }
    return [...by.entries()];
  }, [types]);

  const activeCount = types.filter((t2) => t2.active).length;

  function toggle(it: ProjectType) {
    const next = !it.active;
    setTypes((arr) => arr.map((x) => (x.id === it.id ? { ...x, active: next } : x)));
    start(async () => {
      const res = await updateProjectTypeAction(it.id, { active: next });
      if (!res.ok) setError(res.error);
    });
  }
  function remove(it: ProjectType) {
    setTypes((arr) => arr.filter((x) => x.id !== it.id));
    start(async () => {
      await deleteProjectTypeAction(it.id);
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-4 pb-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-text text-[22px] font-semibold tracking-tight">{t("typesTitle")}</h1>
          <p className="text-text-3 mt-1 text-[13px]">{t("typesSubtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-3 text-[12px]">
            {t("typesActive", { n: activeCount, total: types.length })}
          </span>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="btn-primary flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium"
          >
            <PlusIcon className="size-4" />
            {t("addType")}
          </button>
        </div>
      </div>

      {error && (
        <p className="border-red/30 bg-red-tint text-red-text mt-3 rounded-xl border px-3.5 py-2.5 text-[13px]">
          {error}
        </p>
      )}

      {adding && <AddTypeForm onDone={() => router.refresh()} onClose={() => setAdding(false)} />}

      <div className="mt-6 flex flex-col gap-6">
        {groups.map(([group, rows]) => (
          <div key={group}>
            <p className="text-text-3 mb-2 text-[11.5px] font-medium tracking-wide uppercase">
              {group}
            </p>
            <div className="flex flex-wrap gap-2">
              {rows.map((it) => (
                <span key={it.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggle(it)}
                    title={it.active ? t("typeActiveHint") : t("typeInactiveHint")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                      it.active
                        ? "border-line-blue bg-blue-tint text-text"
                        : "border-line-1 text-text-3 hover:text-text line-through",
                      it.is_custom && "pr-7",
                    )}
                  >
                    {it.name}
                  </button>
                  {it.is_custom && (
                    <button
                      type="button"
                      onClick={() => remove(it)}
                      aria-label={t("delete")}
                      className="text-text-3 hover:text-red-text absolute top-1/2 right-1.5 -translate-y-1/2 text-[13px]"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  function AddTypeForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
    const [name, setName] = useState("");
    const [group, setGroup] = useState("");
    const [saving, startSave] = useTransition();
    const groupNames = [...new Set(types.map((x) => x.group_name))];

    function submit(e: React.FormEvent) {
      e.preventDefault();
      startSave(async () => {
        const res = await createProjectTypeAction({ name: name.trim(), group_name: group.trim() });
        if (res.ok) {
          onClose();
          onDone();
        } else setError(res.error);
      });
    }
    return (
      <form
        onSubmit={submit}
        className="glass mt-4 flex flex-wrap items-center gap-2 rounded-2xl p-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("phTypeName")}
          required
          className={`${inputCls} flex-1`}
        />
        <input
          list="pt-groups"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder={t("phGroup")}
          required
          className={`${inputCls} flex-1`}
        />
        <datalist id="pt-groups">
          {groupNames.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary h-9 rounded-full px-4 text-[13px] font-medium disabled:opacity-60"
        >
          {t("add")}
        </button>
      </form>
    );
  }
}
