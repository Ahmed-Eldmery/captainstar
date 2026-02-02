-- ========================================================
-- FIX PERMISSIONS: STORAGE & DATABASE
-- Run this script in Supabase SQL Editor to fix "Policy" errors
-- ========================================================

-- 1. Unconditionally Disable RLS on All Tables (For Development)
-- This ensures you can save Tasks, Clients, etc. without "Policy violated" errors
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts DISABLE ROW LEVEL SECURITY;

-- 2. Create Storage Bucket 'assets' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. STORAGE POLICIES (Crucial for File Uploads)
-- We need to allow access to the 'assets' bucket

-- Enable RLS on storage.objects (Good practice, but we'll make policies permissive)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Deletes" ON storage.objects;

-- Policy 1: Allow Public Read (View) Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'assets' );

-- Policy 2: Allow Uploads (Insert) for Everyone (Since we handle auth in App)
CREATE POLICY "Allow Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'assets' );

-- Policy 3: Allow Updates (Modify)
CREATE POLICY "Allow Updates"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'assets' );

-- Policy 4: Allow Deletes
CREATE POLICY "Allow Deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'assets' );

-- ========================================================
-- ✅ SUCCESS: Permissions logic updated.
-- Try saving/uploading again after running this.
-- ========================================================
