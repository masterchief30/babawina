-- Check Analytics RLS Policies

-- 1. Check what policies exist for analytics_sessions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('analytics_sessions', 'analytics_events')
ORDER BY tablename, policyname;

-- 2. Check if RLS is even enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('analytics_sessions', 'analytics_events');

