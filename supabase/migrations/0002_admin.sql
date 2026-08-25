-- ============================================================================
-- 0002 — Phase 26: Admin (profiles, roles, audit log)
-- Run in the Supabase SQL editor after 0000/schema.sql.
-- Idempotent.
-- ============================================================================

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'user' check (role in ('admin','user')),
  disabled   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "own profile select" on profiles;
create policy "own profile select" on profiles
  for select using (id = auth.uid());
-- Writes (role changes, disable) happen server-side via the service-role key
-- through guarded admin routes — no client write policies by design.

-- Auto-create a profile for every new auth user.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill a profile for users created before this migration.
insert into profiles (id, email)
select u.id, coalesce(u.email, '')
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ── audit log ───────────────────────────────────────────────────────────────
create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references auth.users(id) on delete set null,
  action     text not null,
  target_id  uuid,
  meta       jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
-- Service-role only (admin routes read/write it). No client policies.

-- ── index ───────────────────────────────────────────────────────────────────
create index if not exists idx_audit_created on audit_logs(created_at desc);
