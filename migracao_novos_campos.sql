-- ============================================================
-- MIGRAÇÃO: Novos campos na OS + Formas de Pagamento
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona campo "cidade" na OS
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);

-- 2. Adiciona campo "numero_os_externo" para rastreabilidade
--    (referência ao número de OP/OS em outro sistema)
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS numero_os_externo VARCHAR(100);

-- 3. Adiciona "Cheque" e "Bonificação" nas formas de pagamento
INSERT INTO formas_pagamento (nome, ativo)
VALUES
  ('Cheque',      true),
  ('Bonificação', true)
ON CONFLICT DO NOTHING;

-- 4. Garante que o status "aprovada" está na constraint
--    (caso a migração anterior não tenha sido executada)
ALTER TABLE ordens_servico
  DROP CONSTRAINT IF EXISTS ordens_servico_status_check;

ALTER TABLE ordens_servico
  ADD CONSTRAINT ordens_servico_status_check
  CHECK (status IN (
    'em_aberto',
    'aguardando_aprovacao',
    'aprovada',
    'em_producao',
    'concluida',
    'cancelada'
  ));

ALTER TABLE ordens_servico
  ALTER COLUMN status SET DEFAULT 'em_aberto';

-- 5. Verifica resultado
SELECT
  'formas_pagamento' AS tabela,
  nome               AS item
FROM formas_pagamento
ORDER BY nome;

SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'ordens_servico'
  AND column_name IN ('cidade', 'numero_os_externo')
ORDER BY column_name;
