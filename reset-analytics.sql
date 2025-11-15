-- Reset Analytics Data
-- This will clear ALL analytics data and start fresh

-- 1. Delete all analytics events
DELETE FROM analytics_events;

-- 2. Delete all analytics sessions
DELETE FROM analytics_sessions;

-- 3. Reset the daily visit counter (if you want to reset that too)
DELETE FROM daily_visit_counter;

-- 4. Verify everything is cleared
SELECT 'ANALYTICS EVENTS' as table_name, COUNT(*) as remaining_rows FROM analytics_events
UNION ALL
SELECT 'ANALYTICS SESSIONS', COUNT(*) FROM analytics_sessions
UNION ALL
SELECT 'DAILY VISIT COUNTER', COUNT(*) FROM daily_visit_counter;

-- Expected result: All counts should be 0

