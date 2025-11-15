-- Create daily visit counter table
CREATE TABLE IF NOT EXISTS daily_visit_counter (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  visit_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_visit_counter_date ON daily_visit_counter(date);

-- Enable Row Level Security
ALTER TABLE daily_visit_counter ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the counter
CREATE POLICY "Anyone can read visit counter"
ON daily_visit_counter
FOR SELECT
TO public
USING (true);

-- Allow anyone to insert/update (for incrementing)
CREATE POLICY "Anyone can increment counter"
ON daily_visit_counter
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Function to increment today's counter
CREATE OR REPLACE FUNCTION increment_daily_visits()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  current_count integer;
BEGIN
  -- Try to increment existing row for today
  UPDATE daily_visit_counter
  SET visit_count = visit_count + 1
  WHERE date = CURRENT_DATE
  RETURNING visit_count INTO current_count;
  
  -- If no row exists for today, create one
  IF NOT FOUND THEN
    INSERT INTO daily_visit_counter (date, visit_count)
    VALUES (CURRENT_DATE, 1)
    RETURNING visit_count INTO current_count;
  END IF;
  
  RETURN current_count;
END;
$$;

-- Function to get today's count
CREATE OR REPLACE FUNCTION get_daily_visits()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT visit_count INTO current_count
  FROM daily_visit_counter
  WHERE date = CURRENT_DATE;
  
  -- If no row exists for today, return 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  RETURN current_count;
END;
$$;

