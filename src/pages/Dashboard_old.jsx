import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StatusBadge, PrioridadeBadge } from "../components/components";
import { fmt, fmtDate, isAtrasada, isHoje, STATUS_CONFIG } from "../constants/constants";
import {
  FileText, PlayCircle, Clock, AlertTriangle, Calendar,
  TrendingUp, CheckCircle2, XCircle, DollarSign, BarChart3,
  RefreshCw,
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentes, setRecentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const hoje = new Date().toISOString().split("T")[0];
    const { data: all } = await supabase
      .from("ordens_servico")
      .select("*, clientes(nome)")
      .order("created_at", { ascending: false });

    if (all) {
      setStats({
        total: all.length,
        aguardando: all.filter(o => o.status === "aguardando").length,
        em_producao: all.filter(o => o.status === "em_producao").length,
        aguardando_aprovacao: all.filter(o => o.status === "aguardando_aprovacao").length,
        concluida: all.filter(o => o.status === "concluida").length,
        cancelada: all.filter(o => o.status === "cancelada").length,
        atrasadas: all.filter(isAtrasada).length,
        hoje: all.filter(o => isHoje(o) && !["concluida","cancelada"].includes(o.status)).length,
        lancadasHoje: all.filter(o => o.data_lancamento?.startsWith(hoje)).length,
        valorTotal: all.reduce((s, o) => s + (o.valor_total || 0), 0),
        valorAbertas: all.filter(o => !["concluida","cancelada"].includes(o.status)).reduce((s, o) => s + (o.valor_total || 0), 0),
        valorConcluidas: all.filter(o => o.status === "concluida").reduce((s, o) => s + (o.valor_total || 0), 0),
      });
      setRecentes(all.slice(0, 8));
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Carregando...</div>;
  if (!stats) return null;

  const cards = [
    { label: "Total de OS",     value: stats.total,         Icon: FileText,      color: "#1D4ED8", bg: "#EFF6FF" },
    { label: "Em Produção",     value: stats.em_producao,   Icon: PlayCircle,    color: "#2563EB", bg: "#DBEAFE" },
    { label: "Aguardando",      value: stats.aguardando,    Icon: Clock,         color: "#D97706", bg: "#FEF3C7" },
    { label: "Em Atraso",       value: stats.atrasadas,     Icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2" },
    { label: "Para Hoje",       value: stats.hoje,          Icon: Calendar,      color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Lançadas Hoje",   value: stats.lancadasHoje,  Icon: TrendingUp,    color: "#059669", bg: "#ECFDF5" },
    { label: "Concluídas",      value: stats.concluida,     Icon: CheckCircle2,  color: "#16A34A", bg: "#DCFCE7" },
    { label: "Canceladas",      value: stats.cancelada,     Icon: XCircle,       color: "#9CA3AF", bg: "#F3F4F6" },
  ];

  const valorCards = [
    { label: "Valor Total Geral", value: fmt(stats.valorTotal),     Icon: DollarSign, color: "#1D4ED8" },
    { label: "Valor em Aberto",   value: fmt(stats.valorAbertas),   Icon: BarChart3,  color: "#D97706" },
    { label: "Valor Concluído",   value: fmt(stats.valorConcluidas),Icon: TrendingUp, color: "#16A34A" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827" }}>Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button onClick={load} style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Cards de contagem */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {cards.map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{label}</p>
                <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color }}>{value}</p>
              </div>
              <div style={{ background: bg, borderRadius: 10, padding: 8 }}>
                <Icon size={18} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cards de valor */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 30 }}>
        {valorCards.map(({ label, value, Icon, color }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Icon size={18} color={color} />
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Distribuição por status */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1px solid #E5E7EB", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111827" }}>Distribuição por Status</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = stats[key] || 0;
            const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={key} style={{ flex: "1 1 120px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cfg.text }}>{cfg.label}</span>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: cfg.border, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Últimas OS */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>Últimas Ordens de Serviço</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Nº OS", "Cliente", "Título", "Status", "Prioridade", "Entrega", "Valor"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentes.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Nenhuma OS cadastrada ainda</td></tr>
                : recentes.map((os, i) => (
                  <tr key={os.id} style={{ borderTop: "1px solid #F3F4F6", background: isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1D4ED8" }}>#{os.numero_os}</td>
                    <td style={{ padding: "12px 16px" }}>{os.clientes?.nome || "—"}</td>
                    <td style={{ padding: "12px 16px", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{os.titulo}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={os.status} /></td>
                    <td style={{ padding: "12px 16px" }}><PrioridadeBadge prioridade={os.prioridade} /></td>
                    <td style={{ padding: "12px 16px", color: isAtrasada(os) ? "#DC2626" : "#374151", fontWeight: isAtrasada(os) ? 700 : 400 }}>
                      {fmtDate(os.data_entrega_prevista)}
                      {isAtrasada(os) && <span style={{ display: "block", fontSize: 10, color: "#DC2626" }}>⚠ ATRASADA</span>}
                      {isHoje(os) && !isAtrasada(os) && <span style={{ display: "block", fontSize: 10, color: "#D97706" }}>📅 HOJE</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{fmt(os.valor_total)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
