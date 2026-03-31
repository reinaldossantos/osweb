-- ============================================================
-- MIGRAÇÃO: Novos campos na OS (estado, descontos)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS estado             VARCHAR(2),
  ADD COLUMN IF NOT EXISTS desconto_valor     NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC(5,2)  DEFAULT 0;

-- Verifica
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ordens_servico'
  AND column_name IN ('estado','desconto_valor','desconto_percentual')
ORDER BY column_name;
