import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StatusBadge } from "../components/components";
import { fmtDate, isAtrasada, STATUS_CONFIG, PRIORIDADE_CONFIG } from "../constants/constants";
import {
  ChevronLeft, ChevronRight, CalendarDays, List,
  Clock, AlertTriangle, AlertCircle, CheckCircle2, Calendar, PlayCircle,
} from "lucide-react";

// ─── HELPERS ─────────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA_CURTO = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function getDiasDoMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const ultimo   = new Date(ano, mes + 1, 0);
  const dias = [];
  // preenche dias anteriores
  for (let i = 0; i < primeiro.getDay(); i++) {
    const d = new Date(ano, mes, -primeiro.getDay() + i + 1);
    dias.push({ date: d, outroMes: true });
  }
  // dias do mês
  for (let d = 1; d <= ultimo.getDate(); d++) {
    dias.push({ date: new Date(ano, mes, d), outroMes: false });
  }
  // completa até 42 células (6 semanas)
  while (dias.length < 42) {
    const last = dias[dias.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    dias.push({ date: next, outroMes: true });
  }
  return dias;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ─── OS PILL (mini badge no calendário) ──────────────────────
function OSPill({ os, onClick }) {
  const cfg = STATUS_CONFIG[os.status] || STATUS_CONFIG.aguardando;
  const atrasada = isAtrasada(os);
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(os); }}
      title={`#${os.numero_os} — ${os.titulo}`}
      style={{
        background: atrasada ? "#FEE2E2" : cfg.bg,
        border: `1px solid ${atrasada ? "#FCA5A5" : cfg.border}`,
        color: atrasada ? "#991B1B" : cfg.text,
        borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        cursor: "pointer", marginBottom: 2, display: "block",
        transition: "opacity 0.12s",
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      #{os.numero_os} {os.titulo}
    </div>
  );
}

