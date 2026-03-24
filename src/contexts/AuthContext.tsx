import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/db';
import { authenticateUser, changePassword as dbChangePassword, getUserById } from '@/lib/surveyForgeDB';

export type AppRole = 'admin' | 'pesquisador' | 'cliente' | 'gerente';

export interface Profile {
  id: string;
  name: string;
  email: string;
  empresa: string | null;
  cargo: string | null;
  role: AppRole;
  status: string;
  requiresPasswordChange: boolean;
}

interface AuthContextType {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'surveyForgeSession';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // CRITICAL FIX: Initialize Supabase session on mount
  // This replaces the insecure localStorage-only authentication approach
  // =========================================================================

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if Supabase is properly configured
        const supabaseConfigured = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (supabaseConfigured) {
          // Try to get existing session from Supabase
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();

          if (supabaseSession?.user) {
            // User has valid Supabase session
            setSession(supabaseSession);
            setUser({ id: supabaseSession.user.id, email: supabaseSession.user.email });

            // Load profile from database
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', supabaseSession.user.id)
              .single();

            if (profileData) {
              setProfile({
                id: profileData.id,
                name: profileData.name,
                email: profileData.email,
                empresa: profileData.empresa,
                cargo: profileData.cargo,
                role: profileData.role as AppRole,
                status: profileData.status,
                requiresPasswordChange: profileData.requires_password_change
              });
            }
          }
        } else {
          // Fallback to localStorage for local development
          const savedSession = localStorage.getItem(SESSION_KEY);
          if (savedSession) {
            try {
              const sessionData = JSON.parse(savedSession);
              setSession(sessionData);
              setUser(sessionData.user);
              setProfile(sessionData.profile);
            } catch (err) {
              console.error('Erro ao carregar sessão:', err);
              localStorage.removeItem(SESSION_KEY);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        // Fallback to localStorage
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            setSession(sessionData);
            setUser(sessionData.user);
            setProfile(sessionData.profile);
          } catch (err) {
            console.error('Erro ao carregar sessão fallback:', err);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const supabaseConfigured = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (supabaseConfigured) {
        // CRITICAL: Use Supabase Auth for login (not localStorage hashing)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error: error.message || 'Erro ao fazer login.' };
        }

        if (data.session?.user) {
          setSession(data.session);
          setUser({ id: data.session.user.id, email: data.session.user.email });

          // Load profile from database
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profileData) {
            const userProfile: Profile = {
              id: profileData.id,
              name: profileData.name,
              email: profileData.email,
              empresa: profileData.empresa,
              cargo: profileData.cargo,
              role: profileData.role as AppRole,
              status: profileData.status,
              requiresPasswordChange: profileData.requires_password_change
            };
            setProfile(userProfile);
            return { error: null };
          }
        }
      } else {
        // Fallback to localStorage for local development
        const localUser = authenticateUser(email, password);
        if (!localUser) {
          return { error: 'E-mail ou senha inválidos.' };
        }

        const userProfile: Profile = {
          id: localUser.id,
          name: localUser.name,
          email: localUser.email,
          empresa: localUser.empresa,
          cargo: localUser.cargo,
          role: localUser.role,
          status: localUser.status,
          requiresPasswordChange: localUser.requiresPasswordChange
        };

        const sessionData = {
          user: { id: localUser.id, email: localUser.email },
          profile: userProfile
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        setSession(sessionData);
        setUser(sessionData.user);
        setProfile(userProfile);
        return { error: null };
      }

      return { error: 'Erro ao fazer login.' };
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      return { error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const signOut = async () => {
    try {
      const supabaseConfigured = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (supabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Erro ao fazer logout no Supabase:', error);
    }

    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const changePassword = async (newPassword: string) => {
    if (!user) {
      return { error: 'Usuário não autenticado.' };
    }

    try {
      const supabaseConfigured = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (supabaseConfigured) {
        // CRITICAL: Use Supabase for password change (not localStorage)
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
          return { error: error.message || 'Erro ao alterar senha.' };
        }

        // Update profile flag in database
        await supabase
          .from('user_profiles')
          .update({ requires_password_change: false })
          .eq('id', user.id);

        if (profile) {
          setProfile({ ...profile, requiresPasswordChange: false });
        }
        return { error: null };
      } else {
        // Fallback to localStorage
        const updatedUser = dbChangePassword(user.id, newPassword);
        if (!updatedUser) {
          return { error: 'Erro ao alterar senha.' };
        }

        const updatedProfile: Profile = {
          ...profile!,
          requiresPasswordChange: false
        };

        const sessionData = {
          user,
          profile: updatedProfile
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        setProfile(updatedProfile);
        return { error: null };
      }
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      return { error: 'Erro ao alterar senha.' };
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const supabaseConfigured = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (supabaseConfigured) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          const updatedProfile: Profile = {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            empresa: profileData.empresa,
            cargo: profileData.cargo,
            role: profileData.role as AppRole,
            status: profileData.status,
            requiresPasswordChange: profileData.requires_password_change
          };
          setProfile(updatedProfile);
        }
      } else {
        const updatedUser = getUserById(user.id);
        if (updatedUser) {
          const updatedProfile: Profile = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            empresa: updatedUser.empresa,
            cargo: updatedUser.cargo,
            role: updatedUser.role,
            status: updatedUser.status,
            requiresPasswordChange: updatedUser.requiresPasswordChange
          };
          setProfile(updatedProfile);
          const sessionData = { user, profile: updatedProfile };
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
    }
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut, changePassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
