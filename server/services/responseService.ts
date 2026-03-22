/**
 * Serviço de Coleta de Respostas para Clarifyse Studio
 * Gerencia submissão, validação e armazenamento de respostas
 */

import { Response, Answer, Quota } from '../../shared/types';
import * as storage from '../storage/jsonStorage';
import { generateId, hashIp } from '../utils/crypto';

/**
 * Valida se uma resposta pode ser aceita (quotas, IP duplicado, etc)
 */
export async function validateResponseSubmission(
  projectId: string,
  linkId: string,
  quotaData: Record<string, string>,
  ipAddress: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  const project = await storage.getProjectById(projectId);
  if (!project) {
    errors.push('Projeto não encontrado');
    return { valid: false, errors };
  }

  if (!project.isPublished) {
    errors.push('Projeto não está publicado');
    return { valid: false, errors };
  }

  // Verificar se link é válido
  const link = await storage.getPublicLinkById(linkId);
  if (!link || !link.isActive) {
    errors.push('Link de coleta inválido ou expirado');
    return { valid: false, errors };
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    errors.push('Link de coleta expirou');
    return { valid: false, errors };
  }

  // Verificar quotas
  const responses = await storage.getResponsesByLinkId(linkId);
  const completedResponses = responses.filter(r => r.status === 'completa');

  if (completedResponses.length >= project.sampleSize) {
    errors.push('Amostra completa - coleta encerrada');
    return { valid: false, errors };
  }

  // Validar quotas demográficas
  for (const quota of project.quotas) {
    const quotaValue = quotaData[quota.id];

    if (quota.isRequired && !quotaValue) {
      errors.push(`Cota obrigatória não preenchida: ${quota.name}`);
      continue;
    }

    if (quotaValue) {
      const option = quota.options.find(o => o.id === quotaValue);

      if (!option) {
        errors.push(`Opção de cota inválida: ${quota.name}`);
        continue;
      }

      // Verificar se cota atingiu limite
      if (option.current >= option.target) {
        errors.push(`Cota completa para ${quota.name}: ${option.label}`);
      }
    }
  }

  // Verificar IP duplicado (simples - em produção usar mais sofisticado)
  const ipHash = hashIp(ipAddress);
  const recentResponsesFromIp = responses.filter(
    r => r.ipHash === ipHash && 
         new Date(r.endTime).getTime() > Date.now() - 3600000 // Última hora
  );

  if (recentResponsesFromIp.length > 0) {
    errors.push('Múltiplas respostas do mesmo IP detectadas');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Cria uma nova resposta
 */
export async function createResponse(
  projectId: string,
  formId: string,
  linkId: string,
  answers: Answer[],
  quotaData: Record<string, string>,
  ipAddress: string,
  userAgent: string,
  startTime: string,
  endTime: string
): Promise<Response | null> {
  // Validar submissão
  const validation = await validateResponseSubmission(projectId, linkId, quotaData, ipAddress);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const duration = Math.round(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
  );

  // Detectar flags de fraude
  const speedFlag = duration < 30; // Menos de 30 segundos
  const ipHash = hashIp(ipAddress);
  const duplicateIpFlag = false; // Já verificado acima
  const incompleteFlag = false; // Será verificado na validação

  const response: Response = {
    id: generateId(),
    projectId,
    formId,
    linkId,
    answers,
    quotaData,
    ipHash,
    userAgent,
    startTime,
    endTime,
    duration,
    status: 'completa',
    flags: {
      speedFlag,
      duplicateIpFlag,
      incompleteFlag,
    },
  };

  // Salvar resposta
  const saved = await storage.createResponse(response);

  // Atualizar quotas
  await updateQuotasFromResponse(projectId, quotaData);

  // Atualizar contador do link
  const link = await storage.getPublicLinkById(linkId);
  if (link) {
    await storage.updatePublicLink(linkId, {
      responseCount: link.responseCount + 1,
    });
  }

  return saved;
}

/**
 * Atualiza quotas baseado em resposta
 */
async function updateQuotasFromResponse(
  projectId: string,
  quotaData: Record<string, string>
): Promise<void> {
  const project = await storage.getProjectById(projectId);
  if (!project) return;

  const updatedQuotas = project.quotas.map(quota => {
    const selectedOptionId = quotaData[quota.id];

    if (selectedOptionId) {
      const updatedOptions = quota.options.map(option => {
        if (option.id === selectedOptionId) {
          return {
            ...option,
            current: Math.min(option.current + 1, option.target),
          };
        }
        return option;
      });

      return { ...quota, options: updatedOptions };
    }

    return quota;
  });

  await storage.updateProject(projectId, { quotas: updatedQuotas });
}

/**
 * Obtém respostas de um projeto
 */
export async function getResponsesByProject(projectId: string): Promise<Response[]> {
  return storage.getResponsesByProjectId(projectId);
}

/**
 * Obtém respostas de um link público
 */
export async function getResponsesByLink(linkId: string): Promise<Response[]> {
  return storage.getResponsesByLinkId(linkId);
}

/**
 * Calcula estatísticas de respostas
 */
export async function getResponseStats(projectId: string) {
  const responses = await storage.getResponsesByProjectId(projectId);

  const totalResponses = responses.length;
  const completedResponses = responses.filter(r => r.status === 'completa').length;
  const incompleteResponses = responses.filter(r => r.status === 'incompleta').length;
  const abandonedResponses = responses.filter(r => r.status === 'abandonada').length;

  const avgDuration = totalResponses > 0
    ? Math.round(responses.reduce((sum, r) => sum + r.duration, 0) / totalResponses)
    : 0;

  const flaggedResponses = responses.filter(
    r => r.flags.speedFlag || r.flags.duplicateIpFlag || r.flags.incompleteFlag
  ).length;

  // Respostas por dia (últimos 7 dias)
  const responsesByDay = getResponsesByDay(responses, 7);

  return {
    totalResponses,
    completedResponses,
    incompleteResponses,
    abandonedResponses,
    completionRate: totalResponses > 0
      ? Math.round((completedResponses / totalResponses) * 100)
      : 0,
    avgDuration,
    flaggedResponses,
    responsesByDay,
  };
}

/**
 * Agrupa respostas por dia
 */
function getResponsesByDay(responses: Response[], days: number) {
  const result: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    result[dateStr] = 0;
  }

  responses.forEach(response => {
    const dateStr = response.endTime.split('T')[0];
    if (result[dateStr] !== undefined) {
      result[dateStr]++;
    }
  });

  return result;
}

/**
 * Marca resposta como incompleta
 */
export async function markResponseIncomplete(responseId: string): Promise<Response | undefined> {
  const response = await storage.getAllResponses().then(
    responses => responses.find(r => r.id === responseId)
  );

  if (!response) return undefined;

  return storage.updateResponse(responseId, {
    status: 'incompleta',
    flags: { ...response.flags, incompleteFlag: true },
  });
}

/**
 * Marca resposta como abandonada
 */
export async function markResponseAbandoned(responseId: string): Promise<Response | undefined> {
  const response = await storage.getAllResponses().then(
    responses => responses.find(r => r.id === responseId)
  );

  if (!response) return undefined;

  return storage.updateResponse(responseId, {
    status: 'abandonada',
  });
}
