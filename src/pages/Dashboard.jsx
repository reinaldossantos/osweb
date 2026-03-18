import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StatusBadge, PrioridadeBadge, Modal } from "../components/components";
import { fmt, fmtDate, isAtrasada, isHoje, STATUS_CONFIG } from "../constants/constants";
import { OSDetalhe } from "./OrdensServico";
import {
  FileText, PlayCircle, Clock, AlertTriangle, Calendar,
  TrendingUp, CheckCircle2, XCircle, DollarSign, BarChart3,
  RefreshCw,
} from "lucide-react";

// ─── MODAL: LISTA DE OS POR FILTRO ───────────────────────────
function OSListModal({ title, ordens, onClose }) {
  const [selectedOS, setSelectedOS] = useState(null);

  return (
    <>
      <Modal title={title} onClose={onClose} size="xl">
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9CA3AF" }}>
          Clique em uma O.S. para ver os detalhes completos.
        </p>
        <div style={{ overflowX: "auto" }}>
          {ordens.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>Nenhuma O.S. encontrada.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["Nº OS", "Cliente", "Título", "Status", "Prioridade", "Entrega", "Valor"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordens.map((os, i) => (
                  <tr
                    key={os.id}
                    onClick={() => setSelectedOS(os)}
                    style={{ borderTop: "1px solid #F3F4F6", background: isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                    onMouseLeave={e => e.currentTarget.style.background = isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA"}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1D4ED8" }}>#{os.numero_os}</td>
                    <td style={{ padding: "12px 14px" }}>{os.clientes?.nome || "—"}</td>
                    <td style={{ padding: "12px 14px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{os.titulo}</td>
                    <td style={{ padding: "12px 14px" }}><StatusBadge status={os.status} /></td>
                    <td style={{ padding: "12px 14px" }}><PrioridadeBadge prioridade={os.prioridade} /></td>
                    <td style={{ padding: "12px 14px", color: isAtrasada(os) ? "#DC2626" : "#374151", fontWeight: isAtrasada(os) ? 700 : 400, whiteSpace: "nowrap" }}>
                      {fmtDate(os.data_entrega_prevista)}
                      {isAtrasada(os) && <span style={{ display: "block", fontSize: 10, color: "#DC2626" }}>⚠ ATRASADA</span>}
                      {isHoje(os) && !isAtrasada(os) && <span style={{ display: "block", fontSize: 10, color: "#D97706" }}>📅 HOJE</span>}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(os.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      {selectedOS && (
        <Modal title={`O.S. #${selectedOS.numero_os} — ${selectedOS.titulo}`} onClose={() => setSelectedOS(null)} size="lg">
          <OSDetalhe os={selectedOS} onClose={() => setSelectedOS(null)} />
        </Modal>
      )}
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────
export default function Dashboard() {
  const [all, setAll] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalFiltro, setModalFiltro] = useState(null);
  const [ultimaOS, setUltimaOS] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const hoje = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("ordens_servico")
      .select("*, clientes(nome)")
      .order("created_at", { ascending: false });

    const lista = data || [];
    setAll(lista);

    setStats({
      total:                lista.length,
      aguardando:           lista.filter(o => o.status === "aguardando").length,
      em_producao:          lista.filter(o => o.status === "em_producao").length,
      aguardando_aprovacao: lista.filter(o => o.status === "aguardando_aprovacao").length,
      concluida:            lista.filter(o => o.status === "concluida").length,
      cancelada:            lista.filter(o => o.status === "cancelada").length,
      atrasadas:            lista.filter(isAtrasada).length,
      hoje:                 lista.filter(o => isHoje(o) && !["concluida","cancelada"].includes(o.status)).length,
      lancadasHoje:         lista.filter(o => o.data_lancamento?.startsWith(hoje)).length,
      valorTotal:           lista.reduce((s, o) => s + (o.valor_total || 0), 0),
      valorAbertas:         lista.filter(o => !["concluida","cancelada"].includes(o.status)).reduce((s, o) => s + (o.valor_total || 0), 0),
      valorConcluidas:      lista.filter(o => o.status === "concluida").reduce((s, o) => s + (o.valor_total || 0), 0),
    });
    setLoading(false);
  };

  // Abre modal com as OS filtradas pelo card clicado
  const abrirFiltro = (title, filtroFn) => {
    setModalFiltro({ title, ordens: all.filter(filtroFn) });
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Carregando...</div>;
  if (!stats) return null;

  const hoje = new Date().toISOString().split("T")[0];

  const cards = [
    {
      label: "Total de OS",   value: stats.total,       Icon: FileText,      color: "#1D4ED8", bg: "#EFF6FF",
      filtro: () => abrirFiltro("Todas as Ordens de Serviço", () => true),
    },
    {
      label: "Em Produção",   value: stats.em_producao, Icon: PlayCircle,    color: "#2563EB", bg: "#DBEAFE",
      filtro: () => abrirFiltro("OS Em Produção", o => o.status === "em_producao"),
    },
    {
      label: "Aguardando",    value: stats.aguardando,  Icon: Clock,         color: "#D97706", bg: "#FEF3C7",
      filtro: () => abrirFiltro("OS Aguardando", o => o.status === "aguardando"),
    },
    {
      label: "Em Atraso",     value: stats.atrasadas,   Icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2",
      filtro: () => abrirFiltro("OS Em Atraso", isAtrasada),
    },
    {
      label: "Para Hoje",     value: stats.hoje,        Icon: Calendar,      color: "#7C3AED", bg: "#F5F3FF",
      filtro: () => abrirFiltro("OS com Entrega Hoje", o => isHoje(o) && !["concluida","cancelada"].includes(o.status)),
    },
    {
      label: "Lançadas Hoje", value: stats.lancadasHoje,Icon: TrendingUp,    color: "#059669", bg: "#ECFDF5",
      filtro: () => abrirFiltro("OS Lançadas Hoje", o => o.data_lancamento?.startsWith(hoje)),
    },
    {
      label: "Concluídas",    value: stats.concluida,   Icon: CheckCircle2,  color: "#16A34A", bg: "#DCFCE7",
      filtro: () => abrirFiltro("OS Concluídas", o => o.status === "concluida"),
    },
    {
      label: "Canceladas",    value: stats.cancelada,   Icon: XCircle,       color: "#9CA3AF", bg: "#F3F4F6",
      filtro: () => abrirFiltro("OS Canceladas", o => o.status === "cancelada"),
    },
  ];

  const valorCards = [
    { label: "Valor Total Geral", value: fmt(stats.valorTotal),      Icon: DollarSign, color: "#1D4ED8",
      filtro: () => abrirFiltro("Todas as Ordens de Serviço", () => true) },
    { label: "Valor em Aberto",   value: fmt(stats.valorAbertas),    Icon: BarChart3,  color: "#D97706",
      filtro: () => abrirFiltro("OS em Aberto", o => !["concluida","cancelada"].includes(o.status)) },
    { label: "Valor Concluído",   value: fmt(stats.valorConcluidas), Icon: TrendingUp, color: "#16A34A",
      filtro: () => abrirFiltro("OS Concluídas", o => o.status === "concluida") },
  ];

  return (
    <div>
      {/* Header */}
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

      {/* Cards de contagem — clicáveis */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {cards.map(({ label, value, Icon, color, bg, filtro }) => (
          <div
            key={label}
            onClick={filtro}
            style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{label}</p>
                <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color }}>{value}</p>
              </div>
              <div style={{ background: bg, borderRadius: 10, padding: 8 }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9CA3AF" }}>Clique para ver detalhes</p>
          </div>
        ))}
      </div>

      {/* Cards de valor — clicáveis */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 30 }}>
        {valorCards.map(({ label, value, Icon, color, filtro }) => (
          <div
            key={label}
            onClick={filtro}
            style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Icon size={18} color={color} />
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value}</p>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9CA3AF" }}>Clique para ver OS</p>
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
              <div
                key={key}
                style={{ flex: "1 1 120px", cursor: "pointer" }}
                onClick={() => abrirFiltro(`OS — ${cfg.label}`, o => o.status === key)}
              >
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
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>Últimas Ordens de Serviço</h3>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>Clique em uma linha para ver detalhes</span>
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
              {all.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Nenhuma OS cadastrada ainda</td></tr>
                : all.slice(0, 8).map((os, i) => (
                  <tr
                    key={os.id}
                    onClick={() => setUltimaOS(os)}
                    style={{ borderTop: "1px solid #F3F4F6", background: isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                    onMouseLeave={e => e.currentTarget.style.background = isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA"}
                  >
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

      {/* Modal de OS filtradas */}
      {modalFiltro && (
        <OSListModal
          title={modalFiltro.title}
          ordens={modalFiltro.ordens}
          onClose={() => setModalFiltro(null)}
        />
      )}

      {/* Modal detalhe de OS das Últimas OS */}
      {ultimaOS && (
        <Modal title={`O.S. #${ultimaOS.numero_os} — ${ultimaOS.titulo}`} onClose={() => setUltimaOS(null)} size="lg">
          <OSDetalhe os={ultimaOS} onClose={() => setUltimaOS(null)} />
        </Modal>
      )}
    </div>
  );
}
