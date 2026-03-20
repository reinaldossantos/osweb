import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { OrdensServico, NovaOS } from "./pages/OrdensServico";
import Relatorios from "./pages/Relatorios";
import Agenda from "./pages/Agenda";
import {
  PageClientes,
  PageFuncionarios,
  PageCargos,
  PageServicos,
  PageEtapas,
  PageTiposOS,
  PageFormasPagto,
  PageUsuarios,
} from "./pages/CrudPages";
import { NAV_ITEMS } from "./constants/constants";
import { FileText, Menu, User, LogOut, ChevronRight } from "lucide-react";

// ─── SIDEBAR ──────────────────────────────────────────────────
function Sidebar({ page, setPage, sidebarOpen, usuario, signOut, isAdmin }) {
  const navFiltered = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside
      style={{
        width: 252,
        flexShrink: 0,
        background: "#130F23",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.2s",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "22px 20px 16px",
          borderBottom: "1px solid #1E293B",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: "#7C3AED",
              borderRadius: 10,
              padding: 8,
              flexShrink: 0,
            }}
          >
            <FileText size={20} color="#fff" />
          </div>
          <div>
            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "-0.3px",
              }}
            >
              OSWeb 1.7
            </div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 1 }}>
              Gestão de O.S.
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {navFiltered.map((item, i) => {
          if (item.key.startsWith("divider")) {
            return (
              <div
                key={i}
                style={{ height: 1, background: "#1E293B", margin: "6px 8px" }}
              />
            );
          }
          const { Icon } = item;
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: active ? "#5B21B6" : "transparent",
                color: active ? "#FFFFFF" : "#94A3B8",
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                marginBottom: 1,
                transition: "all 0.12s",
                textAlign: "left",
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: "nowrap", flex: 1 }}>
                {item.label}
              </span>
              {active && <ChevronRight size={12} style={{ opacity: 0.7 }} />}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "10px 8px 14px",
          borderTop: "1px solid #1E293B",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "8px 12px", marginBottom: 2 }}>
          <div
            style={{
              color: "#E2E8F0",
              fontSize: 13,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {usuario?.funcionarios?.nome || "Usuário"}
          </div>
          <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>
            {usuario?.perfil === "admin" ? "Administrador" : "Usuário básico"}
          </div>
        </div>
        <button
          onClick={signOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: "#64748B",
            fontSize: 13,
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1E293B";
            e.currentTarget.style.color = "#94A3B8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748B";
          }}
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  );
}

// ─── APP CONTENT ──────────────────────────────────────────────
function AppContent() {
  const { user, usuario, loading, signOut } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#7C3AED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <FileText size={26} color="#fff" />
          </div>
          <p style={{ color: "#94A3B8", fontSize: 14, margin: 0 }}>
            Carregando sistema...
          </p>
        </div>
      </div>
    );

  if (!user) return <LoginPage />;

  const isAdmin = usuario?.perfil === "admin";

  const renderContent = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard />;
      case "nova_os":
        return (
          <div>
            <h1
              style={{
                margin: "0 0 24px",
                fontSize: 22,
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              Nova Ordem de Serviço
            </h1>
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 28,
                border: "1px solid #E2E8F0",
              }}
            >
              <NovaOS onSaved={() => setPage("ordens_servico")} />
            </div>
          </div>
        );
      case "ordens_servico":
        return <OrdensServico />;
      case "clientes":
        return <PageClientes />;
      case "funcionarios":
        return <PageFuncionarios />;
      case "cargos":
        return <PageCargos />;
      case "servicos":
        return <PageServicos />;
      case "etapas":
        return <PageEtapas />;
      case "tipos_os":
        return <PageTiposOS />;
      case "formas_pagamento":
        return <PageFormasPagto />;
      case "usuarios":
        return isAdmin ? (
          <PageUsuarios />
        ) : (
          <p style={{ color: "#EF4444" }}>Acesso restrito.</p>
        );
      case "relatorios":
        return <Relatorios />;
      case "agenda":
        return <Agenda />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#F1F5F9",
      }}
    >
      {/* Sidebar — sticky, não rola com o conteúdo */}
      {sidebarOpen && (
        <Sidebar
          page={page}
          setPage={setPage}
          sidebarOpen={sidebarOpen}
          usuario={usuario}
          signOut={signOut}
          isAdmin={isAdmin}
        />
      )}

      {/* Main — coluna direita, rola independente */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Topbar */}
        <header
          style={{
            background: "#fff",
            padding: "0 24px",
            height: 56,
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
            zIndex: 50,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#64748B",
              padding: 6,
              borderRadius: 6,
              display: "flex",
            }}
          >
            <Menu size={20} />
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#7C3AED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={16} color="#fff" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "#0F172A",
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {usuario?.funcionarios?.nome || "Usuário"}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                {usuario?.perfil === "admin" ? "Administrador" : "Básico"}
              </div>
            </div>
          </div>
        </header>

        {/* Page content — rola verticalmente */}
        <main
          key={page}
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
        >
          <div
            style={{
              padding: "28px 32px",
              maxWidth: 1400,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {renderContent()}
          </div>
        </main>
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
        toastOptions={{
          duration: 3500,
          style: {
            background: "#130F23",
            color: "#F8FAFC",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 500,
          },
        }}
      />
      <AppContent />
    </AuthProvider>
  );
}
