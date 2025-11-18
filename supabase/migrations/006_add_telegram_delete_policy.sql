-- Migration: Add DELETE policy for telegram_users table
-- This allows users to unlink/delete their own Telegram connection

-- Add DELETE policy for telegram_users
CREATE POLICY "Users can delete their own telegram connection"
  ON telegram_users
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON POLICY "Users can delete their own telegram connection" ON telegram_users IS
  'Allows authenticated users to unlink their Telegram account by deleting their own telegram_users record';
