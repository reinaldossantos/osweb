# OSWeb 1.0 — Sistema de Ordens de Serviço
## Indústria da Comunicação Visual

---

## 📋 Visão Geral

O **OSWeb 1.0** é um sistema completo de lançamento e acompanhamento de Ordens de Serviço desenvolvido para empresas da indústria da comunicação visual. Moderno, responsivo e acessível via navegador em desktop e dispositivos móveis.

### Tecnologias
- **React 18** + **Vite** · **Supabase** (PostgreSQL + Auth)
- **Lucide React** · **React Hot Toast** · **Plus Jakarta Sans** (Google Fonts)

---

## 🎨 Interface
- Paleta lilás/violeta · Plus Jakarta Sans · Layout sidebar fixa + conteúdo rolável
- Responsivo: desktop, tablet e mobile · Scrollbar customizada em lilás

---

## 🗂️ Estrutura do Projeto

```
src/
├── App.jsx                      ← Layout, sidebar e roteamento
├── main.jsx / index.css         ← Entry point e estilos globais
├── lib/supabase.js              ← Client Supabase
├── constants/constants.js       ← Status, prioridades, nav, helpers
├── contexts/AuthContext.jsx     ← Autenticação e sessão
├── components/components.jsx    ← Modal, FormField, badges, ListPage
├── forms/forms.jsx              ← Formulários de cadastros auxiliares
└── pages/
    ├── LoginPage.jsx            ← Tela de login
    ├── Dashboard.jsx            ← Painel principal interativo
    ├── OrdensServico.jsx        ← OS: lista, nova, edição, detalhe, histórico
    ├── CrudPages.jsx            ← Clientes, Funcionários, Cargos, Serviços...
    ├── Agenda.jsx               ← Agenda de entregas (calendário)
    └── Relatorios.jsx           ← Módulo de relatórios
```

---

## 🚀 Módulos

### 🔐 Autenticação
- Login email/senha via Supabase Auth · Perfis: **Administrador** e **Básico**
- Sessão persistente · Logout seguro

---

### 📊 Dashboard
- **10 cards clicáveis** — ao clicar abre modal com OS filtradas; clicar na OS abre detalhe
- **3 cards financeiros** clicáveis (Total Geral, Em Aberto, Concluído)
- Cards com **cores sólidas e preenchidas** para melhor visualização em TV/monitor grande
- **Efeitos de atenção animados** nos cards: Em Aberto (pulso), Aguard. Aprovação (brilho laranja), Em Atraso (pisca vermelho), Para Hoje (brilho violeta)
- Distribuição por Status com barras clicáveis
- Últimas OS com linhas clicáveis para detalhe

**Cards:** Total de OS · Em Aberto · Aguard. Aprovação · Aprovada · Em Produção · Em Atraso · Para Hoje · Lançadas Hoje · Concluídas · Canceladas

---

### 📄 Ordens de Serviço

#### Fluxo de Status
```
Em Aberto → Aguard. Aprovação → Aprovada → Em Produção → Em Instalação → Concluída
                                                                           ↘ Cancelada
```

| Status | Cor |
|---|---|
| 🔵 Em Aberto | Azul claro — OS lançada sem continuidade definida |
| 🟠 Aguard. Aprovação | Laranja — aguardando aprovação do cliente |
| 🟢 Aprovada | Verde menta — aprovada, aguardando produção |
| 🟣 Em Produção | Lilás — em execução |
| 🔧 Em Instalação | Âmbar — em processo de instalação |
| ✅ Concluída | Verde |
| ❌ Cancelada | Vermelho |

#### Campos da OS
| Campo | Descrição |
|---|---|
| Título | Descrição resumida do serviço *(obrigatório)* |
| Cliente | Cliente vinculado *(obrigatório)* |
| **Cidade** | Cidade do cliente / da entrega |
| Tipo de O.S. | Categoria do serviço (ACM, BANNER, LONA...) |
| Forma de Pagamento | Dinheiro, PIX, Cartão, Boleto, Cheque, Bonificação... |
| Status | Fluxo de produção |
| Prioridade | Baixa / Normal / Alta / Urgente |
| Data de Entrega | Com alertas de atraso e entrega no dia |
| **Nº O.S. em Outro Sistema** | Referência externa para rastreabilidade (ex: OP-2024-001) |
| Valor Total | Calculado automaticamente pelos itens ou informado manualmente |
| Descrição | Detalhes do serviço |
| Observações Internas | Notas internas (não visível ao cliente) |
| Serviço Base | Serviço do catálogo (carrega etapas automaticamente) |
| Etapas | Checklist de etapas selecionado no lançamento |
| Itens / Produtos | Itens com quantidade, valor unitário e subtotal automático |

