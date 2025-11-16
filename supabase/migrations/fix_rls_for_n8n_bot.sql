-- Fix RLS policy to allow n8n Telegram bot insertions
-- This allows insertions if the user_id exists in telegram_users table

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own transactions" ON user_transactions;
DROP POLICY IF EXISTS "Users and service can insert transactions" ON user_transactions;

-- Create a new INSERT policy that allows:
-- 1. Authenticated users to insert their own transactions
-- 2. Any client to insert if user_id exists in telegram_users (for n8n bot)
CREATE POLICY "Allow valid user insertions"
  ON user_transactions FOR INSERT
  WITH CHECK (
    -- Allow if authenticated user matches
    auth.uid() = user_id
    OR
    -- Allow if user_id exists in telegram_users table
    -- This allows n8n bot to insert for valid telegram users
    EXISTS (
      SELECT 1 FROM telegram_users
      WHERE telegram_users.user_id = user_transactions.user_id
    )
  );

COMMENT ON POLICY "Allow valid user insertions" ON user_transactions IS
  'Allows authenticated users to insert their own transactions OR insertions for any valid telegram user (enables n8n bot insertions)';
