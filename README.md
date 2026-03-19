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

## 🎨 Interface

- **Paleta de cores**: tons de lilás/violeta como cor predominante
- **Tipografia**: Plus Jakarta Sans — moderna e legível
- **Layout**: sidebar fixa + conteúdo rolável independente
- **Responsivo**: adaptado para desktop, tablet e mobile
- **Feedback visual**: toasts de sucesso/erro, hover states, badges coloridos por status
- **Scrollbar customizada** em tons de lilás

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
    ├── OrdensServico.jsx        ← OS: lista, nova, edição, detalhe, histórico
    ├── CrudPages.jsx            ← Clientes, Funcionários, Cargos...
    ├── Agenda.jsx               ← Agenda de entregas (calendário)
    └── Relatorios.jsx           ← Módulo de relatórios
```

---

## 🚀 Módulos do Sistema

### 🔐 Autenticação
- Login com email e senha via Supabase Auth
- Dois perfis de acesso: **Administrador** e **Básico**
- Sessão persistente com renovação automática
- Logout seguro

---

### 📊 Dashboard — Painel Principal
- **10 cards de métricas** clicáveis em tempo real
- **3 cards financeiros** clicáveis: Valor Total Geral, Valor em Aberto, Valor Concluído
- Ao clicar em qualquer card, abre modal com a lista filtrada das OS correspondentes
- Dentro do modal de filtro, clique em qualquer OS para ver seus detalhes completos
- **Distribuição por Status** com barras de progresso clicáveis
- **Últimas Ordens de Serviço** com linhas clicáveis para detalhe completo
- Botão de atualização manual

**Cards disponíveis (em ordem):**

| Card | Descrição |
|---|---|
| Total de OS | Todas as OS cadastradas |
| Em Aberto | OS lançadas sem posicionamento de continuidade |
| Aguard. Aprovação | OS aguardando aprovação do cliente |
| Aprovada | OS aprovadas aguardando produção |
| Em Produção | OS em execução |
| Em Atraso | OS com prazo vencido |
| Para Hoje | OS com entrega prevista para hoje |
| Lançadas Hoje | OS criadas no dia atual |
| Concluídas | OS finalizadas |
| Canceladas | OS canceladas |

---

### 📄 Ordens de Serviço

#### Fluxo de Status
```
Em Aberto → Aguard. Aprovação → Aprovada → Em Produção → Concluída
                                                        ↘ Cancelada
