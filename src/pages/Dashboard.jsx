import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge, PrioridadeBadge, Modal } from "../components/components";
import { fmt, fmtDate, isAtrasada, isHoje, STATUS_CONFIG } from "../constants/constants";
import { OSDetalhe } from "./OrdensServico";
import {
  FileText, PlayCircle, Clock, AlertTriangle, AlertCircle, Calendar,
  TrendingUp, CheckCircle2, XCircle, DollarSign, BarChart3,
  RefreshCw, Wrench, Tv, X, Maximize2,
} from "lucide-react";

// ─── CSS GLOBAL (keyframes) ───────────────────────────────────
const DASH_STYLES = `
  @keyframes kf-pulse {
    0%,100% { transform: scale(1);    box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
    50%      { transform: scale(1.05); box-shadow: 0 12px 32px rgba(0,0,0,0.28); }
  }
  @keyframes kf-blink-red {
    0%,100% { box-shadow: 0 2px 8px rgba(239,68,68,0.3); }
    50%      { box-shadow: 0 0 0 12px rgba(239,68,68,0.22), 0 4px 20px rgba(239,68,68,0.6); transform: scale(1.03); }
  }
  @keyframes kf-shake-orange {
    0%,100% { transform: scale(1)    rotate(0deg);   box-shadow: 0 2px 8px rgba(249,115,22,0.3); }
    20%      { transform: scale(1.04) rotate(-1.5deg); }
    40%      { transform: scale(1.04) rotate(1.5deg);  box-shadow: 0 8px 28px rgba(249,115,22,0.65); }
    60%      { transform: scale(1.03) rotate(-1deg); }
    80%      { transform: scale(1.02) rotate(1deg); }
  }
  @keyframes kf-glow-violet {
    0%,100% { box-shadow: 0 2px 8px rgba(124,58,237,0.35); transform: scale(1); }
    50%      { box-shadow: 0 0 0 10px rgba(124,58,237,0.2), 0 4px 24px rgba(124,58,237,0.7); transform: scale(1.03); }
  }
  .dash-card { cursor: pointer; }
  .dash-card:hover { filter: brightness(1.1) !important; transform: translateY(-4px) scale(1.02) !important; transition: all 0.15s !important; }
  .eff-pulse        { animation: kf-pulse        2.5s ease-in-out infinite; }
  .eff-blink-red    { animation: kf-blink-red    1.3s ease-in-out infinite; }
  .eff-shake-orange { animation: kf-shake-orange 2.2s ease-in-out infinite; }
  .eff-glow-violet  { animation: kf-glow-violet  2s   ease-in-out infinite; }

  /* TV Mode */
  .tv-mode-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: #0F172A;
    display: flex; flex-direction: column;
  }
  .tv-card {
    border-radius: 20px; cursor: pointer;
    display: flex; flex-direction: column; justify-content: space-between;
    transition: filter 0.2s;
  }
  .tv-card:hover { filter: brightness(1.12); }
`;

