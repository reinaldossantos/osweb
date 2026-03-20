import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";
import {
  ShieldAlert, Trash2, Database, AlertTriangle,
  CheckCircle2, RefreshCw, ChevronDown, ChevronUp, Info,
} from "lucide-react";

// ─── HELPERS ─────────────────────────────────────────────────
const fmtNum = (n) => new Intl.NumberFormat("pt-BR").format(n);

// ─── CONFIRMATION DIALOG ─────────────────────────────────────
function ConfirmDialog({ item, onConfirm, onCancel }) {
  const [digitado, setDigitado] = useState("");
  const PALAVRA = "CONFIRMAR";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(15,23,42,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480,
        boxShadow: "0 40px 100px rgba(0,0,0,0.4)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: "#FEF2F2", padding: "20px 24px", borderBottom: "2px solid #FCA5A5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#FEE2E2", borderRadius: 10, padding: 8 }}>
              <AlertTriangle size={22} color="#DC2626" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#7F1D1D" }}>Confirmação de Exclusão</div>
              <div style={{ fontSize: 13, color: "#991B1B", marginTop: 2 }}>Esta ação não pode ser desfeita</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px" }}>
          <div style={{ background: "#FFF7F7", border: "1px solid #FCA5A5", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>{item.descricao}</div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {item.contagens?.map(({ label, count }) => (
                <span key={label} style={{ background: "#FEE2E2", color: "#DC2626", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {fmtNum(count)} {label}
                </span>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 14, color: "#374151", marginBottom: 12 }}>
            Para confirmar, digite <strong style={{ color: "#DC2626" }}>{PALAVRA}</strong> abaixo:
          </p>
          <input
            value={digitado}
            onChange={e => setDigitado(e.target.value.toUpperCase())}
            placeholder={`Digite ${PALAVRA}`}
            style={{
              width: "100%", padding: "11px 14px", border: `2px solid ${digitado === PALAVRA ? "#16A34A" : "#E5E7EB"}`,
              borderRadius: 10, fontSize: 14, fontWeight: 600, outline: "none",
              color: "#0F172A", boxSizing: "border-box", letterSpacing: 1,
              transition: "border-color 0.2s",
            }}
          />
          {digitado === PALAVRA && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: "#16A34A", fontSize: 12 }}>
              <CheckCircle2 size={14} /> Confirmação válida
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel}
            style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={digitado !== PALAVRA}
            style={{
              background: digitado === PALAVRA ? "#DC2626" : "#FCA5A5",
              color: "#fff", border: "none", padding: "10px 22px",
              borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: digitado === PALAVRA ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 8,
              transition: "background 0.2s",
            }}>
            <Trash2 size={15} /> Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CARD DE OPERAÇÃO ─────────────────────────────────────────
function OperacaoCard({ op, onExecutar }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: `1px solid ${op.borderColor || "#E5E7EB"}`,
      overflow: "hidden", marginBottom: 14,
    }}>
      {/* Header */}
      <div
        onClick={() => setExpandido(!expandido)}
        style={{
          padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
          cursor: "pointer", background: op.bgColor || "#fff",
          transition: "background 0.1s",
        }}
      >
        <div style={{ background: op.iconBg, borderRadius: 10, padding: 9, flexShrink: 0 }}>
          <op.Icon size={20} color={op.iconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{op.label}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{op.resumo}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {op.contagens?.map(({ label, count, cor }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: cor || "#DC2626" }}>{fmtNum(count)}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
          {expandido ? <ChevronUp size={18} color="#9CA3AF" /> : <ChevronDown size={18} color="#9CA3AF" />}
        </div>
      </div>

      {/* Expandido */}
      {expandido && (
        <div style={{ padding: "16px 20px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Info size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: "#92400E" }}>
                <strong>O que será excluído:</strong> {op.detalhe}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => onExecutar(op)}
              disabled={op.contagens?.every(c => c.count === 0)}
              style={{
                background: op.contagens?.every(c => c.count === 0) ? "#F3F4F6" : "#DC2626",
                color: op.contagens?.every(c => c.count === 0) ? "#9CA3AF" : "#fff",
                border: "none", padding: "10px 20px", borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: op.contagens?.every(c => c.count === 0) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
              <Trash2 size={15} />
              {op.contagens?.every(c => c.count === 0) ? "Nenhum registro" : `Excluir ${op.btnLabel}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────
export default function Manutencao() {
  const [contagens, setContagens] = useState({});
  const [loading, setLoading]   = useState(true);
  const [confirmOp, setConfirmOp] = useState(null);
  const [executando, setExecutando] = useState(false);
  const [log, setLog] = useState([]);

  useEffect(() => { loadContagens(); }, []);

  const addLog = (msg, tipo = "ok") => {
    const hora = new Date().toLocaleTimeString("pt-BR");
    setLog(prev => [{ msg, tipo, hora }, ...prev.slice(0, 19)]);
  };

  const loadContagens = async () => {
    setLoading(true);
    try {
      const queries = await Promise.all([
        supabase.from("ordens_servico").select("id", { count: "exact", head: true }),
        supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("status", "concluida"),
        supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("status", "cancelada"),
        supabase.from("os_historico").select("id", { count: "exact", head: true }),
        supabase.from("os_itens").select("id", { count: "exact", head: true }),
        supabase.from("os_etapas").select("id", { count: "exact", head: true }),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("funcionarios").select("id", { count: "exact", head: true }),
        supabase.from("tipos_os").select("id", { count: "exact", head: true }),
      ]);
      setContagens({
        total_os:        queries[0].count || 0,
        os_concluidas:   queries[1].count || 0,
        os_canceladas:   queries[2].count || 0,
        historico:       queries[3].count || 0,
        itens:           queries[4].count || 0,
        etapas:          queries[5].count || 0,
        clientes:        queries[6].count || 0,
        funcionarios:    queries[7].count || 0,
        tipos_os:        queries[8].count || 0,
      });
    } catch (err) {
      toast.error("Erro ao carregar contagens: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Operações disponíveis ────────────────────────────────────
  const operacoes = [
    {
      id: "reset_total",
      label: "Reset Completo — Apagar TUDO",
      resumo: "Remove todas as OS, históricos, itens, etapas e clientes. Mantém usuários, funcionários e cadastros auxiliares.",
      detalhe: "Serão removidos: todas as ordens de serviço (independente do status), todo o histórico de alterações, todos os itens, todas as etapas ancoradas, e todos os clientes. Usuários, funcionários, cargos, tipos de OS, formas de pagamento e serviços serão MANTIDOS.",
      Icon: ShieldAlert, iconBg: "#FEF2F2", iconColor: "#DC2626",
      bgColor: "#FFF7F7", borderColor: "#FCA5A5",
      btnLabel: "tudo",
      contagens: [
        { label: "OS",        count: contagens.total_os   || 0, cor: "#DC2626" },
        { label: "Histórico", count: contagens.historico  || 0, cor: "#DC2626" },
        { label: "Clientes",  count: contagens.clientes   || 0, cor: "#DC2626" },
      ],
      executar: async () => {
        await supabase.from("os_historico").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("os_itens").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("os_etapas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("ordens_servico").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("clientes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        addLog("Reset completo executado — OS, histórico e clientes removidos.", "ok");
      },
    },
    {
      id: "apagar_os_concluidas",
      label: "Apagar OS Concluídas",
      resumo: "Remove apenas as ordens de serviço com status Concluída e seus dados relacionados.",
      detalhe: "Serão removidos: OS com status 'Concluída', histórico dessas OS, itens e etapas vinculados. OS em outros status não serão afetadas.",
      Icon: Trash2, iconBg: "#DCFCE7", iconColor: "#16A34A",
      bgColor: "#F0FDF4", borderColor: "#86EFAC",
      btnLabel: "OS concluídas",
      contagens: [
        { label: "Concluídas", count: contagens.os_concluidas || 0, cor: "#16A34A" },
      ],
      executar: async () => {
        const { data: ids } = await supabase.from("ordens_servico").select("id").eq("status", "concluida");
        if (!ids?.length) return;
        const osIds = ids.map(r => r.id);
        await supabase.from("os_historico").delete().in("os_id", osIds);
        await supabase.from("os_itens").delete().in("os_id", osIds);
        await supabase.from("os_etapas").delete().in("os_id", osIds);
        await supabase.from("ordens_servico").delete().in("id", osIds);
        addLog(`${osIds.length} OS concluídas e dados relacionados removidos.`, "ok");
      },
    },
    {
      id: "apagar_os_canceladas",
      label: "Apagar OS Canceladas",
      resumo: "Remove apenas as ordens de serviço com status Cancelada e seus dados relacionados.",
      detalhe: "Serão removidos: OS com status 'Cancelada', histórico dessas OS, itens e etapas vinculados.",
      Icon: Trash2, iconBg: "#FEE2E2", iconColor: "#EF4444",
      bgColor: "#FFF7F7", borderColor: "#FCA5A5",
      btnLabel: "OS canceladas",
      contagens: [
        { label: "Canceladas", count: contagens.os_canceladas || 0, cor: "#EF4444" },
      ],
      executar: async () => {
        const { data: ids } = await supabase.from("ordens_servico").select("id").eq("status", "cancelada");
        if (!ids?.length) return;
        const osIds = ids.map(r => r.id);
        await supabase.from("os_historico").delete().in("os_id", osIds);
        await supabase.from("os_itens").delete().in("os_id", osIds);
        await supabase.from("os_etapas").delete().in("os_id", osIds);
        await supabase.from("ordens_servico").delete().in("id", osIds);
        addLog(`${osIds.length} OS canceladas e dados relacionados removidos.`, "ok");
      },
    },
    {
      id: "limpar_historico",
      label: "Limpar Histórico de Alterações",
      resumo: "Remove todos os registros do histórico de alterações. As OS continuam intactas.",
      detalhe: "Apenas os registros da tabela 'os_historico' serão removidos. Nenhuma OS, item ou etapa será afetado. O histórico começará a ser registrado novamente do zero após a limpeza.",
      Icon: Database, iconBg: "#F5F3FF", iconColor: "#7C3AED",
      bgColor: "#FAFAFA", borderColor: "#DDD6FE",
      btnLabel: "histórico",
      contagens: [
        { label: "Histórico", count: contagens.historico || 0, cor: "#7C3AED" },
      ],
      executar: async () => {
        await supabase.from("os_historico").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        addLog(`Histórico de alterações limpo.`, "ok");
      },
    },
    {
      id: "apagar_clientes",
      label: "Apagar Clientes sem OS",
      resumo: "Remove clientes que não possuem nenhuma ordem de serviço vinculada.",
      detalhe: "Apenas clientes sem nenhuma OS serão removidos. Clientes com OS ativas, concluídas ou canceladas serão mantidos.",
      Icon: Trash2, iconBg: "#FEF3C7", iconColor: "#D97706",
      bgColor: "#FFFBEB", borderColor: "#FDE68A",
      btnLabel: "clientes sem OS",
      contagens: [
        { label: "Clientes total", count: contagens.clientes || 0, cor: "#D97706" },
      ],
      executar: async () => {
        const { data: comOS } = await supabase.from("ordens_servico").select("cliente_id");
        const idsComOS = [...new Set((comOS||[]).map(r => r.cliente_id).filter(Boolean))];
        let query = supabase.from("clientes").delete();
        if (idsComOS.length > 0) {
          query = query.not("id", "in", `(${idsComOS.join(",")})`);
        } else {
          query = query.neq("id", "00000000-0000-0000-0000-000000000000");
        }
        addLog(`Clientes sem OS removidos.`, "ok");
      },
    },
    {
      id: "apagar_todos_clientes",
      label: "Apagar TODOS os Clientes",
      resumo: "Remove todos os clientes cadastrados, independente de terem OS vinculadas ou não.",
      detalhe: "ATENÇÃO: todos os clientes serão removidos. As OS vinculadas a eles terão o campo cliente em branco. Recomendado apenas para reset completo de ambiente de testes.",
      Icon: Trash2, iconBg: "#FFEDD5", iconColor: "#EA580C",
      bgColor: "#FFF7ED", borderColor: "#FED7AA",
      btnLabel: "todos os clientes",
      contagens: [
        { label: "Clientes", count: contagens.clientes || 0, cor: "#EA580C" },
      ],
      executar: async () => {
        // Desvincula clientes das OS antes de deletar
        await supabase.from("ordens_servico")
          .update({ cliente_id: null })
          .neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("clientes")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        addLog(`Todos os clientes removidos.`, "ok");
      },
    },
    {
      id: "apagar_tipos_os",
      label: "Apagar Todos os Tipos de O.S.",
      resumo: "Remove todos os tipos de OS cadastrados (ACM, BANNER, LONA, etc.).",
      detalhe: "Todos os tipos de OS serão removidos. As OS que usam esses tipos terão o campo 'Tipo' em branco, mas as OS em si NÃO serão removidas. Serviços e etapas também não serão afetados.",
      Icon: Trash2, iconBg: "#EDE9FE", iconColor: "#7C3AED",
      bgColor: "#F5F3FF", borderColor: "#DDD6FE",
      btnLabel: "tipos de OS",
      contagens: [
        { label: "Tipos de OS", count: contagens.tipos_os || 0, cor: "#7C3AED" },
      ],
      executar: async () => {
        // Desvincula tipos das OS antes de deletar
        await supabase.from("ordens_servico")
          .update({ tipo_os_id: null })
          .neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("tipos_os")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        addLog(`Todos os tipos de OS removidos.`, "ok");
      },
    },
  ];

  const executarOperacao = async (op) => {
    setConfirmOp(null);
    setExecutando(true);
    try {
      await op.executar();
      toast.success(`✅ "${op.label}" concluído!`);
      await loadContagens();
    } catch (err) {
      toast.error("❌ Erro: " + err.message);
      addLog("Erro: " + err.message, "erro");
    } finally {
      setExecutando(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#FEF2F2", borderRadius: 12, padding: 10 }}>
            <ShieldAlert size={22} color="#DC2626" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0F172A" }}>Manutenção do Banco</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>Exclusivo para administradores · Use com cautela</p>
          </div>
        </div>
        <button onClick={loadContagens} disabled={loading}
          style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB", padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Atualizar contagens
        </button>
      </div>

      {/* Alerta */}
      <div style={{ background: "#FEF2F2", border: "2px solid #FCA5A5", borderRadius: 14, padding: "16px 20px", marginBottom: 28, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#7F1D1D", marginBottom: 4 }}>
            ⚠️ Zona de perigo — Ações irreversíveis
          </div>
          <div style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.6 }}>
            As operações desta página <strong>não podem ser desfeitas</strong>. Recomendamos exportar um backup dos dados antes de qualquer exclusão.
            Para confirmar cada operação será necessário digitar <strong>CONFIRMAR</strong>.
          </div>
        </div>
      </div>

      {/* Painel de contagens */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
        {loading ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#9CA3AF", padding: 20 }}>Carregando...</div>
        ) : [
          { label: "Total OS",    value: contagens.total_os,     color: "#7C3AED" },
          { label: "Concluídas",  value: contagens.os_concluidas, color: "#16A34A" },
          { label: "Canceladas",  value: contagens.os_canceladas, color: "#EF4444" },
          { label: "Histórico",   value: contagens.historico,    color: "#7C3AED" },
          { label: "Itens",       value: contagens.itens,        color: "#D97706" },
          { label: "Etapas OS",   value: contagens.etapas,       color: "#0EA5E9" },
          { label: "Clientes",    value: contagens.clientes,     color: "#059669" },
          { label: "Tipos de OS", value: contagens.tipos_os,     color: "#8B5CF6" },
          { label: "Funcionários",value: contagens.funcionarios, color: "#6B7280" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #E5E7EB", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color }}>{fmtNum(value || 0)}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Operações */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#374151", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>
        Selecione o que deseja excluir
      </h2>
      {operacoes.map(op => (
        <OperacaoCard key={op.id} op={op} onExecutar={op => setConfirmOp(op)} />
      ))}

      {/* Log de ações */}
      {log.length > 0 && (
        <div style={{ background: "#0F172A", borderRadius: 14, padding: 20, marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            📋 Log de operações desta sessão
          </div>
          {log.map((entry, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < log.length - 1 ? "1px solid #1E293B" : "none" }}>
              <span style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>{entry.hora}</span>
              <span style={{ fontSize: 13, color: entry.tipo === "erro" ? "#F87171" : "#86EFAC" }}>{entry.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmação */}
      {confirmOp && (
        <ConfirmDialog
          item={{ label: confirmOp.label, descricao: confirmOp.detalhe, contagens: confirmOp.contagens }}
          onConfirm={() => executarOperacao(confirmOp)}
          onCancel={() => setConfirmOp(null)}
        />
      )}

      {/* Overlay carregando */}
      {executando && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1E293B", borderRadius: 16, padding: "28px 36px", textAlign: "center", border: "1px solid #334155" }}>
            <RefreshCw size={32} color="#7C3AED" style={{ marginBottom: 14 }} />
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Executando operação...</div>
            <div style={{ color: "#64748B", fontSize: 13, marginTop: 6 }}>Aguarde, não feche esta página</div>
          </div>
        </div>
      )}
    </div>
  );
}
