import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/db';

type AppRole = 'admin' | 'gerente' | 'cliente';

interface Profile {
  id: string;
  name: string;
  email: string;
  empresa: string | null;
  cargo: string | null;
  role: AppRole;
  status: string;
  must_change_password: boolean | null;
  first_access_done: boolean | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    console.log(`[Auth] Buscando perfil para UID: ${userId} ou Email: ${email}`);
    
    // MASTER ADMIN BYPASS: Se o e-mail for o do administrador, carregar perfil mestre imediatamente
    const adminEmail = 'clarifysestrategyresearch@gmail.com';
    if (email === adminEmail) {
      console.log(`[Auth] Master Admin detectado. Aplicando bypass de carregamento.`);
      setProfile({
        id: userId,
        name: 'Administrador Clarifyse',
        email: adminEmail,
        empresa: 'Clarifyse',
        cargo: 'CEO',
        role: 'admin',
        status: 'active',
        must_change_password: false,
        first_access_done: true
      });
      setLoading(false);
      return;
    }

    // Tentar por ID primeiro (comportamento padrão)
    let { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, empresa, cargo, role, status, must_change_password, first_access_done')
      .eq('id', userId)
      .single();

    // Se falhar por ID (comum após migração para Sheets), tentar por Email
    if ((error || !data) && email) {
      console.log(`[Auth] Perfil não encontrado por ID, tentando por e-mail: ${email}`);
      const { data: emailData, error: emailError } = await supabase
        .from('profiles')
        .select('id, name, email, empresa, cargo, role, status, must_change_password, first_access_done')
        .eq('email', email)
        .single();
      
      data = emailData;
      error = emailError;
    }

    if (!error && data) {
      console.log(`[Auth] Perfil carregado com sucesso: ${data.role}`);
      setProfile(data as Profile);
    } else {
      console.error(`[Auth] Erro ao carregar perfil:`, error);
    }
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email);
    }
  }, [user?.id, user?.email, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id, session.user.email), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      supabase.from('profiles').update({ last_sign_in_at: new Date().toISOString() }).eq('id', data.user.id).then(() => {});
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
