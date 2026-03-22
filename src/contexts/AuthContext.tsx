import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type AppRole = 'admin' | 'pesquisador';

interface Profile {
  id: string;
  name: string;
  email: string;
  empresa: string | null;
  cargo: string | null;
  role: AppRole;
  status: string;
}

interface AuthContextType {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS = [
  {
    id: 'admin-clarifyse',
    email: 'clarifysestrategyresearch@gmail.com',
    password: 'Clarifyse2026!',
    profile: {
      id: 'admin-clarifyse',
      name: 'Admin Clarifyse Strategy',
      email: 'clarifysestrategyresearch@gmail.com',
      empresa: 'Clarifyse Strategy & Research',
      cargo: 'Administrador',
      role: 'admin' as AppRole,
      status: 'active'
    }
  },
  {
    id: '1',
    email: 'admin@clarifyse.com',
    password: 'admin',
    profile: {
      id: '1',
      name: 'Administrador Clarifyse',
      email: 'admin@clarifyse.com',
      empresa: 'Clarifyse',
      cargo: 'Diretor de Pesquisa',
      role: 'admin' as AppRole,
      status: 'active'
    }
  },
  {
    id: '2',
    email: 'pesquisador@clarifyse.com',
    password: '123',
    profile: {
      id: '2',
      name: 'Pesquisador Sênior',
      email: 'pesquisador@clarifyse.com',
      empresa: 'Clarifyse',
      cargo: 'Analista de Mercado',
      role: 'pesquisador' as AppRole,
      status: 'active'
    }
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('surveyForgeSession');
    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      setSession(sessionData);
      setUser(sessionData.user);
      setProfile(sessionData.profile);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (mockUser) {
      const sessionData = {
        user: { id: mockUser.id, email: mockUser.email },
        profile: mockUser.profile
      };
      localStorage.setItem('surveyForgeSession', JSON.stringify(sessionData));
      setSession(sessionData);
      setUser(sessionData.user);
      setProfile(sessionData.profile);
      return { error: null };
    } else {
      return { error: 'E-mail ou senha inválidos.' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('surveyForgeSession');
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = useCallback(async () => {
    // No-op for mock auth
  }, []);

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
