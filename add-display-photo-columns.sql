-- Add display photo columns to competitions table
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS display_photo_path TEXT,
ADD COLUMN IF NOT EXISTS display_photo_alt TEXT;
