-- =======================================================
-- Migration 0001: Initial Schema for Vileads Lead Generation SaaS
-- =======================================================

-- 1. Searches table
create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sector text not null,
  city text not null,
  country text,
  max_results int not null default 50,
  status text not null default 'pending' check (status in ('pending', 'running', 'succeeded', 'failed')),
  apify_run_id text,
  apify_dataset_id text,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists searches_user_id_created_at_idx on public.searches (user_id, created_at desc);

-- 2. Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references public.searches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text,
  name text,
  category text,
  address text,
  phone text,
  website text,
  rating numeric,
  reviews_count int,
  latitude numeric,
  longitude numeric,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (search_id, place_id)
);

create index if not exists leads_user_id_search_id_idx on public.leads (user_id, search_id);
create index if not exists leads_search_id_idx on public.leads (search_id);

-- 3. Messages table (Prospection AI generated messages)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null check (language in ('fr', 'en')),
  content text not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists messages_lead_id_created_at_idx on public.messages (lead_id, created_at desc);
create index if not exists messages_user_id_idx on public.messages (user_id);

-- 4. Enable Row Level Security (RLS)
alter table public.searches enable row level security;
alter table public.leads enable row level security;
alter table public.messages enable row level security;

-- Searches RLS policies
create policy "searches_select_own" on public.searches for select using (auth.uid() = user_id);
create policy "searches_insert_own" on public.searches for insert with check (auth.uid() = user_id);
create policy "searches_update_own" on public.searches for update using (auth.uid() = user_id);
create policy "searches_delete_own" on public.searches for delete using (auth.uid() = user_id);

-- Leads RLS policies
create policy "leads_select_own" on public.leads for select using (auth.uid() = user_id);
create policy "leads_insert_own" on public.leads for insert with check (auth.uid() = user_id);
create policy "leads_update_own" on public.leads for update using (auth.uid() = user_id);
create policy "leads_delete_own" on public.leads for delete using (auth.uid() = user_id);

-- Messages RLS policies
create policy "messages_select_own" on public.messages for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = user_id);
create policy "messages_update_own" on public.messages for update using (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages for delete using (auth.uid() = user_id);
