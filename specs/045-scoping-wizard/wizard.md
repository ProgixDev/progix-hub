# Scoping & Pricing Wizard — design

**Status:** design (step 2 of the pricing epic — step 1, the catalog, is shipped)
**Owner:** Achref · for leadership (Achref, Ilyes, Morgane)
**Currency:** USD ($)

---

## 1. Goal

Turn a vague client idea into a **concrete, priced, scoped project** in one guided flow — used by leadership in the **2nd client meeting** (after the closer's rough estimate).

It outputs two things:

1. **A price** — calculated from a granular catalog, not guessed.
2. **A cahier des charges** — every feature/screen in detail, grouped into phases & sprints, with a timeline, and the scope‑control terms (revision limit + change‑order rule) baked in.

### Why (the problems it fixes)

- We **under‑scope** before signing → projects run long.
- We **price randomly** → we leave money on the table.
- We **eat scope creep** → we never even state the modification limit.

### The commercial target

- Today: projects land **$3k–$10k**.
- Goal: target the **$10k–$20k** market; acceptable band **$3k–$20k**.
- **Calibration rule:** set the catalog prices so a _typical_ project of each type (e.g. a restaurant app) totals **~$12k–$15k**. The per‑block examples below ($1 a screen, $25 auth) are illustrative — the real numbers are whatever, summed across a real project, land us in the target band with margin.
- The wizard shows a **live target‑band indicator** (red below $10k, green $10–20k) so we price _into_ the band instead of underselling.

---

## 2. Core concepts (the building blocks)

The catalog is made of **blocks**. To reach the ~2000‑block granularity we want, blocks come in a few **types**:

| Block type               | What it is                       | Priced?                                        | Example                                                                         |
| ------------------------ | -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| **Essential / skeleton** | The baseline every app has       | **$0** (documented, not charged)               | Splash screen, onboarding, basic navigation, error/empty states                 |
| **Screen**               | Any screen, even empty           | small base each (e.g. **$1** ex.) × complexity | Home, profile, settings, a list, a detail page                                  |
| **Feature**              | A capability                     | priced + effort                                | Auth, payments, chat, search, push                                              |
| **Feature option**       | A variant that adds to a feature | adds to the feature                            | Auth: email/password (**$25**) → + OAuth (total **$100**) → + 2FA, + magic link |
| **Cross‑cutting**        | Project‑wide options             | priced (often per‑unit)                        | Each extra language, custom design, admin dashboard, devops                     |

Each block carries: **category, name, base price, effort (days), type, free flag, platform applicability, complexity tiers**.

A **preset** (project type) is a named bundle of default blocks — so you start from "restaurant app," not a blank page.

---

## 3. The wizard — step by step

### Step 0 · Project basics

Project name, client name, (optional) link to a hub project, optional target budget. Sets the header of the quote + cahier des charges.

### Step 1 · Ecosystem(s)

Choose one **or several** at once:

- **Web app**
- **Mobile app** (iOS + Android)
- **Desktop software** (macOS / Windows)

Picking more than one applies a **platform factor** — shared backend counted once, but platform‑specific build effort counted per platform. (e.g. web + mobile ≈ one backend + two front‑ends.)

### Step 2 · Project type (preset)

Pick the category: **restaurant app, VTC / ride‑hailing, supermarket, e‑commerce, CRM, intranet, marketplace, booking, social, SaaS dashboard, …**
→ The wizard pre‑loads that type's **typical screens + features** as a starting selection you then adjust. (This is what stops us forgetting standard features and what makes the meeting fast.)

### Step 3 · Skeleton / essentials (free baseline)

Shows the standard skeleton (splash, onboarding, navigation, error states) at **$0** — included and documented so the client sees what's covered, but not charged.

### Step 4 · Screens

Go through the screens — every screen, even empty, counts (e.g. **$1** base each, × **simple / standard / complex**). Add/remove screens; the preset already filled the obvious ones.

### Step 5 · Features — one by one, by category

Walk each category and toggle features + their options:

- **Auth:** email/password ($25) → + OAuth (total $100) → + 2FA → + SSO
- **Payments:** checkout → subscriptions → multi‑currency → invoices
- **Realtime:** chat → calls → presence
- **Notifications:** push → email → SMS
- **Search, Maps/geo, Media/upload, Roles & permissions, Admin / back‑office, AI, Analytics, CMS, Scheduling/booking …**
  Each toggle updates the running price + effort live. This granular walk is the core — it's why we'll have ~2000 blocks.

### Step 6 · Cross‑cutting options

- **Languages** (per extra language)
- **Design level** (template UI vs fully custom)
- **Admin dashboard / back‑office**
- **Integrations** (third‑party services)
- **DevOps / hosting / deployment**
- **QA / testing level**
- **Timeline pressure** (rush multiplier) and **risk buffer**

### Step 7 · Review & adjust

The full itemized list + **total price**, **total effort → timeline (sprints/weeks)**, and the **target‑band indicator**. Here you can apply a global multiplier or a negotiated discount, and set the **revision limit** (e.g. "2 rounds included") and **change‑order rule**.

### Step 8 · Export

- **Quote** — itemized or summarized, shown as a **range with a buffer** (pros never quote one exact number).
- **Cahier des charges** — all selected features/screens in detail, grouped into **phases & sprints**, with the **timeline**, plus the **scope section**: what's included, assumptions, client responsibilities, **revision limit**, and **"any change beyond this scope = a written, re‑priced change order."**

---

## 4. Pricing model (the math)

```
Item line      = base_price × quantity × complexity_multiplier
Features total  = Σ feature lines + Σ option lines
Screens total   = Σ screen lines           (essentials = $0)
Platform factor = 1 + 0.6 per extra front-end platform   (tunable)
Cross-cutting   = languages + design + admin + devops + …
Subtotal        = (features + screens) × platform_factor + cross-cutting
Buffer          = subtotal × risk %        (10–30%, default 15%)
Price (range)   = [subtotal, subtotal + buffer]   − negotiated discount
```

- **Complexity tiers** per item: simple ×0.5, standard ×1, complex ×2 (tunable).
- **Effort** mirrors the same sum in **days** → ÷ team velocity → **sprints → weeks** (+ buffer + calendar) = the **timeline**.
- All multipliers/factors live in **settings** so leadership tunes them without code.

---

## 5. Catalog structure to support ~2000 blocks

Extends the shipped `pricing_catalog_items` with:

- **`block_type`** — `essential` | `screen` | `feature` | `option` | `crosscutting`
- **`parent_id`** — options hang under their feature (auth → OAuth, 2FA)
- **`platforms`** — which ecosystems it applies to (web/mobile/desktop)
- **`is_free`** — essentials priced $0
- **complexity multipliers** (or per‑tier prices)
- **Presets** — a `project_presets` table: type → default block list

Leadership builds this **category by category** on `/pricing` (and a preset editor). The wizard reads it.

---

## 6. Build plan (incremental — we go step by step)

1. **Catalog v2** — add `block_type`, `parent_id` (options), `platforms`, `is_free` to the catalog + the `/pricing` editor (group features → options, mark essentials free). _(builds on step 1)_
2. **Presets** — project‑type templates (restaurant, VTC, …) → default block bundles.
3. **The wizard UI** — steps 0–7, live price + effort + target‑band indicator, save as a named **estimate**.
4. **Exports** — the quote + the cahier des charges (with scope/revision/change‑order clauses).
5. **Close the loop** — accepted estimate → seed the project's phases/tasks in the playground; change requests re‑priced from the catalog.

---

## 7. Open questions

- **Velocity:** how many "effort days" does the team really deliver per week? (needed to turn effort → timeline) — start with a tunable default.
- **Platform factor & complexity multipliers:** confirm the default numbers in §4.
- **Quote granularity to the client:** itemized (every block) or summarized (by category/phase)? Probably summarized to the client, itemized internally.
- **Presets first list:** which project types to seed first (restaurant, VTC, supermarket, e‑commerce, CRM, intranet…?).
