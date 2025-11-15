-- Diagnose Analytics Mismatch
-- Check why total visits (83) doesn't match top pages (10)

-- 1. Count sessions vs page views
SELECT 
  'SESSIONS' as type,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM analytics_sessions
WHERE created_at >= '2025-11-15T10:00:00Z'

UNION ALL

SELECT 
  'PAGE VIEWS' as type,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM analytics_events
WHERE event_name = 'page_view'
  AND created_at >= '2025-11-15T10:00:00Z';

-- 2. Check if there are sessions WITHOUT page views
SELECT 
  'SESSIONS WITHOUT PAGE VIEWS' as issue,
  COUNT(DISTINCT s.session_id) as count
FROM analytics_sessions s
LEFT JOIN analytics_events e ON s.session_id = e.session_id AND e.event_name = 'page_view'
WHERE s.created_at >= '2025-11-15T10:00:00Z'
  AND e.id IS NULL;

-- 3. Check if sessions are being created multiple times
SELECT 
  'DUPLICATE SESSIONS' as issue,
  session_id,
  COUNT(*) as duplicate_count
FROM analytics_sessions
WHERE created_at >= '2025-11-15T10:00:00Z'
GROUP BY session_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 5;

-- 4. Show actual session vs event counts by date
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_session_records
FROM analytics_sessions
WHERE created_at >= '2025-11-15T10:00:00Z'
GROUP BY DATE(created_at)
ORDER BY date DESC;

