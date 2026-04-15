-- ============================================================
-- MIGRAÇÃO: Índices para estado e horario_instalacao
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Índice simples no campo estado (UF)
--    Acelera consultas com WHERE estado = 'SP', filtros por estado, etc.
CREATE INDEX IF NOT EXISTS idx_os_estado
  ON ordens_servico(estado)
  WHERE estado IS NOT NULL;

-- 2. Índice composto (estado, cidade)
--    Acelera consultas que filtram por estado + cidade simultaneamente
--    (ex.: WHERE estado = 'SP' AND cidade = 'São Paulo')
CREATE INDEX IF NOT EXISTS idx_os_estado_cidade
  ON ordens_servico(estado, cidade)
  WHERE estado IS NOT NULL;

-- 3. Índice composto (status, horario_instalacao)
--    Acelera relatórios de instalação que filtram por status e horário
--    (ex.: WHERE status = 'em_instalacao' OR horario_instalacao IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_os_status_horario_instalacao
  ON ordens_servico(status, horario_instalacao)
  WHERE horario_instalacao IS NOT NULL;

-- Verifica índices criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ordens_servico'
  AND indexname IN (
    'idx_os_estado',
    'idx_os_estado_cidade',
    'idx_os_status_horario_instalacao'
  )
ORDER BY indexname;
