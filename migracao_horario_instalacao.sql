-- ============================================================
-- MIGRAÇÃO: Campo horario_instalacao na OS
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS horario_instalacao TIMESTAMPTZ;

-- Índice para consultas por horário de instalação
CREATE INDEX IF NOT EXISTS idx_os_horario_instalacao
  ON ordens_servico(horario_instalacao)
  WHERE horario_instalacao IS NOT NULL;

-- Verifica
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ordens_servico'
  AND column_name IN ('horario_instalacao', 'responsavel_instalacao_id')
ORDER BY column_name;
