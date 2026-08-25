# Personal OS — Security Model (Phase 24)

Status: transitional single-user security, hardened for the demo phase and
pre-wired for multi-user (Auth lands in Phase 25).

## Enforced now

| Control | Where |
|---|---|
| Row Level Security on all 18 tables (owner-only, keyed on `auth.uid()`) | `supabase/schema.sql` |
| Subtasks isolation inherits through parent task | schema policy |
| Storage bucket per-user folder policies | schema (Storage section) |
| Sync endpoint guarded by secret, **timing-safe** compare | `api/sync/route.ts` (`secretMatches`) |
| Per-IP sliding-window rate limit (30/min → 429) | `lib/rate-limit.ts` |
| Server-side payload validation: entity whitelist, row caps (5k), field-name rules, string/size bounds, id format, finite numbers, 10 MB body cap → 400 | `services/backend/validate.ts` |
| Field whitelisting at the mapping layer (unknown client fields never reach SQL) | `services/backend/mappers.ts` |
| Deterministic slug→UUID boundary (no client-controlled raw ids into uuid columns) | mappers `toUuid` |
| Security headers: X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy | `next.config.ts` |
| Secrets hygiene: service-role key and `SYNC_SECRET` referenced **only** in server modules; `.env.local` gitignored | audited by grep |

## Transitional caveats (until Phase 25 Auth)

1. `NEXT_PUBLIC_SYNC_SECRET` ships to the browser by definition — it is a
   **capability token for the local demo**, not a security boundary. Anyone
   with it can call `/api/sync` as the owner. Acceptable because the app is
   single-user localhost; the moment Auth exists this is replaced by real
   sessions and RLS.
2. `/api/sync` runs on the service-role client (bypasses RLS) — required
   pre-auth. Rate limit + secret + validation are the compensating controls.
3. Uploaded file blobs live in IndexedDB (per-browser), not yet Storage.
4. The in-memory rate limiter resets on restart and is per-instance.

## Threat model notes

- Threat: leaked service-role key → full DB access. Mitigation: server-only
  modules, never `NEXT_PUBLIC_*`, never committed.
- Threat: malicious sync payload (SQL-shaped garbage) → mappers whitelist
  fields, validator caps sizes, Postgres types/enums reject the rest.
- Threat: brute-forcing the sync secret → timing-safe compare + rate limit.

## Phase 30 audit checklist (future)

Session security, CSRF posture for cookie-based auth, admin route
protection, AI key handling, penetration pass on RLS policies.
