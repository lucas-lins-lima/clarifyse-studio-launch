import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QuotaTarget {
  id: string;
  category: string;
  target: number;
  current: number;
  isBlocked: boolean;
}

export interface Quota {
  id: string;
  name: string;
  type: string;
  targets: QuotaTarget[];
}

export interface QuestionConfig {
  text: string;
  description?: string;
  required: boolean;
  errorMessage?: string;
  options?: string[];
  hasOther?: boolean;
  min?: number;
  max?: number;
  scalePoints?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  scaleOrientation?: "horizontal" | "vertical";
  maxLength?: number;
  decimalPlaces?: number;
  regexPattern?: string;
  skipLogic?: { questionId: string; value: string; action: "show" | "skip" | "end"; targetQuestionId?: string }[];
  randomizeOptions?: boolean;
  fixFirst?: boolean;
  fixLast?: boolean;
}

export interface Question {
  id: string;
  type: "likert" | "single_select" | "multi_select" | "integer" | "decimal" | "short_text" | "long_text" | "email";
  orderIndex: number;
  config: QuestionConfig;
}

export interface ProjectSettings {
  allowMultipleResponses: boolean;
  requirePassword: boolean;
  password?: string;
  estimatedTime?: number;
  welcomeMessage: string;
  quotaReachedMessage: string;
  sampleCompleteMessage: string;
  thankYouMessage: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientName: string;
  researcherId: string;
  researcherName: string;
  sampleTarget: number;
  sampleCurrent: number;
  status: "draft" | "active" | "paused" | "completed" | "trash";
  settings: ProjectSettings;
  quotas: Quota[];
  questions: Question[];
  slug: string;
  publishedAt: string | null;
  completedAt: string | null;
  dataDeletionAt: string | null;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Response {
  id: string;
  projectId: string;
  respondentHash: string;
  status: "in_progress" | "completed" | "partial";
  answers: Record<string, { value: string; label?: string; timeSpent: number }>;
  startedAt: string;
  completedAt: string | null;
  totalTimeSeconds: number | null;
  ipHash: string;
  deviceInfo: Record<string, string>;
}

interface ProjectState {
  projects: Project[];
  responses: Response[];
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt" | "slug" | "sampleCurrent" | "publishedAt" | "completedAt" | "dataDeletionAt" | "trashedAt" | "questions">) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  trashProject: (id: string) => void;
  restoreProject: (id: string) => void;
  duplicateProject: (id: string) => Project | null;
  getProjectsByResearcher: (researcherId: string) => Project[];
  getActiveProjects: () => Project[];
  addResponse: (response: Omit<Response, "id">) => void;
  getResponsesByProject: (projectId: string) => Response[];
}

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      responses: [],

      addProject: (data) => {
        const now = new Date().toISOString();
        const newProject: Project = {
          ...data,
          id: crypto.randomUUID(),
          slug: generateSlug(data.name),
          sampleCurrent: 0,
          questions: [],
          publishedAt: null,
          completedAt: null,
          dataDeletionAt: null,
          trashedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set({ projects: [...get().projects, newProject] });
        return newProject;
      },

      updateProject: (id, data) => {
        const updated = get().projects.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        );
        set({ projects: updated });
      },

      deleteProject: (id) => {
        set({ projects: get().projects.filter((p) => p.id !== id) });
      },

      trashProject: (id) => {
        const updated = get().projects.map((p) =>
          p.id === id ? { ...p, status: "trash" as const, trashedAt: new Date().toISOString() } : p
        );
        set({ projects: updated });
      },

      restoreProject: (id) => {
        const updated = get().projects.map((p) =>
          p.id === id ? { ...p, status: "draft" as const, trashedAt: null } : p
        );
        set({ projects: updated });
      },

      duplicateProject: (id) => {
        const original = get().projects.find((p) => p.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const dup: Project = {
          ...original,
          id: crypto.randomUUID(),
          name: `[Cópia] ${original.name}`,
          slug: generateSlug(`copia-${original.name}`),
          status: "draft",
          sampleCurrent: 0,
          clientName: "",
          publishedAt: null,
          completedAt: null,
          dataDeletionAt: null,
          trashedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set({ projects: [...get().projects, dup] });
        return dup;
      },

      getProjectsByResearcher: (researcherId) =>
        get().projects.filter((p) => p.researcherId === researcherId && p.status !== "trash"),

      getActiveProjects: () => get().projects.filter((p) => p.status === "active"),

      addResponse: (data) => {
        const response: Response = { ...data, id: crypto.randomUUID() };
        set({ responses: [...get().responses, response] });
        // Update sample current
        if (data.status === "completed") {
          const project = get().projects.find((p) => p.id === data.projectId);
          if (project) {
            get().updateProject(data.projectId, { sampleCurrent: project.sampleCurrent + 1 });
          }
        }
      },

      getResponsesByProject: (projectId) =>
        get().responses.filter((r) => r.projectId === projectId),
    }),
    { name: "clarifyse-projects" }
  )
);
