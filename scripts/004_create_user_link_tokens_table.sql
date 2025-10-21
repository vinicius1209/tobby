-- Create user_link_tokens table for temporary tokens to link Telegram accounts
CREATE TABLE IF NOT EXISTS user_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT token_not_expired CHECK (expires_at > created_at)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_link_tokens_user_id ON user_link_tokens(user_id);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_link_tokens_token ON user_link_tokens(token);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_link_tokens_expires_at ON user_link_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE user_link_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own tokens
CREATE POLICY "Users can view their own link tokens"
  ON user_link_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to create their own tokens
CREATE POLICY "Users can create their own link tokens"
  ON user_link_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow service role to update tokens (when Telegram bot uses them)
CREATE POLICY "Service role can update tokens"
  ON user_link_tokens
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create function to cleanup expired tokens (run this periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM user_link_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to table
COMMENT ON TABLE user_link_tokens IS 'Stores temporary tokens for linking Telegram accounts to Supabase users';
COMMENT ON COLUMN user_link_tokens.token IS 'Unique token that user will send to Telegram bot';
COMMENT ON COLUMN user_link_tokens.used_at IS 'Timestamp when the token was used (NULL if not used yet)';
