/**
 * Motor de Análise Automática - Fase 5
 * Transforma respostas brutas em insights inteligentes
 */

export interface AnalysisResponse {
  id: string;
  timestamp: string;
  answers: Record<string, any>;
  quotaProfile: Record<string, string>;
  timeSpent: number;
  qualityFlag: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface Question {
  id: string;
  question: string;
  type: string;
  options?: Array<{ code: string | number; text: string }>;
  variableCode?: string;
}

export interface QuotaGroup {
  id: string;
  name: string;
  target: number;
}

export interface Quota {
  id: string;
  name: string;
  type: string;
  groups: QuotaGroup[];
  questionId: string;
}

export interface AnalysisResult {
  summary: SummaryStats;
  questionAnalysis: QuestionAnalysis[];
  crossAnalysis: CrossAnalysis[];
  qualityScore: number;
  keyInsights: string[];
  quotaComparison: QuotaComparison[];
}

export interface SummaryStats {
  totalResponses: number;
  averageTimeSpent: string;
  qualityRate: number;
  quotasComplete: number;
  quotasTotal: number;
  quotasCompletePercentage: number;
}

export interface QuestionAnalysis {
  questionId: string;
  question: string;
  type: string;
  distribution: DistributionItem[];
  stats?: {
    mean?: number;
    median?: number;
    stdDev?: number;
    classification?: string;
  };
  topWords?: WordFrequency[];
}

export interface DistributionItem {
  label: string;
  code: string | number;
  count: number;
  percentage: number;
}

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface CrossAnalysis {
  primaryQuestion: string;
  secondaryQuestion: string;
  crossTab: CrossTabItem[];
  significantDifference: boolean;
  insight: string;
}

export interface CrossTabItem {
  primaryValue: string;
  secondaryValue: string;
  count: number;
  percentage: number;
}

export interface QuotaComparison {
  quotaName: string;
  groups: QuotaGroupComparison[];
  mainInsight: string;
}

export interface QuotaGroupComparison {
  groupName: string;
  targetMet: number;
  targetTotal: number;
  percentage: number;
  topAnswers: Record<string, number>;
}

/**
 * Gera insights automáticos a partir das respostas
 */
export function generateInsights(
  responses: AnalysisResponse[],
  questions: Question[],
  quotas: Quota[],
  sampleSize: number
): AnalysisResult {
  const summary = generateSummary(responses, quotas, sampleSize);
  const questionAnalysis = analyzeQuestions(responses, questions);
  const crossAnalysis = generateCrossAnalysis(responses, questions, questionAnalysis);
  const qualityScore = calculateQualityScore(responses);
  const keyInsights = generateKeyInsights(
    summary,
    questionAnalysis,
    crossAnalysis,
    quotas,
    responses
  );
  const quotaComparison = analyzeQuotaComparison(responses, quotas, questions);

  return {
    summary,
    questionAnalysis,
    crossAnalysis,
    qualityScore,
    keyInsights,
    quotaComparison,
  };
}

/**
 * Gera estatísticas resumidas
 */
function generateSummary(
  responses: AnalysisResponse[],
  quotas: Quota[],
  sampleSize: number
): SummaryStats {
  const totalResponses = responses.length;
  const avgTime =
    totalResponses > 0
      ? responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / totalResponses
      : 0;

  const qualityFlags = responses.filter(
    (r) => r.qualityFlag === 'excellent' || r.qualityFlag === 'good'
  ).length;
  const qualityRate = totalResponses > 0 ? (qualityFlags / totalResponses) * 100 : 0;

  const quotasTotal = quotas.length;
  let quotasComplete = 0;

  quotas.forEach((quota) => {
    const quotaResponses = responses.filter((r) => r.quotaProfile[quota.id]);
    const allGroupsMet = quota.groups.every((group) => {
      const groupCount = quotaResponses.filter(
        (r) => r.quotaProfile[quota.id] === group.id
      ).length;
      return groupCount >= group.target;
    });
    if (allGroupsMet) quotasComplete++;
  });

  return {
    totalResponses,
    averageTimeSpent: formatTime(avgTime),
    qualityRate: Math.round(qualityRate),
    quotasComplete,
    quotasTotal,
    quotasCompletePercentage: quotasTotal > 0 ? Math.round((quotasComplete / quotasTotal) * 100) : 0,
  };
}

/**
 * Analisa cada pergunta individualmente
 */
function analyzeQuestions(
  responses: AnalysisResponse[],
  questions: Question[]
): QuestionAnalysis[] {
  return questions.map((question) => {
    const answers = responses
      .map((r) => r.answers[question.id])
      .filter((a) => a !== undefined && a !== null);

    if (question.type === 'single' || question.type === 'multiple') {
      return analyzeClosedQuestion(question, answers);
    } else if (
      question.type === 'likert' ||
      question.type === 'nps' ||
      question.type === 'rating'
    ) {
      return analyzeScaleQuestion(question, answers);
    } else if (question.type === 'text' || question.type === 'textarea') {
      return analyzeOpenQuestion(question, answers);
    } else {
      return {
        questionId: question.id,
        question: question.question,
        type: question.type,
        distribution: [],
      };
    }
  });
}

/**
 * Analisa perguntas fechadas (single/multiple choice)
 */
function analyzeClosedQuestion(
  question: Question,
  answers: any[]
): QuestionAnalysis {
  const distribution: Record<string, number> = {};
  const optionLabels: Record<string, string> = {};

  // Mapear opções
  (question.options || []).forEach((opt) => {
    const code = String(opt.code);
    optionLabels[code] = opt.text;
    distribution[code] = 0;
  });

  // Contar respostas
  answers.forEach((answer) => {
    if (Array.isArray(answer)) {
      // Multiple choice
      answer.forEach((a) => {
        const code = String(a);
        if (code in distribution) distribution[code]++;
      });
    } else {
      // Single choice
      const code = String(answer);
      if (code in distribution) distribution[code]++;
    }
  });

  const total = answers.length;
  const distributionArray = Object.entries(distribution)
    .map(([code, count]) => ({
      label: optionLabels[code] || code,
      code,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    questionId: question.id,
    question: question.question,
    type: question.type,
    distribution: distributionArray,
  };
}

/**
 * Analisa perguntas em escala (Likert, NPS, Rating)
 */
function analyzeScaleQuestion(
  question: Question,
  answers: any[]
): QuestionAnalysis {
  const numericAnswers = answers
    .map((a) => {
      if (typeof a === 'number') return a;
      if (typeof a === 'string') {
        const num = parseInt(a);
        return isNaN(num) ? null : num;
      }
      return null;
    })
    .filter((a) => a !== null) as number[];

  if (numericAnswers.length === 0) {
    return {
      questionId: question.id,
      question: question.question,
      type: question.type,
      distribution: [],
    };
  }

  const mean = numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length;
  const sorted = [...numericAnswers].sort((a, b) => a - b);
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const variance =
    numericAnswers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    numericAnswers.length;
  const stdDev = Math.sqrt(variance);

  // Classificação automática
  let classification = 'Regular';
  if (mean >= 8) classification = 'Forte';
  else if (mean >= 5) classification = 'Regular';
  else classification = 'Crítico';

  // Distribuição por faixa
  const distribution: Record<number, number> = {};
  numericAnswers.forEach((val) => {
    distribution[val] = (distribution[val] || 0) + 1;
  });

  const distributionArray = Object.entries(distribution)
    .map(([value, count]) => ({
      label: `${value}`,
      code: value,
      count,
      percentage: (count / numericAnswers.length) * 100,
    }))
    .sort((a, b) => Number(a.code) - Number(b.code));

  return {
    questionId: question.id,
    question: question.question,
    type: question.type,
    distribution: distributionArray,
    stats: {
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      classification,
    },
  };
}

/**
 * Analisa perguntas abertas (texto)
 */
function analyzeOpenQuestion(
  question: Question,
  answers: any[]
): QuestionAnalysis {
  const textAnswers = answers.filter((a) => typeof a === 'string');

  if (textAnswers.length === 0) {
    return {
      questionId: question.id,
      question: question.question,
      type: question.type,
      distribution: [],
    };
  }

  // Extrair palavras mais frequentes
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set([
    'o',
    'a',
    'de',
    'para',
    'com',
    'em',
    'é',
    'e',
    'que',
    'do',
    'da',
    'os',
    'as',
    'um',
    'uma',
    'por',
    'ou',
    'ao',
    'aos',
    'à',
    'às',
  ]);

  textAnswers.forEach((text) => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    words.forEach((word) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
  });

  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      percentage: (count / textAnswers.length) * 100,
    }));

