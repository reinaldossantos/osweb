import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FormField } from "../components/components";
import { inputStyle, btnPrimary, btnSecondary } from "../constants/constants";
import { toast } from "react-hot-toast";

// ─── CARGOS FORM ──────────────────────────────────────────────
export function CargosForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({ nome: item?.nome || "", descricao: item?.descricao || "" });

  const save = async (e) => {
    e.preventDefault();
    const op = item
      ? supabase.from("cargos").update(form).eq("id", item.id)
      : supabase.from("cargos").insert(form);
    const { error } = await op;
    if (!error) onSaved(); else toast.error(error.message);
  };

  return (
    <form onSubmit={save}>
      <FormField label="Nome" required>
        <input style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
      </FormField>
      <FormField label="Descrição">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
      </FormField>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Salvar</button>
      </div>
    </form>
  );
}

// ─── FUNCIONÁRIOS FORM ────────────────────────────────────────
export function FuncionariosForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({
    nome: item?.nome || "", email: item?.email || "",
    telefone: item?.telefone || "", cargo_id: item?.cargo_id || "",
  });
  const [cargos, setCargos] = useState([]);

  useEffect(() => {
    supabase.from("cargos").select("id, nome").eq("ativo", true).order("nome")
      .then(({ data }) => setCargos(data || []));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    // cargo_id vazio ("") causa erro uuid no PostgreSQL — converte para null
    const payload = {
      nome:     form.nome,
      email:    form.email,
      telefone: form.telefone || null,
      cargo_id: form.cargo_id && form.cargo_id.trim() !== "" ? form.cargo_id : null,
    };
    const op = item
      ? supabase.from("funcionarios").update(payload).eq("id", item.id)
      : supabase.from("funcionarios").insert(payload);
    const { error } = await op;
    if (!error) onSaved();
    else toast.error("Erro ao salvar: " + error.message);
  };

  return (
    <form onSubmit={save}>
      <FormField label="Nome" required>
        <input style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
      </FormField>
      <FormField label="Email" required>
        <input type="email" style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
      </FormField>
      <FormField label="Telefone">
        <input style={inputStyle} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
      </FormField>
      <FormField label="Cargo">
        <select style={inputStyle} value={form.cargo_id} onChange={e => setForm({ ...form, cargo_id: e.target.value })}>
          <option value="">Selecione...</option>
          {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </FormField>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Salvar</button>
      </div>
    </form>
  );
}

// ─── SERVIÇOS FORM ────────────────────────────────────────────
export function ServicosForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({
    nome: item?.nome || "", descricao: item?.descricao || "",
    valor_base: item?.valor_base || "", unidade: item?.unidade || "un",
  });

  const save = async (e) => {
    e.preventDefault();
    const op = item
      ? supabase.from("servicos").update(form).eq("id", item.id)
      : supabase.from("servicos").insert(form);
    const { error } = await op;
    if (!error) onSaved(); else toast.error(error.message);
  };

  return (
    <form onSubmit={save}>
      <FormField label="Nome" required>
        <input style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
      </FormField>
      <FormField label="Descrição">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
      </FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Valor Base (R$)">
          <input type="number" style={inputStyle} value={form.valor_base} onChange={e => setForm({ ...form, valor_base: e.target.value })} min="0" step="0.01" />
        </FormField>
        <FormField label="Unidade">
          <input style={inputStyle} value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} placeholder="un, m², h..." />
        </FormField>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Salvar</button>
      </div>
    </form>
  );
}

// ─── ETAPAS FORM ──────────────────────────────────────────────
export function EtapasForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({
    servico_id: item?.servico_id || "", nome: item?.nome || "",
    descricao: item?.descricao || "", ordem: item?.ordem || 0,
    duracao_estimada_horas: item?.duracao_estimada_horas || "",
    duracao_estimada_minutos: item?.duracao_estimada_minutos || "",
  });
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    supabase.from("servicos").select("id, nome").eq("ativo", true).order("nome")
      .then(({ data }) => setServicos(data || []));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      servico_id: form.servico_id,
      nome: form.nome,
      descricao: form.descricao || null,
      ordem: parseInt(form.ordem) || 0,
      duracao_estimada_horas: parseFloat(form.duracao_estimada_horas) || null,
      duracao_estimada_minutos: parseFloat(form.duracao_estimada_minutos) || null,
    };
    const op = item
      ? supabase.from("etapas_servico").update(payload).eq("id", item.id)
      : supabase.from("etapas_servico").insert(payload);
    const { error } = await op;
    if (!error) onSaved(); else toast.error(error.message);
  };

  return (
    <form onSubmit={save}>
      <FormField label="Serviço" required>
        <select style={inputStyle} value={form.servico_id} onChange={e => setForm({ ...form, servico_id: e.target.value })} required>
          <option value="">Selecione...</option>
          {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </FormField>
      <FormField label="Nome da Etapa" required>
        <input style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
      </FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <FormField label="Ordem">
          <input type="number" style={inputStyle} value={form.ordem} onChange={e => setForm({ ...form, ordem: e.target.value })} min="0" />
        </FormField>
        <FormField label="Duração (horas)">
          <input type="number" style={inputStyle} value={form.duracao_estimada_horas} onChange={e => setForm({ ...form, duracao_estimada_horas: e.target.value })} min="0" step="0.5" placeholder="Ex: 1.5" />
        </FormField>
        <FormField label="Duração (minutos)">
          <input type="number" style={inputStyle} value={form.duracao_estimada_minutos} onChange={e => setForm({ ...form, duracao_estimada_minutos: e.target.value })} min="0" step="5" placeholder="Ex: 30" />
        </FormField>
      </div>
      <FormField label="Descrição">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
      </FormField>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Salvar</button>
      </div>
    </form>
  );
}

