-- Fix RLS policies for competition_entries table
-- Run this in Supabase SQL Editor

-- First, drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own entries" ON competition_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON competition_entries;
DROP POLICY IF EXISTS "Authenticated users can view all entries" ON competition_entries;
DROP POLICY IF EXISTS "Admins have full access to entries" ON competition_entries;

-- Create simple, working RLS policies
CREATE POLICY "Enable read access for users based on user_id" ON competition_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id" ON competition_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also ensure competitions table has proper RLS
-- Check if competitions table has RLS enabled
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Drop existing competition policies that might be restrictive
DROP POLICY IF EXISTS "Enable read access for all users" ON competitions;
DROP POLICY IF EXISTS "Public competitions are viewable by everyone" ON competitions;

-- Create simple policy for competitions - allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read competitions" ON competitions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Test queries to verify the policies work
-- These should return results if the policies are correct

-- Test 1: Check if current user can read their own entries
SELECT 'Testing user entries access...' as test;
SELECT COUNT(*) as user_entry_count 
FROM competition_entries 
WHERE user_id = auth.uid();

-- Test 2: Check if current user can read competitions
SELECT 'Testing competitions access...' as test;
SELECT COUNT(*) as competition_count 
FROM competitions;

-- Test 3: First check what columns exist in competitions table
SELECT 'Checking competitions table structure...' as test;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'competitions' 
ORDER BY ordinal_position;

-- Test 4: Try to fetch user entries with competition details (using existing columns)
SELECT 'Testing join query...' as test;
SELECT 
  ce.id,
  ce.competition_id,
  ce.guess_x,
  ce.guess_y,
  c.title,
  c.id as comp_id
FROM competition_entries ce
LEFT JOIN competitions c ON ce.competition_id = c.id
WHERE ce.user_id = auth.uid()
LIMIT 5;
