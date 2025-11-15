-- Test IP Address and Country Tracking
-- This will show you visitor locations

-- 1. Check recent sessions with IP and country
SELECT 
  session_id,
  ip_address,
  country,
  device_type,
  browser,
  os,
  landing_page,
  created_at
FROM analytics_sessions
ORDER BY created_at DESC
LIMIT 10;

-- 2. Count visitors by country
SELECT 
  country,
  COUNT(*) as visitors,
  COUNT(DISTINCT ip_address) as unique_ips
FROM analytics_sessions
WHERE country IS NOT NULL
GROUP BY country
ORDER BY visitors DESC;

-- 3. Show top countries with device breakdown
SELECT 
  country,
  device_type,
  COUNT(*) as sessions
FROM analytics_sessions
WHERE country IS NOT NULL
GROUP BY country, device_type
ORDER BY country, sessions DESC;

-- Expected results:
-- You should see "South Africa" for local visitors
-- IP addresses like 102.68.xxx.xxx for SA visitors
-- Other countries for international visitors

