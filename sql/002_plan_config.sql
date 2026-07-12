-- =========================================================================
-- Migration 002 — plan_config table
-- Run this in Supabase SQL Editor AFTER schema.sql. It adds one new table
-- that stores each user's entire routine (goal, week plan, nutrition,
-- appearance checklist, mental board, milestones) as a single JSON blob,
-- so it can be edited from the app instead of hardcoded in JS.
-- =========================================================================

create table if not exists public.plan_config (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade unique,
  plan        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Reuse the same updated_at trigger function created in schema.sql
drop trigger if exists trg_plan_config_updated_at on public.plan_config;
create trigger trg_plan_config_updated_at
  before update on public.plan_config
  for each row execute function public.set_updated_at();

alter table public.plan_config enable row level security;

create policy "plan_config_select_own"
  on public.plan_config for select
  using (auth.uid() = user_id);

create policy "plan_config_insert_own"
  on public.plan_config for insert
  with check (auth.uid() = user_id);

create policy "plan_config_update_own"
  on public.plan_config for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "plan_config_delete_own"
  on public.plan_config for delete
  using (auth.uid() = user_id);
