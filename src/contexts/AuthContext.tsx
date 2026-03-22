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
  requiresPasswordChange?: boolean;
}

interface AuthContextType {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Gerar senha temporária segura
const generateSecurePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const MOCK_USERS = [
  {
    id: 'admin-clarifyse',
    email: 'clarifysestrategyresearch@gmail.com',
    password: 'Clarifyse2026!',
    tempPassword: null as string | null,
    profile: {
      id: 'admin-clarifyse',
      name: 'Admin Clarifyse Strategy',
      email: 'clarifysestrategyresearch@gmail.com',
      empresa: 'Clarifyse Strategy & Research',
      cargo: 'Administrador',
      role: 'admin' as AppRole,
      status: 'active',
      requiresPasswordChange: false
    }
  },
  {
    id: '1',
    email: 'admin@clarifyse.com',
    password: 'admin',
    tempPassword: null as string | null,
    profile: {
      id: '1',
      name: 'Administrador Clarifyse',
      email: 'admin@clarifyse.com',
      empresa: 'Clarifyse',
      cargo: 'Diretor de Pesquisa',
      role: 'admin' as AppRole,
      status: 'active',
      requiresPasswordChange: false
    }
  },
  {
    id: '2',
    email: 'pesquisador@clarifyse.com',
    password: '123',
    tempPassword: null as string | null,
    profile: {
      id: '2',
      name: 'Pesquisador Sênior',
      email: 'pesquisador@clarifyse.com',
      empresa: 'Clarifyse',
      cargo: 'Analista de Mercado',
      role: 'pesquisador' as AppRole,
      status: 'active',
      requiresPasswordChange: false
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
    // Carregar usuários do localStorage se houver (para permitir mudanças de senha persistentes)
    const storedUsers = localStorage.getItem('surveyForgeUsers');
    const usersToCheck = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;
    
    const mockUser = usersToCheck.find((u: any) => u.email === email && (u.password === password || u.tempPassword === password));
    
    if (mockUser) {
      // Se foi usado tempPassword, marcar que precisa trocar
      const requiresChange = mockUser.tempPassword === password && mockUser.tempPassword !== null;
      
      const sessionData = {
        user: { id: mockUser.id, email: mockUser.email },
        profile: {
          ...mockUser.profile,
          requiresPasswordChange: requiresChange
        }
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

  const changePassword = async (newPassword: string) => {
    if (!user || !profile) {
      return { error: 'Usuário não autenticado.' };
    }

    try {
      // Carregar usuários do localStorage
      const storedUsers = localStorage.getItem('surveyForgeUsers');
      const users = storedUsers ? JSON.parse(storedUsers) : JSON.parse(JSON.stringify(MOCK_USERS));
      
      // Encontrar e atualizar o usuário
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      if (userIndex === -1) {
        return { error: 'Usuário não encontrado.' };
      }

      users[userIndex].password = newPassword;
      users[userIndex].tempPassword = null;
      users[userIndex].profile.requiresPasswordChange = false;

      // Salvar no localStorage
      localStorage.setItem('surveyForgeUsers', JSON.stringify(users));

      // Atualizar sessão
      const updatedProfile = {
        ...profile,
        requiresPasswordChange: false
      };
      const sessionData = {
        user,
        profile: updatedProfile
      };
      localStorage.setItem('surveyForgeSession', JSON.stringify(sessionData));
      setProfile(updatedProfile);

      return { error: null };
    } catch (err) {
      return { error: 'Erro ao alterar senha.' };
    }
  };

  const refreshProfile = useCallback(async () => {
    // No-op for mock auth
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut, refreshProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// Função utilitária para gerar e atribuir senha temporária a um usuário
export function setTemporaryPassword(userId: string): string {
  const tempPassword = generateSecurePassword();
  const storedUsers = localStorage.getItem('surveyForgeUsers');
  const users = storedUsers ? JSON.parse(storedUsers) : JSON.parse(JSON.stringify(MOCK_USERS));
  
  const userIndex = users.findIndex((u: any) => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].tempPassword = tempPassword;
    users[userIndex].profile.requiresPasswordChange = true;
    localStorage.setItem('surveyForgeUsers', JSON.stringify(users));
  }
  
  return tempPassword;
}
