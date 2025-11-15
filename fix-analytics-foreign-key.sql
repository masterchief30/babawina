-- Fix Analytics Foreign Key Race Condition
-- The foreign key constraint is causing page_view events to fail
-- when they fire before the session is created

-- 1. Drop the foreign key constraint
ALTER TABLE analytics_events 
DROP CONSTRAINT IF EXISTS analytics_events_session_id_fkey;

-- 2. Verify it's gone
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname LIKE '%analytics_events%session%';

-- Expected result: No rows (constraint removed)

-- Note: We keep the session_id column, just without the foreign key enforcement
-- This allows events to be tracked even if sessions are slightly delayed

