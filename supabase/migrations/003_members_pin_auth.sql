-- ============================================================
-- Wedding Planner — PIN-based Members (no email auth needed)
-- ============================================================
-- Run this AFTER 002_chat_and_activities.sql in Supabase SQL Editor
-- Safe to re-run — all statements are idempotent.

-- ============================================================
-- MEMBERS (PIN-based lightweight auth)
-- ============================================================
create table if not exists public.members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text not null default '',
  relationship text not null default 'friend',
  pin text not null,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),

  -- PIN must be unique across all members
  constraint members_pin_unique unique (pin)
);

-- Add is_admin column if table existed before this migration
alter table public.members add column if not exists is_admin boolean not null default false;

-- RLS
alter table public.members enable row level security;

-- Drop old policies if they exist, then recreate
drop policy if exists "Anyone can read members" on public.members;
create policy "Anyone can read members"
  on public.members for select using (true);

drop policy if exists "Anyone can join" on public.members;
create policy "Anyone can join"
  on public.members for insert with check (true);

drop policy if exists "Members can update own profile" on public.members;
create policy "Members can update own profile"
  on public.members for update using (true);

create index if not exists idx_members_pin on public.members(pin);

-- Enable realtime (ignore error if already added)
do $$ begin
  alter publication supabase_realtime add table public.members;
exception when duplicate_object then null;
end $$;

-- ============================================================
-- PRE-SEED ADMIN ACCOUNTS (Janet & Jojo)
-- ============================================================
insert into public.members (name, location, relationship, pin, is_admin)
values
  ('Janet', '', 'bride', '1475', true),
  ('Jojo',  '', 'groom', '7991', true)
on conflict (pin) do update set is_admin = true;
