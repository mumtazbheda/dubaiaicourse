-- Run this in the Supabase SQL editor (Project -> SQL -> New query)

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  full_name text,
  phone text,
  paid boolean not null default false,
  amount integer,
  currency text default 'AED',
  razorpay_order_id text,
  razorpay_payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists registrations_paid_idx on public.registrations (paid);
create index if not exists registrations_user_idx on public.registrations (user_id);

alter table public.registrations enable row level security;

drop policy if exists "Users can view own registration" on public.registrations;
create policy "Users can view own registration"
  on public.registrations for select
  using (auth.uid() = user_id or lower(email) = lower(auth.jwt() ->> 'email'));

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists registrations_touch_updated on public.registrations;
create trigger registrations_touch_updated
  before update on public.registrations
  for each row execute procedure public.touch_updated_at();

-- Auto-link a registration row to a Supabase auth user when they sign up
-- (matches by email, only if user_id is still NULL).
create or replace function public.link_registration_to_user()
returns trigger language plpgsql security definer as $$
begin
  update public.registrations
  set user_id = new.id
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.link_registration_to_user();
