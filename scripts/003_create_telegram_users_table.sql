-- Create telegram_users table to link Supabase users with Telegram chat_id
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);

-- Create index on chat_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(chat_id);

-- Enable Row Level Security
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own telegram_users record
CREATE POLICY "Users can view their own telegram connection"
  ON telegram_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own telegram_users record
CREATE POLICY "Users can link their own telegram account"
  ON telegram_users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own telegram_users record
CREATE POLICY "Users can update their own telegram connection"
  ON telegram_users
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_telegram_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_telegram_users_timestamp
  BEFORE UPDATE ON telegram_users
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_users_updated_at();

-- Add comment to table
COMMENT ON TABLE telegram_users IS 'Stores the relationship between Supabase users and Telegram chat IDs';
