import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUsuario(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUsuario(session.user.id);
      else { setUsuario(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUsuario = async (authId) => {
    const { data } = await supabase
      .from("usuarios")
      .select("*, funcionarios(nome, email, cargo_id, cargos(nome))")
      .eq("auth_user_id", authId)
      .single();
    setUsuario(data);
    setLoading(false);
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ user, usuario, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
