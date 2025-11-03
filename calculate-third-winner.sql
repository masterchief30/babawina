-- Calculate winner for the third competition (Win a Playstation 5 today)
SELECT * FROM update_competition_winners('40c12fe1-5fd2-41d4-9b63-5ee5c7d0a5a1');

-- Verify the winner was set
SELECT 
    ce.id,
    p.email,
    ce.guess_x,
    ce.guess_y,
    ce.distance_to_ball,
    ce.created_at
FROM competition_entries ce
LEFT JOIN profiles p ON ce.user_id = p.id
WHERE ce.competition_id = '40c12fe1-5fd2-41d4-9b63-5ee5c7d0a5a1'
  AND ce.is_winner = true;

