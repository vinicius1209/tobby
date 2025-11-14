-- Remove payment method column from recibos_processados table
-- This migration removes the metodo_pagamento column as it's no longer needed in the application

-- Drop the column
ALTER TABLE recibos_processados DROP COLUMN IF EXISTS metodo_pagamento;

-- Recreate spending_by_type view (in case it referenced metodo_pagamento)
CREATE OR REPLACE VIEW spending_by_type AS
SELECT
  chat_id,
  tipo_estabelecimento,
  COUNT(*) as receipt_count,
  SUM(valor_total) as total_spent
FROM recibos_processados
WHERE tipo_estabelecimento IS NOT NULL
GROUP BY chat_id, tipo_estabelecimento;

-- Recreate monthly_spending_summary view (should not be affected but recreating for consistency)
CREATE OR REPLACE VIEW monthly_spending_summary AS
SELECT
  chat_id,
  DATE_TRUNC('month', data_compra) as month,
  COUNT(*) as total_receipts,
  SUM(valor_total) as total_spent,
  AVG(valor_total) as avg_spent
FROM recibos_processados
GROUP BY chat_id, DATE_TRUNC('month', data_compra);
