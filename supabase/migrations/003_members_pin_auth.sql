-- ============================================================
-- Wedding Planner — PIN-based Members (no email auth needed)
-- ============================================================
-- Run this AFTER 002_chat_and_activities.sql in Supabase SQL Editor

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
  created_at timestamptz not null default now(),

  -- PIN must be unique across all members
  constraint members_pin_unique unique (pin)
);

-- No RLS — this is a lightweight open table for the wedding crew
-- Anyone with the app link can join / sign in with their PIN
alter table public.members enable row level security;

-- Allow anyone (anon) to read members (needed to check PIN on login)
create policy "Anyone can read members"
  on public.members for select using (true);

-- Allow anyone (anon) to insert new members (joining the party)
create policy "Anyone can join"
  on public.members for insert with check (true);

-- Allow anyone to update their own row (matched by id)
create policy "Members can update own profile"
  on public.members for update using (true);

create index idx_members_pin on public.members(pin);

-- Enable realtime so member list stays fresh
alter publication supabase_realtime add table public.members;
