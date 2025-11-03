-- Improve the winner calculation trigger to also run when status changes to 'closed' or 'judged'
-- This ensures winners are calculated even if coordinates were set during creation

CREATE OR REPLACE FUNCTION recalculate_all_distances_on_judging()
RETURNS trigger AS $$
BEGIN
    -- Case 1: Judged coordinates were just set (changed from NULL to a value)
    IF (OLD.judged_u IS NULL OR OLD.judged_v IS NULL) AND 
       (NEW.judged_u IS NOT NULL AND NEW.judged_v IS NOT NULL) THEN
        
        RAISE NOTICE 'Competition just judged, recalculating all distances for competition %', NEW.id;
        
        -- Recalculate distances for all existing entries
        PERFORM update_competition_winners(NEW.id);
    END IF;
    
    -- Case 2: Status changed to 'closed' or 'judged' AND coordinates are already set
    IF (OLD.status != NEW.status) AND 
       (NEW.status IN ('closed', 'judged')) AND
       (NEW.judged_u IS NOT NULL AND NEW.judged_v IS NOT NULL) THEN
        
        RAISE NOTICE 'Competition status changed to %, recalculating winners for competition %', NEW.status, NEW.id;
        
        -- Recalculate distances for all existing entries
        PERFORM update_competition_winners(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger already exists, no need to recreate it
-- It's attached to the competitions table as: recalculate_on_judging (AFTER UPDATE)

