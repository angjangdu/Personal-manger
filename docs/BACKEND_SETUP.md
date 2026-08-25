# Backend Setup — Supabase (Phase 21 → 23)

Phase 21 ships the **architecture**: schema, RLS, typed clients, and the
adapter pattern. Nothing in the frozen frontend changes until Phase 23 flips
the data source. Follow these steps when you're ready.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) → **New project** (any region close to you).
2. Save the database password somewhere safe.
3. Copy from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only, secret**)

## 2. Apply the schema

Open **SQL Editor** in the dashboard, paste `supabase/schema.sql`, run it.
This creates every table, enum, index, trigger, the `attachments` storage
bucket, and RLS policies keyed on `auth.uid()`.

Verify: Table Editor should show 17 tables and Storage should show an
`attachments` bucket.

## 3. Configure the app

In `.env.local`:

```bash
NEXT_PUBLIC_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Restart `npm run dev`. With no user session yet the browser client exists but
RLS blocks rows — expected until Auth lands (Phase 25). Server-side scripts
can use the service-role client to seed/migrate meanwhile.

## 4. What's wired vs what comes next

| Piece | Status |
|---|---|
| Schema + enums + indexes + triggers | ✅ `supabase/schema.sql` |
| RLS policies (owner-only) | ✅ active once users exist |
| Storage bucket `attachments` | ✅ created by schema |
| Env-gated clients (`lib/supabase/client.ts`) | ✅ |
| Row↔domain mapper pattern | ✅ `services/backend/tasks-adapter.ts` |
| Per-entity adapters + live sync loop | ⏳ Phase 23 — mechanical: copy the tasks pattern per table, then flip `DATA_SOURCE` |
| Auth / profiles / admin | ⏳ Phases 25–27 |

## Migration of local data

Settings → Export JSON gives you the full local store. Phase 23 will add a
one-click "push local → Supabase" importer using the same adapters.
