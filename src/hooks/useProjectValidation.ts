import { useMemo, useCallback } from 'react';
import { MethodologyValidator, type MethodologyType, type QuestionType } from '@/lib/methodologyQuestionValidator';

export interface ValidationResult {
  isProjectValid: boolean;
  isReadyForAnalysis: boolean;
  canStartCollection: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  methodologyStatus: Partial<Record<MethodologyType, {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>>;
  questionsStatus: {
    totalQuestions: number;
    validQuestions: number;
    missingTypes: QuestionType[];
    suggestions: string[];
  };
  sampleSizeStatus: {
    isValid: boolean;
    current: number;
    minimum: number;
    message: string;
    percentage: number;
  };
  quotasStatus: {
    isValid: boolean;
    total: number;
    configured: number;
    missingQuotas: string[];
  };
}

interface UseProjectValidationProps {
  questions: Array<{ id: string; type: QuestionType; question?: string }>;
  selectedMethodologies: MethodologyType[];
  responses: Array<any>;
  sampleSize: number;
  quotas: Array<{ id: string; name: string; target: number }>;
}

export function useProjectValidation({
  questions,
  selectedMethodologies,
  responses,
  sampleSize,
  quotas,
}: UseProjectValidationProps): ValidationResult {
  return useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const methodologyStatus: Partial<Record<MethodologyType, any>> = {};

    // Validar perguntas
    const questionsStatus = validateQuestions(questions);

    // Validar metodologias selecionadas
    const methodologyValidation = MethodologyValidator.validateProject(
      questions,
      responses,
      selectedMethodologies
    );

    errors.push(...methodologyValidation.errors);
    warnings.push(...methodologyValidation.warnings);
    recommendations.push(...methodologyValidation.recommendations);

    // Validar tamanho de amostra
    const sampleSizeStatus = validateSampleSize(responses.length, sampleSize);
    if (!sampleSizeStatus.isValid) {
      errors.push(sampleSizeStatus.message);
    }

    // Validar cotas
    const quotasStatus = validateQuotas(quotas, responses.length);
    if (!quotasStatus.isValid) {
      warnings.push(`Cotas: ${quotasStatus.missingQuotas.join(', ')}`);
    }

    // Metodologia por metodologia
    selectedMethodologies.forEach(methodology => {
      const methodValidation = MethodologyValidator.validateProject(
        questions,
        responses,
        [methodology]
      );

      methodologyStatus[methodology] = {
        isValid: methodValidation.errors.length === 0,
        errors: methodValidation.errors,
        warnings: methodValidation.warnings,
      };
    });

    // Determinar estado do projeto
    const isProjectValid = errors.length === 0;
    const isReadyForAnalysis = isProjectValid && responses.length > 0;
    const canStartCollection = questionsStatus.validQuestions > 0 && (quotas.length === 0 || quotasStatus.isValid);

    return {
      isProjectValid,
      isReadyForAnalysis,
      canStartCollection,
      errors,
      warnings,
      recommendations,
      methodologyStatus,
      questionsStatus,
      sampleSizeStatus,
      quotasStatus,
    };
  }, [questions, selectedMethodologies, responses, sampleSize, quotas]);
}

/**
 * Validar perguntas do projeto
 */
function validateQuestions(questions: Array<{ id: string; type: QuestionType; question?: string }>) {
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (questions.length === 0) {
    errors.push('Nenhuma pergunta foi criada ainda');
  } else if (questions.length < 3) {
    suggestions.push('Adicione pelo menos 3 perguntas para análises mais robustas');
  }

  // Verificar tipos de pergunta
  const typeFrequency: Record<QuestionType, number> = {} as any;
  questions.forEach(q => {
    typeFrequency[q.type] = (typeFrequency[q.type] || 0) + 1;
  });

  const hasNumericQuestions = Object.keys(typeFrequency).some(type =>
    ['rating', 'scale', 'slider', 'number'].includes(type)
  );

  const hasCategoricalQuestions = Object.keys(typeFrequency).some(type =>
    ['single_choice', 'multiple_choice', 'text'].includes(type)
  );

  if (!hasNumericQuestions) {
    suggestions.push('Considere adicionar perguntas de escala/rating para análises quantitativas');
  }

  if (!hasCategoricalQuestions) {
    suggestions.push('Considere adicionar perguntas categóricas para segmentação');
  }

  const missingTypes = getMissingQuestionTypes(questions);

  return {
    totalQuestions: questions.length,
    validQuestions: questions.filter(q => q.question?.trim().length > 0).length,
    missingTypes,
    suggestions,
  };
}

/**
 * Identificar tipos de perguntas faltando
 */
function getMissingQuestionTypes(questions: Array<{ type: QuestionType }>): QuestionType[] {
  const existingTypes = new Set(questions.map(q => q.type));
  const commonTypes: QuestionType[] = [
    'single_choice',
    'multiple_choice',
    'rating',
    'scale',
    'text',
    'nps',
  ];

  return commonTypes.filter(type => !existingTypes.has(type));
}

/**
 * Validar tamanho de amostra
 */
