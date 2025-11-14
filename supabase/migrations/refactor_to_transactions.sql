-- Migration: Refactor from Receipts System to Financial Transactions System
-- Date: 2025-11-13
-- Description: Complete refactor from "recibos_processados" to "user_transactions"
--              Removes: nome_estabelecimento, cnpj, itens_comprados
--              Renames: tipo_estabelecimento → description, data_compra → transaction_date
--              Adds: transaction_type (withdrawal/deposit), categories system

-- =============================================================================
-- STEP 1: CREATE NEW TABLES
-- =============================================================================

-- Main transactions table
CREATE TABLE user_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id TEXT,
  description TEXT,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'withdrawal' CHECK (transaction_type IN ('withdrawal', 'deposit')),
  amount NUMERIC(10, 2) NOT NULL,
  original_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Categories table (user-specific categories)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Junction table for many-to-many relationship
CREATE TABLE transaction_categories (
  transaction_id UUID NOT NULL REFERENCES user_transactions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, category_id)
);

-- =============================================================================
-- STEP 2: CREATE INDEXES
-- =============================================================================

-- Indexes for user_transactions
CREATE INDEX idx_transactions_user_id ON user_transactions(user_id);
CREATE INDEX idx_transactions_chat_id ON user_transactions(chat_id);
CREATE INDEX idx_transactions_deleted_at ON user_transactions(deleted_at);
CREATE INDEX idx_transactions_user_date ON user_transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_type ON user_transactions(transaction_type);

-- Indexes for categories
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Indexes for transaction_categories
CREATE INDEX idx_transaction_categories_transaction ON transaction_categories(transaction_id);
CREATE INDEX idx_transaction_categories_category ON transaction_categories(category_id);

-- =============================================================================
-- STEP 3: MIGRATE DATA FROM OLD TABLE
-- =============================================================================

-- Migrate all existing data to new structure
-- Fields removed: nome_estabelecimento, cnpj, itens_comprados
-- Fields renamed: tipo_estabelecimento → description, data_compra → transaction_date, valor_total → amount
-- NOTE: user_id comes from telegram_users table via chat_id JOIN
INSERT INTO user_transactions (
  id,
  user_id,
  chat_id,
  description,
  transaction_date,
  transaction_type,
  amount,
  original_json,
  created_at,
  deleted_at
)
SELECT
  r.id,
  t.user_id,                      -- get user_id from telegram_users via JOIN
  r.chat_id,
  r.tipo_estabelecimento,         -- renamed to description
  r.data_compra::date,            -- renamed to transaction_date
  'withdrawal',                   -- all existing records are withdrawals
  r.valor_total,                  -- renamed to amount
  r.json_original::jsonb,         -- renamed to original_json
  r.criado_em,                    -- renamed to created_at
  r.deleted_at
FROM recibos_processados r
INNER JOIN telegram_users t ON r.chat_id = t.chat_id;

-- =============================================================================
-- STEP 4: CREATE AUTOMATIC CATEGORIES FROM EXISTING DATA
-- =============================================================================

-- Create categories for each unique tipo_estabelecimento per user
-- NOTE: user_id comes from telegram_users table via chat_id JOIN
INSERT INTO categories (user_id, name, color, icon)
SELECT DISTINCT
  t.user_id,                      -- get user_id from telegram_users via JOIN
  r.tipo_estabelecimento AS name,
  '#808080' AS color,             -- default gray color
  'Store' AS icon                 -- default icon
FROM recibos_processados r
INNER JOIN telegram_users t ON r.chat_id = t.chat_id
WHERE r.tipo_estabelecimento IS NOT NULL
  AND r.tipo_estabelecimento != ''
ON CONFLICT (user_id, name) DO NOTHING;

-- Link transactions to their corresponding categories
INSERT INTO transaction_categories (transaction_id, category_id)
SELECT DISTINCT
  t.id AS transaction_id,
  c.id AS category_id
FROM user_transactions t
JOIN categories c ON c.name = t.description AND c.user_id = t.user_id
WHERE t.description IS NOT NULL;

-- =============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all new tables
ALTER TABLE user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_transactions
CREATE POLICY "Users can view their own transactions"
  ON user_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON user_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON user_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON user_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transaction_categories
