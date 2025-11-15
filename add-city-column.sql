-- Add City Column to Analytics Sessions
-- This adds city tracking alongside country

-- Add city column
ALTER TABLE analytics_sessions
ADD COLUMN IF NOT EXISTS city TEXT;

-- Verify column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'analytics_sessions'
  AND column_name = 'city';

-- Expected result: 
-- city | text | YES

