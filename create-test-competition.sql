-- Quick SQL to create a test competition
-- Run this in your Supabase SQL editor if you want to quickly add a test competition

INSERT INTO competitions (
  id,
  title,
  slug,
  prize_short,
  prize_value_rand,
  entry_price_rand,
  is_free,
  starts_at,
  ends_at,
  per_user_entry_limit,
  status,
  created_at
) VALUES (
  '40c12fe1-5fd2-41d4-9b63-5ee5c7d0a5a1',
  'Win a PlayStation 5 today',
  'win-a-playstation-5-today',
  'PlayStation 5',
  12000,
  0,
  true,
  NOW(),
  NOW() + INTERVAL '30 days',
  5,
  'live',
  NOW()
);