#### Funcionalidades
- Número sequencial automático · Data/hora e usuário capturados automaticamente
- **Linha clicável** — abre detalhe · **Botão 👁 Visualizar** · **Botão ✏️ Editar**
- Select de status inline na lista · Busca por nº, cliente, título e **OP externa**
- **Validação amigável**: campos obrigatórios com borda vermelha e toast descritivo
- **Sem crash ao adicionar itens** — state gerenciado corretamente

#### Formas de Pagamento disponíveis
Dinheiro · PIX · Cartão de Débito · Cartão de Crédito · Boleto Bancário · Transferência Bancária · **Cheque** · **Bonificação**

---

### 📝 Histórico de Alterações
- Registro de todas as alterações de status com nome do usuário
- Exibe status anterior → novo status com badges coloridos
- Funciona para todos os perfis (admin e básico)
- Visível no detalhe de cada OS

---

### 📅 Agenda de Entregas

#### Cards de Estatísticas (clicáveis por status)
Em Aberto · Aguard. Aprovação · Aprovadas · Em Produção · Em Atraso · Concluídas

#### Modo Sintético (Calendário)
- Grid 7×6 · Pills coloridos por status em cada dia · Badge contador
- Dias atrasados com borda vermelha · Hoje em lilás
- Clicar no dia → modal com OS do dia → clicar na OS → detalhe completo

#### Modo Expandido (Lista)
- Agrupado por data de entrega · Cards com barra lateral colorida
- Efeito deslize ao hover · Clicar na OS → detalhe completo

---

### 👥 Clientes · 👤 Funcionários · 💼 Cargos
- Cadastros básicos com busca e CRUD completo

### 📦 Serviços
- Catálogo com valor base e unidade · Botão "Ver etapas" por serviço

### 🔧 Etapas de Serviço
- Vinculadas ao serviço com ordem e duração estimada
- Ancoradas no lançamento da OS · Checklist no detalhe

### 🏷️ Tipos de O.S.
Código + nome: BANNER, ACM, ADESIVO, LONA, LETC, PLACA, NEON, ENVELOPAMENTO, PLOTAGEM, OUTROS

### 💳 Formas de Pagamento
Dinheiro · PIX · Cartão Débito · Cartão Crédito · Boleto · Transferência · **Cheque** · **Bonificação**

### 🔑 Usuários *(somente Admin)*
- Email + senha · Perfil Básico ou Administrador · Vinculado a funcionário

---

### 📈 Relatórios — 5 abas com filtro por período

| Aba | Destaque |
|---|---|
| Por Status | Cards clicáveis → lista filtrada → detalhe da OS |
| Por Cliente | Ranking com barras de percentual |
| Por Tipo OS | Qtd, % total, valor e ticket médio |
| Financeiro | Totais + Top 10 OS por valor |
| Lista Completa | Linhas clicáveis · Colunas: Nº, Data, Cliente, Título, Tipo, Status, Entrega, Lançado por, **Finalizado por**, Valor |

---

## 🗄️ Banco de Dados

### Tabelas
`funcionarios` · `cargos` · `usuarios` · `clientes` · `servicos` · `etapas_servico` · `tipos_os` · `formas_pagamento` · `ordens_servico` · `os_etapas` · `os_itens` · `os_historico`

### Campos adicionados na `ordens_servico`
| Campo | Tipo | Descrição |
|---|---|---|
| `cidade` | VARCHAR(100) | Cidade do cliente / entrega |
| `numero_os_externo` | VARCHAR(100) | Nº de referência em outro sistema |

---

## 🚀 Instalação

### 1. Criar projeto
```bash
npm create vite@latest osweb -- --template react
cd osweb
npm install
npm install @supabase/supabase-js react-hot-toast lucide-react
```

### 2. Copiar arquivos `src/` conforme estrutura acima