// ─── TIPOS OS FORM ────────────────────────────────────────────
export function TiposOSForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({
    codigo: item?.codigo || "", nome: item?.nome || "", descricao: item?.descricao || "",
  });

  const save = async (e) => {
    e.preventDefault();
    const op = item
      ? supabase.from("tipos_os").update(form).eq("id", item.id)
      : supabase.from("tipos_os").insert(form);
    const { error } = await op;
    if (!error) onSaved(); else toast.error(error.message);
  };

  return (
    <form onSubmit={save}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <FormField label="Código" required>
          <input style={inputStyle} value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })} required maxLength={20} />
        </FormField>
        <FormField label="Nome" required>
          <input style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
        </FormField>
      </div>
      <FormField label="Descrição">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
      </FormField>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Salvar</button>
      </div>
    </form>
  );
}

// ─── FORMAS PAGAMENTO FORM ────────────────────────────────────
export function FormasPagtoForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({ nome: item?.nome || "", descricao: item?.descricao || "" });

  const save = async (e) => {
    e.preventDefault();
    const op = item
      ? supabase.from("formas_pagamento").update(form).eq("id", item.id)
      : supabase.from("formas_pagamento").insert(form);
    const { error } = await op;
    if (!error) onSaved(); else toast.error(error.message);
  };

  return (
    <form onSubmit={save}>
      <FormField label="Nome" required>
        <input style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
      </FormField>
      <FormField label="Descrição">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
      </FormField>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Salvar</button>
      </div>
    </form>
  );
}

// ─── CLIENTES FORM ────────────────────────────────────────────
export function ClientesForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({
    nome: item?.nome || "", email: item?.email || "",
    telefone: item?.telefone || "", documento: item?.documento || "",
    endereco: item?.endereco || "", observacoes: item?.observacoes || "",
  });

  const save = async (e) => {
    e.preventDefault();
    const op = item
      ? supabase.from("clientes").update(form).eq("id", item.id)
      : supabase.from("clientes").insert(form);
    const { error } = await op;
    if (!error) onSaved(); else toast.error(error.message);
  };

  return (
    <form onSubmit={save}>
      <FormField label="Nome" required>
        <input style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
      </FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Email">
          <input type="email" style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Telefone">
          <input style={inputStyle} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
        </FormField>
      </div>
      <FormField label="CPF/CNPJ">
        <input style={inputStyle} value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} />
      </FormField>
      <FormField label="Endereço">
        <input style={inputStyle} value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
      </FormField>
      <FormField label="Observações">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
      </FormField>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Salvar</button>
      </div>
    </form>
  );
}

// ─── USUÁRIOS FORM ────────────────────────────────────────────
export function UsuariosForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({
    funcionario_id: item?.funcionario_id || "",
    perfil: item?.perfil || "basico",
    email: "", password: "",
  });
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    supabase.from("funcionarios").select("id, nome").eq("ativo", true).order("nome")
      .then(({ data }) => setFuncionarios(data || []));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!item) {
      // signUp funciona com a anon key — admin.createUser exige service_role
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authErr) { toast.error("Erro ao criar acesso: " + authErr.message); return; }
      if (!authData?.user) { toast.error("Erro: usuário não criado. Verifique as configurações do Supabase."); return; }

      const { error } = await supabase.from("usuarios").insert({
        funcionario_id: form.funcionario_id,
        perfil: form.perfil,
        auth_user_id: authData.user.id,
      });
      if (!error) {
        toast.success("Usuário criado! Se confirmação de email estiver ativa no Supabase, o usuário deve confirmar o email antes de logar.");
        onSaved();
      } else {
        toast.error(error.message);
      }
    } else {
      const { error } = await supabase.from("usuarios").update({ perfil: form.perfil }).eq("id", item.id);
      if (!error) onSaved(); else toast.error(error.message);
    }
  };

  return (
    <form onSubmit={save}>
      {!item && (
        <>
          <FormField label="Funcionário" required>
            <select style={inputStyle} value={form.funcionario_id} onChange={e => setForm({ ...form, funcionario_id: e.target.value })} required>
              <option value="">Selecione o funcionário...</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Email de acesso" required>
            <input type="email" style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </FormField>
          <FormField label="Senha inicial" required>
            <input type="password" style={inputStyle} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </FormField>
        </>
      )}
      <FormField label="Perfil">
        <select style={inputStyle} value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })}>
          <option value="basico">Básico</option>
          <option value="admin">Administrador</option>
        </select>
      </FormField>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
        <button type="submit" style={btnPrimary}>Salvar</button>
      </div>
    </form>
  );
}
