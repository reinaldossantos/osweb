import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { ListPage, TableHead, ActionButtons, EmptyRow, Modal } from "../components/components";
import { fmt } from "../constants/constants";
import {
  Building2, Users, Briefcase, Package, Layers, Tag, CreditCard, UserPlus,
} from "lucide-react";
import {
  ClientesForm, FuncionariosForm, CargosForm, ServicosForm,
  EtapasForm, TiposOSForm, FormasPagtoForm, UsuariosForm,
} from "../forms/forms";

// ─── CLIENTES ─────────────────────────────────────────────────
export function PageClientes() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("clientes").select("*").order("nome");
    setItems(data || []);
  }

  async function del(id) {
    if (!confirm("Confirmar exclusão?")) return;
    await supabase.from("clientes").update({ ativo: false }).eq("id", id);
    toast.success("Removido!"); load();
  }

  const filtered = items.filter(i =>
    !busca || i.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    i.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <ListPage title="Clientes" icon={Building2} onNew={() => { setEditItem(null); setShowModal(true); }} count={filtered.length} busca={busca} setBusca={setBusca}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <TableHead cols={["Nome", "Email", "Telefone", "CPF/CNPJ"]} />
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={4} /> : filtered.map((item, i) => (
              <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px" }}>{item.nome}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.email || "—"}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.telefone || "—"}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.documento || "—"}</td>
                <ActionButtons onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => del(item.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {showModal && (
        <Modal title={editItem ? "Editar Cliente" : "Novo Cliente"} onClose={() => setShowModal(false)}>
          <ClientesForm item={editItem} onSaved={() => { setShowModal(false); load(); toast.success("Salvo!"); }} onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </>
  );
}

// ─── FUNCIONÁRIOS ─────────────────────────────────────────────
export function PageFuncionarios() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("funcionarios").select("*, cargos(nome)").order("nome");
    setItems(data || []);
  }

  async function del(id) {
    if (!confirm("Confirmar exclusão?")) return;
    await supabase.from("funcionarios").update({ ativo: false }).eq("id", id);
    toast.success("Removido!"); load();
  }

  const filtered = items.filter(i =>
    !busca || i.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    i.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <ListPage title="Funcionários" icon={Users} onNew={() => { setEditItem(null); setShowModal(true); }} count={filtered.length} busca={busca} setBusca={setBusca}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <TableHead cols={["Nome", "Email", "Telefone", "Cargo"]} />
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={4} /> : filtered.map((item, i) => (
              <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px" }}>{item.nome}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.email || "—"}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.telefone || "—"}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.cargos?.nome || "—"}</td>
                <ActionButtons onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => del(item.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {showModal && (
        <Modal title={editItem ? "Editar Funcionário" : "Novo Funcionário"} onClose={() => setShowModal(false)}>
          <FuncionariosForm item={editItem} onSaved={() => { setShowModal(false); load(); toast.success("Salvo!"); }} onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </>
  );
}

// ─── CARGOS ───────────────────────────────────────────────────
export function PageCargos() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("cargos").select("*").order("nome");
    setItems(data || []);
  }

  async function del(id) {
    if (!confirm("Confirmar exclusão?")) return;
    await supabase.from("cargos").update({ ativo: false }).eq("id", id);
    toast.success("Removido!"); load();
  }

  const filtered = items.filter(i => !busca || i.nome?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      <ListPage title="Cargos" icon={Briefcase} onNew={() => { setEditItem(null); setShowModal(true); }} count={filtered.length} busca={busca} setBusca={setBusca}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <TableHead cols={["Nome", "Descrição"]} />
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={2} /> : filtered.map((item, i) => (
              <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px" }}>{item.nome}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.descricao || "—"}</td>
                <ActionButtons onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => del(item.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {showModal && (
        <Modal title={editItem ? "Editar Cargo" : "Novo Cargo"} onClose={() => setShowModal(false)}>
          <CargosForm item={editItem} onSaved={() => { setShowModal(false); load(); toast.success("Salvo!"); }} onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </>
  );
}

// ─── SERVIÇOS ─────────────────────────────────────────────────
export function PageServicos() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("servicos").select("*").order("nome");
    setItems(data || []);
  }

  async function del(id) {
    if (!confirm("Confirmar exclusão?")) return;
    await supabase.from("servicos").update({ ativo: false }).eq("id", id);
    toast.success("Removido!"); load();
  }

  const filtered = items.filter(i => !busca || i.nome?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      <ListPage title="Serviços" icon={Package} onNew={() => { setEditItem(null); setShowModal(true); }} count={filtered.length} busca={busca} setBusca={setBusca}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <TableHead cols={["Nome", "Unidade", "Valor Base"]} />
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={3} /> : filtered.map((item, i) => (
              <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px" }}>{item.nome}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.unidade || "—"}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{fmt(item.valor_base)}</td>
                <ActionButtons onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => del(item.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {showModal && (
        <Modal title={editItem ? "Editar Serviço" : "Novo Serviço"} onClose={() => setShowModal(false)}>
          <ServicosForm item={editItem} onSaved={() => { setShowModal(false); load(); toast.success("Salvo!"); }} onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </>
  );
}

// ─── ETAPAS ───────────────────────────────────────────────────
export function PageEtapas() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("etapas_servico").select("*, servicos(nome)").order("ordem");
    setItems(data || []);
  }

  async function del(id) {
    if (!confirm("Confirmar exclusão?")) return;
    await supabase.from("etapas_servico").update({ ativo: false }).eq("id", id);
    toast.success("Removido!"); load();
  }

  const filtered = items.filter(i =>
    !busca || i.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    i.servicos?.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <ListPage title="Etapas de Serviço" icon={Layers} onNew={() => { setEditItem(null); setShowModal(true); }} count={filtered.length} busca={busca} setBusca={setBusca}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <TableHead cols={["Serviço", "Etapa", "Ordem", "Duração (h)"]} />
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={4} /> : filtered.map((item, i) => (
              <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.servicos?.nome || "—"}</td>
                <td style={{ padding: "12px 16px" }}>{item.nome}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.ordem ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.duracao_estimada_horas ?? "—"}</td>
                <ActionButtons onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => del(item.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {showModal && (
        <Modal title={editItem ? "Editar Etapa" : "Nova Etapa"} onClose={() => setShowModal(false)}>
          <EtapasForm item={editItem} onSaved={() => { setShowModal(false); load(); toast.success("Salvo!"); }} onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </>
  );
}

// ─── TIPOS OS ─────────────────────────────────────────────────
export function PageTiposOS() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("tipos_os").select("*").order("codigo");
    setItems(data || []);
  }

  async function del(id) {
    if (!confirm("Confirmar exclusão?")) return;
    await supabase.from("tipos_os").update({ ativo: false }).eq("id", id);
    toast.success("Removido!"); load();
  }

  const filtered = items.filter(i =>
    !busca || i.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    i.codigo?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <ListPage title="Tipos de O.S." icon={Tag} onNew={() => { setEditItem(null); setShowModal(true); }} count={filtered.length} busca={busca} setBusca={setBusca}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <TableHead cols={["Código", "Nome", "Descrição"]} />
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={3} /> : filtered.map((item, i) => (
              <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                    {item.codigo}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>{item.nome}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.descricao || "—"}</td>
                <ActionButtons onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => del(item.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {showModal && (
        <Modal title={editItem ? "Editar Tipo OS" : "Novo Tipo OS"} onClose={() => setShowModal(false)}>
          <TiposOSForm item={editItem} onSaved={() => { setShowModal(false); load(); toast.success("Salvo!"); }} onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </>
  );
}

// ─── FORMAS DE PAGAMENTO ──────────────────────────────────────
export function PageFormasPagto() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("formas_pagamento").select("*").order("nome");
    setItems(data || []);
  }

  async function del(id) {
    if (!confirm("Confirmar exclusão?")) return;
    await supabase.from("formas_pagamento").update({ ativo: false }).eq("id", id);
    toast.success("Removido!"); load();
  }

  const filtered = items.filter(i => !busca || i.nome?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      <ListPage title="Formas de Pagamento" icon={CreditCard} onNew={() => { setEditItem(null); setShowModal(true); }} count={filtered.length} busca={busca} setBusca={setBusca}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <TableHead cols={["Nome", "Descrição"]} />
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={2} /> : filtered.map((item, i) => (
              <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px" }}>{item.nome}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.descricao || "—"}</td>
                <ActionButtons onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => del(item.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {showModal && (
        <Modal title={editItem ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"} onClose={() => setShowModal(false)}>
          <FormasPagtoForm item={editItem} onSaved={() => { setShowModal(false); load(); toast.success("Salvo!"); }} onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </>
  );
}

// ─── USUÁRIOS ─────────────────────────────────────────────────
export function PageUsuarios() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("usuarios").select("*, funcionarios(nome, email)").order("created_at");
    setItems(data || []);
  }

  async function del(id) {
    if (!confirm("Confirmar exclusão?")) return;
    await supabase.from("usuarios").update({ ativo: false }).eq("id", id);
    toast.success("Removido!"); load();
  }

  const filtered = items.filter(i =>
    !busca || i.funcionarios?.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <ListPage title="Usuários" icon={UserPlus} onNew={() => { setEditItem(null); setShowModal(true); }} count={filtered.length} busca={busca} setBusca={setBusca}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <TableHead cols={["Funcionário", "Email", "Perfil"]} />
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={3} /> : filtered.map((item, i) => (
              <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 16px" }}>{item.funcionarios?.nome || "—"}</td>
                <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.funcionarios?.email || "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: item.perfil === "admin" ? "#FEF3C7" : "#EFF6FF", color: item.perfil === "admin" ? "#92400E" : "#1E40AF", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                    {item.perfil === "admin" ? "Admin" : "Básico"}
                  </span>
                </td>
                <ActionButtons onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => del(item.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {showModal && (
        <Modal title={editItem ? "Editar Usuário" : "Novo Usuário"} onClose={() => setShowModal(false)}>
          <UsuariosForm item={editItem} onSaved={() => { setShowModal(false); load(); toast.success("Salvo!"); }} onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </>
  );
}
