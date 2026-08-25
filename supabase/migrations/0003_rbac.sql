-- ============================================================================
-- 0003 — Phase 27: RBAC formalization
-- Idempotent. Run after 0002_admin.sql.
-- ============================================================================

-- ── is_admin(): SECURITY DEFINER helper ─────────────────────────────────────
-- Avoids RLS recursion when policies on profiles need the caller's role.
create or replace function is_admin() returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'admin' from profiles where id = auth.uid()),
    false
  );
$$;

-- ── admins may read all profiles (user management) ──────────────────────────
drop policy if exists "admin read all profiles" on profiles;
create policy "admin read all profiles" on profiles
  for select using (is_admin());

-- ── admins may read the audit trail ─────────────────────────────────────────
drop policy if exists "admin read audit" on audit_logs;
create policy "admin read audit" on audit_logs
  for select using (is_admin());
