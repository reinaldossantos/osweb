import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Modal, FormField, StatusBadge, PrioridadeBadge } from "../components/components";
import { STATUS_CONFIG, PRIORIDADE_CONFIG, fmt, fmtDate, fmtDateTime, isAtrasada, isHoje, inputStyle, btnPrimary, btnSecondary, btnDanger } from "../constants/constants";
import { Plus, Search, Eye, Trash2, Layers, CheckSquare, Square } from "lucide-react";

// ─── NOVA OS FORM ─────────────────────────────────────────────
export function NovaOS({ onSaved }) {
  const { usuario } = useAuth();
  const [form, setForm] = useState({
    titulo: "", descricao: "", cliente_id: "", tipo_os_id: "",
    servico_id: "", forma_pagamento_id: "", status: "aguardando",
    prioridade: "normal", data_entrega_prevista: "", valor_total: "",
    observacoes_internas: "",
  });
  const [etapasDisponiveis, setEtapasDisponiveis] = useState([]);
  const [etapasSelecionadas, setEtapasSelecionadas] = useState([]);
  const [itens, setItens] = useState([]);
  const [refs, setRefs] = useState({ clientes: [], tipos: [], servicos: [], pagamentos: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadRefs(); }, []);

  const loadRefs = async () => {
    const [{ data: clientes }, { data: tipos }, { data: servicos }, { data: pagamentos }] = await Promise.all([
      supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("tipos_os").select("id, codigo, nome").eq("ativo", true).order("codigo"),
      supabase.from("servicos").select("id, nome, valor_base").eq("ativo", true).order("nome"),
      supabase.from("formas_pagamento").select("id, nome").eq("ativo", true).order("nome"),
    ]);
    setRefs({ clientes: clientes || [], tipos: tipos || [], servicos: servicos || [], pagamentos: pagamentos || [] });
  };

  const handleServicoChange = async (servicoId) => {
    setForm(f => ({ ...f, servico_id: servicoId }));
    if (!servicoId) { setEtapasDisponiveis([]); return; }
    const { data } = await supabase.from("etapas_servico").select("*").eq("servico_id", servicoId).eq("ativo", true).order("ordem");
    setEtapasDisponiveis(data || []);
    setEtapasSelecionadas((data || []).map(e => e.id));
  };

  const toggleEtapa = (id) => setEtapasSelecionadas(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const addItem = () => setItens(prev => [...prev, { servico_id: "", descricao: "", quantidade: 1, valor_unitario: 0 }]);

  const updateItem = (i, field, value) => {
    setItens(prev => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [field]: value };
      if (field === "servico_id" && value) {
        const svc = refs.servicos.find(s => s.id === value);
        if (svc) { arr[i].descricao = svc.nome; arr[i].valor_unitario = svc.valor_base; }
      }
      const total = arr.reduce((s, it) => s + (parseFloat(it.quantidade) || 0) * (parseFloat(it.valor_unitario) || 0), 0);
      setForm(f => ({ ...f, valor_total: total.toFixed(2) }));
      return arr;
    });
  };

  const removeItem = (i) => {
    const newItens = itens.filter((_, idx) => idx !== i);
    setItens(newItens);
    const total = newItens.reduce((s, it) => s + (parseFloat(it.quantidade) || 0) * (parseFloat(it.valor_unitario) || 0), 0);
    setForm(f => ({ ...f, valor_total: total.toFixed(2) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id) { toast.error("Selecione um cliente"); return; }
    setLoading(true);
    try {
      const { data: os, error } = await supabase.from("ordens_servico")
        .insert({ ...form, usuario_lancamento_id: usuario.id, valor_total: parseFloat(form.valor_total) || 0 })
        .select().single();
      if (error) throw error;

      if (etapasSelecionadas.length > 0) {
        const etapasParaInserir = etapasDisponiveis
          .filter(e => etapasSelecionadas.includes(e.id))
          .map(e => ({ os_id: os.id, etapa_id: e.id, nome_etapa: e.nome, ordem: e.ordem }));
        await supabase.from("os_etapas").insert(etapasParaInserir);
      }
      if (itens.length > 0) {
        await supabase.from("os_itens").insert(itens.map(it => ({ ...it, os_id: os.id })));
      }
      await supabase.from("os_historico").insert({ os_id: os.id, usuario_id: usuario.id, tipo_evento: "criada", descricao: "OS criada" });

      toast.success(`O.S. #${os.numero_os} criada com sucesso!`);
      onSaved && onSaved(os);
    } catch (err) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sel = { ...inputStyle, appearance: "none" };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 1 }}>Dados da O.S.</h3>
          <FormField label="Título" required>
            <input style={inputStyle} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Descreva brevemente o serviço" required />
          </FormField>
          <FormField label="Cliente" required>
            <select style={sel} value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} required>
              <option value="">Selecione o cliente...</option>
              {refs.clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Tipo de O.S.">
              <select style={sel} value={form.tipo_os_id} onChange={e => setForm({ ...form, tipo_os_id: e.target.value })}>
                <option value="">Selecione...</option>
                {refs.tipos.map(t => <option key={t.id} value={t.id}>[{t.codigo}] {t.nome}</option>)}
              </select>
            </FormField>
            <FormField label="Forma de Pagamento">
              <select style={sel} value={form.forma_pagamento_id} onChange={e => setForm({ ...form, forma_pagamento_id: e.target.value })}>
                <option value="">Selecione...</option>
                {refs.pagamentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Status">
              <select style={sel} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
            <FormField label="Prioridade">
              <select style={sel} value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>
                {Object.entries(PRIORIDADE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Data de Entrega Prevista">
            <input type="date" style={inputStyle} value={form.data_entrega_prevista} onChange={e => setForm({ ...form, data_entrega_prevista: e.target.value })} />
          </FormField>
          <FormField label="Descrição">
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes do serviço..." />
          </FormField>
          <FormField label="Observações Internas">
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", background: "#FFFBEB" }} value={form.observacoes_internas} onChange={e => setForm({ ...form, observacoes_internas: e.target.value })} placeholder="Notas internas..." />
          </FormField>
        </div>
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 1 }}>Serviço e Etapas</h3>
          <FormField label="Serviço Base">
            <select style={sel} value={form.servico_id} onChange={e => handleServicoChange(e.target.value)}>
              <option value="">Selecione o serviço...</option>
              {refs.servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </FormField>
          {etapasDisponiveis.length > 0 && (
            <div style={{ background: "#F5F3FF", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #DDD6FE" }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#5B21B6" }}>
                <Layers size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Etapas do Serviço
              </p>
              {etapasDisponiveis.map((e, i) => (
                <label key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                  <div onClick={() => toggleEtapa(e.id)} style={{ cursor: "pointer" }}>
                    {etapasSelecionadas.includes(e.id) ? <CheckSquare size={18} color="#5B21B6" /> : <Square size={18} color="#9CA3AF" />}
                  </div>
                  <span style={{ fontSize: 13, color: "#374151" }}>{i + 1}. {e.nome}</span>
                  {e.duracao_estimada_horas && <span style={{ fontSize: 11, color: "#6B7280", marginLeft: "auto" }}>{e.duracao_estimada_horas}h</span>}
                </label>
              ))}
            </div>
          )}
          <h3 style={{ margin: "16px 0 12px", fontSize: 14, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 1 }}>Itens / Produtos</h3>
          {itens.map((item, i) => (
            <div key={i} style={{ background: "#F9FAFB", borderRadius: 8, padding: 12, marginBottom: 8, border: "1px solid #E5E7EB" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                <input style={{ ...inputStyle, fontSize: 12 }} value={item.descricao} onChange={e => updateItem(i, "descricao", e.target.value)} placeholder="Descrição" />
                <input type="number" style={{ ...inputStyle, fontSize: 12 }} value={item.quantidade} onChange={e => updateItem(i, "quantidade", e.target.value)} placeholder="Qtd" min="0.001" step="0.001" />
                <input type="number" style={{ ...inputStyle, fontSize: 12 }} value={item.valor_unitario} onChange={e => updateItem(i, "valor_unitario", e.target.value)} placeholder="Valor unit." min="0" step="0.01" />
                <button type="button" onClick={() => removeItem(i)} style={{ ...btnDanger, padding: "6px 8px" }}><Trash2 size={13} /></button>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                Subtotal: {fmt((item.quantidade || 0) * (item.valor_unitario || 0))}
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} style={{ ...btnSecondary, fontSize: 12, marginBottom: 16 }}>
            <Plus size={13} /> Adicionar Item
          </button>
          <FormField label="Valor Total (R$)">
            <input type="number" style={{ ...inputStyle, fontWeight: 700, fontSize: 16 }} value={form.valor_total} onChange={e => setForm({ ...form, valor_total: e.target.value })} placeholder="0,00" min="0" step="0.01" />
          </FormField>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20, marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={loading} style={{ ...btnPrimary, padding: "12px 28px" }}>
          {loading ? "Salvando..." : "Criar Ordem de Serviço"}
        </button>
      </div>
    </form>
  );
}

// ─── OS DETALHE ───────────────────────────────────────────────
export function OSDetalhe({ os, onClose }) {
  const { usuario } = useAuth();
  const [etapas, setEtapas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [itens, setItens] = useState([]);
  const [status, setStatus] = useState(os.status);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadDetalhes(); }, []);

  const loadDetalhes = async () => {
    const [{ data: et }, { data: hist }, { data: it }] = await Promise.all([
      supabase.from("os_etapas").select("*").eq("os_id", os.id).order("ordem"),
      supabase.from("os_historico").select("*, usuarios(funcionarios(nome))").eq("os_id", os.id).order("created_at", { ascending: false }),
      supabase.from("os_itens").select("*").eq("os_id", os.id),
    ]);
    setEtapas(et || []);
    setHistorico(hist || []);
    setItens(it || []);
  };

  const toggleEtapa = async (etapa) => {
    const concluida = !etapa.concluida;
    await supabase.from("os_etapas").update({ concluida, data_conclusao: concluida ? new Date().toISOString() : null }).eq("id", etapa.id);
    loadDetalhes();
  };

  const salvarStatus = async () => {
    if (status === os.status) { toast("Status não foi alterado."); return; }
    setLoading(true);
    try {
      // 1. Atualiza o status da OS
      const { error } = await supabase
        .from("ordens_servico")
        .update({ status, ...(status === "concluida" ? { data_conclusao: new Date().toISOString() } : {}) })
        .eq("id", os.id);

      if (error) throw error;

      // 2. Registra no histórico com usuário e detalhes completos
      const statusAnterior = STATUS_CONFIG[os.status]?.label || os.status;
      const statusNovo     = STATUS_CONFIG[status]?.label     || status;

      await supabase.from("os_historico").insert({
        os_id:         os.id,
        usuario_id:    usuario?.id || null,
        tipo_evento:   "status_alterado",
        descricao:     `Status alterado: ${statusAnterior} → ${statusNovo}`,
        valor_anterior: os.status,
        valor_novo:     status,
      });

      toast.success(`Status atualizado para "${statusNovo}"!`);
      onClose();
    } catch (err) {
      toast.error("Erro ao atualizar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div>
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Informações</h4>
          {[["Lançamento", fmtDateTime(os.data_lancamento)], ["Entrega", fmtDate(os.data_entrega_prevista)], ["Cliente", os.clientes?.nome], ["Lançado por", os.usuarios?.funcionarios?.nome || "—"], ["Valor", fmt(os.valor_total)]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, minWidth: 100 }}>{l}</span>
              <span style={{ fontSize: 13, color: "#111827" }}>{v || "—"}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Alterar Status</h4>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={salvarStatus} disabled={loading} style={btnPrimary}>{loading ? "..." : "Salvar"}</button>
          </div>
          <StatusBadge status={os.status} size="lg" />
          {os.descricao && <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 12, marginTop: 12 }}><p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{os.descricao}</p></div>}
        </div>
      </div>

      {itens.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Itens</h4>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#F9FAFB" }}>{["Descrição","Qtd","Valor Unit.","Subtotal"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{h}</th>)}</tr></thead>
            <tbody>{itens.map(it => <tr key={it.id} style={{ borderTop: "1px solid #F3F4F6" }}><td style={{ padding: "8px 12px" }}>{it.descricao}</td><td style={{ padding: "8px 12px" }}>{it.quantidade}</td><td style={{ padding: "8px 12px" }}>{fmt(it.valor_unitario)}</td><td style={{ padding: "8px 12px", fontWeight: 600 }}>{fmt(it.valor_total)}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {etapas.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Etapas</h4>
          {etapas.map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, marginBottom: 6, background: e.concluida ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${e.concluida ? "#86EFAC" : "#E5E7EB"}` }}>
              <button onClick={() => toggleEtapa(e)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                {e.concluida ? <CheckSquare size={18} color="#16A34A" /> : <Square size={18} color="#9CA3AF" />}
              </button>
              <span style={{ fontSize: 13, flex: 1, textDecoration: e.concluida ? "line-through" : "none", color: e.concluida ? "#6B7280" : "#374151" }}>{i + 1}. {e.nome_etapa}</span>
              {e.concluida && <span style={{ fontSize: 11, color: "#16A34A" }}>{fmtDate(e.data_conclusao)}</span>}
            </div>
          ))}
        </div>
      )}

      {historico.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Histórico de Alterações</h4>
          {historico.map(h => (
            <div key={h.id} style={{ display: "flex", gap: 10, padding: "10px 12px", marginBottom: 4, borderRadius: 8, background: "#F9FAFB", border: "1px solid #F3F4F6", fontSize: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ color: "#6B7280", whiteSpace: "nowrap", fontSize: 11 }}>{fmtDateTime(h.created_at)}</div>
                {h.usuarios?.funcionarios?.nome && (
                  <div style={{ color: "#7C3AED", fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                    {h.usuarios.funcionarios.nome}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: "#374151", fontWeight: 500 }}>{h.descricao}</span>
                {h.valor_anterior && h.valor_novo && (
                  <div style={{ marginTop: 3, display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "1px 7px", borderRadius: 10, fontSize: 11 }}>
                      {STATUS_CONFIG[h.valor_anterior]?.label || h.valor_anterior}
                    </span>
                    <span style={{ color: "#9CA3AF", fontSize: 11 }}>→</span>
                    <span style={{ background: "#DCFCE7", color: "#166534", padding: "1px 7px", borderRadius: 10, fontSize: 11 }}>
                      {STATUS_CONFIG[h.valor_novo]?.label || h.valor_novo}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ORDENS DE SERVIÇO (LISTA) ────────────────────────────────
export function OrdensServico() {
  const { usuario } = useAuth();
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ status: "", prioridade: "", busca: "" });
  const [showModal, setShowModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState(null);

  useEffect(() => { loadOrdens(); }, []);

  const loadOrdens = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ordens_servico")
      .select("*, clientes(nome), tipos_os(codigo, nome), usuarios!usuario_lancamento_id(funcionarios(nome))")
      .order("created_at", { ascending: false });
    setOrdens(data || []);
    setLoading(false);
  };

  const filtradas = ordens.filter(os => {
    if (filtros.status && os.status !== filtros.status) return false;
    if (filtros.prioridade && os.prioridade !== filtros.prioridade) return false;
    if (filtros.busca) {
      const q = filtros.busca.toLowerCase();
      if (!os.titulo?.toLowerCase().includes(q) && !String(os.numero_os).includes(q) && !(os.clientes?.nome || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const updateStatus = async (osItem, novoStatus) => {
    if (novoStatus === osItem.status) return;
    const { error } = await supabase
      .from("ordens_servico")
      .update({ status: novoStatus, ...(novoStatus === "concluida" ? { data_conclusao: new Date().toISOString() } : {}) })
      .eq("id", osItem.id);

    if (!error) {
      const statusAnterior = STATUS_CONFIG[osItem.status]?.label || osItem.status;
      const statusNovo     = STATUS_CONFIG[novoStatus]?.label    || novoStatus;
      await supabase.from("os_historico").insert({
        os_id:         osItem.id,
        usuario_id:    usuario?.id || null,
        tipo_evento:   "status_alterado",
        descricao:     `Status alterado: ${statusAnterior} → ${statusNovo}`,
        valor_anterior: osItem.status,
        valor_novo:     novoStatus,
      });
      toast.success(`Status → "${statusNovo}"`);
      loadOrdens();
    } else {
      toast.error("Erro: " + error.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111827" }}>Ordens de Serviço</h1>
        <button onClick={() => setShowModal(true)} style={btnPrimary}><Plus size={16} /> Nova O.S.</button>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #E5E7EB", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Buscar por nº, cliente, título..." value={filtros.busca} onChange={e => setFiltros({ ...filtros, busca: e.target.value })} />
        </div>
        <select style={{ ...inputStyle, width: 160 }} value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={{ ...inputStyle, width: 140 }} value={filtros.prioridade} onChange={e => setFiltros({ ...filtros, prioridade: e.target.value })}>
          <option value="">Todas prioridades</option>
          {Object.entries(PRIORIDADE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: 13, color: "#6B7280" }}>{filtradas.length} registros</span>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                {["Nº", "Data", "Cliente", "Título", "Tipo", "Status", "Prioridade", "Entrega", "Valor", "Lançado por", "Ações"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Carregando...</td></tr>
                : filtradas.length === 0
                ? <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Nenhuma OS encontrada</td></tr>
                : filtradas.map((os, i) => (
                  <tr key={os.id} style={{ borderTop: "1px solid #F3F4F6", background: isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#7C3AED" }}>#{os.numero_os}</td>
                    <td style={{ padding: "12px 14px", color: "#6B7280", whiteSpace: "nowrap" }}>{fmtDate(os.data_lancamento)}</td>
                    <td style={{ padding: "12px 14px" }}>{os.clientes?.nome || "—"}</td>
                    <td style={{ padding: "12px 14px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{os.titulo}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {os.tipos_os && <span style={{ background: "#F5F3FF", color: "#7C3AED", padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{os.tipos_os.codigo}</span>}
                    </td>
                    <td style={{ padding: "12px 14px" }}><StatusBadge status={os.status} /></td>
                    <td style={{ padding: "12px 14px" }}><PrioridadeBadge prioridade={os.prioridade} /></td>
                    <td style={{ padding: "12px 14px", color: isAtrasada(os) ? "#DC2626" : "#374151", fontWeight: isAtrasada(os) ? 700 : 400, whiteSpace: "nowrap" }}>
                      {fmtDate(os.data_entrega_prevista)}
                      {isAtrasada(os) && <span style={{ display: "block", fontSize: 10, color: "#DC2626" }}>⚠ ATRASADA</span>}
                      {isHoje(os) && !isAtrasada(os) && <span style={{ display: "block", fontSize: 10, color: "#D97706" }}>📅 HOJE</span>}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(os.valor_total)}</td>
                    <td style={{ padding: "12px 14px", color: "#6B7280", whiteSpace: "nowrap" }}>{os.usuarios?.funcionarios?.nome || "—"}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setSelectedOS(os)} style={{ ...btnSecondary, padding: "5px 8px", fontSize: 11 }}><Eye size={12} /></button>
                        <select value={os.status} onChange={e => updateStatus(os, e.target.value)} style={{ fontSize: 11, padding: "4px 6px", border: "1px solid #D1D5DB", borderRadius: 6, cursor: "pointer", background: "#fff" }}>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <Modal title="Nova Ordem de Serviço" onClose={() => setShowModal(false)} size="xl">
          <NovaOS onSaved={() => { setShowModal(false); loadOrdens(); }} />
        </Modal>
      )}
      {selectedOS && (
        <Modal title={`O.S. #${selectedOS.numero_os} — ${selectedOS.titulo}`} onClose={() => setSelectedOS(null)} size="lg">
          <OSDetalhe os={selectedOS} onClose={() => { setSelectedOS(null); loadOrdens(); }} />
        </Modal>
      )}
    </div>
  );
}
