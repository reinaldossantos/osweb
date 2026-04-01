-- ============================================================
-- MIGRAÇÃO: Novos status, campos de etapa, entrega e retrabalho
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Atualiza constraint de status com todos os novos valores
ALTER TABLE ordens_servico
  DROP CONSTRAINT IF EXISTS ordens_servico_status_check;

ALTER TABLE ordens_servico
  ADD CONSTRAINT ordens_servico_status_check
  CHECK (status IN (
    'em_aberto','aguardando_aprovacao','aprovada',
    'producao_interna','producao_externa','em_producao',
    'acabamento','em_instalacao','retrabalho',
    'concluida','cancelada'
  ));

-- 2. Campos de tipo de produção
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS tipo_producao VARCHAR(20); -- 'interna' ou 'externa'

-- 3. Campos de entrega/conclusão
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS entregue           BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nome_recebedor     VARCHAR(200),
  ADD COLUMN IF NOT EXISTS data_entrega_real  TIMESTAMPTZ;

-- 4. Campos de retrabalho
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS tem_retrabalho        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cobrar_retrabalho     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_retrabalho      NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motivo_retrabalho     TEXT;

-- 5. Responsável por etapa (os_etapas)
ALTER TABLE os_etapas
  ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES funcionarios(id),
  ADD COLUMN IF NOT EXISTS duracao_minutos NUMERIC(5,1);

-- 6. Campo duração em minutos nas etapas_servico
ALTER TABLE etapas_servico
  ADD COLUMN IF NOT EXISTS duracao_estimada_minutos NUMERIC(5,1);

-- Verifica
SELECT 'ordens_servico' as tabela, column_name
FROM information_schema.columns
WHERE table_name = 'ordens_servico'
  AND column_name IN ('tipo_producao','entregue','nome_recebedor','data_entrega_real','tem_retrabalho','cobrar_retrabalho','valor_retrabalho')
UNION ALL
SELECT 'os_etapas', column_name
FROM information_schema.columns
WHERE table_name = 'os_etapas'
  AND column_name IN ('funcionario_id','duracao_minutos')
ORDER BY 1, 2;
