-- ============================================================
-- Migration 006: Enhanced Chat — reactions, replies, images, soft delete
-- ============================================================
-- Adds new columns to the messages table for social media chat features.
-- Idempotent — safe to re-run.

-- reply_to: references the parent message id for thread replies
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS reply_to text DEFAULT NULL;

-- reactions: jsonb map of emoji → array of user_ids
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

-- image_url: URL of a shared image
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- is_deleted: soft delete flag
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Index for reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to);

-- Enable realtime for UPDATE events too (already has INSERT from migration 002)
-- Supabase realtime picks up all DML on tables in supabase_realtime publication.
-- Just ensure the table is still in the publication (idempotent).
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
