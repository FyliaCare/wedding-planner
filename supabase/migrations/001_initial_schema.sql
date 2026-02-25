-- ============================================================
-- Wedding Planner PWA — Supabase Schema Migration
-- ============================================================
-- Run this in Supabase SQL Editor or via supabase db push

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase Auth users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  avatar_url text,
  role text not null default 'couple' check (role in ('couple', 'planner', 'guest')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- WEDDINGS
-- ============================================================
create table if not exists public.weddings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner1_name text not null default '',
  partner2_name text not null default '',
  wedding_date date,
  venue text not null default '',
  location text not null default '',
  theme text not null default '',
  total_budget numeric not null default 0,
  cover_image_url text,
  created_at timestamptz not null default now()
);

alter table public.weddings enable row level security;

create policy "Users can CRUD own weddings"
  on public.weddings for all using (auth.uid() = user_id);

-- ============================================================
-- WEDDING MEMBERS (collaborators)
-- ============================================================
create table if not exists public.wedding_members (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'guest' check (role in ('couple', 'planner', 'guest')),
  unique (wedding_id, user_id)
);

alter table public.wedding_members enable row level security;

create policy "Members can view memberships"
  on public.wedding_members for select
  using (auth.uid() = user_id or exists (
    select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()
  ));

create policy "Wedding owners can manage members"
  on public.wedding_members for all
  using (exists (
    select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()
  ));

-- ============================================================
-- TASKS / CHECKLIST
-- ============================================================
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'other',
  due_date date,
  assigned_to uuid references public.profiles(id),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in-progress', 'done')),
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can CRUD tasks for own weddings"
  on public.tasks for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid())
  );

create index idx_tasks_wedding_id on public.tasks(wedding_id);
create index idx_tasks_status on public.tasks(status);

-- ============================================================
-- BUDGET CATEGORIES
-- ============================================================
create table if not exists public.budget_categories (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  allocated_amount numeric not null default 0,
  icon text not null default '💰'
);

alter table public.budget_categories enable row level security;

create policy "Users can CRUD budget categories for own weddings"
  on public.budget_categories for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid())
  );

-- ============================================================
-- BUDGET ITEMS
-- ============================================================
create table if not exists public.budget_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.budget_categories(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  estimated_cost numeric not null default 0,
  actual_cost numeric not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'deposit-paid', 'fully-paid')),
  vendor_id uuid,
  notes text not null default ''
);

alter table public.budget_items enable row level security;

create policy "Users can CRUD budget items for own weddings"
  on public.budget_items for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid())
  );

-- ============================================================
-- GUESTS
-- ============================================================
create table if not exists public.guests (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  "group" text not null default 'other',
  meal_preference text not null default 'standard',
  dietary_restrictions text not null default '',
  plus_one boolean not null default false,
  plus_one_name text not null default '',
  rsvp_status text not null default 'invited'
    check (rsvp_status in ('invited', 'sent', 'accepted', 'declined', 'pending')),
  table_id uuid,
  seat_number integer,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.guests enable row level security;

create policy "Users can CRUD guests for own weddings"
  on public.guests for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid())
  );

create index idx_guests_wedding_id on public.guests(wedding_id);
create index idx_guests_rsvp on public.guests(rsvp_status);

-- ============================================================
-- VENDORS
-- ============================================================
create table if not exists public.vendors (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  contract_url text,
  total_cost numeric not null default 0,
  deposit_paid numeric not null default 0,
  rating integer not null default 0 check (rating >= 0 and rating <= 5),
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.vendors enable row level security;

create policy "Users can CRUD vendors for own weddings"
  on public.vendors for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid())
  );

-- ============================================================
-- SEATING TABLES
-- ============================================================
create table if not exists public.tables (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  shape text not null default 'round' check (shape in ('round', 'rectangular', 'square')),
  capacity integer not null default 8,
  position_x numeric not null default 0,
  position_y numeric not null default 0
);

alter table public.tables enable row level security;

create policy "Users can CRUD tables for own weddings"
  on public.tables for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid())
  );

-- ============================================================
-- TIMELINE EVENTS
-- ============================================================
create table if not exists public.timeline_events (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  start_time time not null,
  end_time time not null,
  location text not null default '',
  responsible_person text not null default '',
  notes text not null default '',
  sort_order integer not null default 0
);

alter table public.timeline_events enable row level security;

create policy "Users can CRUD timeline events for own weddings"
  on public.timeline_events for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid())
  );

-- ============================================================
-- MOOD BOARD ITEMS
-- ============================================================
create table if not exists public.mood_board_items (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  image_url text not null,
  category text not null default 'other',
  caption text not null default '',
  created_at timestamptz not null default now()
);

alter table public.mood_board_items enable row level security;

create policy "Users can CRUD mood board items for own weddings"
  on public.mood_board_items for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid())
  );

-- ============================================================
-- NOTES
-- ============================================================
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null,
  content text not null default '',
  vendor_id uuid references public.vendors(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can CRUD notes for own weddings"
  on public.notes for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid())
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('wedding-images', 'wedding-images', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'wedding-images' and auth.role() = 'authenticated');

create policy "Anyone can view wedding images"
  on storage.objects for select
  using (bucket_id = 'wedding-images');

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'wedding-images' and auth.uid()::text = (storage.foldername(name))[1]);