-- Allow users to manage relationships for their own transactions
CREATE POLICY "Users can view transaction categories for their transactions"
  ON transaction_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_transactions
      WHERE user_transactions.id = transaction_categories.transaction_id
        AND user_transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transaction categories for their transactions"
  ON transaction_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_transactions
      WHERE user_transactions.id = transaction_categories.transaction_id
        AND user_transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transaction categories for their transactions"
  ON transaction_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_transactions
      WHERE user_transactions.id = transaction_categories.transaction_id
        AND user_transactions.user_id = auth.uid()
    )
  );

-- =============================================================================
-- STEP 6: DROP OLD VIEWS AND CREATE NEW ONES
-- =============================================================================

-- Drop old views that depend on recibos_processados
DROP VIEW IF EXISTS monthly_spending_summary;
DROP VIEW IF EXISTS spending_by_type;

-- Create new view: Monthly transaction summary
CREATE VIEW monthly_transaction_summary AS
SELECT
  user_id,
  chat_id,
  DATE_TRUNC('month', transaction_date)::date AS month,
  transaction_type,
  COUNT(*) AS total_transactions,
  SUM(amount) AS total_amount,
  AVG(amount) AS avg_amount
FROM user_transactions
WHERE deleted_at IS NULL
GROUP BY user_id, chat_id, DATE_TRUNC('month', transaction_date), transaction_type;

-- Create new view: Transactions by description
CREATE VIEW transaction_by_description AS
SELECT
  user_id,
  chat_id,
  description,
  transaction_type,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_amount
FROM user_transactions
WHERE deleted_at IS NULL
  AND description IS NOT NULL
GROUP BY user_id, chat_id, description, transaction_type;

-- =============================================================================
-- STEP 7: ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE user_transactions IS 'Main table for financial transactions (withdrawals and deposits)';
COMMENT ON COLUMN user_transactions.transaction_type IS 'Type of transaction: withdrawal (expense) or deposit (income)';
COMMENT ON COLUMN user_transactions.description IS 'Description of the transaction (replaces tipo_estabelecimento)';
COMMENT ON COLUMN user_transactions.transaction_date IS 'Date when the transaction occurred (renamed from data_compra)';
COMMENT ON COLUMN user_transactions.amount IS 'Transaction amount (renamed from valor_total)';
COMMENT ON COLUMN user_transactions.deleted_at IS 'Soft delete timestamp. NULL means active record';

COMMENT ON TABLE categories IS 'User-defined categories for organizing transactions';
COMMENT ON TABLE transaction_categories IS 'Many-to-many relationship: transactions can have multiple categories';

-- =============================================================================
-- STEP 8: BACKUP OLD TABLE
-- =============================================================================

-- Rename old table to backup (don't drop immediately for safety)
ALTER TABLE recibos_processados RENAME TO recibos_processados_backup;

-- Add comment to backup table
COMMENT ON TABLE recibos_processados_backup IS 'BACKUP of old recibos_processados table before migration to user_transactions. Safe to drop after validation.';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
--
-- Summary of changes:
-- ✅ Created: user_transactions, categories, transaction_categories
-- ✅ Migrated: All data from recibos_processados
-- ✅ Removed fields: nome_estabelecimento, cnpj, itens_comprados
-- ✅ Renamed fields: tipo_estabelecimento→description, data_compra→transaction_date, valor_total→amount
-- ✅ Added: transaction_type column (withdrawal/deposit)
-- ✅ Created: Automatic categories from existing tipo_estabelecimento
-- ✅ Enabled: RLS policies
-- ✅ Updated: Views (monthly_transaction_summary, transaction_by_description)
-- ✅ Backed up: Original table renamed to recibos_processados_backup
--
-- Next steps:
-- 1. Update TypeScript types
-- 2. Update all components to use new table/field names
-- 3. Test thoroughly
-- 4. After validation, drop recibos_processados_backup
--
-- To rollback (if needed):
-- ALTER TABLE user_transactions RENAME TO user_transactions_failed;
-- ALTER TABLE recibos_processados_backup RENAME TO recibos_processados;
-- =============================================================================
