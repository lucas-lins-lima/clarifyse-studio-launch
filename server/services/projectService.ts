/**
 * Serviço de Projetos para Clarifyse Studio
 * Gerencia CRUD de projetos de pesquisa
 */

import { Project, ProjectStatus, Form, Quota, PublicLink, Response } from '../../shared/types';
import * as storage from '../storage/jsonStorage';
import { generateId, generateSlug } from '../utils/crypto';
import * as formService from './formService';

/**
 * Cria um novo projeto
 */
export async function createProject(
  name: string,
  description: string,
  client: string,
  researcherId: string,
  sampleSize: number,
  startDate: string
): Promise<Project> {
  const projectId = generateId();
  const formId = generateId();

  // Criar formulário vazio associado
  const form: Form = {
    id: formId,
    projectId,
    title: `${name} - Formulário`,
    description: `Formulário para ${name}`,
    questions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedTime: 5,
  };

  await storage.createForm(form);

  const project: Project = {
    id: projectId,
    name,
    description,
    client,
    status: 'rascunho',
    researcherId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate,
    endDate: null,
    sampleSize,
    currentResponses: 0,
    formId,
    quotas: [],
    isPublished: false,
    publicLinks: [],
  };

  return storage.createProject(project);
}

/**
 * Obtém um projeto por ID
 */
export async function getProjectById(projectId: string): Promise<Project | undefined> {
  return storage.getProjectById(projectId);
}

/**
 * Obtém todos os projetos
 */
export async function getAllProjects(): Promise<Project[]> {
  return storage.getAllProjects();
}

/**
 * Obtém projetos de um pesquisador
 */
export async function getProjectsByResearcherId(researcherId: string): Promise<Project[]> {
  return storage.getProjectsByResearcherId(researcherId);
}

/**
 * Atualiza um projeto
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<Project | undefined> {
  const project = await storage.getProjectById(projectId);
  if (!project) return undefined;

  const updated = {
    ...project,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return storage.updateProject(projectId, updated);
}

/**
 * Muda o status de um projeto
 */
export async function changeProjectStatus(
  projectId: string,
  newStatus: ProjectStatus
): Promise<Project | undefined> {
  const project = await storage.getProjectById(projectId);
  if (!project) return undefined;

  // Validar transições de status
  const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
    rascunho: ['ativo', 'encerrado'],
    ativo: ['pausado', 'encerrado'],
    pausado: ['ativo', 'encerrado'],
    encerrado: [],
  };

  if (!validTransitions[project.status].includes(newStatus)) {
    throw new Error(
      `Transição inválida de ${project.status} para ${newStatus}`
    );
  }

  return updateProject(projectId, { status: newStatus });
}

/**
 * Duplica um projeto
 */
export async function duplicateProject(
  projectId: string,
  newName: string
): Promise<Project | undefined> {
  const original = await storage.getProjectById(projectId);
  if (!original) return undefined;

  // Duplicar formulário
  const originalForm = await storage.getFormById(original.formId);
  const newFormId = generateId();

  if (originalForm) {
    const newForm: Form = {
      ...originalForm,
      id: newFormId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await storage.createForm(newForm);
  }

  // Duplicar cotas
  const newQuotas = original.quotas.map(quota => ({
    ...quota,
    id: generateId(),
    projectId: generateId(), // Será atualizado após criar projeto
  }));

  // Criar novo projeto
  const newProjectId = generateId();
  const newProject: Project = {
    ...original,
    id: newProjectId,
    name: newName,
    formId: newFormId,
    status: 'rascunho',
    currentResponses: 0,
    isPublished: false,
    publicLinks: [],
    quotas: newQuotas.map(q => ({ ...q, projectId: newProjectId })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return storage.createProject(newProject);
}

/**
 * Deleta um projeto e todos os dados relacionados
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  return storage.deleteProject(projectId);
}

/**
 * Publica um projeto (gera link público)
 */
export async function publishProject(projectId: string): Promise<PublicLink | undefined> {
  const project = await storage.getProjectById(projectId);
  if (!project) return undefined;

  // Validar se projeto está pronto
  if (project.quotas.length === 0) {
    throw new Error('Projeto deve ter pelo menos uma cota configurada');
  }

  const form = await storage.getFormById(project.formId);
  if (!form || form.questions.length === 0) {
    throw new Error('Formulário deve ter pelo menos uma pergunta');
  }

  // Gerar link público
  const linkId = generateId();
  const slug = generateSlug('survey');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

  const publicLink: PublicLink = {
    id: linkId,
    projectId,
    slug,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    isActive: true,
    responseCount: 0,
  };

  await storage.createPublicLink(publicLink);

  // Atualizar projeto
  await updateProject(projectId, {
    isPublished: true,
    status: 'ativo',
    publicLinks: [...project.publicLinks, publicLink],
  });

  return publicLink;
}

/**
 * Desativa um link público
 */
export async function deactivatePublicLink(projectId: string, linkId: string): Promise<boolean> {
  const project = await storage.getProjectById(projectId);
  if (!project) return false;

  const link = await storage.getPublicLinkById(linkId);
  if (!link) return false;

  await storage.updatePublicLink(linkId, { isActive: false });

  // Atualizar projeto
  const updatedLinks = project.publicLinks.map(l =>
    l.id === linkId ? { ...l, isActive: false } : l
  );
  await updateProject(projectId, { publicLinks: updatedLinks });

  return true;
}

/**
 * Calcula estatísticas do projeto
 */
export async function getProjectStats(projectId: string) {
  const project = await storage.getProjectById(projectId);
  if (!project) return null;

  const responses = await storage.getResponsesByProjectId(projectId);
  const completedResponses = responses.filter(r => r.status === 'completa');

  const completionRate = project.sampleSize > 0
    ? Math.round((completedResponses.length / project.sampleSize) * 100)
    : 0;

  const averageResponseTime = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + r.duration, 0) / responses.length)
    : 0;

  // Calcular progresso por quota
  const quotaProgress = project.quotas.map(quota => ({
    name: quota.name,
    progress: quota.options.reduce((sum, opt) => sum + opt.current, 0),
    target: quota.options.reduce((sum, opt) => sum + opt.target, 0),
  }));

  return {
    totalResponses: responses.length,
    completedResponses: completedResponses.length,
    incompleteResponses: responses.filter(r => r.status === 'incompleta').length,
    abandonedResponses: responses.filter(r => r.status === 'abandonada').length,
    completionRate,
    averageResponseTime,
    quotaProgress,
    lastResponseAt: responses.length > 0
      ? responses[responses.length - 1].endTime
      : null,
  };
}

/**
 * Obtém alertas do projeto
 */
export async function getProjectAlerts(projectId: string) {
  return storage.getAlertsByProjectId(projectId);
}
