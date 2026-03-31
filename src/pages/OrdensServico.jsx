import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Modal, FormField, StatusBadge, PrioridadeBadge } from "../components/components";
import { STATUS_CONFIG, PRIORIDADE_CONFIG, fmt, fmtDate, fmtDateTime, isAtrasada, isHoje, inputStyle, btnPrimary, btnSecondary, btnDanger } from "../constants/constants";
import { Plus, Search, Eye, Edit2, Layers, CheckSquare, Square, Trash2 } from "lucide-react";
import { ESTADOS } from "../constants/estadosCidades";

// ─── HELPER ──────────────────────────────────────────────────
const uuidOuNull = (v) => (v && String(v).trim() !== "" ? v : null);

// ─── NOVA OS FORM ─────────────────────────────────────────────
export function NovaOS({ onSaved }) {
  const { usuario } = useAuth();
  const [form, setForm] = useState({
    titulo: "", descricao: "", observacoes_internas: "",
    cliente_id: "", tipo_os_id: "", servico_id: "", forma_pagamento_id: "",
    status: "em_aberto", prioridade: "normal",
    data_entrega_prevista: "", valor_total: "",
    numero_os_externo: "", cidade: "", estado: "",
    desconto_valor: "", desconto_percentual: "",
  });
  const [touched, setTouched] = useState({});
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

  // ── Itens — sem setState aninhado ────────────────────────────
  const addItem = () => {
    setItens(prev => [...prev, { servico_id: "", descricao: "", quantidade: 1, valor_unitario: 0 }]);
  };

  const removeItem = (idx) => {
    setItens(prev => {
      const next = prev.filter((_, i) => i !== idx);
      const total = next.reduce((s, it) => s + (parseFloat(it.quantidade) || 0) * (parseFloat(it.valor_unitario) || 0), 0);
      setForm(f => ({ ...f, valor_total: total.toFixed(2) }));
      return next;
    });
  };

  const updateItem = (idx, field, value) => {
    setItens(prev => {
      const next = prev.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, [field]: value };
        if (field === "servico_id" && value) {
          const svc = refs.servicos.find(s => s.id === value);
          if (svc) { updated.descricao = svc.nome; updated.valor_unitario = svc.valor_base; }
        }
        return updated;
      });
      const total = next.reduce((s, it) => s + (parseFloat(it.quantidade) || 0) * (parseFloat(it.valor_unitario) || 0), 0);
      // Use functional update to avoid closure stale state
      setTimeout(() => setForm(f => ({ ...f, valor_total: total.toFixed(2) })), 0);
      return next;
    });
  };

  const touch = (field) => setTouched(t => ({ ...t, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ titulo: true, cliente: true });

    if (!form.titulo?.trim()) { toast.error("⚠️ Informe o título da O.S."); return; }
    if (!form.cliente_id)     { toast.error("⚠️ Selecione um cliente."); return; }

    const payload = {
      titulo:               form.titulo.trim(),
      descricao:            form.descricao || null,
      observacoes_internas: form.observacoes_internas || null,
      numero_os_externo:    form.numero_os_externo?.trim() || null,
      cidade:               form.cidade?.trim() || null,
      estado:               form.estado?.trim() || null,
      desconto_valor:       parseFloat(form.desconto_valor) || 0,
      desconto_percentual:  parseFloat(form.desconto_percentual) || 0,
      cliente_id:           form.cliente_id,
      tipo_os_id:           uuidOuNull(form.tipo_os_id),
      servico_id:           uuidOuNull(form.servico_id),
      forma_pagamento_id:   uuidOuNull(form.forma_pagamento_id),
      status:               form.status,
      prioridade:           form.prioridade,
      data_entrega_prevista: form.data_entrega_prevista || null,
      valor_total:          parseFloat(form.valor_total) || 0,
      usuario_lancamento_id: usuario.id,
    };

    setLoading(true);
    try {
      const { data: os, error } = await supabase.from("ordens_servico").insert(payload).select().single();
      if (error) throw error;

      if (etapasSelecionadas.length > 0) {
        const ep = etapasDisponiveis.filter(e => etapasSelecionadas.includes(e.id))
          .map(e => ({ os_id: os.id, etapa_id: e.id, nome_etapa: e.nome, ordem: e.ordem }));
        await supabase.from("os_etapas").insert(ep);
      }
      if (itens.length > 0) {
        await supabase.from("os_itens").insert(itens.map(it => ({
          os_id: os.id,
          servico_id:     uuidOuNull(it.servico_id),
          descricao:      it.descricao,
          quantidade:     parseFloat(it.quantidade) || 1,
          valor_unitario: parseFloat(it.valor_unitario) || 0,
        })));
      }
      await supabase.from("os_historico").insert({ os_id: os.id, usuario_id: usuario.id, tipo_evento: "criada", descricao: "OS criada" });
      toast.success(`✅ O.S. #${os.numero_os} criada com sucesso!`);
      onSaved && onSaved(os);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("uuid"))          toast.error("⚠️ Verifique os campos de seleção e tente novamente.");
      else if (msg.includes("column"))   toast.error("⚠️ Campo inválido. Verifique os dados e tente novamente.");
      else                               toast.error("⚠️ Erro ao criar O.S.: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const sel = { ...inputStyle, appearance: "none" };
  const errStyle = (cond) => ({ ...inputStyle, borderColor: cond ? "#EF4444" : "#D1D5DB" });
  const errSel   = (cond) => ({ ...sel,        borderColor: cond ? "#EF4444" : "#D1D5DB" });

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* ── Coluna esquerda ── */}
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1 }}>Dados da O.S.</h3>

          <FormField label="Título" required>
            <input
              style={errStyle(touched.titulo && !form.titulo?.trim())}
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              onBlur={() => touch("titulo")}
              placeholder="Descreva brevemente o serviço"
            />
          </FormField>

          <FormField label="Cliente" required>
            <select
              style={errSel(touched.cliente && !form.cliente_id)}
              value={form.cliente_id}
              onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
              onBlur={() => touch("cliente")}
            >
              <option value="">Selecione o cliente...</option>
              {refs.clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }}>
            <FormField label="Estado">
              <select style={sel} value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value, cidade: "" }))}>
                <option value="">UF...</option>
                {ESTADOS.map(e => <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>)}
              </select>
            </FormField>
            <FormField label="Cidade">
              <select style={sel} value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}>
                <option value="">Selecione a cidade...</option>
                {(ESTADOS.find(e => e.uf === form.estado)?.cidades || []).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Tipo de O.S.">
              <select style={sel} value={form.tipo_os_id} onChange={e => setForm(f => ({ ...f, tipo_os_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {refs.tipos.map(t => <option key={t.id} value={t.id}>[{t.codigo}] {t.nome}</option>)}
              </select>
            </FormField>
            <FormField label="Forma de Pagamento">
              <select style={sel} value={form.forma_pagamento_id} onChange={e => setForm(f => ({ ...f, forma_pagamento_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {refs.pagamentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </FormField>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Status">
              <select style={sel} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
            <FormField label="Prioridade">
              <select style={sel} value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
                {Object.entries(PRIORIDADE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Data de Entrega Prevista">
            <input type="date" style={inputStyle} value={form.data_entrega_prevista} onChange={e => setForm(f => ({ ...f, data_entrega_prevista: e.target.value }))} />
          </FormField>

          <FormField label="Nº O.S. em Outro Sistema">
            <input
              style={inputStyle}
              value={form.numero_os_externo}
              onChange={e => setForm(f => ({ ...f, numero_os_externo: e.target.value }))}
              placeholder="Ex: OP-2024-001 (para rastreabilidade)"
            />
          </FormField>

          <FormField label="Descrição">
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes do serviço..." />
          </FormField>

          <FormField label="Observações Internas">
            <textarea style={{ ...inputStyle, minHeight: 55, resize: "vertical", background: "#FFFBEB" }} value={form.observacoes_internas} onChange={e => setForm(f => ({ ...f, observacoes_internas: e.target.value }))} placeholder="Notas internas (não visível ao cliente)..." />
          </FormField>
        </div>

        {/* ── Coluna direita ── */}
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1 }}>Serviço e Etapas</h3>

          <FormField label="Serviço Base">
            <select style={sel} value={form.servico_id} onChange={e => handleServicoChange(e.target.value)}>
              <option value="">Selecione o serviço...</option>
              {refs.servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </FormField>

          {etapasDisponiveis.length > 0 && (
            <div style={{ background: "#F5F3FF", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid #DDD6FE" }}>
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#5B21B6" }}>
                <Layers size={13} style={{ verticalAlign: "middle", marginRight: 4 }} /> Etapas do Serviço
              </p>
              {etapasDisponiveis.map((et, i) => (
                <label key={et.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, cursor: "pointer" }}>
                  <div onClick={() => toggleEtapa(et.id)} style={{ cursor: "pointer", flexShrink: 0 }}>
                    {etapasSelecionadas.includes(et.id)
                      ? <CheckSquare size={17} color="#7C3AED" />
                      : <Square size={17} color="#9CA3AF" />}
                  </div>
                  <span style={{ fontSize: 13, color: "#374151" }}>{i + 1}. {et.nome}</span>
                  {et.duracao_estimada_horas && <span style={{ fontSize: 11, color: "#6B7280", marginLeft: "auto" }}>{et.duracao_estimada_horas}h</span>}
                </label>
              ))}
            </div>
          )}

          <h3 style={{ margin: "16px 0 10px", fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1 }}>Itens / Produtos</h3>

          {itens.map((item, i) => (
            <div key={i} style={{ background: "#F9FAFB", borderRadius: 8, padding: 10, marginBottom: 8, border: "1px solid #E5E7EB" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 100px auto", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <input
                  style={{ ...inputStyle, fontSize: 12 }}
                  value={item.descricao}
                  onChange={e => updateItem(i, "descricao", e.target.value)}
                  placeholder="Descrição do item"
                />
                <input
                  type="number" style={{ ...inputStyle, fontSize: 12 }}
                  value={item.quantidade}
                  onChange={e => updateItem(i, "quantidade", e.target.value)}
                  placeholder="Qtd" min="0.001" step="0.001"
                />
                <input
                  type="number" style={{ ...inputStyle, fontSize: 12 }}
                  value={item.valor_unitario}
                  onChange={e => updateItem(i, "valor_unitario", e.target.value)}
                  placeholder="Valor unit." min="0" step="0.01"
                />
                <button type="button" onClick={() => removeItem(i)} style={{ ...btnDanger, padding: "6px 8px" }}>
                  <Trash2 size={13} />
                </button>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "#6B7280" }}>
                Subtotal: {fmt((parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0))}
              </div>
            </div>
          ))}

          <button type="button" onClick={addItem} style={{ ...btnSecondary, fontSize: 12, marginBottom: 14 }}>
            <Plus size={13} /> Adicionar Item
          </button>

          {/* Campos de desconto */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Desconto em R$">
              <input
                type="number"
                style={{ ...inputStyle, borderColor: "#FDE68A" }}
                value={form.desconto_valor}
                onChange={e => {
                  const dv = parseFloat(e.target.value) || 0;
                  const vb = parseFloat(form._valor_bruto || form.valor_total) || 0;
                  const pct = vb > 0 ? ((dv / vb) * 100).toFixed(2) : "";
                  setForm(f => ({ ...f, desconto_valor: e.target.value, desconto_percentual: pct, _valor_bruto: vb || f._valor_bruto, valor_total: Math.max(0, vb - dv).toFixed(2) }));
                }}
                placeholder="0,00" min="0" step="0.01"
              />
            </FormField>
            <FormField label="Desconto em %">
              <input
                type="number"
                style={{ ...inputStyle, borderColor: "#FDE68A" }}
                value={form.desconto_percentual}
                onChange={e => {
                  const pct = parseFloat(e.target.value) || 0;
                  const vb = parseFloat(form._valor_bruto || form.valor_total) || 0;
                  const dv = ((pct / 100) * vb).toFixed(2);
                  setForm(f => ({ ...f, desconto_percentual: e.target.value, desconto_valor: dv, _valor_bruto: vb || f._valor_bruto, valor_total: Math.max(0, vb - parseFloat(dv)).toFixed(2) }));
                }}
                placeholder="0,00" min="0" max="100" step="0.01"
              />
            </FormField>
          </div>

          <FormField label="Valor Total (R$)">
            <input
              type="number"
              style={{ ...inputStyle, fontWeight: 700, fontSize: 15, background: "#F0FDF4", borderColor: "#86EFAC" }}
              value={form.valor_total}
              onChange={e => setForm(f => ({ ...f, valor_total: e.target.value, _valor_bruto: e.target.value, desconto_valor: "", desconto_percentual: "" }))}
              placeholder="0,00" min="0" step="0.01"
            />
          </FormField>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 18, marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button type="submit" disabled={loading} style={{ ...btnPrimary, padding: "12px 28px" }}>
          {loading ? "Salvando..." : "Criar Ordem de Serviço"}
        </button>
      </div>
    </form>
  );
}

// ─── EDITAR OS FORM ──────────────────────────────────────────
export function EditarOS({ os, onSaved, onClose }) {
  const { usuario } = useAuth();
  const [form, setForm] = useState({
    titulo:               os.titulo               || "",
    descricao:            os.descricao            || "",
    observacoes_internas: os.observacoes_internas || "",
    numero_os_externo:    os.numero_os_externo    || "",
    cidade:               os.cidade               || "",
    estado:               os.estado               || "",
    desconto_valor:       os.desconto_valor       || "",
    desconto_percentual:  os.desconto_percentual  || "",
    _valor_bruto:         os.valor_total          || "",
    cliente_id:           os.cliente_id           || "",
    tipo_os_id:           os.tipo_os_id           || "",
    servico_id:           os.servico_id           || "",
    forma_pagamento_id:   os.forma_pagamento_id   || "",
    status:               os.status               || "em_aberto",
    prioridade:           os.prioridade           || "normal",
    data_entrega_prevista: os.data_entrega_prevista ? os.data_entrega_prevista.split("T")[0] : "",
    valor_total:          os.valor_total          || "",
  });
  const [refs, setRefs] = useState({ clientes: [], tipos: [], servicos: [], pagamentos: [] });
  const [loading, setLoading] = useState(false);
  const sel = { ...inputStyle, appearance: "none" };

  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("tipos_os").select("id, codigo, nome").eq("ativo", true).order("codigo"),
      supabase.from("servicos").select("id, nome, valor_base").eq("ativo", true).order("nome"),
      supabase.from("formas_pagamento").select("id, nome").eq("ativo", true).order("nome"),
    ]).then(([{data:c},{data:t},{data:s},{data:p}]) =>
      setRefs({ clientes: c||[], tipos: t||[], servicos: s||[], pagamentos: p||[] })
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo?.trim()) { toast.error("⚠️ Informe o título da O.S."); return; }
    if (!form.cliente_id)     { toast.error("⚠️ Selecione um cliente."); return; }

    const payload = {
      titulo:               form.titulo.trim(),
      descricao:            form.descricao || null,
      observacoes_internas: form.observacoes_internas || null,
      numero_os_externo:    form.numero_os_externo?.trim() || null,
      cidade:               form.cidade?.trim() || null,
      estado:               form.estado?.trim() || null,
      desconto_valor:       parseFloat(form.desconto_valor) || 0,
      desconto_percentual:  parseFloat(form.desconto_percentual) || 0,
      cliente_id:           form.cliente_id,
      tipo_os_id:           uuidOuNull(form.tipo_os_id),
      servico_id:           uuidOuNull(form.servico_id),
      forma_pagamento_id:   uuidOuNull(form.forma_pagamento_id),
      status:               form.status,
      prioridade:           form.prioridade,
      data_entrega_prevista: form.data_entrega_prevista || null,
      valor_total:          parseFloat(form.valor_total) || 0,
    };

    setLoading(true);
    try {
      const { error } = await supabase.from("ordens_servico").update(payload).eq("id", os.id);
      if (error) throw error;

      const eventoDesc = form.status !== os.status
        ? `Status alterado: ${STATUS_CONFIG[os.status]?.label} → ${STATUS_CONFIG[form.status]?.label}`
        : "OS editada";
      await supabase.from("os_historico").insert({
        os_id: os.id, usuario_id: usuario?.id || null,
        tipo_evento: form.status !== os.status ? "status_alterado" : "editada",
        descricao: eventoDesc,
        valor_anterior: form.status !== os.status ? os.status : null,
        valor_novo:     form.status !== os.status ? form.status : null,
      });

      toast.success(`✅ O.S. #${os.numero_os} atualizada!`);
      onSaved();
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("uuid")) toast.error("⚠️ Verifique os campos de seleção.");
      else                      toast.error("⚠️ Erro ao salvar: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <FormField label="Título" required>
            <input style={inputStyle} value={form.titulo} onChange={e => setForm(f => ({...f, titulo: e.target.value}))} required />
          </FormField>
          <FormField label="Cliente" required>
            <select style={sel} value={form.cliente_id} onChange={e => setForm(f => ({...f, cliente_id: e.target.value}))} required>
              <option value="">Selecione...</option>
              {refs.clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12 }}>
            <FormField label="Estado">
              <select style={sel} value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value, cidade:""}))}>
                <option value="">UF...</option>
                {ESTADOS.map(e => <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>)}
              </select>
            </FormField>
            <FormField label="Cidade">
              <select style={sel} value={form.cidade} onChange={e => setForm(f => ({...f, cidade: e.target.value}))}>
                <option value="">Selecione...</option>
                {(ESTADOS.find(e => e.uf === form.estado)?.cidades || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Tipo de O.S.">
              <select style={sel} value={form.tipo_os_id} onChange={e => setForm(f => ({...f, tipo_os_id: e.target.value}))}>
                <option value="">Selecione...</option>
                {refs.tipos.map(t => <option key={t.id} value={t.id}>[{t.codigo}] {t.nome}</option>)}
              </select>
            </FormField>
            <FormField label="Forma de Pagamento">
              <select style={sel} value={form.forma_pagamento_id} onChange={e => setForm(f => ({...f, forma_pagamento_id: e.target.value}))}>
                <option value="">Selecione...</option>
                {refs.pagamentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Status">
              <select style={sel} value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
            <FormField label="Prioridade">
              <select style={sel} value={form.prioridade} onChange={e => setForm(f => ({...f, prioridade: e.target.value}))}>
                {Object.entries(PRIORIDADE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Data de Entrega Prevista">
            <input type="date" style={inputStyle} value={form.data_entrega_prevista} onChange={e => setForm(f => ({...f, data_entrega_prevista: e.target.value}))} />
          </FormField>
          <FormField label="Valor Total (R$)">
            <input type="number" style={{...inputStyle, fontWeight:700}} value={form.valor_total} onChange={e => setForm(f => ({...f, valor_total: e.target.value}))} min="0" step="0.01" />
          </FormField>
        </div>
        <div>
          <FormField label="Serviço Base">
            <select style={sel} value={form.servico_id} onChange={e => setForm(f => ({...f, servico_id: e.target.value}))}>
              <option value="">Selecione...</option>
              {refs.servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Nº O.S. em Outro Sistema">
            <input style={inputStyle} value={form.numero_os_externo} onChange={e => setForm(f => ({...f, numero_os_externo: e.target.value}))} placeholder="Ex: OP-2024-001" />
          </FormField>
          <FormField label="Descrição">
            <textarea style={{...inputStyle, minHeight:80, resize:"vertical"}} value={form.descricao} onChange={e => setForm(f => ({...f, descricao: e.target.value}))} />
          </FormField>
          <FormField label="Observações Internas">
            <textarea style={{...inputStyle, minHeight:60, resize:"vertical", background:"#FFFBEB"}} value={form.observacoes_internas} onChange={e => setForm(f => ({...f, observacoes_internas: e.target.value}))} />
          </FormField>
          <div style={{ background: "#F5F3FF", borderRadius: 10, padding: 14, marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>OS #{os.numero_os} · Lançada em {fmtDate(os.data_lancamento)}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280" }}>Para editar etapas e itens use a visualização detalhada.</p>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 18, marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        <button type="submit" disabled={loading} style={btnPrimary}>{loading ? "Salvando..." : "Salvar Alterações"}</button>
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
  const [showInstaladorModal, setShowInstaladorModal] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);
  const [instaladorId, setInstaladorId] = useState("");
  const [horarioInstalacao, setHorarioInstalacao] = useState("");

  useEffect(() => {
    supabase.from("funcionarios").select("id, nome").eq("ativo", true).order("nome")
      .then(({ data }) => setFuncionarios(data || []));
  }, []);

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

  const confirmarInstalador = async () => {
    if (!instaladorId) { toast.error("⚠️ Selecione o responsável pela instalação."); return; }
    setShowInstaladorModal(false);
    await executarSalvarStatus("em_instalacao", instaladorId, horarioInstalacao);
  };

  const salvarStatus = async () => {
    if (status === os.status) { toast("Status não foi alterado."); return; }
    if (status === "em_instalacao") {
      setShowInstaladorModal(true);
      return;
    }
    await executarSalvarStatus(status, null);
  };

  const executarSalvarStatus = async (novoStatus, responsavelInstalacaoId, horarioInst) => {
    setLoading(true);
    try {
      const extra = {};
      if (novoStatus === "concluida")    extra.data_conclusao = new Date().toISOString();
      if (responsavelInstalacaoId)       extra.responsavel_instalacao_id = responsavelInstalacaoId;
      if (horarioInst)                   extra.horario_instalacao = horarioInst;

      const { error } = await supabase.from("ordens_servico")
        .update({ status: novoStatus, ...extra })
        .eq("id", os.id);
      if (error) throw error;

      const responsavelNome = responsavelInstalacaoId
        ? funcionarios.find(f => f.id === responsavelInstalacaoId)?.nome
        : null;

      const anterior = STATUS_CONFIG[os.status]?.label || os.status;
      const novo     = STATUS_CONFIG[novoStatus]?.label || novoStatus;
      const descHorario = horarioInst ? ` · Horário: ${horarioInst}` : "";
      const descExtra = (responsavelNome ? ` · Responsável: ${responsavelNome}` : "") + descHorario;

      await supabase.from("os_historico").insert({
        os_id: os.id, usuario_id: usuario?.id || null,
        tipo_evento: "status_alterado",
        descricao: `Status alterado: ${anterior} → ${novo}${descExtra}`,
        valor_anterior: os.status, valor_novo: novoStatus,
      });
      toast.success(`✅ Status → "${novo}"${responsavelNome ? ` | Responsável: ${responsavelNome}` : ""}${horarioInst ? ` | Horário: ${horarioInst}` : ""}`);
      onClose();
    } catch (err) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const infoRows = [
    ["Lançamento",        fmtDateTime(os.data_lancamento)],
    ["Entrega",           fmtDate(os.data_entrega_prevista)],
    ["Cliente",           os.clientes?.nome],
    ["Estado/Cidade",     [os.estado, os.cidade].filter(Boolean).join(" — ") || null],
    ["Lançado por",       os.usuarios?.funcionarios?.nome],
    ["Nº OS Externo",     os.numero_os_externo],
    ["Resp. Instalação",  os.resp_instalacao?.nome],
    ["Horário Instalação", os.horario_instalacao ? new Date(os.horario_instalacao).toLocaleString("pt-BR") : null],
    ["Desconto",          (os.desconto_valor > 0 || os.desconto_percentual > 0) ? `${fmt(os.desconto_valor)} (${os.desconto_percentual}%)` : null],
    ["Valor Total",       fmt(os.valor_total)],
  ].filter(([, v]) => v);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div>
          <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Informações</h4>
          {infoRows.map(([l, v]) => (
            <div key={l} style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, minWidth: 120, flexShrink: 0 }}>{l}</span>
              <span style={{ fontSize: 13, color: "#111827" }}>{v}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Alterar Status</h4>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={salvarStatus} disabled={loading} style={btnPrimary}>{loading ? "..." : "Salvar"}</button>
          </div>
          <div style={{ marginBottom: 12 }}><StatusBadge status={os.status} size="lg" /></div>
          {/* Mostra responsável pela instalação se status for em_instalacao */}
          {os.status === "em_instalacao" && (os.resp_instalacao?.nome || os.horario_instalacao) && (
            <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C2410C", textTransform: "uppercase", marginBottom: 6 }}>🔧 Dados da Instalação</div>
              {os.resp_instalacao?.nome && (
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Responsável:</span> {os.resp_instalacao.nome}
                </div>
              )}
              {os.horario_instalacao && (
                <div style={{ fontSize: 13, color: "#374151" }}>
                  <span style={{ fontWeight: 600 }}>Horário previsto:</span>{" "}
                  {new Date(os.horario_instalacao).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                </div>
              )}
            </div>
          )}
          {os.descricao && (
            <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{os.descricao}</p>
            </div>
          )}
        </div>
      </div>

      {itens.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Itens</h4>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#F9FAFB" }}>{["Descrição","Qtd","Valor Unit.","Subtotal"].map(h => <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{h}</th>)}</tr></thead>
            <tbody>{itens.map(it => <tr key={it.id} style={{ borderTop: "1px solid #F3F4F6" }}><td style={{ padding: "8px 12px" }}>{it.descricao}</td><td style={{ padding: "8px 12px" }}>{it.quantidade}</td><td style={{ padding: "8px 12px" }}>{fmt(it.valor_unitario)}</td><td style={{ padding: "8px 12px", fontWeight: 600 }}>{fmt(it.valor_total)}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {etapas.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Etapas</h4>
          {etapas.map((et, i) => (
            <div key={et.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 5, background: et.concluida ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${et.concluida ? "#86EFAC" : "#E5E7EB"}` }}>
              <button onClick={() => toggleEtapa(et)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                {et.concluida ? <CheckSquare size={17} color="#16A34A" /> : <Square size={17} color="#9CA3AF" />}
              </button>
              <span style={{ fontSize: 13, flex: 1, textDecoration: et.concluida ? "line-through" : "none", color: et.concluida ? "#6B7280" : "#374151" }}>{i + 1}. {et.nome_etapa}</span>
              {et.concluida && <span style={{ fontSize: 11, color: "#16A34A" }}>{fmtDate(et.data_conclusao)}</span>}
            </div>
          ))}
        </div>
      )}

      {historico.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Histórico de Alterações</h4>
          {historico.map(h => (
            <div key={h.id} style={{ display: "flex", gap: 10, padding: "9px 12px", marginBottom: 4, borderRadius: 8, background: "#F9FAFB", border: "1px solid #F3F4F6", fontSize: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ color: "#6B7280", fontSize: 11 }}>{fmtDateTime(h.created_at)}</div>
                {h.usuarios?.funcionarios?.nome && <div style={{ color: "#7C3AED", fontSize: 11, fontWeight: 600, marginTop: 2 }}>{h.usuarios.funcionarios.nome}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: "#374151", fontWeight: 500 }}>{h.descricao}</span>
                {h.valor_anterior && h.valor_novo && (
                  <div style={{ marginTop: 3, display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "1px 7px", borderRadius: 10, fontSize: 11 }}>{STATUS_CONFIG[h.valor_anterior]?.label || h.valor_anterior}</span>
                    <span style={{ color: "#9CA3AF", fontSize: 11 }}>→</span>
                    <span style={{ background: "#DCFCE7", color: "#166534", padding: "1px 7px", borderRadius: 10, fontSize: 11 }}>{STATUS_CONFIG[h.valor_novo]?.label || h.valor_novo}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal: responsável pela instalação */}
      {showInstaladorModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,0.3)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", background: "#FFF7ED", borderBottom: "2px solid #FB923C" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>🔧 Responsável pela Instalação</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>OS #{os.numero_os} — {os.titulo}</div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <p style={{ margin: "0 0 14px", fontSize: 14, color: "#374151" }}>
                Selecione o funcionário responsável por executar a instalação:
              </p>
              <select
                value={instaladorId}
                onChange={e => setInstaladorId(e.target.value)}
                style={{ ...inputStyle, width: "100%", marginBottom: 16 }}
              >
                <option value="">Selecione o responsável...</option>
                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>

              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Horário previsto para instalação
              </label>
              <input
                type="datetime-local"
                value={horarioInstalacao}
                onChange={e => setHorarioInstalacao(e.target.value)}
                style={{ ...inputStyle, width: "100%", marginBottom: 20, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setShowInstaladorModal(false); setInstaladorId(""); setHorarioInstalacao(""); }}
                  style={{ ...btnSecondary }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarInstalador}
                  style={{ ...btnPrimary, background: "#F97316" }}
                >
                  ✅ Confirmar Instalação
                </button>
              </div>
            </div>
          </div>
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
  const [editOS, setEditOS] = useState(null);

  useEffect(() => { loadOrdens(); }, []);

  const loadOrdens = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ordens_servico")
      .select("*, clientes(nome), tipos_os(codigo, nome), usuarios!usuario_lancamento_id(funcionarios(nome)), resp_instalacao:responsavel_instalacao_id(nome), horario_instalacao")
      .order("created_at", { ascending: false });
    setOrdens(data || []);
    setLoading(false);
  };

  const filtradas = ordens.filter(os => {
    if (filtros.status    && os.status    !== filtros.status)    return false;
    if (filtros.prioridade && os.prioridade !== filtros.prioridade) return false;
    if (filtros.busca) {
      const q = filtros.busca.toLowerCase();
      if (!os.titulo?.toLowerCase().includes(q) &&
          !String(os.numero_os).includes(q) &&
          !(os.clientes?.nome || "").toLowerCase().includes(q) &&
          !(os.numero_os_externo || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const updateStatus = async (osItem, novoStatus) => {
    if (novoStatus === osItem.status) return;
    const { error } = await supabase.from("ordens_servico")
      .update({ status: novoStatus, ...(novoStatus === "concluida" ? { data_conclusao: new Date().toISOString() } : {}) })
      .eq("id", osItem.id);
    if (!error) {
      const anterior = STATUS_CONFIG[osItem.status]?.label || osItem.status;
      const novo     = STATUS_CONFIG[novoStatus]?.label    || novoStatus;
      await supabase.from("os_historico").insert({
        os_id: osItem.id, usuario_id: usuario?.id || null,
        tipo_evento: "status_alterado",
        descricao: `Status alterado: ${anterior} → ${novo}`,
        valor_anterior: osItem.status, valor_novo: novoStatus,
      });
      toast.success(`Status → "${novo}"`);
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

      {/* Filtros */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #E5E7EB", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            style={{ ...inputStyle, paddingLeft: 32 }}
            placeholder="Buscar por nº, cliente, título, OP externa..."
            value={filtros.busca}
            onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
          />
        </div>
        <select style={{ ...inputStyle, width: 170 }} value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={{ ...inputStyle, width: 150 }} value={filtros.prioridade} onChange={e => setFiltros(f => ({ ...f, prioridade: e.target.value }))}>
          <option value="">Todas prioridades</option>
          {Object.entries(PRIORIDADE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: 13, color: "#6B7280" }}>{filtradas.length} registros</span>
      </div>

      {/* Tabela — drag to scroll */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div
          ref={el => {
            if (!el) return;
            const ds = { down: false, moved: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 };
            el._ds = ds;

            // ── Mouse ────────────────────────────────────────
            el.onmousedown = e => {
              if (e.target.closest("button") || e.target.closest("select")) return;
              ds.down = true; ds.moved = false;
              ds.startX = e.clientX; ds.startY = e.clientY;
              ds.scrollLeft = el.scrollLeft; ds.scrollTop = el.scrollTop;
              el.style.cursor = "grab";
            };
            el.onmouseleave = () => { ds.down = false; el.style.cursor = "default"; };
            el.onmouseup    = () => { ds.down = false; el.style.cursor = "default"; };
            el.onmousemove  = e => {
              if (!ds.down) return;
              const dx = Math.abs(e.clientX - ds.startX);
              const dy = Math.abs(e.clientY - ds.startY);
              if (dx > 4 || dy > 4) {
                ds.moved = true;
                el.style.cursor = "grabbing";
                el.scrollLeft = ds.scrollLeft - (e.clientX - ds.startX);
                el.scrollTop  = ds.scrollTop  - (e.clientY - ds.startY);
              }
            };

            // ── Touch ────────────────────────────────────────
            el.ontouchstart = e => {
              if (e.target.closest("button") || e.target.closest("select")) return;
              const t = e.touches[0];
              ds.down = true; ds.moved = false;
              ds.startX = t.clientX; ds.startY = t.clientY;
              ds.scrollLeft = el.scrollLeft; ds.scrollTop = el.scrollTop;
            };
            el.ontouchend  = () => { ds.down = false; };
            el.ontouchmove = e => {
              if (!ds.down) return;
              const t = e.touches[0];
              if (Math.abs(t.clientX - ds.startX) > 4 || Math.abs(t.clientY - ds.startY) > 4) {
                ds.moved = true;
                el.scrollLeft = ds.scrollLeft - (t.clientX - ds.startX);
                el.scrollTop  = ds.scrollTop  - (t.clientY - ds.startY);
              }
            };
          }}
          data-scroll-container="true" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "65vh", cursor: "default", touchAction: "pan-x pan-y" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                {["Nº","Data","Cliente","Título","Tipo","Status","Prioridade","Entrega","Valor","Lançado por","Ações"].map(h => (
                  <th key={h} style={{ padding: "11px 13px", textAlign: "left", fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Carregando...</td></tr>
                : filtradas.length === 0
                ? <tr><td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Nenhuma OS encontrada</td></tr>
                : filtradas.map((os, i) => (
                  <tr
                    key={os.id}
                    onClick={e => {
                      // Só abre se não houve arrasto no container pai
                      const container = e.currentTarget.closest("[data-scroll-container]");
                      if (container?._ds?.moved) return;
                      setSelectedOS(os);
                    }}
                    style={{ borderTop: "1px solid #F3F4F6", background: isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => { if (!e.currentTarget.closest("[data-scroll-container]")?._ds?.moved) e.currentTarget.style.background = "#F5F3FF"; }}
                    onMouseLeave={e => e.currentTarget.style.background = isAtrasada(os) ? "#FFF7F7" : i % 2 === 0 ? "#fff" : "#FAFAFA"}
                  >
                    <td style={{ padding: "11px 13px", fontWeight: 700, color: "#7C3AED" }}>
                      #{os.numero_os}
                      {os.numero_os_externo && <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>↳ {os.numero_os_externo}</div>}
                    </td>
                    <td style={{ padding: "11px 13px", color: "#6B7280", whiteSpace: "nowrap" }}>{fmtDate(os.data_lancamento)}</td>
                    <td style={{ padding: "11px 13px" }}>
                      {os.clientes?.nome || "—"}
                      {os.cidade && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{os.cidade}</div>}
                    </td>
                    <td style={{ padding: "11px 13px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{os.titulo}</td>
                    <td style={{ padding: "11px 13px" }}>
                      {os.tipos_os && <span style={{ background: "#F5F3FF", color: "#7C3AED", padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{os.tipos_os.codigo}</span>}
                    </td>
                    <td style={{ padding: "11px 13px" }}><StatusBadge status={os.status} /></td>
                    <td style={{ padding: "11px 13px" }}><PrioridadeBadge prioridade={os.prioridade} /></td>
                    <td style={{ padding: "11px 13px", color: isAtrasada(os) ? "#DC2626" : "#374151", fontWeight: isAtrasada(os) ? 700 : 400, whiteSpace: "nowrap" }}>
                      {fmtDate(os.data_entrega_prevista)}
                      {isAtrasada(os) && <div style={{ fontSize: 10, color: "#DC2626" }}>⚠ ATRASADA</div>}
                      {isHoje(os) && !isAtrasada(os) && <div style={{ fontSize: 10, color: "#D97706" }}>📅 HOJE</div>}
                    </td>
                    <td style={{ padding: "11px 13px", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(os.valor_total)}</td>
                    <td style={{ padding: "11px 13px", color: "#6B7280", whiteSpace: "nowrap" }}>{os.usuarios?.funcionarios?.nome || "—"}</td>
                    <td style={{ padding: "11px 13px", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button title="Visualizar" onClick={e => { e.stopPropagation(); setSelectedOS(os); }} style={{ background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE", padding: "5px 8px", borderRadius: 7, cursor: "pointer", display: "inline-flex" }}><Eye size={12} /></button>
                        <button title="Editar" onClick={e => { e.stopPropagation(); setEditOS(os); }} style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #86EFAC", padding: "5px 8px", borderRadius: 7, cursor: "pointer", display: "inline-flex" }}><Edit2 size={12} /></button>
                        <select value={os.status} onChange={e => { e.stopPropagation(); updateStatus(os, e.target.value); }} style={{ fontSize: 11, padding: "4px 5px", border: "1px solid #D1D5DB", borderRadius: 6, cursor: "pointer", background: "#fff", maxWidth: 120 }}>
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
      {editOS && (
        <Modal title={`Editar O.S. #${editOS.numero_os} — ${editOS.titulo}`} onClose={() => setEditOS(null)} size="xl">
          <EditarOS os={editOS} onSaved={() => { setEditOS(null); loadOrdens(); }} onClose={() => setEditOS(null)} />
        </Modal>
      )}
    </div>
  );
}