```

| Status | Descrição | Cor |
|---|---|---|
| 🔵 Em Aberto | OS lançada, sem continuidade definida | Azul claro |
| 🟠 Aguard. Aprovação | Aguardando aprovação do cliente | Laranja |
| 🟢 Aprovada | Aprovada, aguardando entrar em produção | Verde menta |
| 🟣 Em Produção | Em execução | Lilás |
| ✅ Concluída | Finalizada | Verde |
| ❌ Cancelada | Cancelada | Vermelho |

#### Funcionalidades
- **Número sequencial automático** gerado pelo banco
- **Captura automática** de data/hora de lançamento e usuário responsável
- **Coluna "Lançado por"** na listagem e no detalhe
- **4 prioridades**: Baixa, Normal, Alta, Urgente
- **Linha clicável** — clicar em qualquer linha abre o detalhe completo da OS
- **Botão 👁 Visualizar** — abre o detalhe completo com histórico e etapas
- **Botão ✏️ Editar** — abre formulário de edição da OS (título, cliente, tipo, status, prioridade, datas, valor, descrição)
- **Select de status inline** — muda o status diretamente na lista sem abrir a OS
- Data de entrega com alertas visuais de atraso e entrega no dia
- **Etapas âncora**: seleção no lançamento com checklist interativo no detalhe
- **Itens da OS** com cálculo automático de subtotal e total
- Campo de observações internas
- Filtros por status, prioridade e busca textual

---

### 📝 Histórico de Alterações
- Registro automático de **todas as alterações de status**
- Registra o **nome do usuário** (admin ou básico) que realizou a alteração
- Registra também edições gerais da OS
- Exibe **status anterior → novo status** com badges coloridos
- Data e hora precisas de cada evento
- Funciona para todos os perfis de usuário
- Visível no detalhe de cada OS

---

### 📅 Agenda de Entregas

Módulo de calendário para acompanhar as datas de entrega das OS.

#### Cards de Estatísticas do Mês (clicáveis)
Cada card abre modal com as OS filtradas por aquele status:

| Card | Filtra por |
|---|---|
| Entregas no mês | Todas as OS do mês |
| Em Aberto | Status "Em Aberto" |
| Aguard. Aprovação | Status "Aguardando Aprovação" |
| Aprovadas | Status "Aprovada" |
| Em Produção | Status "Em Produção" |
| Em Atraso | OS com prazo vencido |
| Concluídas | Status "Concluída" |

#### Modo Sintético (Calendário Mensal)
- Grid 7×6 com todos os dias do mês
- OS exibidas em pills coloridos por status em cada dia
- Badge com contador de OS por dia
- Dias com OS atrasadas destacados com borda vermelha
- Dia atual destacado em lilás
- Clicar no dia abre modal com lista das OS daquele dia
- Clicar em qualquer OS abre o detalhe completo

#### Modo Expandido (Lista Detalhada)
- Agrupado por data de entrega com cabeçalho visual por dia
- Cards com barra lateral colorida por status
- Badges de prioridade, tipo, status e alerta de atraso
- Efeito de deslize ao passar o mouse
- Dias passados em tom acinzentado, hoje em lilás destacado
- Clicar na OS abre detalhe completo

---

### 👥 Clientes
- Cadastro: nome, email, telefone, CPF/CNPJ, endereço, observações
- Vinculação obrigatória a cada OS

### 👤 Funcionários
- Cadastro com nome, email, telefone e cargo
- Todo usuário do sistema é obrigatoriamente um funcionário

### 💼 Cargos
- Cadastro de cargos/funções da empresa

### 📦 Serviços
- Catálogo com valor base e unidade de medida
- Botão **"Ver etapas"** para visualizar etapas cadastradas por serviço

### 🔧 Etapas de Serviço
- Etapas vinculadas a cada serviço com ordem e duração estimada
- Ancoradas no lançamento da OS
- Checklist interativo no detalhe (marcar como concluída)

### 🏷️ Tipos de O.S.
- Código + nome (ex: BANNER, ACM, ADESIVO, LONA, NEON...)

### 💳 Formas de Pagamento
- Dinheiro, PIX, Cartão de Débito, Cartão de Crédito, Boleto, Transferência

### 🔑 Usuários *(somente Administrador)*
- Cadastro com email e senha
- Perfis: **Básico** e **Administrador**
- Todo usuário vinculado a um funcionário
- Somente administradores criam novos usuários

---

### 📈 Relatórios

Módulo com filtro por período e **5 abas**:

| Aba | Conteúdo |
|---|---|
| **Por Status** | Cards clicáveis por status + lista filtrada ao clicar |
| **Por Cliente** | Ranking de clientes com barras de percentual |
| **Por Tipo OS** | Quantidade, % do total, valor e ticket médio por tipo |
| **Financeiro** | Faturamento total, concluído, em aberto, cancelado, ticket médio + Top 10 por valor |
| **Lista Completa** | Linhas clicáveis — abre detalhe da OS. Colunas: Nº, Data, Cliente, Título, Tipo, Status, Entrega, Lançado por, **Finalizado por**, Valor |

> **"Finalizado por"**: nome do usuário que concluiu a OS. Se não finalizada, exibe `—`.

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
| `os_historico` | Histórico completo de alterações |

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
2. Vá em **SQL Editor** e execute os arquivos SQL na ordem da tabela abaixo

### 4. Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 5. Criar o primeiro usuário administrador

No **Supabase → Authentication → Users**, crie um usuário com email e senha. Depois execute no **SQL Editor**:

```sql
INSERT INTO funcionarios (nome, email)
VALUES ('Administrador', 'admin@suaempresa.com.br');

INSERT INTO usuarios (funcionario_id, auth_user_id, perfil)
VALUES (
  (SELECT id FROM funcionarios WHERE email = 'admin@suaempresa.com.br'),
  (SELECT id FROM auth.users   WHERE email = 'admin@suaempresa.com.br'),
  'admin'
);
```

### 6. Confirmação de email (testes)

No **Supabase → Authentication → Settings → Email Auth**:
- Desmarque **"Enable email confirmations"**

### 7. Executar

```bash
npm run dev
```

Acesse em `http://localhost:5173`

---

## 📄 Arquivos SQL — Ordem de Execução

| Ordem | Arquivo | Descrição |
|---|---|---|
| 1 | `supabase_schema.sql` | Cria todas as tabelas, triggers, RLS e dados de seed |
| 2 | `correcao_historico.sql` | Corrige registro de histórico com usuário |
| 3 | `migracao_status.sql` | Renomeia `aguardando` → `em_aberto` e adiciona `aprovada` |
| 4 | `seed_corrigido.sql` | Opcional — recarrega dados de seed |

> ⚠️ O `migracao_status.sql` é **obrigatório** para quem já tinha o sistema instalado.

---

## 📱 Responsividade

- **Desktop** — Sidebar fixa lateral + conteúdo com scroll independente
- **Tablet** — Sidebar recolhível via botão de menu
- **Mobile** — Menu hamburguer, tabelas com scroll horizontal

---

## 📈 Sugestões de Evolução Futura

1. Exportar relatórios em PDF/Excel
2. Notificações por email via Supabase Edge Functions
3. Anexar arquivos à OS (artes, fotos)
4. Portal do cliente — acompanhamento via link único
5. App mobile nativo com React Native
6. Assinatura digital de arte pelo cliente
7. Integração com WhatsApp para notificações automáticas
8. Módulo financeiro com contas a receber
9. Galeria de fotos por OS (antes/durante/depois)
10. Dashboard por funcionário — produtividade por período
11. Notificações in-app para OS atrasadas ou pendentes
12. Etiqueta/QR Code da OS para rastreamento físico

---

## 🆘 Suporte

- [Documentação Supabase](https://supabase.com/docs)
- [React Documentação](https://react.dev)
- [Lucide Icons](https://lucide.dev)
- [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
