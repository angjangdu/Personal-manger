-- ============================================================================
-- Personal OS — PostgreSQL schema (Phase 21/22)
-- Run top-to-bottom in the Supabase SQL editor (or as a migration).
--
-- Conventions
--   * uuid primary keys (client-generated crypto.randomUUID() maps cleanly)
--   * user_id on every user-owned row; RLS keys on auth.uid()
--     (policies activate once Auth exists — Phase 25)
--   * snake_case columns; the adapter layer maps to/from camelCase types
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── updated_at trigger ──────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type task_status    as enum ('inbox','planned','in_progress','completed','cancelled');
  create type priority       as enum ('low','medium','high','urgent');
  create type project_status as enum ('not_started','active','on_hold','completed');
  create type event_category as enum ('general','class','work','study','project','personal');
  create type activity_category as enum ('study','coding','college','project','work','exercise','personal','other');
  create type habit_schedule as enum ('daily','weekly');
  create type topic_status   as enum ('todo','learning','mastered');
  create type session_type   as enum ('study','revision');
  create type reschedule_reason as enum (
    'not_enough_time','higher_priority','unexpected_event',
    'too_tired','took_longer','personal','other'
  );
exception when duplicate_object then null; end $$;

-- ── tags ────────────────────────────────────────────────────────────────────
create table if not exists tags (
  id      uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name    text not null,
  color   text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ── projects ────────────────────────────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  color       text,
  goal_id     uuid,                       -- set after goals exist (no hard FK cycle)
  deadline    timestamptz,
  status      project_status not null default 'active',
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_projects_updated on projects;
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();

-- ── goals ───────────────────────────────────────────────────────────────────
create table if not exists goals (
  id          uuid primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  category    text,
  deadline    timestamptz,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_goals_updated on goals;
create trigger trg_goals_updated before update on goals
  for each row execute function set_updated_at();

alter table projects drop constraint if exists projects_goal_id_fkey;
alter table projects
  add constraint projects_goal_id_fkey foreign key (goal_id) references goals(id) on delete set null;

create table if not exists milestones (
  id           uuid primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  goal_id      uuid not null references goals(id) on delete cascade,
  title        text not null,
  target_date  timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ── tasks ───────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id                          uuid primary key,
  user_id                     uuid references auth.users(id) on delete cascade,
  title                       text not null,
  description                 text,
  status                      task_status not null default 'inbox',
  priority                    priority not null default 'medium',
  due_date                    timestamptz,
  due_time                    text,
  estimated_duration_minutes  int,
  project_id                  uuid references projects(id) on delete set null,
  goal_id                     uuid references goals(id) on delete set null,
  tag_ids                     uuid[] not null default '{}',
  repeat                      jsonb,          -- RecurrenceRule | null
  mit                         boolean not null default false,
  completed_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists idx_tasks_user_due    on tasks(user_id, due_date);
create index if not exists idx_tasks_user_status on tasks(user_id, status);
drop trigger if exists trg_tasks_updated on tasks;
create trigger trg_tasks_updated before update on tasks
  for each row execute function set_updated_at();

create table if not exists subtasks (
  id         uuid primary key,
  task_id    uuid not null references tasks(id) on delete cascade,
  title      text not null,
  completed  boolean not null default false,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

-- ── occurrence overrides (recurring series) ─────────────────────────────────
create table if not exists occurrence_overrides (
  template_task_id uuid not null references tasks(id) on delete cascade,
  user_id          uuid references auth.users(id) on delete cascade,
  date_key         date not null,
  done             boolean not null default false,
  skipped          boolean not null default false,
  completed_at     timestamptz,
  primary key (template_task_id, date_key)
);

-- ── calendar events ─────────────────────────────────────────────────────────
create table if not exists calendar_events (
  id          uuid primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  all_day     boolean not null default false,
  task_id     uuid references tasks(id) on delete set null,
  repeat      jsonb,
  category    event_category not null default 'general',
  created_at  timestamptz not null default now()
);
create index if not exists idx_events_user_start on calendar_events(user_id, start_at);

-- ── habits ──────────────────────────────────────────────────────────────────
create table if not exists habits (
  id          uuid primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  schedule    habit_schedule not null default 'daily',
  weekdays    int[],
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists habit_logs (
  id           uuid primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  habit_id     uuid not null references habits(id) on delete cascade,
  completed_on date not null,
  created_at   timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create table if not exists habit_grace_logs (
  id         uuid primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  habit_id   uuid not null references habits(id) on delete cascade,
  date_key   date not null,
  reason     text not null,
  note       text,
  created_at timestamptz not null default now(),
  unique (habit_id, date_key)
);

-- ── activities ──────────────────────────────────────────────────────────────
create table if not exists activities (
  id               uuid primary key,
  user_id          uuid references auth.users(id) on delete cascade,
  title            text not null,
  task_id          uuid references tasks(id) on delete set null,
  project_id       uuid references projects(id) on delete set null,
  category         activity_category,
  study_subject_id uuid,
  study_topic_id   uuid,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  paused_at        timestamptz,
  total_paused_ms  bigint not null default 0,
  duration_minutes int,
  notes            text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_activities_user_started on activities(user_id, started_at);

-- ── study ───────────────────────────────────────────────────────────────────
create table if not exists study_subjects (
  id          uuid primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  color       text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists study_topics (
  id              uuid primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  subject_id      uuid not null references study_subjects(id) on delete cascade,
  parent_id       uuid references study_topics(id) on delete cascade,
  name            text not null,
  status          topic_status not null default 'todo',
  last_revised_at timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists study_sessions (
  id               uuid primary key,
  user_id          uuid references auth.users(id) on delete cascade,
  subject_id       uuid not null references study_subjects(id) on delete cascade,
  topic_id         uuid references study_topics(id) on delete set null,
  type             session_type not null default 'study',
  date             timestamptz not null,
  duration_minutes int not null,
  notes            text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_sessions_subject on study_sessions(subject_id, date);

-- ── notes ───────────────────────────────────────────────────────────────────
create table if not exists notes (
  id                   uuid primary key,
  user_id              uuid references auth.users(id) on delete cascade,
  title                text not null default 'Untitled',
  content              text not null default '',
  folder               text,
  pinned               boolean not null default false,
  tag_ids              uuid[] not null default '{}',
  linked_task_ids      uuid[] not null default '{}',
  linked_project_ids   uuid[] not null default '{}',
  linked_study_topic_id uuid references study_topics(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_notes_user_folder on notes(user_id, folder);
drop trigger if exists trg_notes_updated on notes;
create trigger trg_notes_updated before update on notes
  for each row execute function set_updated_at();

-- ── daily reviews ───────────────────────────────────────────────────────────
create table if not exists daily_reviews (
  id                     uuid primary key,
  user_id                uuid references auth.users(id) on delete cascade,
  date                   date not null,
  tasks_completed_count  int not null default 0,
  focus_minutes          int not null default 0,
  study_minutes          int not null default 0,
  went_well              text,
  went_wrong             text,
  to_improve             text,
  tomorrow_priority      text,
  created_at             timestamptz not null default now(),
  unique (user_id, date)
);

-- ── reschedule logs ─────────────────────────────────────────────────────────
create table if not exists reschedule_logs (
  id         uuid primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  item_id    uuid not null,
  item_type  text not null default 'event',
  title      text not null,
  from_start timestamptz not null,
  to_start   timestamptz not null,
  reason     reschedule_reason not null,
  note       text,
  created_at timestamptz not null default now()
);

-- ── attachments metadata (binaries live in Storage bucket) ─────────────────
create table if not exists attachments (
  id               uuid primary key,
  user_id          uuid references auth.users(id) on delete cascade,
  name             text not null,
  ext              text not null default '',
  mime             text not null default 'application/octet-stream',
  size_bytes       bigint not null default 0,
  kind             text not null default 'other',
  note_id          uuid references notes(id) on delete set null,
  task_id          uuid references tasks(id) on delete set null,
  project_id       uuid references projects(id) on delete set null,
  study_subject_id uuid references study_subjects(id) on delete set null,
  study_topic_id   uuid references study_topics(id) on delete set null,
  tag_ids          uuid[] not null default '{}',
  uploaded_at      timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Policies are written against auth.uid(); they become enforceable the moment
-- users exist (Auth phase). Until then, access happens with the service-role
-- key server-side only.

do $$
declare t text;
begin
  foreach t in array array[
    'tags','projects','goals','tasks','occurrence_overrides',
    'calendar_events','habits','habit_logs','habit_grace_logs',
    'activities','study_subjects','study_topics','study_sessions',
    'notes','daily_reviews','reschedule_logs','attachments'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists own_rows on %I;', t);
    execute format($f$
      create policy own_rows on %I
        for all using (user_id = auth.uid())
        with check (user_id = auth.uid());
    $f$, t);
  end loop;
end $$;

-- subtasks inherit ownership through their task.
alter table subtasks enable row level security;
drop policy if exists own_rows on subtasks;
create policy own_rows on subtasks
  for all using (
    exists (select 1 from tasks where tasks.id = subtasks.task_id and tasks.user_id = auth.uid())
  )
  with check (
    exists (select 1 from tasks where tasks.id = subtasks.task_id and tasks.user_id = auth.uid())
  );

-- ── storage ─────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments own read"  on storage.objects;
drop policy if exists "attachments own write" on storage.objects;
create policy "attachments own read" on storage.objects
  for select using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attachments own write" on storage.objects
  for insert with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- Phase 26: profiles, roles, audit log (see migrations/0002_admin.sql)
-- ============================================================================
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'user' check (role in ('admin','user')),
  disabled   boolean not null default false,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
drop policy if exists "own profile select" on profiles;
create policy "own profile select" on profiles for select using (id = auth.uid());

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

insert into profiles (id, email)
select u.id, coalesce(u.email, '')
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id)
on conflict (id) do nothing;

create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references auth.users(id) on delete set null,
  action     text not null,
  target_id  uuid,
  meta       jsonb,
  created_at timestamptz not null default now()
);
alter table audit_logs enable row level security;
create index if not exists idx_audit_created on audit_logs(created_at desc);