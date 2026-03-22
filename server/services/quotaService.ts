/**
 * Serviço de Quotas Demográficas para Clarifyse Studio
 * Gerencia configuração e validação de cotas
 */

import { Quota, QuotaType, QuotaOption } from '../../shared/types';
import * as storage from '../storage/jsonStorage';
import { generateId } from '../utils/crypto';

/**
 * Cria uma nova cota
 */
export function createQuota(
  projectId: string,
  type: QuotaType,
  name: string,
  options: QuotaOption[],
  isRequired: boolean = true,
  isMandatory: boolean = false,
  order: number = 0
): Quota {
  return {
    id: generateId(),
    projectId,
    type,
    name,
    isRequired,
    isMandatory,
    options: options.map((opt) => ({
      ...opt,
      id: opt.id || generateId(),
    })),
    order,
  };
}

/**
 * Adiciona cota a um projeto
 */
export async function addQuotaToProject(
  projectId: string,
  quota: Quota
): Promise<Quota | undefined> {
  const project = await storage.getProjectById(projectId);
  if (!project) return undefined;

  const newQuota = {
    ...quota,
    projectId,
    order: project.quotas.length,
  };

  project.quotas.push(newQuota);
  await storage.updateProject(projectId, { quotas: project.quotas });

  return newQuota;
}

/**
 * Atualiza uma cota
 */
export async function updateQuota(
  projectId: string,
  quotaId: string,
  updates: Partial<Quota>
): Promise<Quota | undefined> {
  const project = await storage.getProjectById(projectId);
  if (!project) return undefined;

  const quotaIndex = project.quotas.findIndex(q => q.id === quotaId);
  if (quotaIndex === -1) return undefined;

  const updatedQuota = {
    ...project.quotas[quotaIndex],
    ...updates,
    id: quotaId,
    projectId,
  };

  project.quotas[quotaIndex] = updatedQuota;
  await storage.updateProject(projectId, { quotas: project.quotas });

  return updatedQuota;
}

/**
 * Remove uma cota
 */
export async function removeQuota(
  projectId: string,
  quotaId: string
): Promise<boolean> {
  const project = await storage.getProjectById(projectId);
  if (!project) return false;

  const initialLength = project.quotas.length;
  project.quotas = project.quotas.filter(q => q.id !== quotaId);

  if (project.quotas.length < initialLength) {
    await storage.updateProject(projectId, { quotas: project.quotas });
    return true;
  }

  return false;
}

/**
 * Reordena cotas (drag-and-drop)
 */
export async function reorderQuotas(
  projectId: string,
  quotaIds: string[]
): Promise<Quota[] | undefined> {
  const project = await storage.getProjectById(projectId);
  if (!project) return undefined;

  const quotaMap = new Map(project.quotas.map(q => [q.id, q]));

  const reorderedQuotas = quotaIds
    .map(id => quotaMap.get(id))
    .filter((q): q is Quota => q !== undefined)
    .map((q, index) => ({ ...q, order: index }));

  await storage.updateProject(projectId, { quotas: reorderedQuotas });

  return reorderedQuotas;
}

/**
 * Adiciona opção a uma cota
 */
export async function addOptionToQuota(
  projectId: string,
  quotaId: string,
  label: string,
  target: number
): Promise<Quota | undefined> {
  const project = await storage.getProjectById(projectId);
  if (!project) return undefined;

  const quota = project.quotas.find(q => q.id === quotaId);
  if (!quota) return undefined;

  const newOption: QuotaOption = {
    id: generateId(),
    label,
    target,
    current: 0,
  };

  quota.options.push(newOption);
  await storage.updateProject(projectId, { quotas: project.quotas });

  return quota;
}

/**
 * Atualiza opção de uma cota
 */
export async function updateQuotaOption(
  projectId: string,
  quotaId: string,
  optionId: string,
  updates: Partial<QuotaOption>
): Promise<QuotaOption | undefined> {
  const project = await storage.getProjectById(projectId);
  if (!project) return undefined;

  const quota = project.quotas.find(q => q.id === quotaId);
  if (!quota) return undefined;

  const option = quota.options.find(o => o.id === optionId);
  if (!option) return undefined;

  const updatedOption = {
    ...option,
    ...updates,
    id: optionId,
  };

  const optionIndex = quota.options.findIndex(o => o.id === optionId);
  quota.options[optionIndex] = updatedOption;

  await storage.updateProject(projectId, { quotas: project.quotas });

  return updatedOption;
}

/**
 * Remove opção de uma cota
 */
export async function removeQuotaOption(
  projectId: string,
  quotaId: string,
  optionId: string
): Promise<boolean> {
  const project = await storage.getProjectById(projectId);
  if (!project) return false;

  const quota = project.quotas.find(q => q.id === quotaId);
  if (!quota) return false;

  const initialLength = quota.options.length;
  quota.options = quota.options.filter(o => o.id !== optionId);

  if (quota.options.length < initialLength) {
    await storage.updateProject(projectId, { quotas: project.quotas });
    return true;
  }

  return false;
}

/**
 * Calcula progresso das quotas
 */
export async function getQuotaProgress(projectId: string) {
  const project = await storage.getProjectById(projectId);
  if (!project) return null;

  return project.quotas.map(quota => ({
    id: quota.id,
    name: quota.name,
    type: quota.type,
    progress: quota.options.map(option => ({
      id: option.id,
      label: option.label,
      current: option.current,
      target: option.target,
      percentage: option.target > 0
        ? Math.round((option.current / option.target) * 100)
        : 0,
      isComplete: option.current >= option.target,
    })),
    totalCurrent: quota.options.reduce((sum, opt) => sum + opt.current, 0),
    totalTarget: quota.options.reduce((sum, opt) => sum + opt.target, 0),
    isComplete: quota.options.every(opt => opt.current >= opt.target),
  }));
}

/**
 * Valida se todas as quotas estão configuradas
 */
export async function validateQuotasConfiguration(projectId: string): Promise<{ valid: boolean; errors: string[] }> {
  const project = await storage.getProjectById(projectId);
  if (!project) {
    return { valid: false, errors: ['Projeto não encontrado'] };
  }

  const errors: string[] = [];

  if (project.quotas.length === 0) {
    errors.push('Projeto deve ter pelo menos uma cota configurada');
  }

  project.quotas.forEach((quota, index) => {
    if (quota.options.length === 0) {
      errors.push(`Cota "${quota.name}" deve ter pelo menos uma opção`);
    }

    quota.options.forEach(option => {
      if (option.target <= 0) {
        errors.push(`Opção "${option.label}" da cota "${quota.name}" deve ter meta > 0`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Cria quotas padrão (Gênero, Faixa Etária)
 */
export function createDefaultQuotas(projectId: string): Quota[] {
  return [
    createQuota(
      projectId,
      'genero',
      'Gênero',
      [
        { id: generateId(), label: 'Masculino', target: 250, current: 0 },
        { id: generateId(), label: 'Feminino', target: 250, current: 0 },
        { id: generateId(), label: 'Outro', target: 0, current: 0 },
      ],
      true,
      false,
      0
    ),
    createQuota(
      projectId,
      'faixaEtaria',
      'Faixa Etária',
      [
        { id: generateId(), label: '18-24', target: 100, current: 0 },
        { id: generateId(), label: '25-34', target: 150, current: 0 },
        { id: generateId(), label: '35-44', target: 150, current: 0 },
        { id: generateId(), label: '45-54', target: 100, current: 0 },
        { id: generateId(), label: '55+', target: 100, current: 0 },
      ],
      true,
      false,
      1
    ),
  ];
}