  return {
    questionId: question.id,
    question: question.question,
    type: question.type,
    distribution: [],
    topWords,
  };
}

/**
 * Gera análise cruzada entre perguntas
 */
function generateCrossAnalysis(
  responses: AnalysisResponse[],
  questions: Question[],
  questionAnalysis: QuestionAnalysis[]
): CrossAnalysis[] {
  const crossAnalyses: CrossAnalysis[] = [];

  // Selecionar perguntas fechadas para cruzamento
  const closedQuestions = questions.filter(
    (q) => q.type === 'single' || q.type === 'multiple'
  );

  if (closedQuestions.length < 2) return [];

  // Cruzar primeira pergunta com as demais
  const primary = closedQuestions[0];
  for (let i = 1; i < Math.min(closedQuestions.length, 3); i++) {
    const secondary = closedQuestions[i];
    const crossTab = generateCrossTab(responses, primary, secondary);

    const insight = generateCrossInsight(
      primary.question,
      secondary.question,
      crossTab
    );

    crossAnalyses.push({
      primaryQuestion: primary.question,
      secondaryQuestion: secondary.question,
      crossTab,
      significantDifference: true,
      insight,
    });
  }

  return crossAnalyses;
}

/**
 * Gera tabela cruzada entre duas perguntas
 */
