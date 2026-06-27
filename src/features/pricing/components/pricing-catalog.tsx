"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { PlusIcon } from "@/components/ui/icons";
import {
  createPricingItemAction,
  deletePricingItemAction,
  syncFeatureBlocksAction,
  updatePricingItemAction,
} from "../actions";
import type { PricingItem } from "../types";

const numCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text w-full rounded-lg border px-2.5 py-1.5 text-right text-[13px] tabular-nums outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";
const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-lg border px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function PricingCatalog({ items: initial }: { items: PricingItem[] }) {
  const t = useTranslations("pricing");
  const router = useRouter();
  const [items, setItems] = useState<PricingItem[]>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const groups = useMemo(() => {
    const by = new Map<string, PricingItem[]>();
    for (const it of items) {
      const g = by.get(it.category) ?? [];
      g.push(it);
      by.set(it.category, g);
    }
    return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const totalPrice = items.reduce((a, i) => a + i.base_price, 0);
  const totalDays = items.reduce((a, i) => a + i.effort_days, 0);

  function setLocal(id: string, patch: Partial<PricingItem>) {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function persist(id: string, patch: { base_price?: number; effort_days?: number }) {
    start(async () => {
      const res = await updatePricingItemAction(id, patch);
      if (!res.ok) setError(res.error);
    });
  }

  function importBlocks() {
    setError(null);
    start(async () => {
      const res = await syncFeatureBlocksAction();
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }
  function remove(id: string) {
    setItems((arr) => arr.filter((i) => i.id !== id));
    start(async () => {
      await deletePricingItemAction(id);
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <p className="t-eyebrow">{t("eyebrow")}</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-text text-[26px] font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-text-3 mt-1 text-[13px]">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={importBlocks}
            disabled={pending}
            className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors disabled:opacity-60"
          >
            {t("import")}
          </button>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="btn-primary flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium"
          >
            <PlusIcon className="size-4" />
            {t("addItem")}
          </button>
        </div>
      </div>

      {error && (
        <p className="border-red/30 bg-red-tint text-red-text mt-3 rounded-xl border px-3.5 py-2.5 text-[13px]">
          {error}
        </p>
      )}

      {/* totals */}
      <div className="text-text-3 mt-4 flex gap-5 text-[12.5px]">
        <span>{t("itemsCount", { n: items.length })}</span>
        <span>{t("totalPrice", { v: totalPrice.toLocaleString() })}</span>
        <span>{t("totalDays", { d: totalDays.toLocaleString() })}</span>
      </div>

      {adding && <AddItemForm onDone={() => router.refresh()} onClose={() => setAdding(false)} />}

      {items.length === 0 ? (
        <div className="border-line-1 mt-6 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-text-2 text-[13.5px]">{t("emptyTitle")}</p>
          <button
            type="button"
            onClick={importBlocks}
            disabled={pending}
            className="btn-primary mt-3 inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium disabled:opacity-60"
          >
            {t("import")}
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map(([category, rows]) => {
            const sub = rows.reduce((a, i) => a + i.base_price, 0);
            const days = rows.reduce((a, i) => a + i.effort_days, 0);
            return (
              <div key={category} className="glass overflow-hidden rounded-2xl">
                <div className="border-line text-text-2 flex items-center justify-between border-b px-4 py-2.5">
                  <span className="text-[12.5px] font-semibold tracking-wide uppercase">
                    {category}
                  </span>
                  <span className="text-text-3 text-[11.5px] tabular-nums">
                    {t("groupSummary", { v: sub.toLocaleString(), d: days.toLocaleString() })}
                  </span>
                </div>
                {/* column headers */}
                <div className="text-text-3 hidden grid-cols-[1fr_110px_110px_36px] items-center gap-2 px-4 pt-2 text-[10.5px] font-medium tracking-wide uppercase sm:grid">
                  <span>{t("colFeature")}</span>
                  <span className="text-right">{t("colPrice")}</span>
                  <span className="text-right">{t("colEffort")}</span>
                  <span />
                </div>
                <ul className="divide-line/50 divide-y">
                  {rows.map((it) => (
                    <li
                      key={it.id}
                      className="grid grid-cols-[1fr_110px_110px_36px] items-center gap-2 px-4 py-2"
                    >
                      <span className="text-text min-w-0 truncate text-[13px]">{it.name}</span>
                      <input
                        type="number"
                        min={0}
                        value={it.base_price || ""}
                        placeholder="0"
                        onChange={(e) => setLocal(it.id, { base_price: Number(e.target.value) })}
                        onBlur={() => persist(it.id, { base_price: it.base_price })}
                        className={numCls}
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={it.effort_days || ""}
                        placeholder="0"
                        onChange={(e) => setLocal(it.id, { effort_days: Number(e.target.value) })}
                        onBlur={() => persist(it.id, { effort_days: it.effort_days })}
                        className={numCls}
                      />
                      {it.is_custom ? (
                        <button
                          type="button"
                          onClick={() => remove(it.id)}
                          aria-label={t("delete")}
                          className="text-text-3 hover:text-red-text grid size-8 place-items-center rounded-full text-[15px] transition-colors"
                        >
                          ×
                        </button>
                      ) : (
                        <span />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  function AddItemForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
    const [category, setCategory] = useState("");
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [days, setDays] = useState("");
    const [saving, startSave] = useTransition();
    const categories = [...new Set(items.map((i) => i.category))].sort();

    function submit(e: React.FormEvent) {
      e.preventDefault();
      startSave(async () => {
        const res = await createPricingItemAction({
          category: category.trim(),
          name: name.trim(),
          base_price: Number(price) || 0,
          effort_days: Number(days) || 0,
        });
        if (res.ok) {
          onClose();
          onDone();
        } else setError(res.error);
      });
    }

    return (
      <form
        onSubmit={submit}
        className="glass mt-4 grid grid-cols-1 gap-2 rounded-2xl p-4 sm:grid-cols-[1fr_1fr_110px_110px_auto]"
      >
        <input
          list="pricing-cats"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t("phCategory")}
          required
          className={inputCls}
        />
        <datalist id="pricing-cats">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("phName")}
          required
          className={inputCls}
        />
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={t("colPrice")}
          className={numCls}
        />
        <input
          type="number"
          min={0}
          step={0.5}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder={t("colEffort")}
          className={numCls}
        />
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
