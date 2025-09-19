-- Create competition_entries table to store user guesses
CREATE TABLE IF NOT EXISTS competition_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Coordinates where user clicked (percentage-based, 0-100)
  guess_x DECIMAL(8,5) NOT NULL, -- e.g., 45.67890 (45.67890% from left)
  guess_y DECIMAL(8,5) NOT NULL, -- e.g., 32.12345 (32.12345% from top)
  
  -- Entry metadata
  entry_price_paid INTEGER NOT NULL, -- Price paid in cents (e.g., 410 = R4.10)
  entry_number INTEGER NOT NULL, -- Which entry this is for this user (1, 2, 3, etc.)
  
  -- Distance calculation (calculated when competition is judged)
  distance_to_ball DECIMAL(10,5) NULL, -- Distance in pixels or percentage points
  is_winner BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_id ON competition_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_user_id ON competition_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_distance ON competition_entries(distance_to_ball);
CREATE INDEX IF NOT EXISTS idx_competition_entries_winner ON competition_entries(is_winner);

-- Create unique constraint to prevent duplicate entries at exact same coordinates
CREATE UNIQUE INDEX IF NOT EXISTS idx_competition_entries_unique_guess 
ON competition_entries(competition_id, user_id, guess_x, guess_y);

-- Enable RLS (Row Level Security)
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own entries
CREATE POLICY "Users can view own entries" ON competition_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own entries" ON competition_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete entries (entries are final)
-- Only admins can update entries (for judging/winner calculation)

-- Admin policy for full access
CREATE POLICY "Admins have full access to entries" ON competition_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_competition_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_competition_entries_updated_at
  BEFORE UPDATE ON competition_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_competition_entries_updated_at();
