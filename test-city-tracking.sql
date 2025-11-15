-- Test City Tracking
-- This verifies that cities are being tracked from IP addresses

-- 1. Check recent sessions with city data
SELECT 
  session_id,
  ip_address,
  city,
  country,
  device_type,
  created_at
FROM analytics_sessions
ORDER BY created_at DESC
LIMIT 10;

-- 2. Count sessions with city data
SELECT 
  CASE 
    WHEN city IS NOT NULL THEN 'Has City'
    ELSE 'Missing City'
  END as city_status,
  COUNT(*) as session_count
FROM analytics_sessions
GROUP BY 
  CASE 
    WHEN city IS NOT NULL THEN 'Has City'
    ELSE 'Missing City'
  END;

-- 3. See most common cities
SELECT 
  city,
  country,
  COUNT(*) as visitor_count
FROM analytics_sessions
WHERE city IS NOT NULL
GROUP BY city, country
ORDER BY visitor_count DESC
LIMIT 10;

-- 4. Check if columns exist
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns
WHERE table_name = 'analytics_sessions'
  AND column_name IN ('city', 'country', 'ip_address')
ORDER BY column_name;

