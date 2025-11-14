-- =====================================================
-- REMOVE "BUY 2 GET 1 FREE" LOGIC
-- Switch to simple R15 per entry pricing
-- =====================================================

-- 1. Drop the automatic free entry trigger (DROP TRIGGER FIRST!)
DROP TRIGGER IF EXISTS set_free_entry_status_trigger ON competition_entries;
DROP TRIGGER IF EXISTS trigger_calculate_next_free ON user_submission_counters;
DROP FUNCTION IF EXISTS calculate_next_free_submission() CASCADE;

-- 2. Remove next_free_submission column from user_submission_counters
ALTER TABLE user_submission_counters 
  DROP CONSTRAINT IF EXISTS user_submission_counters_next_free_submission_check;

ALTER TABLE user_submission_counters 
  DROP COLUMN IF EXISTS next_free_submission;

-- 3. Update OLD competitions with outdated prices to R15
-- Future competitions will use whatever you set in the admin panel!
UPDATE competitions 
SET entry_price_rand = 15
WHERE entry_price_rand IN (0, 10, 11);

-- 4. Create simple trigger to just count entries
-- No more free entry logic
CREATE OR REPLACE FUNCTION increment_submission_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update counter (no more free entry tracking)
  INSERT INTO user_submission_counters (
    user_id,
    competition_id,
    total_submissions,
    paid_submissions,
    free_submissions
  )
  VALUES (
    NEW.user_id,
    NEW.competition_id,
    1,
    CASE WHEN NOT NEW.was_free_entry THEN 1 ELSE 0 END,
    CASE WHEN NEW.was_free_entry THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, competition_id) 
  DO UPDATE SET
    total_submissions = user_submission_counters.total_submissions + 1,
    paid_submissions = user_submission_counters.paid_submissions + 
      CASE WHEN NOT NEW.was_free_entry THEN 1 ELSE 0 END,
    free_submissions = user_submission_counters.free_submissions + 
      CASE WHEN NEW.was_free_entry THEN 1 ELSE 0 END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for the new function
DROP TRIGGER IF EXISTS increment_counter_trigger ON competition_entries;
CREATE TRIGGER increment_counter_trigger
  AFTER INSERT ON competition_entries
  FOR EACH ROW
  EXECUTE FUNCTION increment_submission_counter();

-- 6. Update transaction table comment
COMMENT ON TABLE transactions IS 
  'Payment transactions - Simple R15 per entry pricing';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check updated competition prices
-- SELECT id, title, entry_price_rand FROM competitions;

-- Check counter table structure
-- SELECT * FROM user_submission_counters LIMIT 5;

-- Verify no free entry logic remains
-- SELECT count(*) as free_entries FROM competition_entries WHERE was_free_entry = true;

