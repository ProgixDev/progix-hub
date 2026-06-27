"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { saveEstimateAction } from "../actions";
import { computeTotals } from "../calc";
import type { Estimate, EstimateSelection, PricingItem, ProjectType } from "../types";

const ECOSYSTEMS = ["web", "mobile", "desktop"] as const;
const field =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--blue-ring)]";

export function EstimateWizard({
  items,
  projectTypes,
  existing,
}: {
  items: PricingItem[];
  projectTypes: ProjectType[];
  existing?: Estimate | null;
}) {
  const t = useTranslations("pricing");
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [clientName, setClientName] = useState(existing?.client_name ?? "");
  const [projectType, setProjectType] = useState(existing?.project_type ?? "");
  const [ecosystems, setEcosystems] = useState<string[]>(existing?.ecosystems ?? ["web"]);
  const [sel, setSel] = useState<Map<string, number>>(
    () => new Map((existing?.selections ?? []).map((s) => [s.item_id, s.qty])),
  );
  const [bufferPct, setBufferPct] = useState(existing?.buffer_pct ?? 15);
  const [velocity, setVelocity] = useState(existing?.velocity ?? 10);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const query = q.trim().toLowerCase();
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const { groups, childrenOf } = useMemo(() => {
    const childrenOf = new Map<string, PricingItem[]>();
    for (const it of items)
      if (it.parent_id) {
        const c = childrenOf.get(it.parent_id) ?? [];
        c.push(it);
        childrenOf.set(it.parent_id, c);
      }
    const byCat = new Map<string, PricingItem[]>();
    for (const it of items) {
      if (it.parent_id) continue;
      const g = byCat.get(it.category) ?? [];
      g.push(it);
      byCat.set(it.category, g);
    }
    return { groups: [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0])), childrenOf };
  }, [items]);

  const selections: EstimateSelection[] = useMemo(() => {
    const out: EstimateSelection[] = [];
    for (const [id, qty] of sel) {
      const it = itemById.get(id);
      if (!it) continue;
      out.push({
        item_id: it.id,
        name: it.name,
        category: it.category,
        block_type: it.block_type,
        unit_price: it.base_price,
        unit_days: it.effort_days,
        qty,
        is_free: it.is_free,
      });
    }
    return out;
  }, [sel, itemById]);

  const totals = useMemo(
    () => computeTotals(selections, ecosystems, bufferPct, velocity),
    [selections, ecosystems, bufferPct, velocity],
  );

  function toggleItem(id: string) {
    setSel((m) => {
      const n = new Map(m);
      if (n.has(id)) n.delete(id);
      else n.set(id, 1);
      return n;
    });
  }
  function setQty(id: string, qty: number) {
    setSel((m) => new Map(m).set(id, Math.max(1, qty)));
  }
  function toggleEco(e: string) {
    setEcosystems((arr) => (arr.includes(e) ? arr.filter((x) => x !== e) : [...arr, e]));
  }
  function toggleCat(c: string) {
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });
  }
  function matchTree(it: PricingItem): boolean {
    if (!query) return true;
    if (it.name.toLowerCase().includes(query)) return true;
    return (childrenOf.get(it.id) ?? []).some((c) => c.name.toLowerCase().includes(query));
  }

  function save() {
    setError(null);
    startSave(async () => {
      const res = await saveEstimateAction({
        id: existing?.id,
        name: name.trim(),
        client_name: clientName.trim(),
        ecosystems,
        project_type: projectType,
        selections,
        buffer_pct: bufferPct,
        velocity,
      });
      if (res.ok) router.push("/pricing/estimates");
      else setError(res.error);
    });
  }

  const bandCls =
    totals.band === "in"
      ? "border-green/40 bg-green-tint text-green-text"
      : totals.band === "below"
        ? "border-amber/40 bg-amber-tint text-amber-text"
        : "border-line-blue bg-blue-tint text-blue-text";

  function SelectRow({ it, child }: { it: PricingItem; child?: boolean }) {
    const on = sel.has(it.id);
    const qty = sel.get(it.id) ?? 1;
    return (
      <div className={cn("flex items-center gap-2 px-4 py-1.5", child && "ml-6")}>
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="checkbox"
            checked={on}
            onChange={() => toggleItem(it.id)}
            className="size-4"
          />
          <span className="text-text min-w-0 truncate text-[13px]">{it.name}</span>
        </label>
        {it.is_free ? (
          <span className="text-text-3 text-[11px]">{t("free")}</span>
        ) : (
          <span className="text-text-3 text-[12px] tabular-nums">
            ${it.base_price.toLocaleString()}
          </span>
        )}
        {on && (
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(it.id, Number(e.target.value))}
            className="bg-bg-inset border-line-1 text-text h-7 w-14 rounded-lg border px-2 text-right text-[12px] tabular-nums outline-none"
            aria-label={t("qty")}
          />
        )}
      </div>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <p className="t-eyebrow">{t("wizardEyebrow")}</p>
        <h1 className="text-text text-[24px] font-semibold tracking-tight">
          {existing ? t("wizardEditTitle") : t("wizardTitle")}
        </h1>

        {/* basics */}
        <div className="glass mt-5 grid grid-cols-1 gap-3 rounded-2xl p-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-text-3 mb-1 block text-[12px]">{t("estName")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="text-text-3 mb-1 block text-[12px]">{t("estClient")}</span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={field}
            />
          </label>
          <div className="sm:col-span-2">
            <span className="text-text-3 mb-1 block text-[12px]">{t("ecosystems")}</span>
            <div className="flex flex-wrap gap-2">
              {ECOSYSTEMS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleEco(e)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    ecosystems.includes(e)
                      ? "border-line-blue bg-blue-tint text-text"
                      : "border-line-1 text-text-3 hover:text-text",
                  )}
                >
                  {t(`eco_${e}` as "eco_web")}
                </button>
              ))}
            </div>
          </div>
          <label className="block sm:col-span-2">
            <span className="text-text-3 mb-1 block text-[12px]">{t("projectType")}</span>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className={field}
            >
              <option value="">{t("projectTypeNone")}</option>
              {projectTypes.map((pt) => (
                <option key={pt.id} value={pt.name}>
                  {pt.group_name} · {pt.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* feature picker */}
        <div className="mt-5">
          <div className="border-line-1 bg-bg-inset mb-3 flex h-9 items-center gap-2 rounded-full border px-3.5">
            <SearchIcon className="text-text-3 size-4 flex-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPh")}
              className="text-text placeholder:text-text-3 h-full w-full bg-transparent text-[13px] outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            {groups.map(([category, rows]) => {
              const top = rows.filter(matchTree);
              if (query && top.length === 0) return null;
              const expanded = open.has(category) || query.length > 0;
              const chosen = rows.filter((r) => sel.has(r.id)).length;
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
                    </span>
                    {chosen > 0 && (
                      <span className="text-blue-text text-[11.5px]">
                        {t("chosen", { n: chosen })}
                      </span>
                    )}
                  </button>
                  {expanded && (
                    <div className="border-line border-t py-1">
                      {top.map((it) => (
                        <div key={it.id}>
                          <SelectRow it={it} />
                          {(childrenOf.get(it.id) ?? [])
                            .filter(
                              (c) =>
                                !query ||
                                c.name.toLowerCase().includes(query) ||
                                it.name.toLowerCase().includes(query),
                            )
                            .map((c) => (
                              <SelectRow key={c.id} it={c} child />
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* sticky summary */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="glass flex flex-col gap-3 rounded-2xl p-4">
          <p className="text-text-3 text-[12px]">{t("summary")}</p>
          <div className="text-text-3 flex justify-between text-[12.5px]">
            <span>{t("selectedBlocks")}</span>
            <span className="tabular-nums">{sel.size}</span>
          </div>
          <div className="text-text-3 flex justify-between text-[12.5px]">
            <span>{t("subtotal")}</span>
            <span className="tabular-nums">${totals.subtotal.toLocaleString()}</span>
          </div>
          {totals.platformFactor > 1 && (
            <div className="text-text-3 flex justify-between text-[12.5px]">
              <span>{t("platformFactor")}</span>
              <span className="tabular-nums">×{totals.platformFactor.toFixed(1)}</span>
            </div>
          )}
          <label className="text-text-3 flex items-center justify-between text-[12.5px]">
            <span>{t("bufferPct")}</span>
            <input
              type="number"
              min={0}
              max={100}
              value={bufferPct}
              onChange={(e) => setBufferPct(Number(e.target.value))}
              className="bg-bg-inset border-line-1 text-text h-7 w-16 rounded-lg border px-2 text-right text-[12px] tabular-nums outline-none"
            />
          </label>

          <div className="border-line mt-1 border-t pt-3">
            <p className="text-text text-[24px] font-semibold tabular-nums">
              ${totals.totalPrice.toLocaleString()}
            </p>
            <span
              className={cn(
                "mt-1 inline-block rounded-full border px-2.5 py-1 text-[11px]",
                bandCls,
              )}
            >
              {t(`band_${totals.band}` as "band_in")}
            </span>
          </div>

          <div className="border-line mt-1 flex items-center justify-between border-t pt-3 text-[12.5px]">
            <span className="text-text-3">{t("timeline")}</span>
            <span className="text-text tabular-nums">
              {t("daysWeeks", { d: totals.totalDays, w: totals.weeks })}
            </span>
          </div>
          <label className="text-text-3 flex items-center justify-between text-[12px]">
            <span>{t("velocity")}</span>
            <input
              type="number"
              min={1}
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="bg-bg-inset border-line-1 text-text h-7 w-16 rounded-lg border px-2 text-right text-[12px] tabular-nums outline-none"
            />
          </label>

          {error && <p className="text-red-text text-[12px]">{error}</p>}
          <button
            type="button"
            onClick={save}
            disabled={saving || !name.trim() || sel.size === 0}
            className="btn-primary mt-1 h-10 rounded-full text-[13px] font-medium disabled:opacity-50"
          >
            {existing ? t("saveChanges") : t("saveEstimate")}
          </button>
        </div>
      </aside>
    </section>
  );
}
