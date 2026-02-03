-- ============================================
-- Enable Supabase Realtime for all tables
-- Run this in Supabase SQL Editor
-- ============================================

-- First, check if the publication exists
DO $$
BEGIN
  -- Add tables one by one (ignore errors if already added)
  BEGIN
    ALTER publication supabase_realtime ADD TABLE messages;
    RAISE NOTICE 'Added messages to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'messages already in realtime';
  END;

  BEGIN
    ALTER publication supabase_realtime ADD TABLE tasks;
    RAISE NOTICE 'Added tasks to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'tasks already in realtime';
  END;

  BEGIN
    ALTER publication supabase_realtime ADD TABLE projects;
    RAISE NOTICE 'Added projects to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'projects already in realtime';
  END;

  BEGIN
    ALTER publication supabase_realtime ADD TABLE clients;
    RAISE NOTICE 'Added clients to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'clients already in realtime';
  END;

  BEGIN
    ALTER publication supabase_realtime ADD TABLE client_accounts;
    RAISE NOTICE 'Added client_accounts to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'client_accounts already in realtime';
  END;

  BEGIN
    ALTER publication supabase_realtime ADD TABLE notifications;
    RAISE NOTICE 'Added notifications to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'notifications already in realtime';
  END;

  BEGIN
    ALTER publication supabase_realtime ADD TABLE users;
    RAISE NOTICE 'Added users to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'users already in realtime';
  END;
END $$;

-- Verify: Show all tables in the publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
