-- Add IP Address Tracking to Analytics
-- This will allow you to see where visitors are coming from

-- 1. Add ip_address column to analytics_sessions
ALTER TABLE analytics_sessions
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 2. Add country column (optional, for geolocation)
ALTER TABLE analytics_sessions
ADD COLUMN IF NOT EXISTS country TEXT;

-- 3. Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'analytics_sessions'
  AND column_name IN ('ip_address', 'country')
ORDER BY column_name;

-- Expected result: 
-- ip_address | text | YES
-- country    | text | YES

