"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { FEATURE_BLOCKS } from "@/lib/playground/feature-catalog";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "./csv";

export type PricingResult = { ok: true } | { ok: false; error: string };
export type ImportResult =
  | { ok: true; inserted: number; updated: number; skipped: number }
  | { ok: false; error: string };
type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

async function leadership(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user && (user.isSuperadmin || user.isLead || user.isGlobalPm) ? user : null;
}

/** Seed the catalog from the 141 feature blocks (idempotent — never overwrites prices). */
export async function syncFeatureBlocksAction(): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const supabase = await createClient();
  const rows = FEATURE_BLOCKS.map((b, i) => ({
    key: b.key,
    category: b.category,
    name: b.name,
    sort: i,
  }));
  const { error } = await supabase
    .from("pricing_catalog_items")
    .upsert(rows, { onConflict: "key", ignoreDuplicates: true });
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing");
  return { ok: true };
}

const BLOCK_TYPES = ["essential", "screen", "feature", "option", "crosscutting"] as const;
const PLATFORMS = ["web", "mobile", "desktop"] as const;

const updateSchema = z
  .object({
    base_price: z.number().min(0).max(10_000_000),
    effort_days: z.number().min(0).max(100_000),
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(60),
    active: z.boolean(),
    is_free: z.boolean(),
    block_type: z.enum(BLOCK_TYPES),
    platforms: z.array(z.enum(PLATFORMS)).max(3),
  })
  .partial();

export async function updatePricingItemAction(id: string, input: unknown): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const pid = z.string().uuid().safeParse(id);
  const parsed = updateSchema.safeParse(input);
  if (!pid.success || !parsed.success || Object.keys(parsed.data).length === 0) {
    return { ok: false, error: t("errorInvalid") };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_catalog_items")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", pid.data);
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing");
  return { ok: true };
}

const createSchema = z.object({
  category: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  base_price: z.number().min(0).max(10_000_000).default(0),
  effort_days: z.number().min(0).max(100_000).default(0),
  block_type: z.enum(BLOCK_TYPES).default("feature"),
  parent_id: z.string().uuid().nullable().default(null),
  is_free: z.boolean().default(false),
  platforms: z.array(z.enum(PLATFORMS)).max(3).default([]),
});

export async function createPricingItemAction(input: unknown): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("errorInvalid") };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_catalog_items")
    .insert({ ...parsed.data, is_custom: true, created_by: user.id });
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing");
  return { ok: true };
}

export async function deletePricingItemAction(id: string): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const pid = z.string().uuid().safeParse(id);
  if (!pid.success) return { ok: false, error: t("errorInvalid") };
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_catalog_items").delete().eq("id", pid.data);
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing");
  return { ok: true };
}

// ---- CSV import (bulk-load 2000+ blocks) ------------------------------------

const MAX_IMPORT_ROWS = 5000;

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function toBool(s: string): boolean {
  return ["1", "true", "yes", "y", "x", "oui"].includes(s.trim().toLowerCase());
}
function toPlatforms(s: string): string[] {
  return s
    .split(/[;,|]/)
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is "web" | "mobile" | "desktop" => (PLATFORMS as readonly string[]).includes(p));
}
function slugForKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const importRowSchema = z.object({
  category: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  block_type: z.enum(BLOCK_TYPES).catch("feature"),
  base_price: z.number().min(0).max(10_000_000).catch(0),
  effort_days: z.number().min(0).max(100_000).catch(0),
  is_free: z.boolean(),
  platforms: z.array(z.enum(PLATFORMS)).max(3),
  key: z.string().max(120),
  parent: z.string().max(120),
});

/** Bulk import the catalog from a CSV (header: key,category,name,block_type,base_price,effort_days,
 *  is_free,platforms,parent). Upserts by key; rows without a key get a stable synthetic key so
 *  re-imports update rather than duplicate. Two passes so options resolve their parent. */
