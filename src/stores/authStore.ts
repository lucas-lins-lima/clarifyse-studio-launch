import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "pesquisador";
  status: "ativo" | "inativo";
  firstLogin: boolean;
  password: string;
  createdAt: string;
}

interface AuthState {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  changePassword: (newPassword: string) => void;
  addUser: (user: Omit<User, "id" | "createdAt" | "firstLogin" | "status">) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getResearchers: () => User[];
}

const defaultAdmin: User = {
  id: "admin-001",
  email: "clarifysestrategyresearch@gmail.com",
  name: "Administrador",
  role: "admin",
  status: "ativo",
  firstLogin: true,
  password: "A29c26l03!",
  createdAt: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [defaultAdmin],
      currentUser: null,
      isAuthenticated: false,

      login: (email, password) => {
        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!user) return { success: false, error: "E-mail ou senha incorretos." };
        if (user.status === "inativo") return { success: false, error: "Conta desativada. Contate o administrador." };
        set({ currentUser: user, isAuthenticated: true });
        return { success: true };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      changePassword: (newPassword) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const updated = users.map((u) =>
          u.id === currentUser.id ? { ...u, password: newPassword, firstLogin: false } : u
        );
        const updatedUser = { ...currentUser, password: newPassword, firstLogin: false };
        set({ users: updated, currentUser: updatedUser });
      },

      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: crypto.randomUUID(),
          status: "ativo",
          firstLogin: true,
          createdAt: new Date().toISOString(),
        };
        set({ users: [...get().users, newUser] });
      },

      updateUser: (id, data) => {
        const updated = get().users.map((u) => (u.id === id ? { ...u, ...data } : u));
        set({ users: updated });
        if (get().currentUser?.id === id) {
          set({ currentUser: { ...get().currentUser!, ...data } });
        }
      },

      deleteUser: (id) => {
        set({ users: get().users.filter((u) => u.id !== id) });
      },

      getResearchers: () => get().users.filter((u) => u.role === "pesquisador"),
    }),
    { name: "clarifyse-auth" }
  )
);
