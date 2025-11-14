-- =====================================================
-- AUTO-CLOSE EXPIRED COMPETITIONS & CALCULATE WINNERS
-- =====================================================

-- Drop the old function first (if it exists)
DROP FUNCTION IF EXISTS close_expired_competitions();

-- Function to close expired competitions and calculate winners
CREATE OR REPLACE FUNCTION close_expired_competitions()
RETURNS TABLE (
  competition_id uuid,
  competition_title text,
  action_taken text,
  winner_user_id uuid,
  winner_distance numeric
) AS $$
DECLARE
  comp_record RECORD;
  closest_entry RECORD;
  judged_x_val numeric;
  judged_y_val numeric;
BEGIN
  -- Find all competitions that should be closed
  -- (status is 'live' and end date has passed)
  FOR comp_record IN
    SELECT 
      id,
      title,
      judged_x_norm,
      judged_y_norm
    FROM competitions
    WHERE status = 'live'
    AND ends_at < NOW()
  LOOP
    -- Update competition status to 'closed'
    UPDATE competitions
    SET status = 'closed'
    WHERE id = comp_record.id;
    
    -- Return the action taken
    competition_id := comp_record.id;
    competition_title := comp_record.title;
    action_taken := 'closed';
    winner_user_id := NULL;
    winner_distance := NULL;
    
    RETURN NEXT;
    
    -- Calculate winner if judged coordinates exist
    IF comp_record.judged_x_norm IS NOT NULL AND comp_record.judged_y_norm IS NOT NULL THEN
      judged_x_val := comp_record.judged_x_norm;
      judged_y_val := comp_record.judged_y_norm;
      
      -- Find the entry closest to the judged position
      SELECT 
        ce.id,
        ce.user_id,
        ce.guess_x,
        ce.guess_y,
        SQRT(
          POWER(ce.guess_x - judged_x_val, 2) + 
          POWER(ce.guess_y - judged_y_val, 2)
        ) as distance
      INTO closest_entry
      FROM competition_entries ce
      WHERE ce.competition_id = comp_record.id
      ORDER BY distance ASC
      LIMIT 1;
      
      -- If we found a closest entry, mark it as winner
      IF closest_entry.id IS NOT NULL THEN
        -- Mark the winning entry
        UPDATE competition_entries
        SET is_winner = true
        WHERE id = closest_entry.id;
        
        -- Update competition to 'judged' status
        UPDATE competitions
        SET status = 'judged'
        WHERE id = comp_record.id;
        
        -- Return winner info
        competition_id := comp_record.id;
        competition_title := comp_record.title;
        action_taken := 'judged_winner_calculated';
        winner_user_id := closest_entry.user_id;
        winner_distance := closest_entry.distance;
        
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Test the function (uncomment to run manually)
-- SELECT * FROM close_expired_competitions();

