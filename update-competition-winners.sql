-- Function to calculate distances and determine winners for a specific competition
-- This should be run after a competition is judged (when judged_u and judged_v are set)

CREATE OR REPLACE FUNCTION update_competition_winners(competition_id_param UUID)
RETURNS TABLE (
  entry_id UUID,
  user_email TEXT,
  guess_x DECIMAL(8,5),
  guess_y DECIMAL(8,5),
  actual_ball_x DECIMAL(8,5),
  actual_ball_y DECIMAL(8,5),
  distance_to_ball DECIMAL(10,5),
  is_winner BOOLEAN,
  rank INTEGER
) AS $$
DECLARE
  actual_u DECIMAL(8,5);
  actual_v DECIMAL(8,5);
  actual_x DECIMAL(8,5);
  actual_y DECIMAL(8,5);
BEGIN
  -- Get the actual ball coordinates from the competition (judged_u and judged_v are 0-1, convert to percentage)
  SELECT 
    COALESCE(c.judged_u * 100, 50) as ball_x, -- Convert to percentage (0-100)
    COALESCE(c.judged_v * 100, 50) as ball_y  -- Convert to percentage (0-100)
  INTO actual_x, actual_y
  FROM competitions c
  WHERE c.id = competition_id_param;
  
  -- Check if competition exists and has judged coordinates
  IF actual_x IS NULL OR actual_y IS NULL THEN
    RAISE EXCEPTION 'Competition % not found or has no judged coordinates', competition_id_param;
  END IF;
  
  RAISE NOTICE 'Actual ball position: X=%, Y=%', actual_x, actual_y;
  
  -- Calculate distances for all entries and update the table
  WITH distance_calculations AS (
    SELECT 
      ce.id,
      ce.user_id,
      ce.guess_x,
      ce.guess_y,
      -- Calculate Euclidean distance between guess and actual ball position
      SQRT(
        POWER(ce.guess_x - actual_x, 2) + 
        POWER(ce.guess_y - actual_y, 2)
      ) as calculated_distance
    FROM competition_entries ce
    WHERE ce.competition_id = competition_id_param
  ),
  ranked_entries AS (
    SELECT 
      dc.*,
      ROW_NUMBER() OVER (ORDER BY dc.calculated_distance ASC, ce.created_at ASC) as entry_rank
    FROM distance_calculations dc
    JOIN competition_entries ce ON dc.id = ce.id
  )
  -- Update all entries with their distances and winner status
  UPDATE competition_entries 
  SET 
    distance_to_ball = re.calculated_distance,
    is_winner = (re.entry_rank = 1), -- Only the closest entry wins
    updated_at = NOW()
  FROM ranked_entries re
  WHERE competition_entries.id = re.id;
  
  -- Return the results with user emails for display
  RETURN QUERY
  SELECT 
    ce.id as entry_id,
    COALESCE(p.email, au.email) as user_email,
    ce.guess_x,
    ce.guess_y,
    actual_x as actual_ball_x,
    actual_y as actual_ball_y,
    ce.distance_to_ball,
    ce.is_winner,
    ROW_NUMBER() OVER (ORDER BY ce.distance_to_ball ASC, ce.created_at ASC)::INTEGER as rank
  FROM competition_entries ce
  LEFT JOIN auth.users au ON ce.user_id = au.id
  LEFT JOIN profiles p ON ce.user_id = p.id
  WHERE ce.competition_id = competition_id_param
    AND ce.distance_to_ball IS NOT NULL
  ORDER BY ce.distance_to_ball ASC, ce.created_at ASC;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage (replace with actual competition ID):
-- SELECT * FROM update_competition_winners('your-competition-id-here');

-- Function to get current winner for a competition
CREATE OR REPLACE FUNCTION get_competition_winner(competition_id_param UUID)
RETURNS TABLE (
  user_email TEXT,
  guess_x DECIMAL(8,5),
  guess_y DECIMAL(8,5),
  distance_to_ball DECIMAL(10,5),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.email, au.email) as user_email,
    ce.guess_x,
    ce.guess_y,
    ce.distance_to_ball,
    ce.created_at
  FROM competition_entries ce
  LEFT JOIN auth.users au ON ce.user_id = au.id
  LEFT JOIN profiles p ON ce.user_id = p.id
  WHERE ce.competition_id = competition_id_param
    AND ce.is_winner = true
  ORDER BY ce.distance_to_ball ASC, ce.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
