import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  createdAt: string;
}

interface ActivityState {
  logs: ActivityLog[];
  addLog: (data: Omit<ActivityLog, "id" | "createdAt">) => void;
  getRecentLogs: (limit?: number) => ActivityLog[];
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (data) => {
        const log: ActivityLog = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set({ logs: [log, ...get().logs].slice(0, 500) });
      },

      getRecentLogs: (limit = 20) => get().logs.slice(0, limit),
    }),
    { name: "clarifyse-activity" }
  )
);
