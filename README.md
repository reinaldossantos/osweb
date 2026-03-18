# VisualOS — Sistema de Ordens de Serviço

## Indústria da Comunicação Visual

---

## 📋 Visão Geral

O **VisualOS** é um sistema completo de lançamento e acompanhamento de Ordens de Serviço (O.S.) desenvolvido especificamente para empresas da indústria da comunicação visual.

### Tecnologias Utilizadas

- **React 18** — Interface moderna e responsiva
- **Supabase** — Banco de dados PostgreSQL + Autenticação
- **Lucide React** — Biblioteca de ícones
- **React Hot Toast** — Notificações modernas
- **Vite** — Build tool rápido

---

## 🗂️ Módulos do Sistema

### 📊 Dashboard

- Total de OS por status em tempo real
- OS em atraso, previstas para hoje, lançadas hoje
- Valores sumarizados por status (Aberto, Concluído, Total)
- Barra de distribuição por status
- Tabela das últimas OS lançadas

### 📄 Ordens de Serviço

- Lançamento com número sequencial automático
- Captura automática de data/hora do lançamento e usuário
- Seleção de etapas âncora por serviço
- Itens/produtos com cálculo automático
- Campo de data de entrega
- 5 status: Aguardando / Em Produção / Aguard. Aprovação / Concluída / Cancelada
- 4 níveis de prioridade: Baixa / Normal / Alta / Urgente
- Histórico automático de alterações de status
- Visualização detalhada com etapas interativas (check)
- Filtros por status, prioridade e busca textual
- Alertas visuais para OS atrasadas e com entrega hoje

### 👥 Clientes

- Cadastro completo (nome, email, telefone, CPF/CNPJ, endereço)
- Vinculado obrigatoriamente a cada OS

### 👤 Funcionários

- Cadastro com nome, email, telefone e cargo
- Todo usuário é obrigatoriamente um funcionário

### 💼 Cargos

- Cadastro simples de cargos/funções

### 📦 Serviços

- Catálogo de serviços com valor base e unidade
- Base para as etapas e itens de OS

### 🔧 Etapas de Serviço

- Etapas vinculadas a serviços
- Ordem e duração estimada
- Ancoradas no momento do lançamento da OS

### 🏷️ Tipos de O.S.

- Código + nome (ex: BANNER, ACM, ADESIVO...)

### 💳 Formas de Pagamento

- Cadastro de todas as formas aceitas

### 🔐 Usuários (somente Admin)

- Perfis: Básico e Administrador
- Somente admins criam novos usuários
- Todo usuário é vinculado a um funcionário

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuito)

### 1. Clonar/extrair o projeto

```bash
# Instalar dependências
npm install
```

### 2. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor**
3. Cole e execute **todo o conteúdo** do arquivo `supabase_schema.sql`
4. Vá em **Project Settings → API**
5. Copie a **URL** e a **anon public key**

### 3. Configurar variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite .env com seus dados
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 4. Criar o primeiro usuário administrador

No **Supabase Dashboard → Authentication → Users**, clique em **Add user** e crie um usuário com email e senha.

Depois, no **SQL Editor**, execute:

```sql
-- Substitua pelo ID do usuário criado no auth e pelo email
INSERT INTO funcionarios (id, nome, email) VALUES ('Administrador', 'admin@suaempresa.com.br');

INSERT INTO usuarios (funcionario_id, auth_user_id, perfil)
VALUES (
  (SELECT id FROM funcionarios WHERE email = 'admin@suaempresa.com.br'),
  (SELECT id FROM auth.users WHERE email = 'admin@suaempresa.com.br'),
  'admin'
);
```

### 5. Executar o sistema

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

O sistema estará disponível em `http://localhost:5173`

---

## 📱 Responsividade

O sistema é totalmente responsivo, adaptando-se a:

- **Desktop** — Layout com sidebar lateral fixa
- **Tablet** — Sidebar recolhível
- **Mobile** — Sidebar em overlay

---

## 🔒 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Autenticação via Supabase Auth (JWT)
- Controle de acesso por perfil (básico/admin)
- Somente admins podem criar novos usuários

---

## 📈 Sugestões de Evolução Futura

1. **Relatórios em PDF** — Exportar OS em PDF para envio ao cliente
2. **Notificações por email** — Alertas de prazo via Supabase Edge Functions
3. **Módulo financeiro** — Contas a receber vinculadas às OS
4. **App mobile** — React Native com mesmo backend Supabase
5. **Portal do cliente** — Acompanhamento de OS pelo cliente
6. **Galeria de fotos** — Anexar fotos de antes/durante/depois
7. **Assinatura digital** — Aprovação de arte pelo cliente
8. **Integração com WhatsApp** — Notificações automáticas

---

## 🆘 Suporte

Para dúvidas sobre configuração do Supabase:

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Community Discord](https://discord.supabase.com)
