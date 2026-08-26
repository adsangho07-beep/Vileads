-- =======================================================
-- Migration 0002: Credit System for Vileads
-- =======================================================

-- 1. User credits wallet (one row per user)
create table if not exists public.user_credits (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  balance    int  not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;
create policy "user_credits_select_own" on public.user_credits for select using (auth.uid() = user_id);
create policy "user_credits_insert_own" on public.user_credits for insert with check (auth.uid() = user_id);
create policy "user_credits_update_own" on public.user_credits for update using (auth.uid() = user_id);

-- 2. Credit transactions ledger
create table if not exists public.credit_transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  type           text not null check (type in ('signup_bonus', 'purchase', 'consumption', 'refund')),
  amount         int  not null,
  balance_after  int  not null,
  reference_type text,
  reference_id   uuid,
  description    text,
  created_at     timestamptz not null default now()
);

create index if not exists credit_transactions_user_id_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;
create policy "credit_transactions_select_own" on public.credit_transactions for select using (auth.uid() = user_id);

-- 3. Credit purchases (one row per Moneroo checkout session)
create table if not exists public.credit_purchases (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  package_id              text not null,
  credits                 int  not null,
  amount_total            int  not null,
  currency                text not null default 'XOF',
  status                  text not null default 'pending'
                            check (status in ('pending', 'completed', 'failed', 'expired')),
  provider                text not null default 'moneroo',
  provider_transaction_id text,
  checkout_url            text,
  error_message           text,
  metadata                jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists credit_purchases_user_id_idx on public.credit_purchases (user_id);

alter table public.credit_purchases enable row level security;
create policy "credit_purchases_select_own" on public.credit_purchases for select using (auth.uid() = user_id);
create policy "credit_purchases_insert_own" on public.credit_purchases for insert with check (auth.uid() = user_id);
create policy "credit_purchases_update_own" on public.credit_purchases for update using (auth.uid() = user_id);

-- 4. Processed webhook events (deduplication — no RLS, only service role writes)
create table if not exists public.processed_webhook_events (
  provider   text        not null,
  event_id   text        not null,
  created_at timestamptz not null default now(),
  primary key (provider, event_id)
);

-- =======================================================
-- RPC Functions
-- =======================================================

-- 5. add_credits — grant credits (purchase, signup bonus, refund)
create or replace function public.add_credits(
  p_user_id        uuid,
  p_amount         int,
  p_type           text,
  p_reference_type text  default null,
  p_reference_id   uuid  default null,
  p_description    text  default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_new_balance int;
begin
  insert into public.user_credits (user_id, balance, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id)
  do update set
    balance    = user_credits.balance + p_amount,
    updated_at = now()
  returning balance into v_new_balance;

  insert into public.credit_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  values
    (p_user_id, p_type, p_amount, v_new_balance, p_reference_type, p_reference_id, p_description);
end;
$$;

-- 6. consume_credits — debit credits atomically with balance check
create or replace function public.consume_credits(
  p_amount         int,
  p_reference_type text  default null,
  p_reference_id   uuid  default null,
  p_description    text  default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id     uuid := auth.uid();
  v_new_balance int;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  update public.user_credits
  set
    balance    = balance - p_amount,
    updated_at = now()
  where user_id = v_user_id
    and balance >= p_amount
  returning balance into v_new_balance;

  if not found then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  insert into public.credit_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  values
    (v_user_id, 'consumption', -p_amount, v_new_balance, p_reference_type, p_reference_id, p_description);
end;
$$;

-- =======================================================
-- Trigger: 5 free credits on signup
-- =======================================================

create or replace function public.handle_new_user_credits()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.add_credits(
    new.id, 5, 'signup_bonus', null, null,
    'Bonus de bienvenue — 5 crédits offerts'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_credits on auth.users;

create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row
  execute function public.handle_new_user_credits();

-- =======================================================
-- Backfill: give 5 credits to existing users who have none
-- =======================================================
do $$
declare
  r record;
begin
  for r in
    select id from auth.users
    where id not in (select user_id from public.user_credits)
  loop
    perform public.add_credits(
      r.id, 5, 'signup_bonus', null, null,
      'Bonus de bienvenue — 5 crédits offerts (rétroactif)'
    );
  end loop;
end;
$$;