function generateCrossTab(
  responses: AnalysisResponse[],
  primary: Question,
  secondary: Question
): CrossTabItem[] {
  const crossTab: Record<string, Record<string, number>> = {};

  responses.forEach((response) => {
    const primaryAnswer = String(response.answers[primary.id] || 'N/A');
    const secondaryAnswer = String(response.answers[secondary.id] || 'N/A');

    if (!crossTab[primaryAnswer]) crossTab[primaryAnswer] = {};
    crossTab[primaryAnswer][secondaryAnswer] =
      (crossTab[primaryAnswer][secondaryAnswer] || 0) + 1;
  });

  const total = responses.length;
  const result: CrossTabItem[] = [];

  Object.entries(crossTab).forEach(([pValue, sValues]) => {
    Object.entries(sValues).forEach(([sValue, count]) => {
      result.push({
        primaryValue: pValue,
        secondaryValue: sValue,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      });
    });
  });

  return result.sort((a, b) => b.count - a.count);
}

/**
 * Gera insight automático para análise cruzada
 */
function generateCrossInsight(
  primaryQuestion: string,
  secondaryQuestion: string,
  crossTab: CrossTabItem[]
): string {
  if (crossTab.length === 0) return 'Sem dados para análise cruzada.';

  const topCombination = crossTab[0];
  return `A combinação mais frequente é "${topCombination.primaryValue}" com "${topCombination.secondaryValue}" (${Math.round(topCombination.percentage)}% das respostas).`;
}

/**
 * Calcula score de qualidade do projeto
 */
