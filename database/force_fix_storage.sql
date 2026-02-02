-- ========================================================
-- FORCE FIX STORAGE: Assets Bucket & Policies
-- Run this script in Supabase SQL Editor
-- ========================================================

-- 1. Create 'assets' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('assets', 'assets', true, 52428800, NULL) -- 50MB limit
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop all existing policies on 'assets' to ensure a clean slate
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow Deletes" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- 3. ENABLE RLS (Required for policies to work, even if they are public)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Create PERMISSIVE policies
-- IMPORTANT: These policies allow ANYONE (anon key) to read/write/delete.
-- This is acceptable because authentication is handled at the App level before calling Supabase.

-- Allow Public Read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'assets' );

-- Allow Public Insert (Upload)
CREATE POLICY "Allow Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'assets' );

-- Allow Public Update
CREATE POLICY "Allow Updates"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'assets' );

-- Allow Public Delete
CREATE POLICY "Allow Deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'assets' );

-- 5. Verify
-- You should see 'assets' in your Storage buckets.
