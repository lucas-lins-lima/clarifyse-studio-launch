/**
 * Tipos compartilhados entre cliente e servidor
 * Arquitetura JSON-first para Clarifyse Studio
 */

// ============ AUTENTICAÇÃO ============
export type UserRole = 'admin' | 'pesquisador';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // Hash bcrypt
  role: UserRole;
  createdAt: string; // ISO timestamp
  lastLogin: string | null;
  status: 'ativo' | 'inativo';
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: string;
}

// ============ PROJETOS ============
export type ProjectStatus = 'rascunho' | 'ativo' | 'pausado' | 'encerrado';

export interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  status: ProjectStatus;
  researcherId: string;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string | null;
  sampleSize: number;
  currentResponses: number;
  formId: string;
  quotas: Quota[];
  isPublished: boolean;
  publicLinks: PublicLink[];
}

// ============ FORMULÁRIOS ============
export type QuestionType = 'likert' | 'multipleChoice' | 'shortText' | 'longText' | 'nps' | 'email';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  options?: QuestionOption[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minValue?: number;
    maxValue?: number;
  };
  skipLogic?: {
    condition: string;
    targetQuestionId: string;
  };
}

export interface Form {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  estimatedTime: number; // em minutos
}

// ============ COTAS DEMOGRÁFICAS ============
export type QuotaType = 'genero' | 'faixaEtaria' | 'categoria' | 'customizado';

export interface QuotaOption {
  id: string;
  label: string;
  target: number;
  current: number;
  subcategories?: QuotaOption[];
}

export interface Quota {
  id: string;
  projectId: string;
  type: QuotaType;
  name: string;
  isRequired: boolean;
  isMandatory: boolean;
  options: QuotaOption[];
  order: number;
}

// ============ COLETA DE RESPOSTAS ============
export interface PublicLink {
  id: string;
  projectId: string;
  slug: string;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  responseCount: number;
}

export interface Answer {
  questionId: string;
  value: string | string[] | number;
  timestamp: string;
}

export interface Response {
  id: string;
  projectId: string;
  formId: string;
  linkId: string;
  answers: Answer[];
  quotaData: Record<string, string>; // Dados de quota do respondente
  ipHash: string;
  userAgent: string;
  startTime: string;
  endTime: string;
  duration: number; // em segundos
  status: 'completa' | 'incompleta' | 'abandonada';
  flags: {
    speedFlag: boolean;
    duplicateIpFlag: boolean;
    incompleteFlag: boolean;
  };
}

// ============ ALERTAS ============
export type AlertType = 'quota_atingida' | 'sem_respostas' | 'exclusao_proxima' | 'erro_integracao';

export interface Alert {
  id: string;
  projectId: string;
  type: AlertType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

// ============ LOGS DE ATIVIDADE ============
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'project' | 'form' | 'response' | 'user' | 'quota';
  entityId: string;
  changes?: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
}

// ============ EXPORTAÇÃO ============
export interface ExportOptions {
  format: 'csv' | 'excel';
  includeMetadata: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  quotaFilters?: Record<string, string[]>;
}

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  metadata?: {
    projectName: string;
    exportDate: string;
    totalResponses: number;
  };
}