function calculateQualityScore(responses: AnalysisResponse[]): number {
  if (responses.length === 0) return 0;

  const excellentCount = responses.filter(
    (r) => r.qualityFlag === 'excellent'
  ).length;
  const goodCount = responses.filter((r) => r.qualityFlag === 'good').length;
  const warningCount = responses.filter((r) => r.qualityFlag === 'warning').length;

  const score =
    (excellentCount * 100 + goodCount * 75 + warningCount * 50) / responses.length;
  return Math.round(score);
}

/**
 * Gera insights automáticos em linguagem natural
 */
function generateKeyInsights(
  summary: SummaryStats,
  questionAnalysis: QuestionAnalysis[],
  crossAnalysis: CrossAnalysis[],
  quotas: Quota[],
  responses: AnalysisResponse[]
): string[] {
  const insights: string[] = [];

  // Insight sobre amostra
  insights.push(
    `Total de ${summary.totalResponses} respostas coletadas com tempo médio de ${summary.averageTimeSpent}.`
  );

  // Insight sobre qualidade
  if (summary.qualityRate >= 90) {
    insights.push(`Excelente qualidade de dados: ${summary.qualityRate}% das respostas estão em bom estado.`);
  } else if (summary.qualityRate >= 75) {
    insights.push(`Qualidade de dados satisfatória: ${summary.qualityRate}% das respostas validadas.`);
  } else {
    insights.push(`Atenção: Apenas ${summary.qualityRate}% das respostas passaram na validação de qualidade.`);
  }

  // Insight sobre cotas
  if (summary.quotasCompletePercentage === 100) {
    insights.push('Todas as cotas foram atingidas com sucesso!');
  } else if (summary.quotasCompletePercentage >= 75) {
    insights.push(`${summary.quotasCompletePercentage}% das cotas foram completadas.`);
  }

  // Insights sobre perguntas principais
  questionAnalysis.slice(0, 3).forEach((qa) => {
    if (qa.distribution.length > 0) {
      const top = qa.distribution[0];
      insights.push(
        `Na pergunta "${qa.question}": "${top.label}" é a resposta mais frequente (${Math.round(top.percentage)}%).`
      );
    }
    if (qa.stats && qa.stats.classification) {
      insights.push(
        `Nível geral de satisfação: ${qa.stats.classification.toLowerCase()} (média: ${qa.stats.mean}).`
      );
    }
  });

  // Insights sobre análise cruzada
  crossAnalysis.slice(0, 2).forEach((ca) => {
    insights.push(ca.insight);
  });

  return insights.slice(0, 8); // Limitar a 8 insights principais
}

/**
 * Analisa comparação entre grupos de cotas
 */
function analyzeQuotaComparison(
  responses: AnalysisResponse[],
  quotas: Quota[],
  questions: Question[]
): QuotaComparison[] {
  return quotas.map((quota) => {
    const quotaResponses = responses.filter((r) => r.quotaProfile[quota.id]);

    const groups = quota.groups.map((group) => {
      const groupResponses = quotaResponses.filter(
        (r) => r.quotaProfile[quota.id] === group.id
      );

      // Encontrar respostas mais frequentes para este grupo
      const topAnswers: Record<string, number> = {};
      groupResponses.forEach((resp) => {
        // Pegar primeira pergunta como exemplo
        const firstQuestion = questions[0];
        if (firstQuestion && resp.answers[firstQuestion.id]) {
          const answer = String(resp.answers[firstQuestion.id]);
          topAnswers[answer] = (topAnswers[answer] || 0) + 1;
        }
      });

      return {
        groupName: group.name,
        targetMet: groupResponses.length,
        targetTotal: group.target,
        percentage:
          group.target > 0
            ? Math.round((groupResponses.length / group.target) * 100)
            : 0,
        topAnswers,
      };
    });

    const mainInsight = `${quota.name}: ${groups.filter((g) => g.targetMet >= g.targetTotal).length}/${groups.length} grupos atingiram meta.`;

    return {
      quotaName: quota.name,
      groups,
      mainInsight,
    };
  });
}

/**
 * Formata tempo em formato legível
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}m${secs}s`;
}
