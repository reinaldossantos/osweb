# OSWeb 1.0 — Sistema de Ordens de Serviço
## Indústria da Comunicação Visual

---

## 📋 Visão Geral

O **OSWeb 1.0** é um sistema completo de lançamento e acompanhamento de Ordens de Serviço desenvolvido especificamente para empresas da indústria da comunicação visual. Moderno, responsivo e acessível via navegador em desktop e dispositivos móveis.

### Tecnologias Utilizadas
- **React 18** + **Vite** — Interface moderna e responsiva
- **Supabase** — Banco de dados PostgreSQL + Autenticação
- **Lucide React** — Biblioteca de ícones
- **React Hot Toast** — Notificações modernas
- **Plus Jakarta Sans** — Tipografia moderna (Google Fonts)

---

## 🗂️ Estrutura do Projeto

```
src/
├── App.jsx                      ← Layout, sidebar e roteamento
├── main.jsx                     ← Entry point
├── index.css                    ← Estilos globais e tipografia
├── lib/
│   └── supabase.js              ← Client do Supabase
├── constants/
│   └── constants.js             ← Status, prioridades, nav, helpers
├── contexts/
│   └── AuthContext.jsx          ← Autenticação e sessão
├── components/
│   └── components.jsx           ← Modal, FormField, badges, ListPage
├── forms/
│   └── forms.jsx                ← Todos os formulários de cadastro
└── pages/
    ├── LoginPage.jsx            ← Tela de login
    ├── Dashboard.jsx            ← Painel principal interativo
    ├── OrdensServico.jsx        ← OS: lista, nova, detalhe, histórico
    ├── CrudPages.jsx            ← Clientes, Funcionários, Cargos...
    └── Relatorios.jsx           ← Módulo de relatórios
```

---

## 🚀 Módulos do Sistema

### 🔐 Autenticação
- Login com email e senha via Supabase Auth
- Dois perfis de acesso: **Administrador** e **Básico**
- Sessão persistente com renovação automática
- Logout seguro

### 📊 Dashboard — Painel Principal
- **8 cards de métricas** em tempo real: Total de OS, Em Produção, Aguardando, Em Atraso, Para Hoje, Lançadas Hoje, Concluídas, Canceladas
- **3 cards financeiros**: Valor Total Geral, Valor em Aberto, Valor Concluído
- **Cards clicáveis** — ao clicar em qualquer card, abre um modal com a lista filtrada das OS correspondentes
- **Dentro do modal**, clique em qualquer OS para ver seus detalhes completos
- **Distribuição por Status** com barras de progresso clicáveis
- **Últimas Ordens de Serviço** com linhas clicáveis para detalhe completo
- Botão de atualização manual

### 📄 Ordens de Serviço
- **Número sequencial automático** gerado pelo banco
- **Captura automática** de data/hora de lançamento e usuário responsável
- **Coluna "Lançado por"** na listagem e no detalhe da OS
- **5 status** com badges coloridos:
  - 🟡 Aguardando
  - 🔵 Em Produção
  - 🟠 Aguardando Aprovação
  - 🟢 Concluída
  - 🔴 Cancelada
- **4 prioridades**: Baixa, Normal, Alta, Urgente
- Troca de status diretamente na lista (select inline) ou no detalhe
- Data de entrega prevista com alertas visuais de atraso e entrega no dia
- **Etapas âncora**: seleção das etapas necessárias no momento do lançamento com checklist interativo
- **Itens da OS** com cálculo automático de subtotal e total
- Campo de observações internas (não visível ao cliente)
- Filtros por status, prioridade e busca textual

### 📝 Histórico de Alterações
- Registro automático de **todas as alterações de status**
- Registra o **usuário** (admin ou básico) que realizou a alteração
- Exibe **status anterior → novo status** com badges coloridos
- Data e hora precisas de cada evento
- Funciona para todos os perfis de usuário

### 👥 Clientes
- Cadastro completo: nome, email, telefone, CPF/CNPJ, endereço, observações
- Vinculação obrigatória a cada OS

### 👤 Funcionários
- Cadastro com nome, email, telefone e cargo
- Todo usuário do sistema é obrigatoriamente um funcionário

### 💼 Cargos
- Cadastro de cargos/funções da empresa

### 📦 Serviços
- Catálogo de serviços com valor base e unidade de medida
- Botão **"Ver etapas"** em cada serviço para visualizar todas as etapas cadastradas com ordem e duração estimada

### 🔧 Etapas de Serviço
- Etapas vinculadas a cada serviço
- Ordem de execução e duração estimada em horas
- Ancoradas no momento do lançamento da OS
- Checklist interativo no detalhe da OS (marcar como concluída)

### 🏷️ Tipos de O.S.
- Código + nome (ex: BANNER, ACM, ADESIVO, LONA...)

### 💳 Formas de Pagamento
- Cadastro de todas as formas aceitas pela empresa

### 🔑 Usuários *(somente Administrador)*
- Cadastro de usuário com email e senha
- Dois perfis: **Básico** e **Administrador**
- Todo usuário é vinculado a um funcionário
- Somente administradores podem criar novos usuários

### 📈 Relatórios
Módulo com **5 abas** e filtro por período (data início → data fim):

