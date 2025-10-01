-- Migration: Create pending_bets table for token-based bet storage
-- This table stores bets immediately when placed, before user confirmation

CREATE TABLE IF NOT EXISTS pending_bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_token TEXT NOT NULL,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    competition_title TEXT NOT NULL,
    prize_short TEXT NOT NULL,
    entry_price INTEGER NOT NULL, -- Price in cents
    guess_x NUMERIC NOT NULL, -- X coordinate of guess
    guess_y NUMERIC NOT NULL, -- Y coordinate of guess
    entry_number INTEGER NOT NULL, -- 1, 2, 3, 4, 5 for multiple bets
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_confirmation', -- 'pending_confirmation', 'confirmed', 'expired'
    confirmed_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Set when confirmed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Ensure unique entry numbers per token
    UNIQUE(submission_token, entry_number)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pending_bets_token ON pending_bets(submission_token);
CREATE INDEX IF NOT EXISTS idx_pending_bets_status ON pending_bets(status);
CREATE INDEX IF NOT EXISTS idx_pending_bets_expires_at ON pending_bets(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_bets_competition_id ON pending_bets(competition_id);

-- RLS (Row Level Security) policies
ALTER TABLE pending_bets ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert pending bets
CREATE POLICY "Allow anonymous insert pending bets" ON pending_bets
    FOR INSERT 
    WITH CHECK (true);

-- Allow users to read pending bets by token (for confirmation)
CREATE POLICY "Allow read pending bets by token" ON pending_bets
    FOR SELECT 
    USING (true); -- Anyone can read with token (needed for confirmation)

-- Allow authenticated users to update their confirmed bets
CREATE POLICY "Allow update confirmed bets" ON pending_bets
    FOR UPDATE 
    USING (auth.uid() = confirmed_user_id);

-- Function to clean up expired pending bets (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_pending_bets()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM pending_bets 
    WHERE expires_at < NOW() AND status = 'pending_confirmation';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT ON pending_bets TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON pending_bets TO authenticated;

-- Comments for documentation
COMMENT ON TABLE pending_bets IS 'Stores bets immediately when placed, before user email confirmation';
COMMENT ON COLUMN pending_bets.submission_token IS 'Unique token linking all bets in a submission';
COMMENT ON COLUMN pending_bets.status IS 'pending_confirmation, confirmed, or expired';
COMMENT ON COLUMN pending_bets.confirmed_user_id IS 'User ID set after email confirmation';
COMMENT ON COLUMN pending_bets.expires_at IS 'Bets expire after 7 days if not confirmed';
