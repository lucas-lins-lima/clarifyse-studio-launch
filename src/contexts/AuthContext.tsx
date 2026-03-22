import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authenticateUser, changePassword as dbChangePassword, getUserById } from '@/lib/surveyForgeDB';

export type AppRole = 'admin' | 'pesquisador';

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

  // Carregar sessão ao montar
  useEffect(() => {
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
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const user = authenticateUser(email, password);
      if (!user) {
        return { error: 'E-mail ou senha inválidos.' };
      }

      const profile: Profile = {
        id: user.id,
        name: user.name,
        email: user.email,
        empresa: user.empresa,
        cargo: user.cargo,
        role: user.role,
        status: user.status,
        requiresPasswordChange: user.requiresPasswordChange
      };

      const sessionData = {
        user: { id: user.id, email: user.email },
        profile
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setSession(sessionData);
      setUser(sessionData.user);
      setProfile(profile);

      return { error: null };
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      return { error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const signOut = async () => {
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
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      return { error: 'Erro ao alterar senha.' };
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
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
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
    }
  }, [user]);

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
