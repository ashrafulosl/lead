-- =========================================================================
-- Migration 003 — AI features (chat history + cached daily suggestions)
-- Run in Supabase SQL Editor AFTER schema.sql and 002_plan_config.sql.
-- =========================================================================

-- One row per chat message (both user and assistant), so the coach chat
-- has real memory across sessions, not just within one page load.
create table if not exists public.ai_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

-- One row per user per day — caches the "Today's Focus" suggestion so
-- reloading the page doesn't burn another Gemini call. Overwritten when
-- the user hits Refresh.
create table if not exists public.ai_daily_suggestions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  suggestion_date  date not null,
  suggestion       text not null,
  created_at       timestamptz not null default now(),
  unique (user_id, suggestion_date)
);

create index if not exists idx_ai_chat_messages_user_created
  on public.ai_chat_messages (user_id, created_at);

alter table public.ai_chat_messages enable row level security;
alter table public.ai_daily_suggestions enable row level security;

-- ai_chat_messages policies
create policy "ai_chat_messages_select_own"
  on public.ai_chat_messages for select using (auth.uid() = user_id);
create policy "ai_chat_messages_insert_own"
  on public.ai_chat_messages for insert with check (auth.uid() = user_id);
create policy "ai_chat_messages_delete_own"
  on public.ai_chat_messages for delete using (auth.uid() = user_id);

-- ai_daily_suggestions policies
create policy "ai_daily_suggestions_select_own"
  on public.ai_daily_suggestions for select using (auth.uid() = user_id);
create policy "ai_daily_suggestions_insert_own"
  on public.ai_daily_suggestions for insert with check (auth.uid() = user_id);
create policy "ai_daily_suggestions_update_own"
  on public.ai_daily_suggestions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai_daily_suggestions_delete_own"
  on public.ai_daily_suggestions for delete using (auth.uid() = user_id);