// ─── MODAL: LISTA DE OS ───────────────────────────────────────
function OSListModal({ title, ordens, onClose }) {
  const [selectedOS, setSelectedOS] = useState(null);
  return (
    <>
      <Modal title={title} onClose={onClose} size="xl">
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9CA3AF" }}>Clique em uma O.S. para ver os detalhes.</p>
        <div style={{ overflowX: "auto" }}>
          {ordens.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>Nenhuma O.S. encontrada.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["Nº OS","Cliente","Título","Status","Prioridade","Entrega","Valor"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordens.map((os, i) => (
                  <tr key={os.id} onClick={() => setSelectedOS(os)}
                    style={{ borderTop: "1px solid #F3F4F6", background: isAtrasada(os) ? "#FFF7F7" : i%2===0?"#fff":"#FAFAFA", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background="#F5F3FF"}
                    onMouseLeave={e => e.currentTarget.style.background=isAtrasada(os)?"#FFF7F7":i%2===0?"#fff":"#FAFAFA"}
                  >
                    <td style={{ padding:"12px 14px", fontWeight:700, color:"#7C3AED" }}>#{os.numero_os}</td>
                    <td style={{ padding:"12px 14px" }}>{os.clientes?.nome||"—"}</td>
                    <td style={{ padding:"12px 14px", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{os.titulo}</td>
                    <td style={{ padding:"12px 14px" }}><StatusBadge status={os.status}/></td>
                    <td style={{ padding:"12px 14px" }}><PrioridadeBadge prioridade={os.prioridade}/></td>
                    <td style={{ padding:"12px 14px", color:isAtrasada(os)?"#DC2626":"#374151", fontWeight:isAtrasada(os)?700:400, whiteSpace:"nowrap" }}>
                      {fmtDate(os.data_entrega_prevista)}
                      {isAtrasada(os) && <span style={{ display:"block", fontSize:10, color:"#DC2626" }}>⚠ ATRASADA</span>}
                    </td>
                    <td style={{ padding:"12px 14px", fontWeight:600 }}>{fmt(os.valor_total)}</td>
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

// ─── TV MODE ─────────────────────────────────────────────────
function TVMode({ cards, stats, onClose, load }) {
  const [tick, setTick] = useState(0);
  const [modalFiltro, setModalFiltro] = useState(null);
  const [osDetalheTV, setOsDetalheTV] = useState(null);
  const [ultimaRefresh, setUltimaRefresh] = useState(new Date());

  // Auto-refresh a cada 60s
  useEffect(() => {
    const id = setInterval(() => {
      load();
      setUltimaRefresh(new Date());
      setTick(t => t+1);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const hora = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const data = now.toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long" });

  // Only status cards (exclude financial)
  const tvCards = cards.filter(c => !["valorTotal","valorAbertas","valorConcluidas"].includes(c._key));

  return (
    <div className="tv-mode-overlay">
      <style>{DASH_STYLES}</style>

      {/* Header TV */}
      <div style={{ padding: "18px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1E293B", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "#7C3AED", borderRadius: 12, padding: "8px 10px" }}>
            <Tv size={22} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px" }}>OSWeb 1.0 — Painel de Produção</div>
            <div style={{ color: "#64748B", fontSize: 13, marginTop: 2, textTransform: "capitalize" }}>{data}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{hora}</div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>Atualização automática a cada 60s</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#1E293B", border: "1px solid #334155", color: "#94A3B8", borderRadius: 10, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            <X size={16} /> Sair do Modo TV
          </button>
        </div>
      </div>

      {/* Cards grid — ocupa todo o espaço restante */}
      <div style={{ flex: 1, padding: "24px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18, alignContent: "start", overflowY: "auto" }}>
        {tvCards.map(({ label, value, Icon, bg, icon, color, effect, filtro }) => (
          <div
            key={label}
            onClick={() => filtro && setModalFiltro({ title: label, ordens: filtro() })}
            className={`tv-card${effect ? " eff-" + effect : ""}`}
            style={{ background: bg, padding: "28px 26px", minHeight: 160, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p style={{ margin: 0, fontSize: 14, color: color === "#fff" ? "rgba(255,255,255,0.8)" : "#6B7280", fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</p>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 10 }}>
                <Icon size={24} color={icon} />
              </div>
            </div>
            <p style={{ margin: "16px 0 8px", fontSize: 56, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
            <p style={{ margin: 0, fontSize: 11, color: color === "#fff" ? "rgba(255,255,255,0.5)" : "#9CA3AF" }}>▸ toque para ver OS</p>
          </div>
        ))}
      </div>

      {/* Modal: lista de OS do status */}
      {modalFiltro && (
        <div onClick={e => e.target===e.currentTarget&&setModalFiltro(null)}
          style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", padding:32 }}>
          <div style={{ background:"#1E293B", borderRadius:24, width:"100%", maxWidth:760, maxHeight:"85vh", display:"flex", flexDirection:"column", border:"1px solid #334155", boxShadow:"0 40px 100px rgba(0,0,0,0.6)" }}>

            {/* Header */}
            <div style={{ padding:"22px 28px", borderBottom:"1px solid #334155", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <div>
                <div style={{ color:"#fff", fontSize:20, fontWeight:800 }}>{modalFiltro.title}</div>
                <div style={{ color:"#64748B", fontSize:13, marginTop:3 }}>
                  {modalFiltro.ordens.length} {modalFiltro.ordens.length===1?"ordem":"ordens"} · Toque para ver detalhes
                </div>
              </div>
              <button onClick={()=>setModalFiltro(null)}
                style={{ background:"#334155", border:"none", color:"#94A3B8", borderRadius:12, width:44, height:44, cursor:"pointer", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
                ×
              </button>
            </div>

            {/* Lista */}
            <div style={{ padding:20, overflowY:"auto", flex:1 }}>
              {modalFiltro.ordens.length===0
                ? <p style={{ color:"#64748B", textAlign:"center", padding:40, fontSize:16 }}>Nenhuma OS neste status.</p>
                : modalFiltro.ordens.map(os => {
                  const cfg = STATUS_CONFIG[os.status]||STATUS_CONFIG.em_aberto;
                  const atrasada = isAtrasada(os);
                  return (
                    <div
                      key={os.id}
                      onClick={() => { setModalFiltro(null); setOsDetalheTV(os); }}
                      style={{
                        borderLeft:`5px solid ${atrasada?"#EF4444":cfg.border}`,
                        borderRadius:14, padding:"16px 20px", marginBottom:10,
                        background: atrasada?"#1A0A0A":"#0F172A",
                        border:`1px solid ${atrasada?"#3D1515":"#1E293B"}`,
                        borderLeftWidth:5,
                        cursor:"pointer", transition:"all 0.15s",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background="#1E293B"}
                      onMouseLeave={e=>e.currentTarget.style.background=atrasada?"#1A0A0A":"#0F172A"}
                    >
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ color:"#7C3AED", fontWeight:800, fontSize:15 }}>OS #{os.numero_os}</span>
                          {os.numero_os_externo && (
                            <span style={{ background:"#1E293B", color:"#94A3B8", fontSize:11, padding:"2px 8px", borderRadius:6, fontWeight:500 }}>
                              ↳ {os.numero_os_externo}
                            </span>
                          )}
                          {atrasada && (
                            <span style={{ background:"#3D1515", color:"#F87171", fontSize:11, padding:"2px 8px", borderRadius:6, fontWeight:700 }}>
                              ⚠ ATRASADA
                            </span>
                          )}
                        </div>
                        <StatusBadge status={os.status}/>
                      </div>
                      <div style={{ color:"#F1F5F9", fontWeight:700, fontSize:16, marginBottom:6 }}>{os.titulo}</div>
                      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                        <span style={{ color:"#94A3B8", fontSize:13 }}>👤 {os.clientes?.nome||"—"}</span>
                        <span style={{ color: atrasada?"#F87171":"#94A3B8", fontSize:13, fontWeight: atrasada?700:400 }}>
                          📅 {fmtDate(os.data_entrega_prevista)}
                        </span>
                        {os.valor_total > 0 && (
                          <span style={{ color:"#94A3B8", fontSize:13 }}>💰 {fmt(os.valor_total)}</span>
                        )}
                      </div>
                      <div style={{ marginTop:10, fontSize:12, color:"#475569", display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ background:"#1E293B", borderRadius:6, padding:"3px 10px", border:"1px solid #334155" }}>
                          ▸ Toque para ver detalhes completos
                        </span>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      )}

      {/* Modal: detalhe completo da OS no Modo TV */}
      {osDetalheTV && (
        <div onClick={e => e.target===e.currentTarget&&setOsDetalheTV(null)}
          style={{ position:"fixed", inset:0, zIndex:10001, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", padding:32 }}>
          <div style={{ background:"#1E293B", borderRadius:24, width:"100%", maxWidth:860, maxHeight:"90vh", display:"flex", flexDirection:"column", border:"1px solid #334155", boxShadow:"0 40px 100px rgba(0,0,0,0.7)" }}>

            {/* Header da OS */}
            <div style={{ padding:"22px 28px", borderBottom:"1px solid #334155", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0, background:"#0F172A", borderRadius:"24px 24px 0 0" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ color:"#7C3AED", fontWeight:900, fontSize:18 }}>OS #{osDetalheTV.numero_os}</span>
                  <StatusBadge status={osDetalheTV.status}/>
                  {isAtrasada(osDetalheTV) && (
                    <span style={{ background:"#3D1515", color:"#F87171", fontSize:12, padding:"3px 10px", borderRadius:8, fontWeight:700 }}>⚠ ATRASADA</span>
                  )}
                </div>
                <div style={{ color:"#F1F5F9", fontSize:22, fontWeight:800 }}>{osDetalheTV.titulo}</div>
              </div>
              <button onClick={()=>setOsDetalheTV(null)}
                style={{ background:"#1E293B", border:"1px solid #334155", color:"#94A3B8", borderRadius:12, width:44, height:44, cursor:"pointer", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, flexShrink:0 }}>
                ×
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ padding:28, overflowY:"auto", flex:1 }}>
              {/* Grid de informações */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>
                {[
                  ["Cliente",       osDetalheTV.clientes?.nome],
                  ["Cidade",        osDetalheTV.cidade],
                  ["Entrega",       fmtDate(osDetalheTV.data_entrega_prevista)],
                  ["Valor Total",   fmt(osDetalheTV.valor_total)],
                  ["Nº Externo",    osDetalheTV.numero_os_externo],
                  ["Prioridade",    osDetalheTV.prioridade],
                ].filter(([,v])=>v).map(([label, value]) => (
                  <div key={label} style={{ background:"#0F172A", borderRadius:12, padding:"14px 18px", border:"1px solid #1E293B" }}>
                    <div style={{ color:"#64748B", fontSize:12, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{label}</div>
                    <div style={{ color:"#F1F5F9", fontSize:16, fontWeight:700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Descrição */}
              {osDetalheTV.descricao && (
                <div style={{ background:"#0F172A", borderRadius:12, padding:"16px 20px", border:"1px solid #1E293B", marginBottom:20 }}>
                  <div style={{ color:"#64748B", fontSize:12, fontWeight:600, textTransform:"uppercase", marginBottom:8 }}>Descrição</div>
                  <div style={{ color:"#CBD5E1", fontSize:14, lineHeight:1.7 }}>{osDetalheTV.descricao}</div>
                </div>
              )}

              {/* Botão de fechar grande (fácil de tocar em TV) */}
              <div style={{ display:"flex", justifyContent:"center", marginTop:8 }}>
                <button
                  onClick={()=>setOsDetalheTV(null)}
                  style={{ background:"#7C3AED", color:"#fff", border:"none", padding:"16px 48px", borderRadius:14, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(124,58,237,0.4)", touchAction:"manipulation" }}
                >
                  ✕ Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────
export default function Dashboard() {
  const { usuario } = useAuth();
  const [all, setAll] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalFiltro, setModalFiltro] = useState(null);
  const [ultimaOS, setUltimaOS] = useState(null);
  const [tvMode, setTvMode] = useState(false);

  const isAdmin = usuario?.perfil === "admin";

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
      em_aberto:            lista.filter(o => o.status === "em_aberto").length,
      aguardando_aprovacao: lista.filter(o => o.status === "aguardando_aprovacao").length,
      aprovada:             lista.filter(o => o.status === "aprovada").length,
      em_producao:          lista.filter(o => o.status === "em_producao").length,
      em_instalacao:        lista.filter(o => o.status === "em_instalacao").length,
      concluida:            lista.filter(o => o.status === "concluida").length,
      cancelada:            lista.filter(o => o.status === "cancelada").length,
      atrasadas:            lista.filter(isAtrasada).length,
      hoje:                 lista.filter(o => isHoje(o) && !["concluida","cancelada"].includes(o.status)).length,
      lancadasHoje:         lista.filter(o => o.data_lancamento?.startsWith(hoje)).length,
      valorTotal:           lista.reduce((s,o) => s+(o.valor_total||0), 0),
      valorAbertas:         lista.filter(o => !["concluida","cancelada"].includes(o.status)).reduce((s,o) => s+(o.valor_total||0), 0),
      valorConcluidas:      lista.filter(o => o.status==="concluida").reduce((s,o) => s+(o.valor_total||0), 0),
    });
    setLoading(false);
  };

  const abrirFiltro = (title, filtroFn) => setModalFiltro({ title, ordens: all.filter(filtroFn) });

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#6B7280" }}>Carregando...</div>;
  if (!stats) return null;

  const hoje = new Date().toISOString().split("T")[0];

  const cards = [
    { _key:"total",    label:"Total de OS",       value:stats.total,                Icon:FileText,      bg:"#7C3AED", icon:"#fff", color:"#fff", effect:null,
      filtro:()=>abrirFiltro("Todas as OS",()=>true) },
    { _key:"em_aberto", label:"Em Aberto",         value:stats.em_aberto,            Icon:Clock,         bg:"#0EA5E9", icon:"#fff", color:"#fff", effect:"pulse",
      filtro:()=>abrirFiltro("OS Em Aberto", o=>o.status==="em_aberto") },
    { _key:"aguard",   label:"Aguard. Aprovação",  value:stats.aguardando_aprovacao, Icon:AlertCircle,   bg:"#F97316", icon:"#fff", color:"#fff", effect:"shake-orange",
      filtro:()=>abrirFiltro("OS Aguardando Aprovação", o=>o.status==="aguardando_aprovacao") },
    { _key:"aprovada", label:"Aprovada",           value:stats.aprovada,             Icon:CheckCircle2,  bg:"#10B981", icon:"#fff", color:"#fff", effect:null,
      filtro:()=>abrirFiltro("OS Aprovadas", o=>o.status==="aprovada") },
    { _key:"em_prod",  label:"Em Produção",        value:stats.em_producao,          Icon:PlayCircle,    bg:"#8B5CF6", icon:"#fff", color:"#fff", effect:null,
      filtro:()=>abrirFiltro("OS Em Produção", o=>o.status==="em_producao") },
    { _key:"em_inst",  label:"Em Instalação",      value:stats.em_instalacao,        Icon:Wrench,        bg:"#F59E0B", icon:"#fff", color:"#fff", effect:null,
      filtro:()=>abrirFiltro("OS Em Instalação", o=>o.status==="em_instalacao") },
    { _key:"atraso",   label:"Em Atraso",          value:stats.atrasadas,            Icon:AlertTriangle, bg:"#EF4444", icon:"#fff", color:"#fff", effect:"blink-red",
      filtro:()=>abrirFiltro("OS Em Atraso", isAtrasada) },
    { _key:"hoje",     label:"Para Hoje",          value:stats.hoje,                 Icon:Calendar,      bg:"#7C3AED", icon:"#fff", color:"#fff", effect:"glow-violet",
      filtro:()=>abrirFiltro("OS com Entrega Hoje", o=>isHoje(o)&&!["concluida","cancelada"].includes(o.status)) },
    { _key:"lancadas", label:"Lançadas Hoje",      value:stats.lancadasHoje,         Icon:TrendingUp,    bg:"#059669", icon:"#fff", color:"#fff", effect:null,
      filtro:()=>abrirFiltro("OS Lançadas Hoje", o=>o.data_lancamento?.startsWith(hoje)) },
    { _key:"concl",    label:"Concluídas",         value:stats.concluida,            Icon:CheckCircle2,  bg:"#16A34A", icon:"#fff", color:"#fff", effect:null,
      filtro:()=>abrirFiltro("OS Concluídas", o=>o.status==="concluida") },
    { _key:"cancel",   label:"Canceladas",         value:stats.cancelada,            Icon:XCircle,       bg:"#F3F4F6", icon:"#9CA3AF", color:"#6B7280", effect:null,
      filtro:()=>abrirFiltro("OS Canceladas", o=>o.status==="cancelada") },
  ];

  const valorCards = [
    { label:"Valor Total Geral", value:fmt(stats.valorTotal),      Icon:DollarSign, bg:"#7C3AED",
      filtro:()=>abrirFiltro("Todas as OS",()=>true) },
    { label:"Valor em Aberto",   value:fmt(stats.valorAbertas),    Icon:BarChart3,  bg:"#F97316",
      filtro:()=>abrirFiltro("OS em Aberto", o=>!["concluida","cancelada"].includes(o.status)) },
    { label:"Valor Concluído",   value:fmt(stats.valorConcluidas), Icon:TrendingUp, bg:"#16A34A",
      filtro:()=>abrirFiltro("OS Concluídas", o=>o.status==="concluida") },
  ];

  // TV Mode — passa filtro como função que retorna ordens
  const cardsParaTV = cards.map(c => ({
    ...c,
    filtro: () => all.filter(
      c._key === "total"    ? () => true :
      c._key === "em_aberto"? o => o.status==="em_aberto" :
      c._key === "aguard"   ? o => o.status==="aguardando_aprovacao" :
      c._key === "aprovada" ? o => o.status==="aprovada" :
      c._key === "em_prod"  ? o => o.status==="em_producao" :
      c._key === "em_inst"  ? o => o.status==="em_instalacao" :
      c._key === "atraso"   ? isAtrasada :
      c._key === "hoje"     ? o => isHoje(o)&&!["concluida","cancelada"].includes(o.status) :
      c._key === "lancadas" ? o => o.data_lancamento?.startsWith(hoje) :
      c._key === "concl"    ? o => o.status==="concluida" :
                              o => o.status==="cancelada"
    )
  }));

  if (tvMode) return <TVMode cards={cardsParaTV} stats={stats} onClose={() => setTvMode(false)} load={load} />;

  return (
    <div>
      <style>{DASH_STYLES}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"#111827" }}>Dashboard</h1>
          <p style={{ margin:"4px 0 0", color:"#6B7280", fontSize:14 }}>
            {new Date().toLocaleDateString("pt-BR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button
            onClick={() => setTvMode(true)}
            style={{ background:"#7C3AED", color:"#fff", border:"none", padding:"10px 18px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7, boxShadow:"0 2px 8px rgba(124,58,237,0.35)" }}
          >
            <Tv size={15} /> Modo TV
          </button>
          <button
            onClick={load}
            style={{ background:"#F3F4F6", color:"#374151", border:"1px solid #D1D5DB", padding:"10px 18px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6 }}
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
      </div>

      {/* Cards de status */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:14, marginBottom:24 }}>
        {cards.map(({ label, value, Icon, bg, icon, color, filtro, effect }) => (
          <div
            key={label}
            onClick={filtro}
            className={`dash-card${effect ? " eff-"+effect : ""}`}
            style={{ background:bg, borderRadius:16, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.12)" }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ margin:0, fontSize:11.5, color:color==="#fff"?"rgba(255,255,255,0.8)":"#6B7280", fontWeight:600 }}>{label}</p>
                <p style={{ margin:"8px 0 0", fontSize:32, fontWeight:900, color, lineHeight:1 }}>{value}</p>
              </div>
              <div style={{ background:"rgba(255,255,255,0.22)", borderRadius:12, padding:9, flexShrink:0 }}>
                <Icon size={20} color={icon} />
              </div>
            </div>
            <p style={{ margin:"10px 0 0", fontSize:10.5, color:color==="#fff"?"rgba(255,255,255,0.6)":"#9CA3AF" }}>▸ ver detalhes</p>
          </div>
        ))}
      </div>

      {/* Cards financeiros — somente Admin */}
      {isAdmin && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:14, marginBottom:30 }}>
          {valorCards.map(({ label, value, Icon, bg, filtro }) => (
            <div
              key={label}
              onClick={filtro}
              className="dash-card"
              style={{ background:bg, borderRadius:16, padding:"20px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.12)" }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:10, padding:7 }}>
                  <Icon size={18} color="#fff" />
                </div>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontWeight:600 }}>{label}</span>
              </div>
              <p style={{ margin:0, fontSize:24, fontWeight:900, color:"#fff" }}>{value}</p>
              <p style={{ margin:"6px 0 0", fontSize:10.5, color:"rgba(255,255,255,0.6)" }}>▸ ver OS</p>
            </div>
          ))}
        </div>
      )}

      {/* Distribuição por status */}
      <div style={{ background:"#fff", borderRadius:14, padding:24, border:"1px solid #E5E7EB", marginBottom:24 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:"#111827" }}>Distribuição por Status</h3>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = stats[key] || 0;
            const pct = stats.total ? Math.round((count/stats.total)*100) : 0;
            return (
              <div key={key} style={{ flex:"1 1 120px", cursor:"pointer" }}
                onClick={() => abrirFiltro(`OS — ${cfg.label}`, o => o.status===key)}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:cfg.text }}>{cfg.label}</span>
                  <span style={{ fontSize:12, color:"#6B7280" }}>{count}</span>
                </div>
                <div style={{ height:6, background:"#F3F4F6", borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:cfg.border, borderRadius:3, transition:"width 0.5s" }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Últimas OS */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #E5E7EB", overflow:"hidden" }}>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#111827" }}>Últimas Ordens de Serviço</h3>
          <span style={{ fontSize:12, color:"#9CA3AF" }}>Clique em uma linha para ver detalhes</span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#F9FAFB" }}>
                {["Nº OS","Cliente","Título","Status","Prioridade","Entrega","Valor"].map(h => (
                  <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontWeight:600, color:"#6B7280", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.length===0
                ? <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"#9CA3AF" }}>Nenhuma OS cadastrada ainda</td></tr>
                : all.slice(0,8).map((os,i) => (
                  <tr key={os.id} onClick={() => setUltimaOS(os)}
                    style={{ borderTop:"1px solid #F3F4F6", background:isAtrasada(os)?"#FFF7F7":i%2===0?"#fff":"#FAFAFA", cursor:"pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background="#F5F3FF"}
                    onMouseLeave={e => e.currentTarget.style.background=isAtrasada(os)?"#FFF7F7":i%2===0?"#fff":"#FAFAFA"}
                  >
                    <td style={{ padding:"12px 16px", fontWeight:700, color:"#7C3AED" }}>#{os.numero_os}</td>
                    <td style={{ padding:"12px 16px" }}>{os.clientes?.nome||"—"}</td>
                    <td style={{ padding:"12px 16px", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{os.titulo}</td>
                    <td style={{ padding:"12px 16px" }}><StatusBadge status={os.status}/></td>
                    <td style={{ padding:"12px 16px" }}><PrioridadeBadge prioridade={os.prioridade}/></td>
                    <td style={{ padding:"12px 16px", color:isAtrasada(os)?"#DC2626":"#374151", fontWeight:isAtrasada(os)?700:400 }}>
                      {fmtDate(os.data_entrega_prevista)}
                      {isAtrasada(os) && <span style={{ display:"block", fontSize:10, color:"#DC2626" }}>⚠ ATRASADA</span>}
                      {isHoje(os) && !isAtrasada(os) && <span style={{ display:"block", fontSize:10, color:"#D97706" }}>📅 HOJE</span>}
                    </td>
                    <td style={{ padding:"12px 16px", fontWeight:600 }}>{fmt(os.valor_total)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficos de Volume por Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>

        {/* Gráfico de barras horizontal — OS por Status */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#111827" }}>Volume por Status</h3>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = stats[key] || 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: cfg.text }}>{cfg.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{count}</span>
                </div>
                <div style={{ height: 10, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: cfg.border, borderRadius: 99, transition: "width 0.8s ease", minWidth: count > 0 ? 4 : 0 }} />
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{pct.toFixed(0)}% do total</div>
              </div>
            );
          })}
        </div>

        {/* Gráfico de rosca — SVG puro */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#111827" }}>Distribuição Visual</h3>
          {(() => {
            const statusComDados = Object.entries(STATUS_CONFIG)
              .map(([key, cfg]) => ({ key, cfg, count: stats[key] || 0 }))
              .filter(x => x.count > 0);
            const total = statusComDados.reduce((s, x) => s + x.count, 0);

            if (total === 0) return (
              <div style={{ textAlign: "center", color: "#9CA3AF", padding: "40px 0" }}>
                <p>Nenhuma OS cadastrada</p>
              </div>
            );

            // Build SVG donut
            const cx = 100, cy = 100, r = 70, innerR = 42;
            const circumference = 2 * Math.PI * r;
            let offset = 0;
            const slices = statusComDados.map(({ key, cfg, count }) => {
              const pct = count / total;
              const dash = pct * circumference;
              const slice = { key, cfg, count, dash, offset, pct };
              offset += dash;
              return slice;
            });

            return (
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <svg width={200} height={200} viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
                  {slices.map(({ key, cfg, dash, offset: off }) => (
                    <circle
                      key={key}
                      cx={cx} cy={cy} r={r}
                      fill="none"
                      stroke={cfg.border}
                      strokeWidth={28}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-off + circumference * 0.25}
                      style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />
                  ))}
                  <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
                  <text x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight={800} fill="#111827">{total}</text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="#6B7280">OS total</text>
                </svg>
                <div style={{ flex: 1 }}>
                  {slices.map(({ key, cfg, count, pct }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}
                      onClick={() => abrirFiltro(`OS — ${cfg.label}`, o => o.status === key)}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.border, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, flex: 1, color: "#374151" }}>{cfg.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.text }}>{count}</span>
                      <span style={{ fontSize: 11, color: "#9CA3AF", minWidth: 32, textAlign: "right" }}>{(pct * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modais */}
      {modalFiltro && (
        <OSListModal title={modalFiltro.title} ordens={modalFiltro.ordens} onClose={() => setModalFiltro(null)} />
      )}
      {ultimaOS && (
        <Modal title={`O.S. #${ultimaOS.numero_os} — ${ultimaOS.titulo}`} onClose={() => setUltimaOS(null)} size="lg">
          <OSDetalhe os={ultimaOS} onClose={() => setUltimaOS(null)} />
        </Modal>
      )}
    </div>
  );
}
