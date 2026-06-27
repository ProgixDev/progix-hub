"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import {
  createPricingItemAction,
  deletePricingItemAction,
  importPricingCsvAction,
  syncFeatureBlocksAction,
  updatePricingItemAction,
} from "../actions";
import type { BlockType, PricingItem } from "../types";

const numCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text w-full rounded-lg border px-2 py-1 text-right text-[12.5px] tabular-nums outline-none focus:ring-2 focus:ring-[var(--blue-ring)] disabled:opacity-40";
const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-lg border px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

const BLOCK_BADGE: Record<BlockType, { short: string; cls: string }> = {
  essential: { short: "ESS", cls: "bg-bg-inset text-text-3" },
  screen: { short: "SCR", cls: "bg-blue-tint text-blue-text" },
  feature: { short: "FEA", cls: "bg-bg-inset text-text-2" },
  option: { short: "OPT", cls: "bg-bg-inset text-text-3" },
  crosscutting: { short: "X", cls: "bg-bg-inset text-text-3" },
};
const BLOCK_TYPES: BlockType[] = ["essential", "screen", "feature", "option", "crosscutting"];

export function PricingCatalog({ items: initial }: { items: PricingItem[] }) {
  const t = useTranslations("pricing");
  const router = useRouter();
  const [items, setItems] = useState<PricingItem[]>(initial);
  // Re-sync local state when the server data changes (after import / add / delete refresh). Inline
  // edits don't touch `initial`, so they aren't clobbered. (React's reset-state-on-prop-change pattern.)
  const sig = useMemo(
    () => initial.map((i) => `${i.id}:${i.base_price}:${i.effort_days}:${i.is_free}`).join("|"),
    [initial],
  );
  const prevSig = useRef(sig);
  if (sig !== prevSig.current) {
    prevSig.current = sig;
    setItems(initial);
  }
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setNotice(null);
    start(async () => {
      const text = await file.text();
      const res = await importPricingCsvAction(text);
      if (res.ok) {
        setNotice(
          t("importDone", { inserted: res.inserted, updated: res.updated, skipped: res.skipped }),
        );
        router.refresh();
      } else setError(res.error);
    });
  }

  const query = q.trim().toLowerCase();

  // Build per-category trees: top-level items + their nested options.
  const { groups, childrenOf } = useMemo(() => {
    const childrenOf = new Map<string, PricingItem[]>();
    for (const it of items) {
      if (it.parent_id) {
        const c = childrenOf.get(it.parent_id) ?? [];
        c.push(it);
        childrenOf.set(it.parent_id, c);
      }
    }
    const byCat = new Map<string, PricingItem[]>();
    for (const it of items) {
      if (it.parent_id) continue;
      const g = byCat.get(it.category) ?? [];
      g.push(it);
      byCat.set(it.category, g);
    }
    const groups = [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return { groups, childrenOf };
  }, [items]);

  function matchTree(it: PricingItem): boolean {
    if (!query) return true;
    if (it.name.toLowerCase().includes(query)) return true;
    return (childrenOf.get(it.id) ?? []).some((c) => c.name.toLowerCase().includes(query));
  }

  const priceOf = (it: PricingItem) => (it.is_free ? 0 : it.base_price);
  const totalPrice = items.reduce((a, i) => a + priceOf(i), 0);

  function setLocal(id: string, patch: Partial<PricingItem>) {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function persist(id: string, patch: Record<string, unknown>) {
    start(async () => {
      const res = await updatePricingItemAction(id, patch);
      if (!res.ok) setError(res.error);
    });
  }
  function toggleCat(c: string) {
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
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
  function addOption(feature: PricingItem) {
    start(async () => {
      const res = await createPricingItemAction({
        category: feature.category,
        name: "New option",
        block_type: "option",
        parent_id: feature.id,
      });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }
  function remove(id: string) {
    setItems((arr) => arr.filter((i) => i.id !== id && i.parent_id !== id));
    start(async () => {
      await deletePricingItemAction(id);
    });
  }

  function Row({ it, child }: { it: PricingItem; child?: boolean }) {
    const badge = BLOCK_BADGE[it.block_type];
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-1.5",
          child && "border-line/40 ml-6 border-l pl-3",
        )}
      >
        <span
          className={cn(
            "grid h-5 w-9 flex-none place-items-center rounded text-[9px] font-semibold",
            badge.cls,
          )}
        >
          {badge.short}
        </span>
        <span className="text-text min-w-0 flex-1 truncate text-[13px]">{it.name}</span>
        <select
          value={it.block_type}
          onChange={(e) => {
            setLocal(it.id, { block_type: e.target.value as BlockType });
            persist(it.id, { block_type: e.target.value });
          }}
          className="bg-bg-inset border-line-1 text-text-2 hidden h-7 rounded-lg border px-1.5 text-[11px] outline-none sm:block"
          aria-label={t("colType")}
        >
          {BLOCK_TYPES.map((b) => (
            <option key={b} value={b}>
              {t(`type_${b}` as "type_feature")}
            </option>
          ))}
        </select>
        <label className="text-text-3 flex flex-none items-center gap-1 text-[11px]">
          <input
            type="checkbox"
            checked={it.is_free}
            onChange={(e) => {
              setLocal(it.id, { is_free: e.target.checked });
              persist(it.id, { is_free: e.target.checked });
            }}
            className="size-3.5"
          />
          {t("free")}
        </label>
        <input
          type="number"
          min={0}
          value={it.is_free ? "" : it.base_price || ""}
          placeholder="0"
          disabled={it.is_free}
          onChange={(e) => setLocal(it.id, { base_price: Number(e.target.value) })}
          onBlur={() => persist(it.id, { base_price: it.base_price })}
          className={`${numCls} w-[84px] flex-none`}
        />
        <input
          type="number"
          min={0}
          step={0.5}
          value={it.effort_days || ""}
          placeholder="0"
          onChange={(e) => setLocal(it.id, { effort_days: Number(e.target.value) })}
          onBlur={() => persist(it.id, { effort_days: it.effort_days })}
          className={`${numCls} w-[72px] flex-none`}
        />
        {!child && it.block_type === "feature" ? (
          <button
            type="button"
            onClick={() => addOption(it)}
            title={t("addOption")}
            className="text-text-3 hover:text-text grid size-7 flex-none place-items-center rounded-full text-[15px]"
          >
            +
          </button>
        ) : (
          <span className="w-7 flex-none" />
        )}
        {it.is_custom ? (
          <button
            type="button"
            onClick={() => remove(it.id)}
            aria-label={t("delete")}
            className="text-text-3 hover:text-red-text grid size-7 flex-none place-items-center rounded-full text-[15px]"
          >
            ×
          </button>
        ) : (
          <span className="w-7 flex-none" />
        )}
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <p className="t-eyebrow">{t("eyebrow")}</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-text text-[26px] font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-text-3 mt-1 text-[13px]">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/pricing/export"
            className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors"
          >
            {t("exportCsv")}
          </a>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors disabled:opacity-60"
          >
            {t("importCsv")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onImportFile}
            className="hidden"
          />
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

      {/* search + totals */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="border-line-1 bg-bg-inset flex h-9 flex-1 items-center gap-2 rounded-full border px-3.5">
          <SearchIcon className="text-text-3 size-4 flex-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPh")}
            className="text-text placeholder:text-text-3 h-full w-full bg-transparent text-[13px] outline-none"
          />
        </div>
        <span className="text-text-3 text-[12.5px] tabular-nums">
          {t("itemsCount", { n: items.length })} ·{" "}
          {t("totalPrice", { v: totalPrice.toLocaleString() })}
        </span>
      </div>

      {error && (
        <p className="border-red/30 bg-red-tint text-red-text mt-3 rounded-xl border px-3.5 py-2.5 text-[13px]">
          {error}
        </p>
      )}
      {notice && (
        <p className="border-line-blue bg-blue-tint text-text mt-3 rounded-xl border px-3.5 py-2.5 text-[13px]">
          {notice}
        </p>
      )}

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
        <div className="mt-5 flex flex-col gap-2.5">
          {groups.map(([category, rows]) => {
            const top = rows.filter(matchTree);
            if (query && top.length === 0) return null;
            const expanded = open.has(category) || query.length > 0;
            const count =
              rows.length + rows.reduce((a, r) => a + (childrenOf.get(r.id)?.length ?? 0), 0);
            const sub = rows.reduce(
              (a, r) =>
                a + priceOf(r) + (childrenOf.get(r.id) ?? []).reduce((b, c) => b + priceOf(c), 0),
              0,
            );
            return (
              <div key={category} className="glass overflow-hidden rounded-2xl">
                <button
                  type="button"
                  onClick={() => toggleCat(category)}
                  className="hover:bg-bg-inset flex w-full items-center justify-between px-4 py-2.5 transition-colors"
                >
                  <span className="text-text flex items-center gap-2 text-[13px] font-semibold">
                    <span className="text-text-3 text-[11px]">{expanded ? "▾" : "▸"}</span>
                    {category}
                    <span className="text-text-3 text-[11.5px] font-normal">{count}</span>
                  </span>
                  <span className="text-text-3 text-[11.5px] tabular-nums">
                    {t("groupTotal", { v: sub.toLocaleString() })}
                  </span>
                </button>
                {expanded && (
                  <div className="border-line border-t py-1">
                    {top.map((it) => (
                      <div key={it.id}>
                        <Row it={it} />
                        {(childrenOf.get(it.id) ?? [])
                          .filter(
                            (c) =>
                              !query ||
                              c.name.toLowerCase().includes(query) ||
                              it.name.toLowerCase().includes(query),
                          )
                          .map((c) => (
                            <Row key={c.id} it={c} child />
                          ))}
                      </div>
                    ))}
                  </div>
                )}
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
    const [blockType, setBlockType] = useState<BlockType>("feature");
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
          block_type: blockType,
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
        className="glass mt-4 grid grid-cols-1 gap-2 rounded-2xl p-4 sm:grid-cols-[1fr_1fr_auto_90px_80px_auto]"
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
        <select
          value={blockType}
          onChange={(e) => setBlockType(e.target.value as BlockType)}
          className={inputCls}
        >
          {BLOCK_TYPES.map((b) => (
            <option key={b} value={b}>
              {t(`type_${b}` as "type_feature")}
            </option>
          ))}
        </select>
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
