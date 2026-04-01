import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StatusBadge } from "../components/components";
import { fmt, fmtDate, STATUS_CONFIG, isAtrasada } from "../constants/constants";
import { BarChart3, FileText, DollarSign, Users, Calendar, Filter, Wrench } from "lucide-react";
import { OSDetalhe } from "./OrdensServico";
import { Modal } from "../components/components";

const inputStyle = {
  padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8,
  fontSize: 14, color: "#111827", outline: "none", background: "#fff",
};

const groupBy = (arr, key) => arr.reduce((acc, item) => {
  const k = key(item) || "Não informado";
  acc[k] = acc[k] || [];
  acc[k].push(item);
  return acc;
}, {});

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10, background: "#F9FAFB" }}>
        {Icon && <Icon size={18} color="#7C3AED" />}
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h2>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

export default function Relatorios() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("status");
  const [filtroModal, setFiltroModal] = useState(null);
  const [osDetalhe, setOsDetalhe] = useState(null);
  const [filtros, setFiltros] = useState({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0],
  });

  useEffect(() => { load(); }, [filtros]);

  const load = async () => {
    setLoading(true);

    const [{ data: osData }, { data: histData }] = await Promise.all([
      supabase
        .from("ordens_servico")
        .select("*, clientes(nome), tipos_os(codigo, nome), usuarios!usuario_lancamento_id(funcionarios(nome)), resp_instalacao:responsavel_instalacao_id(nome)")
        .gte("data_lancamento", filtros.dataInicio + "T00:00:00")
        .lte("data_lancamento", filtros.dataFim + "T23:59:59")
        .order("data_lancamento", { ascending: false }),
      // Busca todos os registros de conclusão do período
      supabase
        .from("os_historico")
        .select("os_id, usuarios(funcionarios(nome)), created_at")
        .eq("valor_novo", "concluida")
        .order("created_at", { ascending: false }),
    ]);

    // Mapeia: os_id → nome do usuário que finalizou (primeiro registro encontrado)
    const finalizadoPorMap = {};
    (histData || []).forEach(h => {
      if (!finalizadoPorMap[h.os_id]) {
        finalizadoPorMap[h.os_id] = h.usuarios?.funcionarios?.nome || "—";
      }
    });

    // Injeta "finalizado_por" em cada OS
    const ordens = (osData || []).map(os => ({
      ...os,
      finalizado_por: os.status === "concluida" ? (finalizadoPorMap[os.id] || "—") : "—",
    }));

    setOrdens(ordens);
    setLoading(false);
  };

  const abas = [
    { key: "status",      label: "Por Status",       Icon: BarChart3  },
    { key: "cliente",     label: "Por Cliente",      Icon: Users      },
    { key: "tipo",        label: "Por Tipo OS",      Icon: FileText   },
    { key: "financeiro",  label: "Financeiro",       Icon: DollarSign },
    { key: "colaborador", label: "Por Colaborador",  Icon: Users      },
    { key: "instalacoes", label: "Instalações",      Icon: Wrench     },
    { key: "lista",       label: "Lista Completa",   Icon: Calendar   },
  ];

  // ── Por Status ───────────────────────────────────────────────
  const renderStatus = () => {
    const grupos = Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
      const lista = ordens.filter(o => o.status === key);
      return { key, cfg, count: lista.length, valor: lista.reduce((s, o) => s + (o.valor_total || 0), 0) };
    });
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
          {grupos.map(({ key, cfg, count, valor }) => (
            <div
              key={key}
              onClick={() => count > 0 && setFiltroModal({ label: cfg.label, lista: ordens.filter(o => o.status === key) })}
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: "16px 18px", cursor: count > 0 ? "pointer" : "default", transition: "all 0.15s" }}
              onMouseEnter={e => count > 0 && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "none")}
            >
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: cfg.text }}>{cfg.label}</p>
              <p style={{ margin: "6px 0 2px", fontSize: 26, fontWeight: 800, color: cfg.text }}>{count}</p>
              <p style={{ margin: 0, fontSize: 11, color: cfg.text, opacity: 0.8 }}>{fmt(valor)}</p>
              {count > 0 && <p style={{ margin: "4px 0 0", fontSize: 10, color: cfg.text, opacity: 0.5 }}>clique para ver</p>}
            </div>
          ))}
        </div>
        {grupos.filter(g => g.count > 0).map(({ key, cfg, count, valor }) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: cfg.text }}>{cfg.label}</span>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{fmt(valor)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: cfg.text }}>{count} OS</span>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>⚠ Em atraso</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>{ordens.filter(isAtrasada).length} OS</span>
        </div>
      </>
    );
  };

  // ── Por Cliente ──────────────────────────────────────────────
  const renderCliente = () => {
    const grupos = groupBy(ordens, o => o.clientes?.nome);
    const sorted = Object.entries(grupos).sort((a, b) => b[1].length - a[1].length);
    if (sorted.length === 0) return <p style={{ color: "#9CA3AF", textAlign: "center" }}>Nenhuma OS no período.</p>;
    return sorted.map(([nome, lista]) => {
      const valor = lista.reduce((s, o) => s + (o.valor_total || 0), 0);
      const pct = Math.round((lista.length / ordens.length) * 100);
      return (
        <div key={nome} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{nome}</span>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{lista.length} OS · {fmt(valor)}</span>
          </div>
          <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "#7C3AED", borderRadius: 4 }} />
          </div>
        </div>
      );
    });
  };

  // ── Por Tipo ─────────────────────────────────────────────────
  const renderTipo = () => {
    const grupos = groupBy(ordens, o => o.tipos_os ? `[${o.tipos_os.codigo}] ${o.tipos_os.nome}` : "Sem tipo");
    const sorted = Object.entries(grupos).sort((a, b) => b[1].length - a[1].length);
    if (sorted.length === 0) return <p style={{ color: "#9CA3AF", textAlign: "center" }}>Nenhuma OS no período.</p>;
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Tipo", "Qtd", "% Total", "Valor Total", "Ticket Médio"].map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(([tipo, lista], i) => {
            const valor = lista.reduce((s, o) => s + (o.valor_total || 0), 0);
            return (
              <tr key={tipo} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px", fontWeight: 500 }}>{tipo}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ background: "#F5F3FF", color: "#7C3AED", borderRadius: 20, padding: "2px 10px", fontWeight: 700, fontSize: 12 }}>{lista.length}</span></td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{Math.round((lista.length / ordens.length) * 100)}%</td>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{fmt(valor)}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{fmt(lista.length > 0 ? valor / lista.length : 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // ── Financeiro ───────────────────────────────────────────────
  const renderFinanceiro = () => {
    const concluidas  = ordens.filter(o => o.status === "concluida");
    const abertas     = ordens.filter(o => !["concluida","cancelada"].includes(o.status));
    const canceladas  = ordens.filter(o => o.status === "cancelada");
    const valorTotal  = ordens.reduce((s, o) => s + (o.valor_total || 0), 0);
    const valorConc   = concluidas.reduce((s, o) => s + (o.valor_total || 0), 0);
    const valorAberto = abertas.reduce((s, o) => s + (o.valor_total || 0), 0);
    const valorCanc   = canceladas.reduce((s, o) => s + (o.valor_total || 0), 0);

    const summaryCards = [
      { label: "Faturamento Total",   value: fmt(valorTotal),                              color: "#7C3AED", bg: "#F5F3FF" },
      { label: "Valor Concluído",     value: fmt(valorConc),                               color: "#16A34A", bg: "#DCFCE7" },
      { label: "Valor em Aberto",     value: fmt(valorAberto),                             color: "#D97706", bg: "#FEF3C7" },
      { label: "Valor Cancelado",     value: fmt(valorCanc),                               color: "#DC2626", bg: "#FEF2F2" },
      { label: "Ticket Médio",        value: fmt(ordens.length > 0 ? valorTotal / ordens.length : 0), color: "#7C3AED", bg: "#F5F3FF" },
      { label: "Total de OS",         value: ordens.length,                                color: "#059669", bg: "#ECFDF5" },
    ];

    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          {summaryCards.map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color, opacity: 0.8 }}>{label}</p>
              <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>
        <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Top 10 OS por Valor</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Nº OS", "Cliente", "Título", "Status", "Valor"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...ordens].sort((a, b) => (b.valor_total || 0) - (a.valor_total || 0)).slice(0, 10).map((os, i) => (
              <tr key={os.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#7C3AED" }}>#{os.numero_os}</td>
                <td style={{ padding: "12px 16px" }}>{os.clientes?.nome || "—"}</td>
                <td style={{ padding: "12px 16px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{os.titulo}</td>
                <td style={{ padding: "12px 16px" }}><StatusBadge status={os.status} /></td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#16A34A" }}>{fmt(os.valor_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  // ── Lista Completa ───────────────────────────────────────────
  const renderLista = () => (
    <div style={{ overflowX: "auto" }}>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9CA3AF" }}>{ordens.length} registros no período.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
            {["Nº", "Data", "Cliente", "Título", "Tipo", "Status", "Entrega", "Lançado por", "Finalizado por", "Valor"].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordens.length === 0
            ? <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Nenhuma OS no período.</td></tr>
            : ordens.map((os, i) => (
              <tr
                key={os.id}
                onClick={() => setOsDetalhe(os)}
                style={{ borderTop: "1px solid #F3F4F6", background: isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F5F3FF"}
                onMouseLeave={e => e.currentTarget.style.background = isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA"}
              >
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#7C3AED" }}>#{os.numero_os}</td>
                <td style={{ padding: "10px 14px", color: "#6B7280", whiteSpace: "nowrap" }}>{fmtDate(os.data_lancamento)}</td>
                <td style={{ padding: "10px 14px" }}>{os.clientes?.nome || "—"}</td>
                <td style={{ padding: "10px 14px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{os.titulo}</td>
                <td style={{ padding: "10px 14px" }}>
                  {os.tipos_os && <span style={{ background: "#F5F3FF", color: "#7C3AED", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{os.tipos_os.codigo}</span>}
                </td>
                <td style={{ padding: "10px 14px" }}><StatusBadge status={os.status} /></td>
                <td style={{ padding: "10px 14px", color: isAtrasada(os) ? "#DC2626" : "#374151", whiteSpace: "nowrap", fontWeight: isAtrasada(os) ? 700 : 400 }}>
                  {fmtDate(os.data_entrega_prevista)}
                  {isAtrasada(os) && <span style={{ display: "block", fontSize: 10 }}>⚠ ATRASADA</span>}
                </td>
                <td style={{ padding: "10px 14px", color: "#6B7280" }}>{os.usuarios?.funcionarios?.nome || "—"}</td>
                <td style={{ padding: "10px 14px", color: os.finalizado_por !== "—" ? "#16A34A" : "#9CA3AF", fontWeight: os.finalizado_por !== "—" ? 600 : 400 }}>
                  {os.finalizado_por}
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{fmt(os.valor_total)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  // ── Instalações ─────────────────────────────────────────────
  const renderInstalacoes = () => {
    const instaladas   = ordens.filter(o => o.status === "em_instalacao" || o.horario_instalacao);
    const concluidas   = ordens.filter(o => o.status === "concluida" && o.horario_instalacao);
    const emAndamento  = ordens.filter(o => o.status === "em_instalacao");

    if (instaladas.length === 0) return (
      <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF" }}>
        <Wrench size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: 15 }}>Nenhuma instalação no período.</p>
      </div>
    );

    return (
      <div>
        {/* Resumo */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total de Instalações", value: instaladas.length,  color: "#C2410C", bg: "#FFF7ED" },
            { label: "Em Andamento",         value: emAndamento.length,  color: "#F59E0B", bg: "#FFFBEB" },
            { label: "Concluídas",           value: concluidas.length,   color: "#16A34A", bg: "#DCFCE7" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color, opacity: 0.8 }}>{label}</p>
              <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                {["Nº OS","Cliente","Título","Status","Responsável","Horário Previsto","Entrega","Valor"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {instaladas.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Nenhuma instalação no período.</td></tr>
                : instaladas.map((os, i) => (
                  <tr key={os.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#7C3AED" }}>#{os.numero_os}</td>
                    <td style={{ padding: "10px 14px" }}>{os.clientes?.nome || "—"}</td>
                    <td style={{ padding: "10px 14px", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{os.titulo}</td>
                    <td style={{ padding: "10px 14px" }}><StatusBadge status={os.status} /></td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#C2410C" }}>
                      {os.resp_instalacao?.nome || <span style={{ color: "#9CA3AF", fontWeight: 400 }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "#374151" }}>
                      {os.horario_instalacao
                        ? new Date(os.horario_instalacao).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })
                        : <span style={{ color: "#9CA3AF" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: isAtrasada(os) ? "#DC2626" : "#374151", fontWeight: isAtrasada(os) ? 700 : 400 }}>
                      {fmtDate(os.data_entrega_prevista)}
                      {isAtrasada(os) && <span style={{ display: "block", fontSize: 10 }}>⚠ ATRASADA</span>}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{fmt(os.valor_total)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Produção por Colaborador ─────────────────────────────────
  const renderColaborador = () => {
    // Group OS by who launched them (usuario_lancamento)
    const lancadasPor = {};
    ordens.forEach(os => {
      const nome = os.usuarios?.funcionarios?.nome || "Não identificado";
      if (!lancadasPor[nome]) lancadasPor[nome] = { lancadas: 0, concluidas: 0, retrabalhos: 0, valor: 0, osIds: [] };
      lancadasPor[nome].lancadas++;
      if (os.status === "concluida")   lancadasPor[nome].concluidas++;
      if (os.status === "retrabalho" || os.tem_retrabalho) lancadasPor[nome].retrabalhos++;
      lancadasPor[nome].valor += os.valor_total || 0;
    });

    const sorted = Object.entries(lancadasPor).sort((a, b) => b[1].lancadas - a[1].lancadas);

    if (sorted.length === 0) return (
      <p style={{ textAlign:"center", color:"#9CA3AF", padding:40 }}>Nenhum dado no período.</p>
    );

    return (
      <div>
        <div style={{ marginBottom:16, background:"#F5F3FF", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#5B21B6" }}>
          📊 Produção individual dos colaboradores com base nas OS lançadas no período selecionado.
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
                {["Colaborador","OS Lançadas","OS Concluídas","Retrabalhos","Taxa Conclusão","Valor Total"].map(h => (
                  <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontWeight:600, color:"#6B7280", fontSize:12, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(([nome, d], i) => (
                <tr key={nome} style={{ borderTop:"1px solid #F3F4F6", background: i%2===0?"#fff":"#FAFAFA" }}>
                  <td style={{ padding:"12px 16px", fontWeight:700, color:"#0F172A" }}>{nome}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ background:"#F5F3FF", color:"#7C3AED", padding:"2px 10px", borderRadius:20, fontWeight:700 }}>{d.lancadas}</span>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ background:"#DCFCE7", color:"#166534", padding:"2px 10px", borderRadius:20, fontWeight:700 }}>{d.concluidas}</span>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ background: d.retrabalhos > 0 ? "#FFF1F2" : "#F3F4F6", color: d.retrabalhos > 0 ? "#BE123C" : "#9CA3AF", padding:"2px 10px", borderRadius:20, fontWeight:700 }}>{d.retrabalhos}</span>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:6, background:"#F3F4F6", borderRadius:99 }}>
                        <div style={{ height:"100%", width:`${d.lancadas > 0 ? (d.concluidas/d.lancadas*100).toFixed(0) : 0}%`, background:"#7C3AED", borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:12, color:"#374151", minWidth:30 }}>
                        {d.lancadas > 0 ? (d.concluidas/d.lancadas*100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px", fontWeight:600 }}>{fmt(d.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAba = () => {
    if (loading) return <p style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>Carregando...</p>;
    switch (abaAtiva) {
      case "status":      return renderStatus();
      case "cliente":     return renderCliente();
      case "tipo":        return renderTipo();
      case "financeiro":  return renderFinanceiro();
      case "colaborador": return renderColaborador();
      case "instalacoes": return renderInstalacoes();
      case "lista":       return renderLista();
      default:            return null;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#F5F3FF", borderRadius: 10, padding: 10 }}>
            <BarChart3 size={20} color="#7C3AED" />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Relatórios</h1>
        </div>
      </div>

      {/* Filtro de período */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 24, border: "1px solid #E5E7EB", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Filter size={16} color="#6B7280" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Período:</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#6B7280" }}>De</label>
          <input type="date" style={{ ...inputStyle, fontSize: 13 }} value={filtros.dataInicio} onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#6B7280" }}>Até</label>
          <input type="date" style={{ ...inputStyle, fontSize: 13 }} value={filtros.dataFim} onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))} />
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 13 }}>
          <span style={{ color: "#6B7280" }}><strong style={{ color: "#111827" }}>{ordens.length}</strong> OS no período</span>
          <span style={{ color: "#6B7280" }}>Total: <strong style={{ color: "#16A34A" }}>{fmt(ordens.reduce((s, o) => s + (o.valor_total || 0), 0))}</strong></span>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#F3F4F6", padding: 4, borderRadius: 12, width: "fit-content", flexWrap: "wrap" }}>
        {abas.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setAbaAtiva(key)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
            borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: abaAtiva === key ? "#fff" : "transparent",
            color: abaAtiva === key ? "#7C3AED" : "#6B7280",
            boxShadow: abaAtiva === key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.15s",
          }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <SectionCard title={abas.find(a => a.key === abaAtiva)?.label || ""} icon={abas.find(a => a.key === abaAtiva)?.Icon}>
        {renderAba()}
      </SectionCard>
      {/* Modal de filtro por status */}
      {filtroModal && (
        <div
          onClick={e => e.target === e.currentTarget && setFiltroModal(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 700, maxHeight: "80vh", overflow: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F5F3FF", borderRadius: "20px 20px 0 0" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
                {filtroModal.label} — {filtroModal.lista.length} OS
              </div>
              <button onClick={() => setFiltroModal(null)} style={{ border: "none", background: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 18, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: 16 }}>
              {filtroModal.lista.length === 0
                ? <p style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>Nenhuma OS.</p>
                : filtroModal.lista.map(os => {
                    const cfg = STATUS_CONFIG[os.status] || STATUS_CONFIG.em_aberto;
                    const atrasada = isAtrasada(os);
                    return (
                      <div
                        key={os.id}
                        onClick={() => { setFiltroModal(null); setOsDetalhe(os); }}
                        style={{ border: `1px solid ${atrasada ? "#FCA5A5" : "#E5E7EB"}`, borderLeft: `4px solid ${atrasada ? "#EF4444" : cfg.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 8, cursor: "pointer", background: "#FAFAFA", transition: "background 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F5F3FF"}
                        onMouseLeave={e => e.currentTarget.style.background = "#FAFAFA"}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>OS #{os.numero_os}</span>
                          <StatusBadge status={os.status} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{os.titulo}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          {os.clientes?.nome} · {fmtDate(os.data_lancamento)}
                          {atrasada && <span style={{ color: "#DC2626", fontWeight: 700 }}> ⚠ ATRASADA</span>}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhe da OS */}
      {osDetalhe && (
        <Modal title={`O.S. #${osDetalhe.numero_os} — ${osDetalhe.titulo}`} onClose={() => setOsDetalhe(null)} size="lg">
          <OSDetalhe os={osDetalhe} onClose={() => setOsDetalhe(null)} />
        </Modal>
      )}
    </div>
  );
}