import { X, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { STATUS_CONFIG, PRIORIDADE_CONFIG, btnPrimary, btnSecondary, btnDanger, inputStyle } from "../constants/constants";

// ─── MODAL ───────────────────────────────────────────────────
export function Modal({ title, onClose, children, size = "md" }) {
  const widths = { sm: 480, md: 640, lg: 860, xl: 1060 };
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%",
        maxWidth: widths[size], maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid #E5E7EB",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{title}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── FORM FIELD ───────────────────────────────────────────────
export function FormField({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────
export function StatusBadge({ status, size = "sm" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.aguardando;
  const { Icon } = cfg;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: size === "lg" ? "6px 12px" : "3px 8px",
      borderRadius: 20, fontSize: size === "lg" ? 13 : 11,
      fontWeight: 600, background: cfg.bg, color: cfg.text,
      border: `1px solid ${cfg.border}`,
    }}>
      <Icon size={size === "lg" ? 14 : 11} />
      {cfg.label}
    </span>
  );
}

// ─── PRIORIDADE BADGE ─────────────────────────────────────────
export function PrioridadeBadge({ prioridade }) {
  const cfg = PRIORIDADE_CONFIG[prioridade] || PRIORIDADE_CONFIG.normal;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px",
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── LIST PAGE WRAPPER ────────────────────────────────────────
export function ListPage({ title, icon: Icon, onNew, count, busca, setBusca, children }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {Icon && (
            <div style={{ background: "#F5F3FF", borderRadius: 10, padding: 10 }}>
              <Icon size={20} color="#7C3AED" />
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>{title}</h1>
        </div>
        <button onClick={onNew} style={btnPrimary}>
          <Plus size={16} /> Novo
        </button>
      </div>

      <div style={{
        background: "#fff", borderRadius: 12, padding: 14, marginBottom: 16,
        border: "1px solid #E5E7EB", display: "flex", gap: 10, alignItems: "center",
      }}>
        <Search size={14} color="#9CA3AF" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar..."
          style={{ border: "none", outline: "none", fontSize: 14, flex: 1, color: "#111827" }}
        />
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{count} itens</span>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ─── TABLE HEAD ───────────────────────────────────────────────
export function TableHead({ cols }) {
  return (
    <thead>
      <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
        {cols.map(c => (
          <th key={c} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12 }}>
            {c}
          </th>
        ))}
        <th style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280" }}>Ações</th>
      </tr>
    </thead>
  );
}

// ─── ACTION BUTTONS ───────────────────────────────────────────
export function ActionButtons({ onEdit, onDelete }) {
  return (
    <td style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onEdit} style={{ ...btnSecondary, padding: "5px 10px", fontSize: 12 }}>
          <Edit2 size={12} />
        </button>
        <button onClick={onDelete} style={{ ...btnDanger, padding: "5px 10px" }}>
          <Trash2 size={12} />
        </button>
      </div>
    </td>
  );
}

// ─── EMPTY ROW ────────────────────────────────────────────────
export function EmptyRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols + 1} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>
        Nenhum registro encontrado
      </td>
    </tr>
  );
}

// ─── LOADING ROW ──────────────────────────────────────────────
export function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols + 1} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>
        Carregando...
      </td>
    </tr>
  );
}
