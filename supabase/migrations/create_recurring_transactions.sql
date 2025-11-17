-- Migration: Create Recurring Transactions System
-- Date: 2025-11-16
-- Description: Tables for managing recurring income/expense transactions with automatic generation

-- =============================================================================
-- STEP 1: CREATE RECURRING_TRANSACTIONS TABLE
-- =============================================================================

CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  transaction_type TEXT NOT NULL DEFAULT 'deposit' CHECK (transaction_type IN ('withdrawal', 'deposit')),

  -- Frequency configuration
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('monthly', 'biweekly', 'weekly', 'yearly')),
  frequency_config JSONB NOT NULL,
  -- Examples of frequency_config:
  -- Monthly: {"day": 5} → every month on day 5
  -- Biweekly: {"days": [1, 15]} → day 1 and day 15 of every month
  -- Weekly: {"weekday": 5} → every Friday (0=Sunday, 6=Saturday)
  -- Yearly: {"month": 12, "day": 25} → every December 25th

  -- Date range
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT NULL, -- NULL means no end date

  -- Status tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_date DATE DEFAULT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: CREATE TRANSACTION_GENERATION_LOG TABLE
-- =============================================================================

CREATE TABLE transaction_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_transaction_id UUID NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  generated_transaction_id UUID NOT NULL REFERENCES user_transactions(id) ON DELETE CASCADE,
  generated_for_date DATE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate generations for the same date
  UNIQUE(recurring_transaction_id, generated_for_date)
);

-- =============================================================================
-- STEP 3: CREATE INDEXES
-- =============================================================================

-- Recurring transactions indexes
CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_is_active ON recurring_transactions(is_active);
CREATE INDEX idx_recurring_transactions_frequency_type ON recurring_transactions(frequency_type);
CREATE INDEX idx_recurring_transactions_next_gen ON recurring_transactions(is_active, last_generated_date)
  WHERE is_active = true;

-- Generation log indexes
CREATE INDEX idx_generation_log_recurring_id ON transaction_generation_log(recurring_transaction_id);
CREATE INDEX idx_generation_log_generated_id ON transaction_generation_log(generated_transaction_id);
CREATE INDEX idx_generation_log_date ON transaction_generation_log(generated_for_date);

-- =============================================================================
-- STEP 4: CREATE UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recurring_transactions_updated_at
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_generation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_transactions
CREATE POLICY "Users can view their own recurring transactions"
  ON recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring transactions"
  ON recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring transactions"
  ON recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring transactions"
  ON recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transaction_generation_log
-- Users can view logs for their own recurring transactions
CREATE POLICY "Users can view their own generation logs"
  ON transaction_generation_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recurring_transactions
      WHERE recurring_transactions.id = transaction_generation_log.recurring_transaction_id
        AND recurring_transactions.user_id = auth.uid()
    )
  );

-- NOTE: INSERT/UPDATE/DELETE on generation_log should only happen via
-- Edge Function using service_role key (which bypasses RLS).
-- No explicit policies needed for those operations.

-- =============================================================================
-- STEP 6: ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE recurring_transactions IS 'Stores recurring income/expense transaction rules';
COMMENT ON COLUMN recurring_transactions.frequency_type IS 'Type of recurrence: monthly, biweekly, weekly, yearly';
COMMENT ON COLUMN recurring_transactions.frequency_config IS 'JSON configuration for frequency (day, days, weekday, month)';
COMMENT ON COLUMN recurring_transactions.last_generated_date IS 'Last date a transaction was generated for this rule';

COMMENT ON TABLE transaction_generation_log IS 'Logs which transactions were auto-generated from recurring rules';
COMMENT ON COLUMN transaction_generation_log.generated_for_date IS 'The date this transaction was generated for (prevents duplicates)';

-- =============================================================================
-- STEP 7: CREATE HELPER FUNCTION TO VALIDATE FREQUENCY_CONFIG
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_frequency_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate based on frequency_type
  CASE NEW.frequency_type
    WHEN 'monthly' THEN
      IF NOT (NEW.frequency_config ? 'day' AND
              (NEW.frequency_config->>'day')::int BETWEEN 1 AND 31) THEN
        RAISE EXCEPTION 'Monthly frequency requires day field (1-31)';
      END IF;

    WHEN 'biweekly' THEN
      IF NOT (NEW.frequency_config ? 'days' AND
              jsonb_array_length(NEW.frequency_config->'days') = 2) THEN
        RAISE EXCEPTION 'Biweekly frequency requires days array with 2 values';
      END IF;

    WHEN 'weekly' THEN
      IF NOT (NEW.frequency_config ? 'weekday' AND
              (NEW.frequency_config->>'weekday')::int BETWEEN 0 AND 6) THEN
        RAISE EXCEPTION 'Weekly frequency requires weekday field (0-6)';
      END IF;

    WHEN 'yearly' THEN
      IF NOT (NEW.frequency_config ? 'month' AND NEW.frequency_config ? 'day' AND
              (NEW.frequency_config->>'month')::int BETWEEN 1 AND 12 AND
              (NEW.frequency_config->>'day')::int BETWEEN 1 AND 31) THEN
        RAISE EXCEPTION 'Yearly frequency requires month (1-12) and day (1-31)';
      END IF;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_recurring_transaction_config
  BEFORE INSERT OR UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_frequency_config();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
--
-- Summary:
-- ✅ Created: recurring_transactions table
-- ✅ Created: transaction_generation_log table
-- ✅ Created: Indexes for performance
-- ✅ Created: updated_at trigger
-- ✅ Enabled: RLS policies for security
-- ✅ Created: Validation function for frequency_config
--
-- Next steps:
-- 1. Create Supabase Edge Function to generate transactions
-- 2. Set up cron job to run the Edge Function daily
-- 3. Update TypeScript types
-- 4. Build UI for managing recurring transactions
-- =============================================================================
