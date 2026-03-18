-- ============================================================
-- SISTEMA DE ORDEM DE SERVIÇO - COMUNICAÇÃO VISUAL
-- Schema Supabase / PostgreSQL
-- ============================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: cargos
-- ============================================================
CREATE TABLE cargos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: funcionarios
-- ============================================================
CREATE TABLE funcionarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  cargo_id UUID REFERENCES cargos(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: usuarios (vinculado a funcionarios)
-- ============================================================
CREATE TABLE usuarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funcionario_id UUID REFERENCES funcionarios(id) NOT NULL,
  auth_user_id UUID UNIQUE, -- referência ao auth.users do Supabase
  perfil VARCHAR(20) NOT NULL DEFAULT 'basico' CHECK (perfil IN ('basico', 'admin')),
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: formas_pagamento
-- ============================================================
CREATE TABLE formas_pagamento (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: tipos_os
-- ============================================================
CREATE TABLE tipos_os (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: servicos
-- ============================================================
CREATE TABLE servicos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  valor_base DECIMAL(10,2) DEFAULT 0,
  unidade VARCHAR(30) DEFAULT 'un',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: etapas_servico
-- ============================================================
CREATE TABLE etapas_servico (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  servico_id UUID REFERENCES servicos(id),
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  duracao_estimada_horas DECIMAL(5,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: clientes
-- ============================================================
CREATE TABLE clientes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  telefone VARCHAR(20),
  documento VARCHAR(30), -- CPF ou CNPJ
  endereco TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ordens_servico
-- ============================================================
CREATE TABLE ordens_servico (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  numero_os SERIAL UNIQUE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) NOT NULL,
  tipo_os_id UUID REFERENCES tipos_os(id),
  servico_id UUID REFERENCES servicos(id),
  forma_pagamento_id UUID REFERENCES formas_pagamento(id),
  usuario_lancamento_id UUID REFERENCES usuarios(id) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'aguardando' 
    CHECK (status IN ('aguardando', 'em_producao', 'aguardando_aprovacao', 'concluida', 'cancelada')),
  prioridade VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  observacoes_internas TEXT,
  valor_total DECIMAL(10,2) DEFAULT 0,
  data_lancamento TIMESTAMPTZ DEFAULT NOW(),
  data_entrega_prevista DATE,
  data_conclusao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: os_etapas (etapas ancoradas à OS)
-- ============================================================
CREATE TABLE os_etapas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  os_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE NOT NULL,
  etapa_id UUID REFERENCES etapas_servico(id),
  nome_etapa VARCHAR(150) NOT NULL, -- snapshot do nome no momento do lançamento
  ordem INTEGER DEFAULT 0,
  concluida BOOLEAN DEFAULT false,
  data_conclusao TIMESTAMPTZ,
  responsavel_id UUID REFERENCES funcionarios(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: os_historico (log de alterações)
-- ============================================================
CREATE TABLE os_historico (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  os_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  tipo_evento VARCHAR(50) NOT NULL, -- 'status_alterado', 'criada', 'editada', 'etapa_concluida'
  descricao TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: os_itens (itens/serviços da OS)
-- ============================================================
CREATE TABLE os_itens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  os_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE NOT NULL,
  servico_id UUID REFERENCES servicos(id),
  descricao VARCHAR(200) NOT NULL,
  quantidade DECIMAL(10,3) DEFAULT 1,
  valor_unitario DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_os_status ON ordens_servico(status);
CREATE INDEX idx_os_data_lancamento ON ordens_servico(data_lancamento);
CREATE INDEX idx_os_data_entrega ON ordens_servico(data_entrega_prevista);
CREATE INDEX idx_os_cliente ON ordens_servico(cliente_id);
CREATE INDEX idx_os_usuario ON ordens_servico(usuario_lancamento_id);
CREATE INDEX idx_os_numero ON ordens_servico(numero_os);
CREATE INDEX idx_etapas_servico ON etapas_servico(servico_id);
CREATE INDEX idx_os_etapas_os ON os_etapas(os_id);
CREATE INDEX idx_historico_os ON os_historico(os_id);

-- ============================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON cargos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON funcionarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tipos_os_updated_at BEFORE UPDATE ON tipos_os FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_os_updated_at BEFORE UPDATE ON ordens_servico FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_os_etapas_updated_at BEFORE UPDATE ON os_etapas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNÇÃO: registrar histórico automaticamente ao alterar status
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_historico_os()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO os_historico (os_id, tipo_evento, descricao, valor_anterior, valor_novo)
    VALUES (NEW.id, 'status_alterado', 'Status da OS alterado', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_historico_os
AFTER UPDATE ON ordens_servico
FOR EACH ROW EXECUTE FUNCTION registrar_historico_os();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_itens ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados podem ver tudo
CREATE POLICY "Authenticated users can read" ON cargos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON formas_pagamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON tipos_os FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON etapas_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON ordens_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON os_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON os_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON os_itens FOR SELECT TO authenticated USING (true);

-- Write policies: usuários autenticados podem inserir/atualizar
CREATE POLICY "Authenticated users can insert" ON clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON ordens_servico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON ordens_servico FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON os_etapas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON os_etapas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON os_historico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert" ON os_itens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete" ON os_itens FOR DELETE TO authenticated USING (true);

-- Admin-only write policies (gerenciados via service_role ou função customizada)
CREATE POLICY "Admin can manage" ON cargos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can manage" ON funcionarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can manage" ON usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can manage" ON formas_pagamento FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can manage" ON tipos_os FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can manage" ON servicos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can manage" ON etapas_servico FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- DADOS INICIAIS (SEED)
-- ============================================================

-- Cargos
INSERT INTO cargos (nome, descricao) VALUES
  ('Administrador', 'Acesso total ao sistema'),
  ('Atendente', 'Responsável pelo atendimento e lançamento de OS'),
  ('Operador de Produção', 'Responsável pela execução dos serviços'),
  ('Designer', 'Responsável pela criação e diagramação'),
  ('Instalador', 'Responsável pela instalação dos materiais');

-- Formas de Pagamento
INSERT INTO formas_pagamento (nome) VALUES
  ('Dinheiro'),
  ('PIX'),
  ('Cartão de Débito'),
  ('Cartão de Crédito'),
  ('Boleto Bancário'),
  ('Transferência Bancária');

-- Tipos de OS
INSERT INTO tipos_os (codigo, nome) VALUES
  ('BANNER', 'Banner / Faixa'),
  ('ACM', 'Fachada ACM'),
  ('ADESIVO', 'Adesivagem'),
  ('LONA', 'Impressão em Lona'),
  ('LETC', 'Letreiro Caixa'),
  ('PLACA', 'Placa em PVC / PS'),
  ('NEON', 'Letreiro Neon'),
  ('ENVELOPAMENTO', 'Envelopamento Veicular'),
  ('PLOTAGEM', 'Plotagem'),
  ('OUTROS', 'Outros Serviços');

-- Serviços
INSERT INTO servicos (nome, descricao, valor_base, unidade) VALUES
  ('Impressão Digital Grande Formato', 'Impressão em lona, banner ou vinil', 25.00, 'm²'),
  ('Recorte em Vinil Adesivo', 'Recorte em plotter de corte', 15.00, 'm²'),
  ('Instalação de ACM', 'Instalação de fachada em ACM', 180.00, 'h'),
  ('Adesivagem Veicular', 'Aplicação de adesivos em veículos', 120.00, 'un'),
  ('Confecção de Placa', 'Placa em PVC ou PS com impressão', 45.00, 'un'),
  ('Letreiro Luminoso', 'Fabricação de letreiro em caixa luminosa', 350.00, 'un'),
  ('Plotagem em Papel', 'Plotagem em papel sulfite ou couché', 8.00, 'm²'),
  ('Instalação de Banner', 'Instalação com suporte de banner', 30.00, 'un'),
  ('Design e Arte Final', 'Criação e diagramação de arte', 80.00, 'h'),
  ('Envelopamento Veicular Completo', 'Envelopamento total do veículo', 1200.00, 'un');

-- Etapas por Serviço (alguns exemplos)
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Briefing com cliente', 1, 0.5 FROM servicos WHERE nome = 'Impressão Digital Grande Formato';
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Criação da arte', 2, 2.0 FROM servicos WHERE nome = 'Impressão Digital Grande Formato';
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Aprovação do cliente', 3, 0.5 FROM servicos WHERE nome = 'Impressão Digital Grande Formato';
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Impressão', 4, 1.0 FROM servicos WHERE nome = 'Impressão Digital Grande Formato';
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Acabamento e embalagem', 5, 0.5 FROM servicos WHERE nome = 'Impressão Digital Grande Formato';
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Entrega/Instalação', 6, 1.0 FROM servicos WHERE nome = 'Impressão Digital Grande Formato';

INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Medição e vistoria', 1, 1.0 FROM servicos WHERE nome = 'Instalação de ACM';
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Projeto e aprovação', 2, 3.0 FROM servicos WHERE nome = 'Instalação de ACM';
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Corte e preparação do ACM', 3, 4.0 FROM servicos WHERE nome = 'Instalação de ACM';
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Instalação da estrutura', 4, 6.0 FROM servicos WHERE nome = 'Instalação de ACM';
INSERT INTO etapas_servico (servico_id, nome, ordem, duracao_estimada_horas)
SELECT id, 'Acabamento e limpeza', 5, 1.0 FROM servicos WHERE nome = 'Instalação de ACM';
