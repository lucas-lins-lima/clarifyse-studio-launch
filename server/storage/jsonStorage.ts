/**
 * Sistema de armazenamento JSON para Clarifyse Studio
 * Gerencia leitura, escrita e sincronização de dados em arquivos JSON
 */

import fs from 'fs/promises';
import path from 'path';
import { User, Project, Form, Response, Alert, ActivityLog, Quota, PublicLink } from '../../shared/types';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');

// Estrutura de dados
interface DataStore {
  users: User[];
  projects: Project[];
  forms: Form[];
  responses: Response[];
  alerts: Alert[];
  activityLogs: ActivityLog[];
  quotas: Quota[];
  publicLinks: PublicLink[];
}

// Inicializar estrutura padrão
const DEFAULT_DATA: DataStore = {
  users: [],
  projects: [],
  forms: [],
  responses: [],
  alerts: [],
  activityLogs: [],
  quotas: [],
  publicLinks: [],
};

/**
 * Garante que o diretório de dados existe
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Erro ao criar diretório de dados:', error);
  }
}

/**
 * Obtém o caminho completo de um arquivo JSON
 */
function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

/**
 * Lê um arquivo JSON com tratamento de erro
 */
async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    await ensureDataDir();
    const filePath = getFilePath(filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Arquivo não existe, retorna valor padrão
      return defaultValue;
    }
    console.error(`Erro ao ler ${filename}:`, error);
    return defaultValue;
  }
}

/**
 * Escreve um arquivo JSON com formatação
 */
async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  try {
    await ensureDataDir();
    const filePath = getFilePath(filename);
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`Erro ao escrever ${filename}:`, error);
    throw error;
  }
}

/**
 * Cache em memória para melhor performance
 */
let cache: Partial<DataStore> = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 segundos

/**
 * Verifica se o cache está válido
 */
function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_DURATION;
}

/**
 * Invalida o cache
 */
function invalidateCache(): void {
  cache = {};
  cacheTimestamp = 0;
}

/**
 * Carrega todos os dados do armazenamento
 */
export async function loadAllData(): Promise<DataStore> {
  if (isCacheValid() && Object.keys(cache).length > 0) {
    return cache as DataStore;
  }

  const data: DataStore = {
    users: await readJsonFile('users.json', DEFAULT_DATA.users),
    projects: await readJsonFile('projects.json', DEFAULT_DATA.projects),
    forms: await readJsonFile('forms.json', DEFAULT_DATA.forms),
    responses: await readJsonFile('responses.json', DEFAULT_DATA.responses),
    alerts: await readJsonFile('alerts.json', DEFAULT_DATA.alerts),
    activityLogs: await readJsonFile('activityLogs.json', DEFAULT_DATA.activityLogs),
    quotas: await readJsonFile('quotas.json', DEFAULT_DATA.quotas),
    publicLinks: await readJsonFile('publicLinks.json', DEFAULT_DATA.publicLinks),
  };

  cache = data;
  cacheTimestamp = Date.now();
  return data;
}

/**
 * Salva todos os dados
 */
export async function saveAllData(data: DataStore): Promise<void> {
  await Promise.all([
    writeJsonFile('users.json', data.users),
    writeJsonFile('projects.json', data.projects),
    writeJsonFile('forms.json', data.forms),
    writeJsonFile('responses.json', data.responses),
    writeJsonFile('alerts.json', data.alerts),
    writeJsonFile('activityLogs.json', data.activityLogs),
    writeJsonFile('quotas.json', data.quotas),
    writeJsonFile('publicLinks.json', data.publicLinks),
  ]);
  invalidateCache();
}

/**
 * Operações de Usuários
 */