| Aba | Conteúdo |
|---|---|
| **Por Status** | Contagem e valor por status + alerta de atrasadas |
| **Por Cliente** | Ranking de clientes com barras de percentual |
| **Por Tipo OS** | Quantidade, % do total, valor e ticket médio por tipo |
| **Financeiro** | Faturamento total, concluído, em aberto, cancelado, ticket médio + Top 10 OS por valor |
| **Lista Completa** | Tabela exportável com todas as OS do período |

---

## 🎨 Interface

- **Paleta de cores**: tons de lilás/violeta como cor predominante
- **Tipografia**: Plus Jakarta Sans (moderna e legível)
- **Layout**: sidebar fixa + conteúdo rolável independente
- **Responsivo**: adaptado para desktop, tablet e mobile
- **Feedback visual**: toasts de sucesso/erro, hover states, badges coloridos
- **Scrollbar customizada** em tons de lilás

---

## 🗄️ Banco de Dados — Supabase

### Tabelas principais
| Tabela | Descrição |
|---|---|
| `funcionarios` | Cadastro de funcionários |
| `cargos` | Cargos/funções |
| `usuarios` | Usuários do sistema vinculados a funcionários |
| `clientes` | Clientes da empresa |
| `servicos` | Catálogo de serviços |
| `etapas_servico` | Etapas por serviço |
| `tipos_os` | Tipos de ordem de serviço |
| `formas_pagamento` | Formas de pagamento aceitas |
| `ordens_servico` | Ordens de serviço (tabela principal) |
| `os_etapas` | Etapas ancoradas a cada OS |
| `os_itens` | Itens/produtos de cada OS |
| `os_historico` | Histórico de alterações das OS |

### Segurança
- Row Level Security (RLS) habilitado em todas as tabelas
- Autenticação via Supabase Auth (JWT)
- Controle de acesso por perfil (básico/admin)

---

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuito)

### 1. Criar o projeto

```bash
npm create vite@latest osweb -- --template react
cd osweb
npm install
npm install @supabase/supabase-js react-hot-toast lucide-react
```

### 2. Substituir os arquivos `src/`

Copie todos os arquivos do projeto para dentro da pasta `src/` respeitando a estrutura de pastas.

### 3. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor** e execute o arquivo `supabase_schema.sql`
3. Em seguida execute o arquivo `correcao_historico.sql`
4. Vá em **Project Settings → API** e copie a **URL** e a **anon public key**

### 4. Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 5. Criar o primeiro usuário administrador

No **Supabase → Authentication → Users**, crie um usuário com email e senha. Depois execute no **SQL Editor**:

```sql
-- Substitua pelo seu nome e email
INSERT INTO funcionarios (nome, email)
VALUES ('Administrador', 'admin@suaempresa.com.br');

INSERT INTO usuarios (funcionario_id, auth_user_id, perfil)
VALUES (
  (SELECT id FROM funcionarios WHERE email = 'admin@suaempresa.com.br'),
  (SELECT id FROM auth.users   WHERE email = 'admin@suaempresa.com.br'),
  'admin'
);
```

### 6. Configurar autenticação de email (recomendado para testes)

No **Supabase → Authentication → Settings → Email Auth**:
- Desmarque **"Enable email confirmations"** para evitar que novos usuários precisem confirmar o email antes de logar

### 7. Executar o sistema

```bash
npm run dev
```

Acesse em `http://localhost:5173`

---

## 📱 Responsividade

- **Desktop** — Sidebar fixa lateral + conteúdo com scroll independente
- **Tablet** — Sidebar recolhível via botão de menu
- **Mobile** — Menu hamburguer, tabelas com scroll horizontal

---

## 🔄 Arquivos SQL

| Arquivo | Quando executar |
|---|---|
| `supabase_schema.sql` | Na criação inicial do projeto — cria todas as tabelas, triggers, RLS e dados de seed |
| `correcao_historico.sql` | Após a instalação inicial — corrige o registro de histórico para capturar o usuário |
| `seed_corrigido.sql` | Opcional — recarrega os dados de seed (cargos, tipos OS, serviços, formas de pagamento) |

---

## 📈 Sugestões de Evolução Futura

1. **Exportar relatórios em PDF/Excel** — Relatórios prontos para impressão
2. **Anexar arquivos à OS** — Artes, fotos de medição, imagem do produto finalizado
3. **Notificações por email** — Alertas de prazo via Supabase Edge Functions
4. **Portal do cliente** — Acompanhamento de OS pelo cliente via link único
5. **App mobile nativo** — React Native com mesmo backend Supabase
6. **Assinatura digital de arte** — Aprovação de arte pelo cliente no próprio sistema
7. **Integração com WhatsApp** — Notificações automáticas via API
8. **Módulo financeiro** — Contas a receber vinculadas às OS
9. **Galeria de fotos por OS** — Registro fotográfico do serviço
10. **Dashboard por funcionário** — Produtividade individual por período

---

## 🆘 Suporte e Documentação

- [Documentação Supabase](https://supabase.com/docs)
- [React Documentação](https://react.dev)
- [Lucide Icons](https://lucide.dev)
- [Supabase Community Discord](https://discord.supabase.com)
