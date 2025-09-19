-- Fix RLS policy for competition-display bucket uploads

-- First, make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'competition-display',
  'competition-display',
  true,
  6291456, -- 6MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 6291456,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Create RLS policy to allow uploads to competition-display bucket
CREATE POLICY "Allow uploads to competition-display bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'competition-display'
);

-- Create RLS policy to allow public access to competition-display bucket
CREATE POLICY "Allow public access to competition-display bucket" ON storage.objects
FOR SELECT USING (
  bucket_id = 'competition-display'
);

-- Create RLS policy to allow updates to competition-display bucket
CREATE POLICY "Allow updates to competition-display bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'competition-display'
);

-- Create RLS policy to allow deletes from competition-display bucket
CREATE POLICY "Allow deletes from competition-display bucket" ON storage.objects
FOR DELETE USING (
  bucket_id = 'competition-display'
);
