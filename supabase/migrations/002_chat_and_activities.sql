-- ============================================================
-- Wedding Planner — Chat Messages & Activity Feed
-- ============================================================
-- Run this AFTER 001_initial_schema.sql in Supabase SQL Editor

-- ============================================================
-- MESSAGES (Chat / Forum)
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null default '',
  user_avatar text,
  content text not null,
  type text not null default 'message' check (type in ('message', 'update', 'photo')),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Anyone who is a member of the wedding (or the wedding owner) can read messages
create policy "Wedding members can view messages"
  on public.messages for select using (
    exists (
      select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()
    )
    or exists (
      select 1 from public.wedding_members wm where wm.wedding_id = messages.wedding_id and wm.user_id = auth.uid()
    )
  );

-- Any authenticated user who is a member can send messages
create policy "Wedding members can send messages"
  on public.messages for insert with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()
      )
      or exists (
        select 1 from public.wedding_members wm where wm.wedding_id = messages.wedding_id and wm.user_id = auth.uid()
      )
    )
  );

-- Users can delete their own messages
create policy "Users can delete own messages"
  on public.messages for delete using (auth.uid() = user_id);

create index idx_messages_wedding_id on public.messages(wedding_id);
create index idx_messages_created_at on public.messages(created_at);

-- Enable realtime for messages table
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- ACTIVITIES (Activity Feed / Audit Log)
-- ============================================================
create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null default '',
  action text not null,
  entity_type text not null default '',
  entity_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Wedding members can view activities"
  on public.activities for select using (
    exists (
      select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()
    )
    or exists (
      select 1 from public.wedding_members wm where wm.wedding_id = activities.wedding_id and wm.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create activities"
  on public.activities for insert with check (auth.uid() = user_id);

create index idx_activities_wedding_id on public.activities(wedding_id);
create index idx_activities_created_at on public.activities(created_at);

-- Enable realtime for activities table
alter publication supabase_realtime add table public.activities;
