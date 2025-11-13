-- STEP 1: Fix the trigger logic first
-- This changes the logic from paid_submissions % 2 to total_submissions % 3
CREATE OR REPLACE FUNCTION calculate_next_free_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Buy 2 Get 1 Free: Every 3rd submission is free
    -- Position in cycle: total_submissions % 3
    --   1 % 3 = 1 → Pay (next_free = false)
    --   2 % 3 = 2 → Pay (next_free = true, because next is free!)
    --   3 % 3 = 0 → Free (next_free = false, start new cycle)
    
    IF (NEW.total_submissions % 3 = 2) THEN
        NEW.next_submission_free = true;
    ELSE
        NEW.next_submission_free = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Fix the submission counter for the affected user
-- Current state: paid=2, free=0, total=2, next_free=true
-- Actual state: paid=2, free=14, total=16, next_free=? (trigger will calculate)

UPDATE user_submission_counters
SET 
  paid_submissions = 2,        -- Correct (2 entries with was_free_entry=false)
  free_submissions = 14,       -- Was 0, should be 14 (14 entries with was_free_entry=true)
  total_submissions = 16,      -- Was 2, should be 16 (total entries)
  -- Don't set next_submission_free manually, let trigger calculate it:
  -- 16 % 3 = 1, so next_free should be FALSE
  updated_at = NOW()
WHERE 
  user_id = '93bc053d-8f7d-41a4-85a6-8eb4e8b886bf'
  AND competition_id = '11cac93d-08e6-4fcd-a673-0e041f6e9afa';

-- STEP 3: Verify the fix
SELECT 
  paid_submissions,
  free_submissions,
  total_submissions,
  (total_submissions % 3) as position_in_cycle,
  next_submission_free,
  updated_at
FROM user_submission_counters
WHERE 
  user_id = '93bc053d-8f7d-41a4-85a6-8eb4e8b886bf'
  AND competition_id = '11cac93d-08e6-4fcd-a673-0e041f6e9afa';

-- Expected result:
-- paid_submissions: 2
-- free_submissions: 14
-- total_submissions: 16
-- position_in_cycle: 1 (16 % 3 = 1)
-- next_submission_free: false (because position 1 means we're at start of new cycle)

