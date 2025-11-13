-- Create competition-display storage bucket for 16:9 tile images
-- These are the optimized images shown in competition tiles

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('competition-display', 'competition-display', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can upload display photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view display photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update display photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete display photos" ON storage.objects;

-- Allow admins to upload
CREATE POLICY "Admins can upload display photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'competition-display' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow anyone to view (public bucket)
CREATE POLICY "Anyone can view display photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'competition-display');

-- Allow admins to update
CREATE POLICY "Admins can update display photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'competition-display' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete
CREATE POLICY "Admins can delete display photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'competition-display' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

