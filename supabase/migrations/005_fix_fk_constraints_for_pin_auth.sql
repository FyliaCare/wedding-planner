-- ============================================================
-- Migration 005: Fix Foreign Key Constraints for PIN-based Auth
-- ============================================================
-- The original schema (001/002) referenced profiles(id) which is tied to
-- Supabase Auth. Since we switched to PIN-based auth via the `members`
-- table, those FK constraints cause every insert to fail.
--
-- This migration:
-- 1. Drops all FK constraints referencing profiles
-- 2. Drops all auth.uid()-based RLS policies
-- 3. Creates open RLS policies (security boundary is the PIN gate)
-- 4. Idempotent — safe to re-run
-- ============================================================

-- ========== 1. DROP FOREIGN KEY CONSTRAINTS TO profiles ==========

-- messages.user_id → profiles(id)
ALTER TABLE IF EXISTS public.messages
  DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

-- activities.user_id → profiles(id)
ALTER TABLE IF EXISTS public.activities
  DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

-- weddings.user_id → profiles(id)
ALTER TABLE IF EXISTS public.weddings
  DROP CONSTRAINT IF EXISTS weddings_user_id_fkey;

-- tasks.assigned_to → profiles(id)
ALTER TABLE IF EXISTS public.tasks
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- wedding_members.user_id → profiles(id) (legacy table, not used by PIN auth)
ALTER TABLE IF EXISTS public.wedding_members
  DROP CONSTRAINT IF EXISTS wedding_members_user_id_fkey;

-- ========== 2. DROP OLD auth.uid()-BASED RLS POLICIES ==========

-- From migration 001:
DROP POLICY IF EXISTS "Users can CRUD own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can CRUD tasks for own weddings" ON tasks;
DROP POLICY IF EXISTS "Users can CRUD budget categories for own weddings" ON budget_categories;
DROP POLICY IF EXISTS "Users can CRUD budget items for own weddings" ON budget_items;
DROP POLICY IF EXISTS "Users can CRUD guests for own weddings" ON guests;
DROP POLICY IF EXISTS "Users can CRUD vendors for own weddings" ON vendors;
DROP POLICY IF EXISTS "Users can CRUD tables for own weddings" ON tables;
DROP POLICY IF EXISTS "Users can CRUD timeline events for own weddings" ON timeline_events;
DROP POLICY IF EXISTS "Users can CRUD mood_board for own weddings" ON mood_board_items;
DROP POLICY IF EXISTS "Users can CRUD notes for own weddings" ON notes;
DROP POLICY IF EXISTS "Members can view memberships" ON wedding_members;
DROP POLICY IF EXISTS "Wedding owners can manage members" ON wedding_members;

-- From migration 002:
DROP POLICY IF EXISTS "Wedding members can view messages" ON messages;
DROP POLICY IF EXISTS "Wedding members can send messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "Wedding members can view activities" ON activities;
DROP POLICY IF EXISTS "Authenticated users can create activities" ON activities;

-- ========== 3. ENSURE RLS IS ENABLED + OPEN POLICIES ==========
-- Since auth is PIN-based and all party members share access,
-- open policies are appropriate. The security boundary is the PIN gate.

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'weddings', 'tasks', 'budget_categories', 'budget_items',
      'guests', 'vendors', 'tables', 'timeline_events',
      'mood_board_items', 'notes', 'messages', 'activities',
      'wedding_members'
    ])
  LOOP
    -- Enable RLS
    BEGIN
      EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', tbl);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Create open policies (idempotent — skip if already exists)
    BEGIN
      EXECUTE format('CREATE POLICY "%s_open_select" ON %I FOR SELECT USING (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      EXECUTE format('CREATE POLICY "%s_open_insert" ON %I FOR INSERT WITH CHECK (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      EXECUTE format('CREATE POLICY "%s_open_update" ON %I FOR UPDATE USING (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      EXECUTE format('CREATE POLICY "%s_open_delete" ON %I FOR DELETE USING (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;

-- ========== 4. MAKE user_id NULLABLE ON MESSAGES/ACTIVITIES ==========
-- (In case the column was NOT NULL, allow null for backward compat)
ALTER TABLE IF EXISTS public.messages ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.activities ALTER COLUMN user_id DROP NOT NULL;

-- ========== 5. CHANGE user_id TYPE TO TEXT FOR FLEXIBILITY ==========
-- Members IDs are UUIDs but stored as text in the app for flexibility
ALTER TABLE IF EXISTS public.messages ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE IF EXISTS public.activities ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE IF EXISTS public.weddings ALTER COLUMN user_id TYPE text USING user_id::text;