export async function importPricingCsvAction(csvText: string): Promise<ImportResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  if (typeof csvText !== "string" || csvText.length > 5_000_000) {
    return { ok: false, error: t("errorInvalid") };
  }

  const rows = parseCsv(csvText);
  if (rows.length < 2) return { ok: false, error: t("errorCsvEmpty") };
  const header = (rows[0] ?? []).map(norm);
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(norm(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const cols = {
    key: idx("key"),
    category: idx("category", "categorie"),
    name: idx("name", "nom", "feature", "fonctionnalite"),
    block_type: idx("blocktype", "type"),
    base_price: idx("baseprice", "price", "prix"),
    effort_days: idx("effortdays", "effort", "days", "jours", "charge"),
    is_free: idx("isfree", "free", "gratuit"),
    platforms: idx("platforms", "platform", "plateformes"),
    parent: idx("parent"),
  };
  if (cols.category < 0 || cols.name < 0) return { ok: false, error: t("errorCsvColumns") };
  const data = rows.slice(1, 1 + MAX_IMPORT_ROWS);

  type Parsed = z.infer<typeof importRowSchema> & { computedKey: string };
  const parsed: Parsed[] = [];
  let skipped = 0;
  for (const r of data) {
    const get = (i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    const res = importRowSchema.safeParse({
      category: get(cols.category),
      name: get(cols.name),
      block_type: get(cols.block_type),
      base_price: Number(get(cols.base_price).replace(/[^0-9.]/g, "")) || 0,
      effort_days: Number(get(cols.effort_days).replace(/[^0-9.]/g, "")) || 0,
      is_free: toBool(get(cols.is_free)),
      platforms: toPlatforms(get(cols.platforms)),
      key: get(cols.key),
      parent: get(cols.parent),
    });
    if (!res.success) {
      skipped++;
      continue;
    }
    const v = res.data;
    const computedKey =
      v.key || `csv:${slugForKey(v.category)}:${slugForKey(v.parent || "")}:${slugForKey(v.name)}`;
    parsed.push({ ...v, computedKey });
  }
  if (parsed.length === 0) return { ok: false, error: t("errorCsvEmpty") };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("pricing_catalog_items")
    .select("id,key,category,name");
  const keyToId = new Map<string, string>();
  const catNameToId = new Map<string, string>();
  const existingKeys = new Set<string>();
  for (const e of (existing ?? []) as {
    id: string;
    key: string | null;
    category: string;
    name: string;
  }[]) {
    if (e.key) {
      keyToId.set(e.key, e.id);
      existingKeys.add(e.key);
    }
    catNameToId.set(`${e.category.toLowerCase()}|${e.name.toLowerCase()}`, e.id);
  }

  let inserted = 0;
  let updated = 0;
  for (const p of parsed) existingKeys.has(p.computedKey) ? updated++ : inserted++;

  // created_by is intentionally omitted: on an upsert it would reassign authorship of existing/seeded
  // rows to the importer on every re-import. Inserts default it to null; updates keep the original.
  function payload(p: Parsed, parentId: string | null) {
    return {
      key: p.computedKey,
      category: p.category,
      name: p.name,
      block_type: p.block_type,
      base_price: p.base_price,
      effort_days: p.effort_days,
      is_free: p.is_free,
      platforms: p.platforms,
      parent_id: parentId,
      is_custom: p.computedKey.startsWith("csv:"),
      updated_at: new Date().toISOString(),
    };
  }

  // Pass 1 — non-options (so their ids exist before options resolve a parent).
  const firstPass = parsed.filter((p) => p.block_type !== "option").map((p) => payload(p, null));
  if (firstPass.length > 0) {
    const { data: up, error } = await supabase
      .from("pricing_catalog_items")
      .upsert(firstPass, { onConflict: "key" })
      .select("id,key,category,name");
    if (error) return { ok: false, error: t("errorFailed") };
    for (const e of (up ?? []) as { id: string; key: string; category: string; name: string }[]) {
      keyToId.set(e.key, e.id);
      catNameToId.set(`${e.category.toLowerCase()}|${e.name.toLowerCase()}`, e.id);
    }
  }

  // Pass 2 — options, resolving parent by name within the category.
  const optionRows = parsed
    .filter((p) => p.block_type === "option")
    .map((p) => {
      const parentId = p.parent
        ? (catNameToId.get(`${p.category.toLowerCase()}|${p.parent.toLowerCase()}`) ?? null)
        : null;
      return payload(p, parentId);
    });
  if (optionRows.length > 0) {
    const { error } = await supabase
      .from("pricing_catalog_items")
      .upsert(optionRows, { onConflict: "key" });
    if (error) return { ok: false, error: t("errorFailed") };
  }

  revalidatePath("/pricing");
  return { ok: true, inserted, updated, skipped };
}

// ---- Project types (the wizard's project-type step) -------------------------

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "type"
  );
}

const typeCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  group_name: z.string().trim().min(1).max(60),
});

export async function createProjectTypeAction(input: unknown): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const parsed = typeCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("errorInvalid") };
  const supabase = await createClient();
  const slug = `${slugify(parsed.data.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase
    .from("project_types")
    .insert({ ...parsed.data, slug, is_custom: true, sort: 999, created_by: user.id });
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing/types");
  return { ok: true };
}

const typeUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    group_name: z.string().trim().min(1).max(60),
    active: z.boolean(),
  })
  .partial();

export async function updateProjectTypeAction(id: string, input: unknown): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const pid = z.string().uuid().safeParse(id);
  const parsed = typeUpdateSchema.safeParse(input);
  if (!pid.success || !parsed.success || Object.keys(parsed.data).length === 0) {
    return { ok: false, error: t("errorInvalid") };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_types")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", pid.data);
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing/types");
  return { ok: true };
}

export async function deleteProjectTypeAction(id: string): Promise<PricingResult> {
  const t = await getTranslations("pricing");
  const user = await leadership();
  if (!user) return { ok: false, error: t("errorNotAuthorized") };
  const pid = z.string().uuid().safeParse(id);
  if (!pid.success) return { ok: false, error: t("errorInvalid") };
  const supabase = await createClient();
  const { error } = await supabase.from("project_types").delete().eq("id", pid.data);
  if (error) return { ok: false, error: t("errorFailed") };
  revalidatePath("/pricing/types");
  return { ok: true };
}