export async function getAllUsers(): Promise<User[]> {
  const data = await loadAllData();
  return data.users;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const data = await loadAllData();
  return data.users.find(u => u.id === id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const data = await loadAllData();
  return data.users.find(u => u.email === email);
}

export async function createUser(user: User): Promise<User> {
  const data = await loadAllData();
  data.users.push(user);
  await saveAllData(data);
  return user;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
  const data = await loadAllData();
  const user = data.users.find(u => u.id === id);
  if (!user) return undefined;
  
  const updated = { ...user, ...updates, id: user.id };
  data.users = data.users.map(u => u.id === id ? updated : u);
  await saveAllData(data);
  return updated;
}

export async function deleteUser(id: string): Promise<boolean> {
  const data = await loadAllData();
  const initialLength = data.users.length;
  data.users = data.users.filter(u => u.id !== id);
  
  if (data.users.length < initialLength) {
    await saveAllData(data);
    return true;
  }
  return false;
}

/**
 * Operações de Projetos
 */
export async function getAllProjects(): Promise<Project[]> {
  const data = await loadAllData();
  return data.projects;
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const data = await loadAllData();
  return data.projects.find(p => p.id === id);
}

export async function getProjectsByResearcherId(researcherId: string): Promise<Project[]> {
  const data = await loadAllData();
  return data.projects.filter(p => p.researcherId === researcherId);
}

export async function createProject(project: Project): Promise<Project> {
  const data = await loadAllData();
  data.projects.push(project);
  await saveAllData(data);
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
  const data = await loadAllData();
  const project = data.projects.find(p => p.id === id);
  if (!project) return undefined;
  
  const updated = { ...project, ...updates, id: project.id };
  data.projects = data.projects.map(p => p.id === id ? updated : p);
  await saveAllData(data);
  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  const data = await loadAllData();
  const initialLength = data.projects.length;
  data.projects = data.projects.filter(p => p.id !== id);
  
  if (data.projects.length < initialLength) {
    // Limpar dados relacionados
    data.forms = data.forms.filter(f => f.projectId !== id);
    data.responses = data.responses.filter(r => r.projectId !== id);
    data.alerts = data.alerts.filter(a => a.projectId !== id);
    data.quotas = data.quotas.filter(q => q.projectId !== id);
    data.publicLinks = data.publicLinks.filter(l => l.projectId !== id);
    
    await saveAllData(data);
    return true;
  }
  return false;
}

/**
 * Operações de Formulários
 */
export async function getFormById(id: string): Promise<Form | undefined> {
  const data = await loadAllData();
  return data.forms.find(f => f.id === id);
}

export async function getFormsByProjectId(projectId: string): Promise<Form[]> {
  const data = await loadAllData();
  return data.forms.filter(f => f.projectId === projectId);
}

export async function createForm(form: Form): Promise<Form> {
  const data = await loadAllData();
  data.forms.push(form);
  await saveAllData(data);
  return form;
}

export async function updateForm(id: string, updates: Partial<Form>): Promise<Form | undefined> {
  const data = await loadAllData();
  const form = data.forms.find(f => f.id === id);
  if (!form) return undefined;
  
  const updated = { ...form, ...updates, id: form.id };
  data.forms = data.forms.map(f => f.id === id ? updated : f);
  await saveAllData(data);
  return updated;
}

/**
 * Operações de Respostas
 */
export async function getAllResponses(): Promise<Response[]> {
  const data = await loadAllData();
  return data.responses;
}

export async function getResponsesByProjectId(projectId: string): Promise<Response[]> {
  const data = await loadAllData();
  return data.responses.filter(r => r.projectId === projectId);
}

export async function getResponsesByLinkId(linkId: string): Promise<Response[]> {
  const data = await loadAllData();
  return data.responses.filter(r => r.linkId === linkId);
}

export async function createResponse(response: Response): Promise<Response> {
  const data = await loadAllData();
  data.responses.push(response);
  
  // Atualizar contador de respostas do projeto
  const project = data.projects.find(p => p.id === response.projectId);
  if (project) {
    project.currentResponses = data.responses.filter(r => r.projectId === response.projectId).length;
  }
  
  await saveAllData(data);
  return response;
}

export async function updateResponse(id: string, updates: Partial<Response>): Promise<Response | undefined> {
  const data = await loadAllData();
  const response = data.responses.find(r => r.id === id);
  if (!response) return undefined;
  
  const updated = { ...response, ...updates, id: response.id };
  data.responses = data.responses.map(r => r.id === id ? updated : r);
  await saveAllData(data);
  return updated;
}

/**
 * Operações de Alertas
 */
export async function getAllAlerts(): Promise<Alert[]> {
  const data = await loadAllData();
  return data.alerts;
}

export async function getAlertsByProjectId(projectId: string): Promise<Alert[]> {
  const data = await loadAllData();
  return data.alerts.filter(a => a.projectId === projectId);
}

export async function createAlert(alert: Alert): Promise<Alert> {
  const data = await loadAllData();
  data.alerts.push(alert);
  await saveAllData(data);
  return alert;
}

export async function updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
  const data = await loadAllData();
  const alert = data.alerts.find(a => a.id === id);
  if (!alert) return undefined;
  
  const updated = { ...alert, ...updates, id: alert.id };
  data.alerts = data.alerts.map(a => a.id === id ? updated : a);
  await saveAllData(data);
  return updated;
}

export async function deleteAlert(id: string): Promise<boolean> {
  const data = await loadAllData();
  const initialLength = data.alerts.length;
  data.alerts = data.alerts.filter(a => a.id !== id);
  
  if (data.alerts.length < initialLength) {
    await saveAllData(data);
    return true;
  }
  return false;
}

/**
 * Operações de Links Públicos
 */
export async function getPublicLinkById(id: string): Promise<PublicLink | undefined> {
  const data = await loadAllData();
  return data.publicLinks.find(l => l.id === id);
}

export async function getPublicLinkBySlug(slug: string): Promise<PublicLink | undefined> {
  const data = await loadAllData();
  return data.publicLinks.find(l => l.slug === slug);
}

export async function getPublicLinksByProjectId(projectId: string): Promise<PublicLink[]> {
  const data = await loadAllData();
  return data.publicLinks.filter(l => l.projectId === projectId);
}

export async function createPublicLink(link: PublicLink): Promise<PublicLink> {
  const data = await loadAllData();
  data.publicLinks.push(link);
  await saveAllData(data);
  return link;
}

export async function updatePublicLink(id: string, updates: Partial<PublicLink>): Promise<PublicLink | undefined> {
  const data = await loadAllData();
  const link = data.publicLinks.find(l => l.id === id);
  if (!link) return undefined;
  
  const updated = { ...link, ...updates, id: link.id };
  data.publicLinks = data.publicLinks.map(l => l.id === id ? updated : l);
  await saveAllData(data);
  return updated;
}

/**
 * Operações de Logs de Atividade
 */
export async function createActivityLog(log: ActivityLog): Promise<ActivityLog> {
  const data = await loadAllData();
  data.activityLogs.push(log);
  await saveAllData(data);
  return log;
}

export async function getActivityLogsByUserId(userId: string): Promise<ActivityLog[]> {
  const data = await loadAllData();
  return data.activityLogs.filter(l => l.userId === userId);
}

export async function getActivityLogsByEntityId(entityId: string): Promise<ActivityLog[]> {
  const data = await loadAllData();
  return data.activityLogs.filter(l => l.entityId === entityId);
}
