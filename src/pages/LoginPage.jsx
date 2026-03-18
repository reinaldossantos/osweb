import { useState } from "react";
import { FileText } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      toast.success("Login realizado!");
    } catch {
      toast.error("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(145deg, #0F172A 0%, #4C1D95 55%, #7C3AED 100%)",
      padding: 16,
    }}>
      {/* Card */}
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "44px 40px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
            boxShadow: "0 8px 28px rgba(109,40,217,0.45)",
          }}>
            <FileText size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px", margin: 0 }}>
            OSWeb 1.0
          </h1>
          <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: 14, fontWeight: 400 }}>
            Sistema de Ordens de Serviço
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              required
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              style={{
                width: "100%", padding: "11px 14px",
                border: "1.5px solid #E2E8F0", borderRadius: 10,
                fontSize: 14, color: "#0F172A", outline: "none",
                background: "#F8FAFC", transition: "border 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "#A78BFA"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Senha
            </label>
            <input
              type="password"
              value={form.password}
              required
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              style={{
                width: "100%", padding: "11px 14px",
                border: "1.5px solid #E2E8F0", borderRadius: 10,
                fontSize: 14, color: "#0F172A", outline: "none",
                background: "#F8FAFC", transition: "border 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "#A78BFA"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: loading ? "#DDD6FE" : "linear-gradient(135deg, #7C3AED, #A78BFA)",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(109,40,217,0.45)",
              transition: "all 0.2s", letterSpacing: "0.2px",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#CBD5E1" }}>
          Gestão de O.S. · OSWeb 1.0
        </p>
      </div>
    </div>
  );
}
