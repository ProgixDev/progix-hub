# 002 — Supabase + GitHub OAuth setup (human prerequisite)

Do these once before `/implement-feature 002`. Nothing here is committed — secrets go in `.env.local` (gitignored) and GitHub Actions secrets only.

## 1. Create the Supabase project

1. https://supabase.com → New project (org: Progix). Name it `progix-hub`. Pick a region near the team. Save the database password.
2. Project Settings → API. Copy three values:
   - **Project URL** → `https://<ref>.supabase.co`
   - **anon public** key
   - **service_role** key (secret — server only)

## 2. Create the GitHub OAuth App

GitHub → Settings → Developer settings → **OAuth Apps** → New (ideally under the **DigitariaWebs** org so it's team-owned):

- **Application name:** progixHub
- **Homepage URL:** `http://localhost:3000` (update to the prod URL later)
- **Authorization callback URL:** `https://<ref>.supabase.co/auth/v1/callback` ← the Supabase URL from step 1
- After creating: copy the **Client ID** and generate a **Client secret**.

## 3. Wire GitHub into Supabase Auth

Supabase dashboard → Authentication → Providers → **GitHub**:

- Enable it; paste the **Client ID** + **Client secret** from step 2.
- **Scopes:** add `read:org` (needed to verify DigitariaWebs membership).
- Authentication → URL Configuration → **Redirect URLs:** add `http://localhost:3000/auth/callback` (add the prod URL later).

## 4. What to send me

Paste these three (anon + URL are safe; the service_role is sensitive — share it the way the team shares secrets, and I'll put it only in `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

The GitHub Client ID/secret stay **in Supabase** — I don't need them.

## 5. Later (not blocking implementation)

- CI: add the same three as **GitHub Actions secrets** (ideally a separate test Supabase project) so e2e can run a seeded session.
- Prod: update the OAuth app Homepage/callback and Supabase Redirect URLs to the Vercel domain.
- Decide whether to use the Supabase CLI for migrations (`supabase/migrations/`) or apply `0001_projects.sql` via the SQL editor.
