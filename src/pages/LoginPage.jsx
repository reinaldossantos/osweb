import { useState } from "react";
import { FileText } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { FormField } from "../components/components";
import { inputStyle, btnPrimary } from "../constants/constants";
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
      toast.success("Login realizado com sucesso!");
    } catch {
      toast.error("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 50%, #2563EB 100%)",
    }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 48, width: "100%", maxWidth: 400, boxShadow: "0 25px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <FileText size={32} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111827" }}>VisualOS</h1>
          <p style={{ margin: "6px 0 0", color: "#6B7280", fontSize: 14 }}>Sistema de Ordens de Serviço</p>
        </div>
        <form onSubmit={handleSubmit}>
          <FormField label="Email">
            <input type="email" value={form.email} required onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="seu@email.com" />
          </FormField>
          <FormField label="Senha">
            <input type="password" value={form.password} required onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} placeholder="••••••••" />
          </FormField>
          <button type="submit" disabled={loading} style={{ ...btnPrimary, width: "100%", justifyContent: "center", padding: "12px", marginTop: 8 }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
