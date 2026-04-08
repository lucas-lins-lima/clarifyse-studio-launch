/**
 * LÓGICA COMPARTILHADA DE COTAS (JavaScript)
 * 
 * Versão para Node.js/backend dos mesmos algoritmos em src/lib/sharedQuotaLogic.ts
 * Garante que a validação de cotas seja idêntica em frontend e backend
 */

/**
 * Calcula o grupo de cota para um conjunto de respostas
 */
function calculateQuotaGroup(project, answers) {
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
function isSampleFull(project) {
  if (!project.sampleSize || project.sampleSize <= 0) return false;
  const totalResponses = project.responses?.length || 0;
  return totalResponses >= project.sampleSize;
}

/**
 * Verifica se uma cota específica foi atingida
 */
function isQuotaFull(project, quotaGroupName) {
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
 * Função de validação integrada
 * Verifica se respondente pode submeter resposta
 */
function validateQuotasForResponse(project, answers) {
  // Amostra total atingida?
  const sampleFull = isSampleFull(project);
  if (sampleFull) {
    return {
      valid: false,
      canRespond: false,
      reason: 'A pesquisa atingiu o número total de respostas necessárias. Obrigado!',
      blockedType: 'sample'
    };
  }

  // Cota específica atingida?
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
 */
function getQuotasStats(project) {
  const stats = {};

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

export {
  calculateQuotaGroup,
  isSampleFull,
  isQuotaFull,
  validateQuotasForResponse,
  getQuotasStats
};
