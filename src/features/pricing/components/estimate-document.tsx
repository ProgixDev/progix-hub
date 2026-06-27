import { useTranslations } from "next-intl";
import { DOC_TERMS, estimateDocModel } from "../document";
import type { Estimate } from "../types";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

/** The client deliverable — variant "quote" (summarized + price range) or "spec" (cahier des charges). */
export function EstimateDocument({
  estimate,
  variant,
}: {
  estimate: Estimate;
  variant: "quote" | "spec";
}) {
  const t = useTranslations("estimateDoc");
  const m = estimateDocModel(estimate);
  const ecosystems = estimate.ecosystems.map((e) => t(`eco_${e}` as "eco_web")).join(", ") || "—";

  const Meta = (
    <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
      <Field label={t("project")} value={estimate.name} />
      <Field label={t("client")} value={estimate.client_name || "—"} />
      <Field label={t("projectType")} value={estimate.project_type || "—"} />
      <Field label={t("platforms")} value={ecosystems} />
    </div>
  );

  const Terms = (
    <div className="mt-8 break-inside-avoid">
      <H>{t("scopeControl")}</H>
      <Term title={t("termIncludedT")} body={t("termIncludedB")} />
      <Term title={t("termRevisionsT")} body={t("termRevisionsB", { n: DOC_TERMS.revisions })} />
      <Term title={t("termChangeT")} body={t("termChangeB")} highlight />
      <Term title={t("termClientT")} body={t("termClientB", { n: DOC_TERMS.feedbackDays })} />
      <Term title={t("termAssumptionsT")} body={t("termAssumptionsB")} />
      <Term title={t("termScopeT")} body={t("termScopeB")} />
    </div>
  );

  const Investment = (
    <div className="mt-8 break-inside-avoid rounded-xl border border-zinc-200 bg-zinc-50 p-5">
      <div className="flex items-end justify-between">
        <span className="text-[13px] font-medium text-zinc-500">{t("investment")}</span>
        <span className="text-[24px] font-semibold text-zinc-900 tabular-nums">
          {money(m.priceLow)} – {money(m.priceHigh)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[13px] text-zinc-500">
        <span>{t("timeline")}</span>
        <span className="tabular-nums">
          {t("daysWeeks", { d: m.totals.totalDays, w: m.totals.weeks })}
        </span>
      </div>
      <p className="mt-3 text-[11.5px] text-zinc-400">
        {t("validUntil", { n: DOC_TERMS.validityDays })}
      </p>
    </div>
  );

  const Signature = (
    <div className="mt-10 grid break-inside-avoid grid-cols-2 gap-8">
      {[t("clientSignature"), t("providerSignature")].map((who) => (
        <div key={who}>
          <div className="h-12 border-b border-zinc-300" />
          <p className="mt-1 text-[12px] text-zinc-500">{who}</p>
        </div>
      ))}
    </div>
  );

  return (
    <article className="mx-auto max-w-[820px] bg-white px-10 py-12 text-zinc-900 print:px-0 print:py-0">
      <header className="mb-8 flex items-start justify-between border-b border-zinc-200 pb-5">
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-zinc-900">Progix</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">
            {variant === "quote" ? t("quoteTitle") : t("specTitle")}
          </h1>
        </div>
        <p className="text-[12px] text-zinc-500">{estimate.created_at.slice(0, 10)}</p>
      </header>

      {Meta}

      {variant === "quote" ? (
        <>
          <p className="mb-6 text-[13.5px] leading-relaxed text-zinc-600">{t("introQuote")}</p>
          <H>{t("summary")}</H>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="py-1.5 font-medium">{t("category")}</th>
                <th className="py-1.5 text-right font-medium">{t("items")}</th>
                <th className="py-1.5 text-right font-medium">{t("price")}</th>
              </tr>
            </thead>
            <tbody>
              {m.byCategory.map((c) => (
                <tr key={c.category} className="border-b border-zinc-100">
                  <td className="py-1.5">{c.category}</td>
                  <td className="py-1.5 text-right tabular-nums">{c.blocks.length}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {c.subtotal > 0 ? money(c.subtotal) : t("incl")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {Investment}
          {Terms}
          {Signature}
        </>
      ) : (
        <>
          <H>{t("overview")}</H>
          <p className="mb-6 text-[13.5px] leading-relaxed text-zinc-600">
            {t("introSpec", {
              type: estimate.project_type || t("theProduct"),
              platforms: ecosystems,
            })}
          </p>

          <H>{t("scope")}</H>
          {m.byCategory.map((c) => (
            <div key={c.category} className="mb-4 break-inside-avoid">
              <p className="mb-1 text-[13px] font-semibold text-zinc-800">{c.category}</p>
              <ul className="text-[12.5px] text-zinc-600">
                {c.blocks.map((b) => (
                  <li
                    key={b.item_id}
                    className="flex justify-between border-b border-zinc-100 py-1"
                  >
                    <span>
                      {b.name}
                      {b.qty > 1 && (
                        <span className="text-zinc-400"> {t("qty", { n: b.qty })}</span>
                      )}
                      {b.block_type === "option" && (
                        <span className="text-zinc-400"> · {t("optionTag")}</span>
                      )}
                    </span>
                    <span className="text-zinc-500 tabular-nums">
                      {b.is_free ? t("incl") : money(b.unit_price * b.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {m.essentials.length > 0 && (
            <div className="mb-4 break-inside-avoid">
              <H>{t("essentialsSection")}</H>
              <p className="text-[12.5px] text-zinc-600">
                {m.essentials.map((e) => e.name).join(" · ")} — {t("incl")}
              </p>
            </div>
          )}

          <H>{t("timelineSection")}</H>
          <p className="text-[13px] text-zinc-600">
            {t("daysWeeks", { d: m.totals.totalDays, w: m.totals.weeks })}
          </p>

          {Investment}
          {Terms}
          {Signature}
        </>
      )}

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-[11px] text-zinc-400">
        {t("footer")}
      </footer>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-zinc-400">{label}</span>
      <p className="font-medium text-zinc-900">{value}</p>
    </div>
  );
}
function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-2 mb-2 text-[12px] font-semibold tracking-wide text-zinc-400 uppercase">
      {children}
    </h2>
  );
}
function Term({ title, body, highlight }: { title: string; body: string; highlight?: boolean }) {
  return (
    <div className={`mb-2.5 ${highlight ? "rounded-lg bg-amber-50 p-3" : ""}`}>
      <p className="text-[13px] font-semibold text-zinc-800">{title}</p>
      <p className="text-[12.5px] leading-relaxed text-zinc-600">{body}</p>
    </div>
  );
}
