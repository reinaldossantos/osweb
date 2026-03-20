import { useState } from "react";
import { FileText, Eye, EyeOff, ArrowLeft, UserPlus, KeyRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

// ─── Tela de Login ────────────────────────────────────────────
function TelaLogin({ onCadastro, onEsqueceu }) {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(form.email, form.password);
    } catch {
      toast.error("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width:60, height:60, borderRadius:16, background:"linear-gradient(135deg,#7C3AED,#A78BFA)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 8px 28px rgba(124,58,237,0.4)" }}>
          <FileText size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize:26, fontWeight:800, color:"#0F172A", letterSpacing:"-0.5px", margin:0 }}>OSWeb 1.0</h1>
        <p style={{ margin:"6px 0 0", color:"#64748B", fontSize:14 }}>Sistema de Ordens de Serviço</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Email</label>
          <input type="email" value={form.email} required
            onChange={e => setForm({...form, email:e.target.value})}
            placeholder="seu@email.com"
            style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, color:"#0F172A", outline:"none", background:"#F8FAFC", boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor="#7C3AED"}
            onBlur={e => e.target.style.borderColor="#E2E8F0"}
          />
        </div>

        <div style={{ marginBottom:8 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Senha</label>
          <div style={{ position:"relative" }}>
            <input type={showPass?"text":"password"} value={form.password} required
              onChange={e => setForm({...form, password:e.target.value})}
              placeholder="••••••••"
              style={{ width:"100%", padding:"11px 44px 11px 14px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, color:"#0F172A", outline:"none", background:"#F8FAFC", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor="#7C3AED"}
              onBlur={e => e.target.style.borderColor="#E2E8F0"}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", border:"none", background:"none", cursor:"pointer", color:"#94A3B8", padding:0 }}>
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>

        <div style={{ textAlign:"right", marginBottom:24 }}>
          <button type="button" onClick={onEsqueceu}
            style={{ border:"none", background:"none", color:"#7C3AED", fontSize:13, cursor:"pointer", fontWeight:600, padding:0 }}>
            Esqueceu a senha?
          </button>
        </div>

        <button type="submit" disabled={loading}
          style={{ width:"100%", padding:13, background: loading?"#A78BFA":"linear-gradient(135deg,#7C3AED,#9333EA)", color:"#fff", border:"none", borderRadius:10, fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:"0 4px 16px rgba(124,58,237,0.4)", transition:"all 0.2s" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div style={{ textAlign:"center", marginTop:20 }}>
        <span style={{ fontSize:13, color:"#64748B" }}>Não tem conta? </span>
        <button type="button" onClick={onCadastro}
          style={{ border:"none", background:"none", color:"#7C3AED", fontSize:13, cursor:"pointer", fontWeight:700, padding:0 }}>
          Solicitar acesso
        </button>
      </div>
    </>
  );
}

// ─── Tela de Cadastro ─────────────────────────────────────────
function TelaCadastro({ onVoltar }) {
  const [form, setForm] = useState({ nome: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres."); return; }
    if (form.password !== form.confirm) { toast.error("As senhas não conferem."); return; }
    if (!form.nome.trim()) { toast.error("Informe seu nome completo."); return; }

    setLoading(true);
    try {
      // 1. Cria conta no Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authErr) throw authErr;
      if (!authData?.user) throw new Error("Usuário não criado.");

      // 2. Cria funcionário e usuário como perfil básico
      const { data: func, error: funcErr } = await supabase.from("funcionarios")
        .insert({ nome: form.nome.trim(), email: form.email })
        .select().single();
      if (funcErr) throw funcErr;

      const { error: usuErr } = await supabase.from("usuarios").insert({
        funcionario_id: func.id,
        auth_user_id: authData.user.id,
        perfil: "basico",
      });
      if (usuErr) throw usuErr;

      setOk(true);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("already registered")) toast.error("Este email já está cadastrado.");
      else toast.error("Erro ao criar conta: " + msg);
    } finally {
      setLoading(false);
    }
  };

  if (ok) return (
    <div style={{ textAlign:"center" }}>
      <div style={{ width:60, height:60, borderRadius:"50%", background:"#DCFCE7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
        <UserPlus size={28} color="#16A34A"/>
      </div>
      <h2 style={{ margin:"0 0 10px", color:"#0F172A", fontSize:20, fontWeight:800 }}>Conta criada!</h2>
      <p style={{ color:"#64748B", fontSize:14, margin:"0 0 8px" }}>
        Seu acesso foi cadastrado com perfil <strong>básico</strong>.
      </p>
      <p style={{ color:"#64748B", fontSize:13, margin:"0 0 24px" }}>
        Se o Supabase exigir confirmação de email, verifique sua caixa de entrada antes de logar.
      </p>
      <button onClick={onVoltar}
        style={{ background:"linear-gradient(135deg,#7C3AED,#9333EA)", color:"#fff", border:"none", padding:"11px 28px", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer" }}>
        Ir para o Login
      </button>
    </div>
  );

  return (
    <>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
        <button onClick={onVoltar} style={{ border:"none", background:"#F1F5F9", borderRadius:8, padding:"6px 8px", cursor:"pointer", display:"flex", color:"#64748B" }}>
          <ArrowLeft size={16}/>
        </button>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#0F172A" }}>Solicitar acesso</h2>
          <p style={{ margin:0, fontSize:12, color:"#64748B" }}>Conta criada com perfil básico</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {[
          { label:"Nome completo", key:"nome", type:"text", placeholder:"Seu nome" },
          { label:"Email",         key:"email", type:"email", placeholder:"seu@email.com" },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>{label}</label>
            <input type={type} value={form[key]} required placeholder={placeholder}
              onChange={e => setForm(f => ({...f, [key]:e.target.value}))}
              style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, color:"#0F172A", outline:"none", background:"#F8FAFC", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor="#7C3AED"}
              onBlur={e => e.target.style.borderColor="#E2E8F0"}
            />
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Senha</label>
          <div style={{ position:"relative" }}>
            <input type={showPass?"text":"password"} value={form.password} required minLength={6}
              onChange={e => setForm(f => ({...f, password:e.target.value}))}
              placeholder="Mínimo 6 caracteres"
              style={{ width:"100%", padding:"10px 44px 10px 14px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, outline:"none", background:"#F8FAFC", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor="#7C3AED"}
              onBlur={e => e.target.style.borderColor="#E2E8F0"}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", border:"none", background:"none", cursor:"pointer", color:"#94A3B8" }}>
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>

        <div style={{ marginBottom:22 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Confirmar Senha</label>
          <input type="password" value={form.confirm} required
            onChange={e => setForm(f => ({...f, confirm:e.target.value}))}
            placeholder="Repita a senha"
            style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, outline:"none", background:"#F8FAFC", boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor="#7C3AED"}
            onBlur={e => e.target.style.borderColor="#E2E8F0"}
          />
        </div>

        <button type="submit" disabled={loading}
          style={{ width:"100%", padding:12, background:loading?"#A78BFA":"linear-gradient(135deg,#7C3AED,#9333EA)", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:"0 4px 14px rgba(124,58,237,0.35)" }}>
          {loading ? "Criando conta..." : "Criar minha conta"}
        </button>
      </form>
    </>
  );
}

// ─── Tela de Esqueceu Senha ───────────────────────────────────
function TelaEsqueceuSenha({ onVoltar }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/?reset=1",
      });
      if (error) throw error;
      setEnviado(true);
    } catch (err) {
      toast.error("Erro ao enviar email: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (enviado) return (
    <div style={{ textAlign:"center" }}>
      <div style={{ width:60, height:60, borderRadius:"50%", background:"#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
        <KeyRound size={28} color="#7C3AED"/>
      </div>
      <h2 style={{ margin:"0 0 10px", color:"#0F172A", fontSize:20, fontWeight:800 }}>Email enviado!</h2>
      <p style={{ color:"#64748B", fontSize:14, margin:"0 0 6px" }}>
        Verifique sua caixa de entrada em <strong>{email}</strong>.
      </p>
      <p style={{ color:"#64748B", fontSize:13, margin:"0 0 24px" }}>
        Clique no link do email para redefinir sua senha. Verifique também o spam.
      </p>
      <button onClick={onVoltar}
        style={{ background:"linear-gradient(135deg,#7C3AED,#9333EA)", color:"#fff", border:"none", padding:"11px 28px", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer" }}>
        Voltar ao Login
      </button>
    </div>
  );

  return (
    <>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
        <button onClick={onVoltar} style={{ border:"none", background:"#F1F5F9", borderRadius:8, padding:"6px 8px", cursor:"pointer", display:"flex", color:"#64748B" }}>
          <ArrowLeft size={16}/>
        </button>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#0F172A" }}>Recuperar senha</h2>
          <p style={{ margin:0, fontSize:12, color:"#64748B" }}>Enviaremos um link para seu email</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom:22 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Email cadastrado</label>
          <input type="email" value={email} required
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, color:"#0F172A", outline:"none", background:"#F8FAFC", boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor="#7C3AED"}
            onBlur={e => e.target.style.borderColor="#E2E8F0"}
          />
          <p style={{ margin:"8px 0 0", fontSize:12, color:"#94A3B8" }}>
            Um link de redefinição será enviado para este email.
          </p>
        </div>

        <button type="submit" disabled={loading}
          style={{ width:"100%", padding:12, background:loading?"#A78BFA":"linear-gradient(135deg,#7C3AED,#9333EA)", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:"0 4px 14px rgba(124,58,237,0.35)" }}>
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>
    </>
  );
}

// ─── Página Principal ─────────────────────────────────────────
export default function LoginPage() {
  const [tela, setTela] = useState("login"); // "login" | "cadastro" | "esqueceu"

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(145deg,#1A0533 0%,#4C1D95 50%,#7C3AED 100%)", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 38px", width:"100%", maxWidth:400, boxShadow:"0 32px 80px rgba(0,0,0,0.35)" }}>
        {tela === "login"    && <TelaLogin onCadastro={() => setTela("cadastro")} onEsqueceu={() => setTela("esqueceu")} />}
        {tela === "cadastro" && <TelaCadastro onVoltar={() => setTela("login")} />}
        {tela === "esqueceu" && <TelaEsqueceuSenha onVoltar={() => setTela("login")} />}
        <p style={{ textAlign:"center", marginTop:24, fontSize:12, color:"#CBD5E1" }}>
          Gestão de O.S. · OSWeb 1.0
        </p>
      </div>
    </div>
  );
}
