-- Migration: Add soft delete support to recibos_processados table
-- Date: 2025-11-13
-- Description: Adds deleted_at column for soft delete functionality

-- Add deleted_at column to recibos_processados table
ALTER TABLE recibos_processados
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add index on deleted_at for faster queries filtering deleted records
CREATE INDEX idx_recibos_deleted_at ON recibos_processados(deleted_at);

-- Add comment to column for documentation
COMMENT ON COLUMN recibos_processados.deleted_at IS 'Timestamp when the record was soft deleted. NULL means the record is active.';