### 3. Criar `.env` na raiz
```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 4. Criar primeiro usuário admin no Supabase → Authentication → Users, depois:
```sql
INSERT INTO funcionarios (nome, email) VALUES ('Administrador', 'admin@suaempresa.com.br');
INSERT INTO usuarios (funcionario_id, auth_user_id, perfil)
VALUES (
  (SELECT id FROM funcionarios WHERE email = 'admin@suaempresa.com.br'),
  (SELECT id FROM auth.users   WHERE email = 'admin@suaempresa.com.br'),
  'admin'
);
```

### 5. Rodar
```bash
npm run dev   # http://localhost:5173
```

---

## 📄 Arquivos SQL — Ordem de Execução

| # | Arquivo | Descrição |
|---|---|---|
| 1 | `supabase_schema.sql` | Criação inicial: tabelas, triggers, RLS, seed |
| 2 | `correcao_historico.sql` | Corrige histórico para registrar usuário |
| 3 | `migracao_status.sql` | Renomeia `aguardando` → `em_aberto`, adiciona `aprovada` |
| 4 | `migracao_novos_campos.sql` | Adiciona `cidade`, `numero_os_externo`, Cheque e Bonificação |
| 5 | `migracao_em_instalacao.sql` | Adiciona status `em_instalacao` |
| 6 | `seed_corrigido.sql` | Opcional — recarrega dados de seed |

> ⚠️ Os arquivos de migração (3 e 4) são **obrigatórios** para quem já tinha o sistema instalado.

---

## 📈 Sugestões de Evolução

1. Exportar relatórios PDF/Excel · 2. Notificações por email · 3. Anexar arquivos à OS
4. Portal do cliente · 5. App mobile React Native · 6. Assinatura digital de arte
7. WhatsApp API · 8. Módulo financeiro · 9. Galeria de fotos por OS
10. Dashboard por funcionário · 11. Notificações in-app · 12. Etiqueta/QR Code da OS

---

## 🆘 Suporte
[Supabase Docs](https://supabase.com/docs) · [React](https://react.dev) · [Lucide Icons](https://lucide.dev) · [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)

---

## 🔧 Manutenção do Banco *(somente Administrador)*

Acessível pelo menu **"Manutenção"** na sidebar (visível apenas para administradores).

### Painel de Contagens
Exibe em tempo real quantos registros existem em cada tabela:
Total OS · Concluídas · Canceladas · Histórico · Itens · Etapas OS · Clientes · Tipos de OS · Funcionários

### Operações Disponíveis

| Operação | O que remove | Mantém |
|---|---|---|
| 🔴 **Reset Completo** | Todas as OS + histórico + itens + etapas + clientes | Usuários, funcionários, tipos OS, serviços, formas de pagamento |
| 🟢 **OS Concluídas** | Apenas OS com status Concluída + histórico/itens/etapas vinculados | Todas as outras OS |
| 🔴 **OS Canceladas** | Apenas OS com status Cancelada + dados vinculados | Todas as outras OS |
| 🟣 **Histórico** | Todos os registros de histórico de alterações | As OS e seus dados ficam intactos |
| 🟡 **Clientes sem OS** | Clientes que não têm nenhuma OS vinculada | Clientes com OS ativas ou encerradas |
| 🟠 **Todos os Clientes** | Todos os clientes cadastrados (desvincula das OS antes) | As OS ficam, só o campo cliente fica em branco |
| 🟣 **Tipos de OS** | Todos os tipos cadastrados (ACM, BANNER, LONA...) | As OS ficam, só o campo tipo fica em branco |

### Segurança
- Cada operação exige digitar **`CONFIRMAR`** em maiúsculas antes de executar
- O botão de exclusão só ativa após a digitação correta
- Operações desabilitadas automaticamente quando não há registros
- Log de sessão registra todas as operações com hora
- Overlay de "aguarde" impede duplo clique durante o processamento

> ⚠️ **Recomendação**: use o **Reset Completo** para limpar dados de teste antes de colocar o sistema em produção. As operações são irreversíveis — não há desfazer.

---

## 📄 Arquivos SQL — Ordem de Execução

| Ordem | Arquivo | Descrição |
|---|---|---|
| 1 | `supabase_schema.sql` | Criação inicial: tabelas, triggers, RLS, seed |
| 2 | `correcao_historico.sql` | Corrige histórico para registrar usuário |
| 3 | `migracao_status.sql` | Renomeia `aguardando` → `em_aberto`, adiciona `aprovada` |
| 4 | `migracao_novos_campos.sql` | Adiciona `cidade`, `numero_os_externo`, Cheque e Bonificação |
| 5 | `migracao_em_instalacao.sql` | Adiciona status `em_instalacao` |
| 6 | `migracao_responsavel_instalacao.sql` | Adiciona campo `responsavel_instalacao_id` |
| 7 | `seed_corrigido.sql` | Opcional — recarrega dados de seed |

> ⚠️ Os arquivos de migração (3 a 6) são **obrigatórios** para quem já tinha o sistema instalado anteriormente.
