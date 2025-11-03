-- Populate the winners table from all competition_entries with is_winner = true
-- This syncs the winners table with the calculated winners

-- Insert all winners into the winners table (avoiding duplicates)
INSERT INTO winners (competition_id, user_id, rank, distance, announced_at)
SELECT 
    ce.competition_id,
    ce.user_id,
    1 as rank,
    ce.distance_to_ball as distance,
    NOW() as announced_at
FROM competition_entries ce
WHERE ce.is_winner = true
  AND NOT EXISTS (
    -- Don't insert duplicates
    SELECT 1 FROM winners w 
    WHERE w.competition_id = ce.competition_id 
    AND w.user_id = ce.user_id
  );

-- Verify all winners are in the table
SELECT 
    c.title,
    p.email as winner_email,
    w.distance,
    w.rank,
    w.announced_at
FROM winners w
JOIN competitions c ON w.competition_id = c.id
LEFT JOIN profiles p ON w.user_id = p.id
ORDER BY w.announced_at DESC;

