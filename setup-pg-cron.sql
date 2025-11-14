-- =====================================================
-- SETUP PG_CRON FOR AUTO-CLOSING COMPETITIONS
-- =====================================================

-- Step 1: Schedule the job to run every hour
SELECT cron.schedule(
  'close-expired-competitions',    -- Job name
  '0 * * * *',                      -- Every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
  $$ SELECT close_expired_competitions(); $$
);

-- Alternative schedules (uncomment the one you want):

-- Every 30 minutes:
-- SELECT cron.schedule(
--   'close-expired-competitions',
--   '*/30 * * * *',
--   $$ SELECT close_expired_competitions(); $$
-- );

-- Every 15 minutes:
-- SELECT cron.schedule(
--   'close-expired-competitions',
--   '*/15 * * * *',
--   $$ SELECT close_expired_competitions(); $$
-- );

-- At 6:00 PM every day (18:00 UTC):
-- SELECT cron.schedule(
--   'close-expired-competitions',
--   '0 18 * * *',
--   $$ SELECT close_expired_competitions(); $$
-- );

-- =====================================================
-- VERIFY CRON JOB WAS SCHEDULED
-- =====================================================

-- Check scheduled jobs:
SELECT * FROM cron.job;

-- =====================================================
-- TO REMOVE THE CRON JOB (IF NEEDED)
-- =====================================================

-- Unschedule by name:
-- SELECT cron.unschedule('close-expired-competitions');

