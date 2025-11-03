-- Auto-close competitions that have passed their end date
-- This can be run manually or scheduled with pg_cron

-- Function to close expired competitions
CREATE OR REPLACE FUNCTION auto_close_expired_competitions()
RETURNS TABLE(competition_id uuid, competition_title text, old_status text, new_status text) AS $$
BEGIN
  RETURN QUERY
  UPDATE competitions c
  SET status = 'closed'
  WHERE c.status = 'live' 
    AND c.ends_at < NOW()
  RETURNING c.id, c.title, 'live'::text, c.status::text;
END;
$$ LANGUAGE plpgsql;

-- Run it once now to close any currently expired competitions
SELECT * FROM auto_close_expired_competitions();

-- ========================================
-- OPTIONAL: Schedule to run automatically
-- ========================================
-- If you have pg_cron extension enabled, uncomment below to run this every hour:

-- SELECT cron.schedule(
--   'auto-close-expired-competitions',
--   '0 * * * *',  -- Run at minute 0 of every hour
--   $$ SELECT auto_close_expired_competitions(); $$
-- );

-- NOTE: Without pg_cron, you'll need to:
-- 1. Run this manually when needed, OR
-- 2. Call it from your application code, OR
-- 3. Use an external scheduler (like a server cron job)

