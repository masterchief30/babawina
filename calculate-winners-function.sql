-- Function to calculate winners for a competition
-- This should be called after a competition is judged and the actual ball coordinates are set

CREATE OR REPLACE FUNCTION calculate_competition_winners(competition_id_param UUID)
RETURNS TABLE (
  entry_id UUID,
  user_id UUID,
  guess_x DECIMAL(8,5),
  guess_y DECIMAL(8,5),
  distance_to_ball DECIMAL(10,5),
  rank INTEGER
) AS $$
DECLARE
  actual_ball_x DECIMAL(8,5);
  actual_ball_y DECIMAL(8,5);
BEGIN
  -- Get the actual ball coordinates from the competition
  SELECT 
    COALESCE(judged_u * 100, 50) as ball_x, -- Convert unit coords to percentage, default to center if null
    COALESCE(judged_v * 100, 50) as ball_y
  INTO actual_ball_x, actual_ball_y
  FROM competitions 
  WHERE id = competition_id_param;
  
  -- If no ball coordinates found, raise exception
  IF actual_ball_x IS NULL OR actual_ball_y IS NULL THEN
    RAISE EXCEPTION 'Competition % has no judged ball coordinates', competition_id_param;
  END IF;
  
  -- Calculate distances and update entries
  WITH distance_calculations AS (
    SELECT 
      ce.id as entry_id,
      ce.user_id,
      ce.guess_x,
      ce.guess_y,
      -- Calculate Euclidean distance between guess and actual ball position
      SQRT(
        POWER(ce.guess_x - actual_ball_x, 2) + 
        POWER(ce.guess_y - actual_ball_y, 2)
      ) as calculated_distance
    FROM competition_entries ce
    WHERE ce.competition_id = competition_id_param
  ),
  ranked_entries AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (ORDER BY calculated_distance ASC, created_at ASC) as entry_rank
    FROM distance_calculations
  )
  -- Update the entries with calculated distances
  UPDATE competition_entries 
  SET 
    distance_to_ball = re.calculated_distance,
    is_winner = (re.entry_rank = 1), -- Only the closest entry wins
    updated_at = NOW()
  FROM ranked_entries re
  WHERE competition_entries.id = re.entry_id;
  
  -- Return the results
  RETURN QUERY
  SELECT 
    ce.id as entry_id,
    ce.user_id,
    ce.guess_x,
    ce.guess_y,
    ce.distance_to_ball,
    ROW_NUMBER() OVER (ORDER BY ce.distance_to_ball ASC, ce.created_at ASC)::INTEGER as rank
  FROM competition_entries ce
  WHERE ce.competition_id = competition_id_param
  ORDER BY ce.distance_to_ball ASC, ce.created_at ASC;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get competition winners (for display purposes)
CREATE OR REPLACE FUNCTION get_competition_winners(competition_id_param UUID)
RETURNS TABLE (
  entry_id UUID,
  user_id UUID,
  user_email TEXT,
  guess_x DECIMAL(8,5),
  guess_y DECIMAL(8,5),
  distance_to_ball DECIMAL(10,5),
  entry_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id as entry_id,
    ce.user_id,
    p.email as user_email,
    ce.guess_x,
    ce.guess_y,
    ce.distance_to_ball,
    ce.entry_number,
    ce.created_at
  FROM competition_entries ce
  JOIN auth.users au ON ce.user_id = au.id
  JOIN profiles p ON ce.user_id = p.id
  WHERE ce.competition_id = competition_id_param
    AND ce.is_winner = true
  ORDER BY ce.distance_to_ball ASC, ce.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all entries for a competition (admin only)
CREATE OR REPLACE FUNCTION get_competition_entries(competition_id_param UUID)
RETURNS TABLE (
  entry_id UUID,
  user_id UUID,
  user_email TEXT,
  guess_x DECIMAL(8,5),
  guess_y DECIMAL(8,5),
  distance_to_ball DECIMAL(10,5),
  entry_number INTEGER,
  is_winner BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    ce.id as entry_id,
    ce.user_id,
    p.email as user_email,
    ce.guess_x,
    ce.guess_y,
    ce.distance_to_ball,
    ce.entry_number,
    ce.is_winner,
    ce.created_at
  FROM competition_entries ce
  JOIN auth.users au ON ce.user_id = au.id
  JOIN profiles p ON ce.user_id = p.id
  WHERE ce.competition_id = competition_id_param
  ORDER BY 
    CASE WHEN ce.distance_to_ball IS NULL THEN 1 ELSE 0 END,
    ce.distance_to_ball ASC, 
    ce.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
