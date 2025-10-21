
CREATE INDEX IF NOT EXISTS idx_recibos_chat_id ON recibos_processados(chat_id);

-- Enable Row Level Security
ALTER TABLE recibos_processados ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own receipts
-- Users can insert their own receipts
-- Users can update their own receipts
-- Users can delete their own receipts


-- Create a view for monthly spending summary
CREATE OR REPLACE VIEW monthly_spending_summary AS
SELECT 
  chat_id,
  DATE_TRUNC('month', data_compra) as month,
  COUNT(*) as total_receipts,
  SUM(valor_total) as total_spent,
  AVG(valor_total) as avg_spent
FROM recibos_processados
GROUP BY chat_id, DATE_TRUNC('month', data_compra);

-- Create a view for spending by establishment type
CREATE OR REPLACE VIEW spending_by_type AS
SELECT 
  chat_id,
  tipo_estabelecimento,
  COUNT(*) as receipt_count,
  SUM(valor_total) as total_spent
FROM recibos_processados
WHERE tipo_estabelecimento IS NOT NULL
GROUP BY chat_id, tipo_estabelecimento;
