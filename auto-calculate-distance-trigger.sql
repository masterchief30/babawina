-- Trigger to automatically calculate distance_to_ball when a new entry is made
-- This will work for competitions that are already judged (have judged_u and judged_v set)

CREATE OR REPLACE FUNCTION calculate_entry_distance()
RETURNS TRIGGER AS $$
DECLARE
    actual_x DECIMAL(8,5);
    actual_y DECIMAL(8,5);
    calculated_distance DECIMAL(10,5);
BEGIN
    -- Get the judged coordinates for this competition (if they exist)
    SELECT 
        COALESCE(c.judged_u * 100, NULL) as ball_x, -- Convert to percentage (0-100)
        COALESCE(c.judged_v * 100, NULL) as ball_y  -- Convert to percentage (0-100)
    INTO actual_x, actual_y
    FROM competitions c
    WHERE c.id = NEW.competition_id;
    
    -- If the competition has been judged, calculate the distance immediately
    IF actual_x IS NOT NULL AND actual_y IS NOT NULL THEN
        -- Calculate Euclidean distance between guess and actual ball position
        calculated_distance := SQRT(
            POWER(NEW.guess_x - actual_x, 2) + 
            POWER(NEW.guess_y - actual_y, 2)
        );
        
        -- Set the distance in the new entry
        NEW.distance_to_ball := calculated_distance;
        
        -- DO NOT determine winners yet - only calculate distance
        -- Winners will be determined only after competition end time has passed
        NEW.is_winner := FALSE;
        
        RAISE NOTICE 'Auto-calculated distance for new entry: % (position: %, %) - Winner will be determined after competition ends', calculated_distance, NEW.guess_x, NEW.guess_y;
    ELSE
        -- Competition not judged yet, distance will be calculated later
        NEW.distance_to_ball := NULL;
        NEW.is_winner := FALSE;
        RAISE NOTICE 'Competition not judged yet, distance will be calculated after judging';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_calculate_distance ON competition_entries;
CREATE TRIGGER auto_calculate_distance
    BEFORE INSERT ON competition_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_entry_distance();

-- Also create a trigger for when competitions get judged (judged_u/judged_v are updated)
CREATE OR REPLACE FUNCTION recalculate_all_distances_on_judging()
RETURNS TRIGGER AS $$
BEGIN
    -- If judged_u or judged_v were just set (changed from NULL to a value)
    IF (OLD.judged_u IS NULL OR OLD.judged_v IS NULL) AND 
       (NEW.judged_u IS NOT NULL AND NEW.judged_v IS NOT NULL) THEN
        
        RAISE NOTICE 'Competition just judged, recalculating all distances for competition %', NEW.id;
        
        -- Recalculate distances for all existing entries
        PERFORM update_competition_winners(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for when competitions are judged
DROP TRIGGER IF EXISTS recalculate_on_judging ON competitions;
CREATE TRIGGER recalculate_on_judging
    AFTER UPDATE ON competitions
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_all_distances_on_judging();

-- Function to determine winners ONLY after competition has ended
CREATE OR REPLACE FUNCTION determine_winners_after_end_time()
RETURNS TABLE (
    competition_id UUID,
    competition_title TEXT,
    winner_email TEXT,
    winner_distance DECIMAL(10,5),
    entries_processed INTEGER
) AS $$
DECLARE
    comp_record RECORD;
    winner_count INTEGER;
BEGIN
    -- Find all competitions that have ended but don't have winners determined yet
    FOR comp_record IN 
        SELECT 
            c.id,
            c.title,
            c.end_date
        FROM competitions c
        WHERE c.end_date < NOW()  -- Competition has ended
        AND c.judged_u IS NOT NULL 
        AND c.judged_v IS NOT NULL  -- Competition has been judged
        AND NOT EXISTS (
            SELECT 1 FROM competition_entries ce 
            WHERE ce.competition_id = c.id 
            AND ce.is_winner = TRUE
        )  -- No winner determined yet
    LOOP
        RAISE NOTICE 'Determining winner for ended competition: % (ended: %)', comp_record.title, comp_record.end_date;
        
        -- Find the closest entry and mark as winner
        WITH closest_entry AS (
            SELECT 
                ce.id,
                ce.user_id,
                ce.distance_to_ball,
                COALESCE(p.email, au.email) as user_email
            FROM competition_entries ce
            LEFT JOIN auth.users au ON ce.user_id = au.id
            LEFT JOIN profiles p ON ce.user_id = p.id
            WHERE ce.competition_id = comp_record.id
            AND ce.distance_to_ball IS NOT NULL
            ORDER BY ce.distance_to_ball ASC, ce.created_at ASC
            LIMIT 1
        )
        UPDATE competition_entries
        SET is_winner = TRUE, updated_at = NOW()
        WHERE id = (SELECT id FROM closest_entry);
        
        GET DIAGNOSTICS winner_count = ROW_COUNT;
        
        -- Return information about this competition
        RETURN QUERY
        SELECT 
            comp_record.id,
            comp_record.title,
            ce_winner.user_email,
            ce_winner.distance_to_ball,
            winner_count
        FROM (
            SELECT 
                COALESCE(p.email, au.email) as user_email,
                ce.distance_to_ball
            FROM competition_entries ce
            LEFT JOIN auth.users au ON ce.user_id = au.id
            LEFT JOIN profiles p ON ce.user_id = p.id
            WHERE ce.competition_id = comp_record.id
            AND ce.is_winner = TRUE
            LIMIT 1
        ) ce_winner;
        
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually check and determine winners for ended competitions
-- Run this periodically or via cron job
CREATE OR REPLACE FUNCTION check_and_determine_winners()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
    winner_record RECORD;
BEGIN
    result_text := 'Checking for competitions that have ended...' || CHR(10);
    
    FOR winner_record IN 
        SELECT * FROM determine_winners_after_end_time()
    LOOP
        result_text := result_text || 
            'Winner determined for "' || winner_record.competition_title || '": ' || 
            winner_record.winner_email || ' (distance: ' || winner_record.winner_distance || ')' || CHR(10);
    END LOOP;
    
    IF result_text = 'Checking for competitions that have ended...' || CHR(10) THEN
        result_text := result_text || 'No competitions ready for winner determination.';
    END IF;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
