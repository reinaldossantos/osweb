import {
  LayoutDashboard, FileText, Plus, Users, Briefcase,
  CreditCard, Tag, UserPlus, Package, Layers, Building2,
  Clock, CheckCircle2, XCircle, AlertCircle, PlayCircle, BarChart3, CalendarDays, Wrench, ShieldAlert,
} from "lucide-react";

export const STATUS_CONFIG = {
  em_aberto:            { label: "Em Aberto",          Icon: Clock,        bg: "#F0F9FF", text: "#0369A1", border: "#7DD3FC" },
  aguardando_aprovacao: { label: "Aguard. Aprovação",   Icon: AlertCircle,  bg: "#FED7AA", text: "#9A3412", border: "#FB923C" },
  aprovada:             { label: "Aprovada",            Icon: CheckCircle2, bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  em_producao:          { label: "Em Produção",         Icon: PlayCircle,   bg: "#EDE9FE", text: "#6D28D9", border: "#DDD6FE" },
  em_instalacao:        { label: "Em Instalação",       Icon: Wrench,       bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  concluida:            { label: "Concluída",           Icon: CheckCircle2, bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  cancelada:            { label: "Cancelada",           Icon: XCircle,      bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
};

export const PRIORIDADE_CONFIG = {
  baixa:   { label: "Baixa",   color: "#6B7280", bg: "#F3F4F6" },
  normal:  { label: "Normal",  color: "#8B5CF6", bg: "#F5F3FF" },
  alta:    { label: "Alta",    color: "#D97706", bg: "#FEF3C7" },
  urgente: { label: "Urgente", color: "#DC2626", bg: "#FEF2F2" },
};

export const NAV_ITEMS = [
  { key: "dashboard",        label: "Dashboard",          Icon: LayoutDashboard },
  { key: "nova_os",          label: "Nova O.S.",           Icon: Plus },
  { key: "ordens_servico",   label: "Ordens de Serviço",   Icon: FileText },
  { key: "clientes",         label: "Clientes",            Icon: Building2 },
  { key: "divider1" },
  { key: "funcionarios",     label: "Funcionários",         Icon: Users },
  { key: "cargos",           label: "Cargos",               Icon: Briefcase },
  { key: "servicos",         label: "Serviços",             Icon: Package },
  { key: "etapas",           label: "Etapas de Serviço",    Icon: Layers },
  { key: "tipos_os",         label: "Tipos de O.S.",        Icon: Tag },
  { key: "formas_pagamento", label: "Formas de Pagamento",  Icon: CreditCard },
  { key: "divider2" },
  { key: "usuarios",         label: "Usuários",             Icon: UserPlus,  adminOnly: true },
  { key: "agenda",           label: "Agenda",               Icon: CalendarDays },
  { key: "relatorios",       label: "Relatórios",           Icon: BarChart3 },
  { key: "divider3" },
  { key: "manutencao",       label: "Manutenção",           Icon: ShieldAlert, adminOnly: true },
];

export const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
};

export const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR");
};

export const isAtrasada = (os) => {
  if (os.status === "concluida" || os.status === "cancelada") return false;
  if (!os.data_entrega_prevista) return false;
  return new Date(os.data_entrega_prevista) < new Date();
};

export const isHoje = (os) => {
  if (!os.data_entrega_prevista) return false;
  return new Date(os.data_entrega_prevista).toDateString() === new Date().toDateString();
};

export const inputStyle = {
  width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB",
  borderRadius: 8, fontSize: 14, color: "#111827", outline: "none",
  boxSizing: "border-box", background: "#fff",
};

export const btnPrimary = {
  background: "#7C3AED", color: "#fff", border: "none",
  padding: "10px 20px", borderRadius: 8, fontSize: 14,
  fontWeight: 600, cursor: "pointer", display: "inline-flex",
  alignItems: "center", gap: 6,
};

export const btnSecondary = {
  background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB",
  padding: "10px 20px", borderRadius: 8, fontSize: 14,
  fontWeight: 600, cursor: "pointer", display: "inline-flex",
  alignItems: "center", gap: 6,
};

export const btnDanger = {
  background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5",
  padding: "5px 10px", borderRadius: 8, fontSize: 13,
  fontWeight: 600, cursor: "pointer", display: "inline-flex",
  alignItems: "center", gap: 6,
};