// ─── MODAL DETALHE DO DIA ─────────────────────────────────────
function DiaModal({ date, ordens, onClose, onSelectOS }) {
  const fmt2 = (d) => d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 540, maxHeight: "80vh", overflow: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F5F3FF", borderRadius: "20px 20px 0 0" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#7C3AED", textTransform: "uppercase", letterSpacing: 1 }}>Entregas do dia</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginTop: 2, textTransform: "capitalize" }}>{fmt2(date)}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 18, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          {ordens.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9CA3AF", padding: 24 }}>Nenhuma OS para este dia.</p>
          ) : ordens.map(os => {
            const cfg = STATUS_CONFIG[os.status] || STATUS_CONFIG.aguardando;
            const atrasada = isAtrasada(os);
            const prio = PRIORIDADE_CONFIG[os.prioridade] || PRIORIDADE_CONFIG.normal;
            return (
              <div
                key={os.id}
                onClick={() => { onClose(); onSelectOS(os); }}
                style={{ border: `1px solid ${atrasada ? "#FCA5A5" : "#E5E7EB"}`, borderLeft: `4px solid ${atrasada ? "#EF4444" : cfg.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, cursor: "pointer", background: atrasada ? "#FFF7F7" : "#FAFAFA", transition: "all 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F5F3FF"}
                onMouseLeave={e => e.currentTarget.style.background = atrasada ? "#FFF7F7" : "#FAFAFA"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>OS #{os.numero_os}</span>
                    <span style={{ fontSize: 11, marginLeft: 8, background: "#F5F3FF", color: "#7C3AED", padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>
                      {os.tipos_os?.codigo || "—"}
                    </span>
                  </div>
                  <StatusBadge status={os.status} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>{os.titulo}</div>
                <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6B7280", flexWrap: "wrap" }}>
                  <span>👤 {os.clientes?.nome || "—"}</span>
                  <span style={{ color: prio.color, fontWeight: 600 }}>▲ {prio.label}</span>
                  {os.usuarios?.funcionarios?.nome && <span>🚀 {os.usuarios.funcionarios.nome}</span>}
                  {atrasada && <span style={{ color: "#DC2626", fontWeight: 700 }}>⚠ ATRASADA</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AGENDA EXPANDIDA (lista por semana/mês) ─────────────────
function AgendaExpandida({ ordens, mes, ano, onSelectOS }) {
  if (ordens.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
        <Calendar size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: 15 }}>Nenhuma OS com entrega em {MESES[mes]} de {ano}</p>
      </div>
    );
  }

  // Agrupa por data de entrega
  const grupos = {};
  ordens.forEach(os => {
    const key = os.data_entrega_prevista?.split("T")[0] || "sem_data";
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(os);
  });

  return (
    <div>
      {Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b)).map(([key, lista]) => {
        const d = key !== "sem_data" ? new Date(key + "T12:00:00") : null;
        const hoje = new Date();
        const isToday = d && isSameDay(d, hoje);
        const passou = d && d < hoje;

        return (
          <div key={key} style={{ marginBottom: 20 }}>
            {/* Header do dia */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: isToday ? "#7C3AED" : passou ? "#F3F4F6" : "#F5F3FF",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                {d ? (
                  <>
                    <span style={{ fontSize: 18, fontWeight: 800, color: isToday ? "#fff" : passou ? "#9CA3AF" : "#7C3AED", lineHeight: 1 }}>{d.getDate()}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: isToday ? "#DDD6FE" : passou ? "#9CA3AF" : "#A78BFA", textTransform: "uppercase" }}>{DIAS_SEMANA_CURTO[d.getDay()]}</span>
                  </>
                ) : <span style={{ fontSize: 11, color: "#9CA3AF" }}>—</span>}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isToday ? "#7C3AED" : passou ? "#9CA3AF" : "#0F172A" }}>
                  {d ? d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : "Sem data de entrega"}
                  {isToday && <span style={{ marginLeft: 8, fontSize: 11, background: "#7C3AED", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>HOJE</span>}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{lista.length} {lista.length === 1 ? "entrega" : "entregas"}</div>
              </div>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 8 }} />
            </div>

            {/* OS do dia */}
            <div style={{ paddingLeft: 60, display: "flex", flexDirection: "column", gap: 8 }}>
              {lista.map(os => {
                const cfg = STATUS_CONFIG[os.status] || STATUS_CONFIG.aguardando;
                const atrasada = isAtrasada(os);
                const prio = PRIORIDADE_CONFIG[os.prioridade] || PRIORIDADE_CONFIG.normal;
                return (
                  <div
                    key={os.id}
                    onClick={() => onSelectOS(os)}
                    style={{
                      background: "#fff", border: `1px solid ${atrasada ? "#FCA5A5" : "#E5E7EB"}`,
                      borderLeft: `4px solid ${atrasada ? "#EF4444" : cfg.border}`,
                      borderRadius: 12, padding: "14px 18px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 16,
                      transition: "all 0.12s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.12)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>#{os.numero_os}</span>
                        {os.tipos_os && <span style={{ fontSize: 11, background: "#F5F3FF", color: "#7C3AED", padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{os.tipos_os.codigo}</span>}
                        <span style={{ fontSize: 11, background: prio.bg, color: prio.color, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{prio.label}</span>
                        {atrasada && <span style={{ fontSize: 11, background: "#FEE2E2", color: "#991B1B", padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>⚠ ATRASADA</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{os.titulo}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        {os.clientes?.nome} {os.usuarios?.funcionarios?.nome && `· por ${os.usuarios.funcionarios.nome}`}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <StatusBadge status={os.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── AGENDA (CALENDÁRIO MENSAL SINTÉTICO) ────────────────────
function AgendaCalendario({ ano, mes, mapaOS, onDayClick, onSelectOS }) {
  const dias = getDiasDoMes(ano, mes);
  const hoje = new Date();

  return (
    <div>
      {/* Cabeçalho dias da semana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DIAS_SEMANA_CURTO.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#94A3B8", padding: "8px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {dias.map(({ date, outroMes }, idx) => {
          const key = dateKey(date);
          const osNoDia = mapaOS[key] || [];
          const isToday = isSameDay(date, hoje);
          const temOS = osNoDia.length > 0;
          const temAtrasada = osNoDia.some(isAtrasada);

          return (
            <div
              key={idx}
              onClick={() => temOS && onDayClick(date, osNoDia)}
              style={{
                minHeight: 96, borderRadius: 12, padding: "8px 8px 6px",
                background: isToday ? "#F5F3FF" : outroMes ? "#FAFAFA" : "#fff",
                border: isToday ? "2px solid #7C3AED" : temAtrasada ? "1px solid #FCA5A5" : "1px solid #E5E7EB",
                cursor: temOS ? "pointer" : "default",
                transition: "all 0.12s",
                opacity: outroMes ? 0.45 : 1,
              }}
              onMouseEnter={e => temOS && (e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.14)")}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              {/* Número do dia */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{
                  fontSize: 13, fontWeight: isToday ? 800 : 500,
                  color: isToday ? "#7C3AED" : outroMes ? "#CBD5E1" : "#0F172A",
                  width: 24, height: 24, borderRadius: "50%",
                  background: isToday ? "#EDE9FE" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {date.getDate()}
                </span>
                {temOS && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
                    background: temAtrasada ? "#EF4444" : "#7C3AED",
                    color: "#fff", borderRadius: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 5px",
                  }}>
                    {osNoDia.length}
                  </span>
                )}
              </div>

              {/* Pills das OS */}
              {osNoDia.slice(0, 2).map(os => (
                <OSPill key={os.id} os={os} onClick={onSelectOS} />
              ))}
              {osNoDia.length > 2 && (
                <div style={{ fontSize: 10, color: "#7C3AED", fontWeight: 600, paddingLeft: 4 }}>
                  +{osNoDia.length - 2} mais
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── OS DETALHE MODAL (mini, usado na agenda) ─────────────────
function OSMiniDetalhe({ os, onClose }) {
  const cfg = STATUS_CONFIG[os.status] || STATUS_CONFIG.aguardando;
  const prio = PRIORIDADE_CONFIG[os.prioridade] || PRIORIDADE_CONFIG.normal;
  const atrasada = isAtrasada(os);

  const rows = [
    ["Cliente",       os.clientes?.nome || "—"],
    ["Tipo",          os.tipos_os ? `[${os.tipos_os.codigo}] ${os.tipos_os.nome}` : "—"],
    ["Prioridade",    <span style={{ color: prio.color, fontWeight: 600 }}>{prio.label}</span>],
    ["Entrega",       <span style={{ color: atrasada ? "#DC2626" : "#374151", fontWeight: atrasada ? 700 : 400 }}>{fmtDate(os.data_entrega_prevista)}{atrasada ? " ⚠" : ""}</span>],
    ["Lançado por",   os.usuarios?.funcionarios?.nome || "—"],
  ];

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 32px 80px rgba(0,0,0,0.3)", overflow: "hidden" }}>
        {/* Header colorido */}
        <div style={{ background: atrasada ? "#FEE2E2" : cfg.bg, padding: "20px 24px", borderBottom: `2px solid ${atrasada ? "#FCA5A5" : cfg.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: atrasada ? "#991B1B" : cfg.text, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                OS #{os.numero_os}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{os.titulo}</div>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.6)", borderRadius: 10, width: 32, height: 32, cursor: "pointer", fontSize: 18, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <StatusBadge status={os.status} size="lg" />
          </div>
        </div>

        {/* Detalhes */}
        <div style={{ padding: "18px 24px" }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, minWidth: 110 }}>{label}</span>
              <span style={{ fontSize: 13, color: "#0F172A" }}>{value}</span>
            </div>
          ))}
          {os.descricao && (
            <div style={{ marginTop: 14, background: "#F9FAFB", borderRadius: 10, padding: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{os.descricao}</p>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#7C3AED", color: "#fff", border: "none", padding: "9px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA AGENDA ────────────────────────────────────────────
export default function Agenda() {
  const hoje = new Date();
  const [ano,  setAno]  = useState(hoje.getFullYear());
  const [mes,  setMes]  = useState(hoje.getMonth());
  const [modo, setModo] = useState("calendario"); // "calendario" | "lista"
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diaModal, setDiaModal] = useState(null); // { date, ordens }
  const [osDetalhe, setOsDetalhe] = useState(null);
  const [filtroModal, setFiltroModal] = useState(null);

  useEffect(() => { loadOrdens(); }, [ano, mes]);

  const loadOrdens = async () => {
    setLoading(true);
    const inicio = new Date(ano, mes, 1).toISOString().split("T")[0];
    const fim    = new Date(ano, mes + 1, 0).toISOString().split("T")[0];

    const { data } = await supabase
      .from("ordens_servico")
      .select("*, clientes(nome), tipos_os(codigo, nome), usuarios!usuario_lancamento_id(funcionarios(nome))")
      .gte("data_entrega_prevista", inicio)
      .lte("data_entrega_prevista", fim)
      .not("status", "in", '("cancelada")')
      .order("data_entrega_prevista", { ascending: true });

    setOrdens(data || []);
    setLoading(false);
  };

  // Mapa: "YYYY-MM-DD" → [OS, ...]
  const mapaOS = {};
  ordens.forEach(os => {
    const key = os.data_entrega_prevista?.split("T")[0];
    if (key) {
      if (!mapaOS[key]) mapaOS[key] = [];
      mapaOS[key].push(os);
    }
  });

  const navMes = (delta) => {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 0)  { novoMes = 11; novoAno--; }
    if (novoMes > 11) { novoMes = 0;  novoAno++; }
    setMes(novoMes); setAno(novoAno);
  };

  const irParaHoje = () => { setMes(hoje.getMonth()); setAno(hoje.getFullYear()); };

  // Estatísticas rápidas do mês
  const total      = ordens.length;
  const atrasadas  = ordens.filter(isAtrasada).length;
  const concluidas = ordens.filter(o => o.status === "concluida").length;
  const emAberto   = ordens.filter(o => o.status === "em_aberto").length;
  const aguardAprov= ordens.filter(o => o.status === "aguardando_aprovacao").length;
  const aprovadas  = ordens.filter(o => o.status === "aprovada").length;
  const emProducao = ordens.filter(o => o.status === "em_producao").length;

  const statCards = [
    { label: "Entregas no mês",    value: total,      color: "#7C3AED", bg: "#F5F3FF", Icon: Calendar,      filtro: null },
    { label: "Em Aberto",          value: emAberto,   color: "#0369A1", bg: "#F0F9FF", Icon: Clock,          filtro: () => setFiltroModal({ label: "Em Aberto", ordens: ordens.filter(o => o.status === "em_aberto") }) },
    { label: "Aguard. Aprovação",  value: aguardAprov,color: "#EA580C", bg: "#FFF7ED", Icon: AlertCircle,    filtro: () => setFiltroModal({ label: "Aguardando Aprovação", ordens: ordens.filter(o => o.status === "aguardando_aprovacao") }) },
    { label: "Aprovadas",          value: aprovadas,  color: "#065F46", bg: "#ECFDF5", Icon: CheckCircle2,   filtro: () => setFiltroModal({ label: "Aprovadas", ordens: ordens.filter(o => o.status === "aprovada") }) },
    { label: "Em Produção",        value: emProducao, color: "#6D28D9", bg: "#EDE9FE", Icon: PlayCircle,     filtro: () => setFiltroModal({ label: "Em Produção", ordens: ordens.filter(o => o.status === "em_producao") }) },
    { label: "Em Atraso",          value: atrasadas,  color: "#DC2626", bg: "#FEF2F2", Icon: AlertTriangle,  filtro: () => setFiltroModal({ label: "Em Atraso", ordens: ordens.filter(isAtrasada) }) },
    { label: "Concluídas",         value: concluidas, color: "#16A34A", bg: "#DCFCE7", Icon: CheckCircle2,   filtro: () => setFiltroModal({ label: "Concluídas", ordens: ordens.filter(o => o.status === "concluida") }) },
  ];

  return (
    <div>
      {/* Título */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#F5F3FF", borderRadius: 12, padding: 10 }}>
            <CalendarDays size={22} color="#7C3AED" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0F172A" }}>Agenda de Entregas</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>Datas de entrega das Ordens de Serviço</p>
          </div>
        </div>

        {/* Toggle sintético/expandido */}
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 4, gap: 2 }}>
          <button
            onClick={() => setModo("calendario")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: modo === "calendario" ? "#fff" : "transparent", color: modo === "calendario" ? "#7C3AED" : "#6B7280", boxShadow: modo === "calendario" ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}
          >
            <CalendarDays size={14} /> Sintético
          </button>
          <button
            onClick={() => setModo("lista")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: modo === "lista" ? "#fff" : "transparent", color: modo === "lista" ? "#7C3AED" : "#6B7280", boxShadow: modo === "lista" ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}
          >
            <List size={14} /> Expandido
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {statCards.map(({ label, value, color, bg, Icon, filtro }) => (
          <div
            key={label}
            onClick={filtro || undefined}
            style={{ background: bg, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: filtro ? "pointer" : "default", transition: "all 0.15s" }}
            onMouseEnter={e => filtro && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)")}
            onMouseLeave={e => filtro && (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "none")}
          >
            <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: 8 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color, opacity: 0.75, marginTop: 2, fontWeight: 500 }}>{label}</div>
              {filtro && <div style={{ fontSize: 10, color, opacity: 0.5, marginTop: 1 }}>clique p/ ver</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Header de navegação do mês */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #E5E7EB", background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" }}>
          <button onClick={() => navMes(-1)} style={{ border: "1px solid #DDD6FE", background: "#fff", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7C3AED" }}>
            <ChevronLeft size={18} />
          </button>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>
              {MESES[mes]}
            </div>
            <div style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>{ano}</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={irParaHoje} style={{ border: "1px solid #DDD6FE", background: "#fff", borderRadius: 10, padding: "0 14px", height: 36, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#7C3AED" }}>
              Hoje
            </button>
            <button onClick={() => navMes(1)} style={{ border: "1px solid #DDD6FE", background: "#fff", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7C3AED" }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
              <CalendarDays size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p style={{ margin: 0 }}>Carregando agenda...</p>
            </div>
          ) : modo === "calendario" ? (
            <AgendaCalendario
              ano={ano} mes={mes} mapaOS={mapaOS}
              onDayClick={(date, os) => setDiaModal({ date, ordens: os })}
              onSelectOS={setOsDetalhe}
            />
          ) : (
            <AgendaExpandida
              ordens={ordens} mes={mes} ano={ano}
              onSelectOS={setOsDetalhe}
            />
          )}
        </div>
      </div>

      {/* Modal: filtro por status dos cards */}
      {filtroModal && (
        <div
          onClick={e => e.target === e.currentTarget && setFiltroModal(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 700, maxHeight: "80vh", overflow: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F5F3FF", borderRadius: "20px 20px 0 0" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
                {filtroModal.label} — {filtroModal.ordens.length} {filtroModal.ordens.length === 1 ? "OS" : "OS"}
              </div>
              <button onClick={() => setFiltroModal(null)} style={{ border: "none", background: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 18, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: 16 }}>
              {filtroModal.ordens.length === 0
                ? <p style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>Nenhuma OS nesta categoria.</p>
                : filtroModal.ordens.map(os => {
                    const cfg = STATUS_CONFIG[os.status] || STATUS_CONFIG.em_aberto;
                    const atrasada = isAtrasada(os);
                    return (
                      <div
                        key={os.id}
                        onClick={() => { setFiltroModal(null); setOsDetalhe(os); }}
                        style={{ border: `1px solid ${atrasada ? "#FCA5A5" : "#E5E7EB"}`, borderLeft: `4px solid ${atrasada ? "#EF4444" : cfg.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 8, cursor: "pointer", background: "#FAFAFA", transition: "all 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F5F3FF"}
                        onMouseLeave={e => e.currentTarget.style.background = "#FAFAFA"}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>OS #{os.numero_os}</span>
                          <StatusBadge status={os.status} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{os.titulo}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          {os.clientes?.nome} · Entrega: {fmtDate(os.data_entrega_prevista)}
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

      {/* Modal: OS do dia (modo calendário) */}
      {diaModal && (
        <DiaModal
          date={diaModal.date}
          ordens={diaModal.ordens}
          onClose={() => setDiaModal(null)}
          onSelectOS={os => { setDiaModal(null); setOsDetalhe(os); }}
        />
      )}

      {/* Modal: detalhe da OS */}
      {osDetalhe && (
        <OSMiniDetalhe os={osDetalhe} onClose={() => setOsDetalhe(null)} />
      )}
    </div>
  );
}
