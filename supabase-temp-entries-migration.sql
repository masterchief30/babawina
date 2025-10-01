-- Migration: Create temporary entries table for preserving game entries during signup
-- This table stores game entries for users who haven't confirmed their email yet

CREATE TABLE IF NOT EXISTS temp_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    competition_title TEXT NOT NULL,
    prize_short TEXT NOT NULL,
    entry_price INTEGER NOT NULL, -- Price in cents
    entries_data JSONB NOT NULL, -- Array of game entries with x, y coordinates
    image_url TEXT NOT NULL,
    user_email TEXT, -- Set when user signs up
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Ensure one temp entry per session per competition
    UNIQUE(session_id, competition_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_temp_entries_session_id ON temp_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_temp_entries_user_email ON temp_entries(user_email);
CREATE INDEX IF NOT EXISTS idx_temp_entries_expires_at ON temp_entries(expires_at);

-- RLS (Row Level Security) policies
ALTER TABLE temp_entries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert temp entries (for unauthenticated users)
CREATE POLICY "Allow anonymous insert temp entries" ON temp_entries
    FOR INSERT 
    WITH CHECK (true);

-- Allow users to read their own temp entries by session_id or email
CREATE POLICY "Allow read own temp entries" ON temp_entries
    FOR SELECT 
    USING (
        session_id = current_setting('request.headers')::json->>'x-session-id'
        OR user_email = auth.jwt() ->> 'email'
    );

-- Allow users to update their own temp entries
CREATE POLICY "Allow update own temp entries" ON temp_entries
    FOR UPDATE 
    USING (
        session_id = current_setting('request.headers')::json->>'x-session-id'
        OR user_email = auth.jwt() ->> 'email'
    );

-- Allow users to delete their own temp entries
CREATE POLICY "Allow delete own temp entries" ON temp_entries
    FOR DELETE 
    USING (
        session_id = current_setting('request.headers')::json->>'x-session-id'
        OR user_email = auth.jwt() ->> 'email'
    );

-- Function to clean up expired temp entries (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_temp_entries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM temp_entries 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up expired entries daily
-- Note: This requires the pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-temp-entries', '0 2 * * *', 'SELECT cleanup_expired_temp_entries();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON temp_entries TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON temp_entries TO authenticated;

-- Comments for documentation
COMMENT ON TABLE temp_entries IS 'Temporary storage for game entries during user signup and email confirmation process';
COMMENT ON COLUMN temp_entries.session_id IS 'Unique session identifier for anonymous users';
COMMENT ON COLUMN temp_entries.entries_data IS 'JSON array of game entries with x, y coordinates and metadata';
COMMENT ON COLUMN temp_entries.user_email IS 'Email address associated during signup process';
COMMENT ON COLUMN temp_entries.expires_at IS 'Expiration timestamp - entries are deleted after 24 hours';
