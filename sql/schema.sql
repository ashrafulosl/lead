-- =========================================================================
-- 90-Day Tracker — Supabase schema, RLS policies, and triggers
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- =========================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- TABLE: day_records
-- One row per user per calendar date. Holds workout checkbox state,
-- nutrition checkbox state, the day's progress "level" (0-3), and a note.
-- -------------------------------------------------------------------------
create table if not exists public.day_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  record_date  date not null,
  level        integer not null default 0 check (level between 0 and 3),
  exercises    jsonb not null default '{}'::jsonb,   -- { "Push-ups": true, ... }
  nutrition    jsonb not null default '{}'::jsonb,   -- { "Breakfast::3 eggs": true, ... }
  note         text not null default '',
  updated_at   timestamptz not null default now(),
  unique (user_id, record_date)
);

-- -------------------------------------------------------------------------
-- TABLE: appearance_checks
-- One row per user per checklist item (grooming / presence / clothing).
-- These are weekly-cadence items, not tied to a specific date.
-- -------------------------------------------------------------------------
create table if not exists public.appearance_checks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  item_key     text not null,       -- e.g. "Grooming::Haircut on schedule"
  checked      boolean not null default true,
  updated_at   timestamptz not null default now(),
  unique (user_id, item_key)
);

-- -------------------------------------------------------------------------
-- Auto-update `updated_at` on every row change (keeps it simple, no app code needed)
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_day_records_updated_at on public.day_records;
create trigger trg_day_records_updated_at
  before update on public.day_records
  for each row execute function public.set_updated_at();

drop trigger if exists trg_appearance_checks_updated_at on public.appearance_checks;
create trigger trg_appearance_checks_updated_at
  before update on public.appearance_checks
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Every user can only ever see or modify rows where user_id = their own id.
-- -------------------------------------------------------------------------
alter table public.day_records enable row level security;
alter table public.appearance_checks enable row level security;

-- day_records policies
create policy "day_records_select_own"
  on public.day_records for select
  using (auth.uid() = user_id);

create policy "day_records_insert_own"
  on public.day_records for insert
  with check (auth.uid() = user_id);

create policy "day_records_update_own"
  on public.day_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "day_records_delete_own"
  on public.day_records for delete
  using (auth.uid() = user_id);

-- appearance_checks policies
create policy "appearance_checks_select_own"
  on public.appearance_checks for select
  using (auth.uid() = user_id);

create policy "appearance_checks_insert_own"
  on public.appearance_checks for insert
  with check (auth.uid() = user_id);

create policy "appearance_checks_update_own"
  on public.appearance_checks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "appearance_checks_delete_own"
  on public.appearance_checks for delete
  using (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- Helpful index for range queries (calendar view fetches a date range)
-- -------------------------------------------------------------------------
create index if not exists idx_day_records_user_date
  on public.day_records (user_id, record_date);
