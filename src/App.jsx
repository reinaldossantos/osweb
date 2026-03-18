import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { OrdensServico, NovaOS } from "./pages/OrdensServico";
import {
  PageClientes, PageFuncionarios, PageCargos, PageServicos,
  PageEtapas, PageTiposOS, PageFormasPagto, PageUsuarios,
} from "./pages/CrudPages";
import { NAV_ITEMS } from "./constants/constants";
import Relatorios from "./pages/Relatorios";
import { FileText, Menu, User, LogOut, ChevronRight } from "lucide-react";

// ─── SIDEBAR ──────────────────────────────────────────────────
function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen, usuario, signOut, isAdmin }) {
  const navFiltered = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <div style={{
      width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0,
      background: "#0F172A", transition: "width 0.2s, min-width 0.2s",
      overflow: "hidden", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1E293B" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#1D4ED8", borderRadius: 10, padding: 8, flexShrink: 0 }}>
            <FileText size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>VisualOS</div>
            <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>Comunicação Visual</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {navFiltered.map((item, i) => {
          if (item.key.startsWith("divider")) {
            return <div key={i} style={{ height: 1, background: "#1E293B", margin: "8px 0" }} />;
          }
          const { Icon } = item;
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: active ? "#1E40AF" : "transparent",
                color: active ? "#fff" : "#94A3B8",
                fontSize: 13, fontWeight: active ? 600 : 400, marginBottom: 2,
                transition: "all 0.15s",
              }}
            >
              <Icon size={16} />
              <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
              {active && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 10px", borderTop: "1px solid #1E293B" }}>
        <div style={{ padding: "10px 12px", marginBottom: 6 }}>
          <div style={{ color: "#CBD5E1", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {usuario?.funcionarios?.nome || "Usuário"}
          </div>
          <div style={{ color: "#64748B", fontSize: 11 }}>
            {usuario?.perfil === "admin" ? "Administrador" : "Usuário básico"}
          </div>
        </div>
        <button
          onClick={signOut}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "#94A3B8", fontSize: 13 }}
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    </div>
  );
}

// ─── APP CONTENT ──────────────────────────────────────────────
function AppContent() {
  const { user, usuario, loading, signOut } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <FileText size={24} color="#fff" />
        </div>
        <p style={{ color: "#6B7280", fontSize: 14 }}>Carregando...</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const isAdmin = usuario?.perfil === "admin";
  const contentStyle = { flex: 1, padding: 28, maxWidth: 1280, width: "100%" };

  // Cada componente é um módulo separado — React trata como tipo único
  // Não há componente genérico reutilizado — navegação 100% isolada
  const renderContent = () => {
    switch (page) {
      case "dashboard":        return <Dashboard />;
      case "nova_os":          return (
        <div style={contentStyle}>
          <h1 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 800, color: "#111827" }}>Nova Ordem de Serviço</h1>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, border: "1px solid #E5E7EB" }}>
            <NovaOS onSaved={() => setPage("ordens_servico")} />
          </div>
        </div>
      );
      case "ordens_servico":   return <OrdensServico />;
      case "clientes":         return <PageClientes />;
      case "funcionarios":     return <PageFuncionarios />;
      case "cargos":           return <PageCargos />;
      case "servicos":         return <PageServicos />;
      case "etapas":           return <PageEtapas />;
      case "tipos_os":         return <PageTiposOS />;
      case "formas_pagamento": return <PageFormasPagto />;
      case "usuarios":         return isAdmin ? <PageUsuarios /> : <p style={{ color: "#EF4444", padding: 40 }}>Acesso restrito.</p>;
      case "relatorios":       return <Relatorios />;
      default:                 return <Dashboard />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F1F5F9" }}>
      <Sidebar
        page={page} setPage={setPage}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        usuario={usuario} signOut={signOut} isAdmin={isAdmin}
      />

      <div style={{ flex: 1, marginLeft: sidebarOpen ? 260 : 0, transition: "margin-left 0.2s", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Topbar */}
        <div style={{ background: "#fff", padding: "14px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748B", padding: 4 }}>
            <Menu size={20} />
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{usuario?.funcionarios?.nome || "Usuário"}</span>
          </div>
        </div>

        {/* Conteúdo — key={page} garante desmontagem completa a cada troca */}
        <div key={page} style={contentStyle}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000, style: { background: "#1F2937", color: "#fff", borderRadius: 10, fontSize: 14 } }}
      />
      <AppContent />
    </AuthProvider>
  );
}
