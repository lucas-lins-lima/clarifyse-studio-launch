/**
 * LÓGICA COMPARTILHADA DE COTAS
 * 
 * Este módulo centraliza a lógica de cotas que era duplicada em:
 * - frontend/SurveyPage.tsx
 * - backend/server/src/server.js
 * - lib/surveyForgeDB.js
 * 
 * Objetivo: Garantir que a validação de cotas seja consistente em todos os lugares
 */

export interface Quota {
  id: string;
  questionId: string;
  questionVariableCode: string;
  mappings: Array<{
    code: string | number;
    groupId: string;
  }>;
  groups: Array<{
    id: string;
    name: string;
    target: number;
  }>;
}

export interface Project {
  id: string;
  sampleSize: number;
  quotas?: Quota[];
  formQuestions?: Array<{
    id: string;
    variableCode: string;
  }>;
  responses?: Array<{
    id: string;
    quotaGroup: string;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  canRespond: boolean;
  reason?: string;
  blockedGroup?: string;
  blockedType?: 'sample' | 'quota' | 'both';
}

/**
 * Calcula o grupo de cota para um conjunto de respostas
 * 
 * FUNÇÃO CRÍTICA: Deve ser idêntica em todas as implementações
 */
export function calculateQuotaGroup(project: Project, answers: Record<string, any>): string {
  if (!project.quotas || project.quotas.length === 0) {
    return 'Geral';
  }

  for (const quota of project.quotas) {
    if (!quota.questionId) continue;

    const question = project.formQuestions?.find(q => q.id === quota.questionId);
    if (!question) continue;

    const answer = answers[question.variableCode];
    if (answer === undefined || answer === null) continue;

    if (quota.mappings && quota.mappings.length > 0) {
      const mapping = quota.mappings.find(m => String(m.code) === String(answer));
      if (mapping && mapping.groupId) {
        const group = quota.groups?.find(g => g.id === mapping.groupId);
        if (group) return group.name;
      }
    }
  }

  return 'Geral';
}

/**
 * Verifica se a amostra total foi atingida
 */
export function isSampleFull(project: Project): boolean {
  if (!project.sampleSize || project.sampleSize <= 0) return false;
  const totalResponses = project.responses?.length || 0;
  return totalResponses >= project.sampleSize;
}

/**
 * Verifica se uma cota específica foi atingida
 */
export function isQuotaFull(project: Project, quotaGroupName: string): boolean {
  if (!project.quotas || project.quotas.length === 0) return false;

  for (const quota of project.quotas) {
    for (const group of quota.groups || []) {
      if (group.name === quotaGroupName) {
        const currentCount = (project.responses || []).filter(
          r => r.quotaGroup === quotaGroupName
        ).length;
        return group.target > 0 && currentCount >= group.target;
      }
    }
  }

  return false;
}

/**
 * FUNÇÃO VALIDAÇÃO INTEGRADA
 * Verifica todos os bloqueios possíveis em uma única chamada
 * 
 * Retorna:
 * {
 *   valid: true/false - respondente pode responder?
 *   canRespond: true/false - alias para 'valid'
 *   reason: string descritivo
 *   blockedType: 'sample' | 'quota' | 'both'
 *   blockedGroup: nome da cota bloqueada (se aplicável)
 * }
 */
export function validateQuotasForResponse(
  project: Project,
  answers: Record<string, any>
): ValidationResult {
  // VALIDAÇÃO 1: Amostra total atingida?
  const sampleFull = isSampleFull(project);
  if (sampleFull) {
    return {
      valid: false,
      canRespond: false,
      reason: 'A pesquisa atingiu o número total de respostas necessárias. Obrigado!',
      blockedType: 'sample'
    };
  }

  // VALIDAÇÃO 2: Cota específica atingida?
  const quotaGroup = calculateQuotaGroup(project, answers);
  const quotaFull = isQuotaFull(project, quotaGroup);

  if (quotaFull) {
    return {
      valid: false,
      canRespond: false,
      reason: `A cota para o perfil "${quotaGroup}" já foi preenchida. Obrigado pela participação!`,
      blockedType: 'quota',
      blockedGroup: quotaGroup
    };
  }

  // Tudo OK
  return {
    valid: true,
    canRespond: true
  };
}

/**
 * Obtém estatísticas de preenchimento de cotas
 * Útil para exibir na UI o status de cada cota
 */
export function getQuotasStats(project: Project) {
  const stats: Record<string, any> = {};

  // Status geral
  const totalResponses = project.responses?.length || 0;
  stats['Geral'] = {
    name: 'Geral (Amostra Total)',
    target: project.sampleSize,
    current: totalResponses,
    filled: Math.round((totalResponses / (project.sampleSize || 1)) * 100),
    isFull: isSampleFull(project)
  };

  // Status de cada cota
  if (project.quotas && project.quotas.length > 0) {
    for (const quota of project.quotas) {
      for (const group of quota.groups || []) {
        const currentCount = (project.responses || []).filter(
          r => r.quotaGroup === group.name
        ).length;

        stats[group.name] = {
          name: group.name,
          target: group.target,
          current: currentCount,
          filled: Math.round((currentCount / (group.target || 1)) * 100),
          isFull: currentCount >= group.target
        };
      }
    }
  }

  return stats;
}

/**
 * Retorna lista de grupos de cota disponíveis (não cheios)
 */
export function getAvailableQuotaGroups(project: Project): string[] {
  const available: string[] = [];

  // Amostra geral sempre considerada se não cheia
  if (!isSampleFull(project)) {
    available.push('Geral');
  }

  // Quotas específicas
  if (project.quotas && project.quotas.length > 0) {
    for (const quota of project.quotas) {
      for (const group of quota.groups || []) {
        if (!isQuotaFull(project, group.name)) {
          available.push(group.name);
        }
      }
    }
  }

  // Remover duplicatas
  return [...new Set(available)];
}

// Types already exported above via interface declarations