function validateSampleSize(
  currentResponses: number,
  targetSize: number
): {
  isValid: boolean;
  current: number;
  minimum: number;
  message: string;
  percentage: number;
} {
  const minimumSize = Math.max(10, Math.ceil(targetSize * 0.1));

  if (targetSize === 0) {
    return {
      isValid: false,
      current: currentResponses,
      minimum: minimumSize,
      message: 'Tamanho de amostra não foi definido',
      percentage: 0,
    };
  }

  const isValid = currentResponses >= targetSize;
  const percentage = Math.round((currentResponses / targetSize) * 100);

  return {
    isValid,
    current: currentResponses,
    minimum: targetSize,
    message: isValid
      ? `Amostra completa: ${currentResponses}/${targetSize}`
      : `Amostra insuficiente: ${currentResponses}/${targetSize}`,
    percentage,
  };
}

/**
 * Validar cotas
 */
function validateQuotas(
  quotas: Array<{ id: string; name: string; target: number }>,
  totalResponses: number
): {
  isValid: boolean;
  total: number;
  configured: number;
  missingQuotas: string[];
} {
  if (quotas.length === 0) {
    return {
      isValid: true, // Cotas são opcionais
      total: 0,
      configured: 0,
      missingQuotas: [],
    };
  }

  const totalTarget = quotas.reduce((sum, q) => sum + q.target, 0);
  const isValid = totalTarget > 0 && totalResponses >= totalTarget;

  const missingQuotas = quotas
    .filter(q => q.target === 0 || q.target === undefined)
    .map(q => q.name);

  return {
    isValid,
    total: quotas.length,
    configured: quotas.filter(q => q.target > 0).length,
    missingQuotas,
  };
}

/**
 * Hook para obter sugestões automáticas
 */
export function useAutomaticSuggestions({
  questions,
  selectedMethodologies,
  responses,
}: {
  questions: Array<{ type: QuestionType }>;
  selectedMethodologies: MethodologyType[];
  responses: Array<any>;
}) {
  return useMemo(() => {
    const suggestions: string[] = [];

    // Se não há metodologias selecionadas, sugerir
    if (selectedMethodologies.length === 0 && questions.length > 0) {
      const suggested = MethodologyValidator.suggestMethodologies(questions);
      if (suggested.length > 0) {
        suggestions.push(
          `Baseado em suas perguntas, recomendamos as metodologias: ${suggested.slice(0, 3).join(', ')}`
        );
      }
    }

    // Se tem poucas respostas
    if (responses.length < 10) {
      suggestions.push('Colete pelo menos 10 respostas para resultados mais confiáveis');
    }

    // Se tem muitas perguntas
    if (questions.length > 20) {
      suggestions.push('Considere reduzir o número de perguntas para melhorar a taxa de conclusão');
    }

    // Se não tem perguntas de segmentação
    const hasSegmentationQuestion = questions.some(q => ['single_choice', 'multiple_choice'].includes(q.type));
    if (!hasSegmentationQuestion && selectedMethodologies.some(m => ['t_test', 'anova'].includes(m))) {
      suggestions.push('Adicione uma pergunta de segmentação para análises comparativas');
    }

    return suggestions;
  }, [questions, selectedMethodologies, responses]);
}

/**
 * Hook para monitorar prontidão para análise
 */
export function useAnalysisReadiness(validation: ValidationResult) {
  return useMemo(() => {
    return {
      readinessPercentage: calculateReadinessPercentage(validation),
      readinessStatus: getReadinessStatus(validation),
      nextSteps: getNextSteps(validation),
      blockers: validation.errors,
    };
  }, [validation]);
}

/**
 * Calcular percentual de prontidão
 */
function calculateReadinessPercentage(validation: ValidationResult): number {
  let score = 0;
  const maxScore = 5;

  if (validation.questionsStatus.totalQuestions >= 3) score++;
  if (validation.questionsStatus.validQuestions >= validation.questionsStatus.totalQuestions * 0.8) score++;
  if (validation.sampleSizeStatus.percentage >= 50) score++;
  if (validation.quotasStatus.isValid || validation.quotasStatus.total === 0) score++;
  if (validation.errors.length === 0) score++;

  return Math.round((score / maxScore) * 100);
}

/**
 * Obter status de prontidão
 */
function getReadinessStatus(validation: ValidationResult): 'not_ready' | 'in_progress' | 'almost_ready' | 'ready' {
  if (validation.isReadyForAnalysis) return 'ready';
  if (validation.canStartCollection && validation.sampleSizeStatus.percentage >= 50) return 'almost_ready';
  if (validation.canStartCollection) return 'in_progress';
  return 'not_ready';
}

/**
 * Obter próximos passos
 */
function getNextSteps(validation: ValidationResult): string[] {
  const steps: string[] = [];

  if (validation.questionsStatus.totalQuestions === 0) {
    steps.push('Crie pelo menos uma pergunta');
  }

  if (validation.quotasStatus.total > 0 && !validation.quotasStatus.isValid) {
    steps.push('Configure as cotas corretamente');
  }

  if (!validation.sampleSizeStatus.isValid) {
    steps.push(`Colete mais ${validation.sampleSizeStatus.minimum - validation.sampleSizeStatus.current} respostas`);
  }

  if (validation.errors.length > 0) {
    steps.push('Resolva os erros de validação acima');
  }

  if (steps.length === 0) {
    steps.push('Projeto pronto para análise!');
  }

  return steps;
}
