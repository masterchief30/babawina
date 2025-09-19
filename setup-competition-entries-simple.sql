-- Simple setup for competition_entries table
-- Run this in Supabase SQL Editor

-- Create competition_entries table to store user guesses
CREATE TABLE IF NOT EXISTS competition_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Coordinates where user clicked (percentage-based, 0-100)
  guess_x DECIMAL(8,5) NOT NULL,
  guess_y DECIMAL(8,5) NOT NULL,
  
  -- Entry metadata
  entry_price_paid INTEGER NOT NULL DEFAULT 30,
  entry_number INTEGER NOT NULL DEFAULT 1,
  
  -- Distance calculation (calculated when competition is judged)
  distance_to_ball DECIMAL(10,5) NULL,
  is_winner BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_id ON competition_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_user_id ON competition_entries(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies
-- Users can view their own entries
CREATE POLICY "Users can view own entries" ON competition_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own entries" ON competition_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read all entries (for leaderboards, etc.)
CREATE POLICY "Authenticated users can view all entries" ON competition_entries
  FOR SELECT USING (auth.role() = 'authenticated');
