-- ============================================================
-- MIGRAÇÃO: Campo responsavel_instalacao_id na OS
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona campo de responsável pela instalação
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS responsavel_instalacao_id UUID REFERENCES funcionarios(id);

-- 2. Cria índice para consultas
CREATE INDEX IF NOT EXISTS idx_os_responsavel_instalacao
  ON ordens_servico(responsavel_instalacao_id)
  WHERE responsavel_instalacao_id IS NOT NULL;

-- 3. Verifica
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ordens_servico'
  AND column_name = 'responsavel_instalacao_id';
