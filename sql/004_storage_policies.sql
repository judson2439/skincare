-- ============================================================================
-- SkinAura PRO Storage Bucket Policies
-- Version: 1.0
-- Description: RLS policies for the progress-photos storage bucket
-- ============================================================================

-- First, ensure the bucket exists and is public (for reading)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress-photos',
  'progress-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================================================
-- STORAGE POLICIES FOR progress-photos BUCKET
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files to their own folder
-- The file path must start with the user's ID (e.g., "user-uuid/avatar.jpg")
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'progress-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'progress-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'progress-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow public read access to all files in the bucket
-- This is needed so avatar URLs can be accessed without authentication
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'progress-photos');

-- ============================================================================
-- ALTERNATIVE: If the above policies don't work, try these simpler versions
-- ============================================================================

-- Uncomment these if the above policies cause issues:

-- DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- -- Simpler upload policy - allows any authenticated user to upload
-- CREATE POLICY "Authenticated users can upload"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'progress-photos');

-- ============================================================================
-- GRANT USAGE ON STORAGE SCHEMA
-- ============================================================================

-- Ensure the authenticated role has access to storage functions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
