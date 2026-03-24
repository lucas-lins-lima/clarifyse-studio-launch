/**
 * Motor de Análise por Metodologia Específica
 * Implementa análises avançadas para cada metodologia descrita no documento Clarifyse
 */

import { AnalysisResponse, Question } from './analyticsEngine';

// ============================================================================
// PENALTY ANALYSIS
// ============================================================================

export interface PenaltyItemAnalysis {
  attribute: string;
  withAttribute: number;
  withoutAttribute: number;
  penaltyScore: number;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export function analyzePenaltyAttributes(
  responses: AnalysisResponse[],
  question: Question,
  satisfactionQuestion: Question
): PenaltyItemAnalysis[] {
  // Extrai dados de um atributo (sim/não ou presente/ausente) e relaciona com satisfação
  const answerKey = question.variableCode || question.id;
  const satKey = satisfactionQuestion.variableCode || satisfactionQuestion.id;

  const results: PenaltyItemAnalysis[] = [];

  if (!question.options) return results;

  question.options.forEach(option => {
    const withAttribute = responses
      .filter(r => r.answers[answerKey] === option.code)
      .map(r => r.answers[satKey])
      .filter(v => v !== undefined && v !== null) as number[];

    const withoutAttribute = responses
      .filter(r => r.answers[answerKey] !== option.code)
      .map(r => r.answers[satKey])
      .filter(v => v !== undefined && v !== null) as number[];

    const avgWith = withAttribute.length > 0
      ? withAttribute.reduce((a, b) => a + b, 0) / withAttribute.length
      : 0;

    const avgWithout = withoutAttribute.length > 0
      ? withoutAttribute.reduce((a, b) => a + b, 0) / withoutAttribute.length
      : 0;

    const penaltyScore = avgWith - avgWithout;
    let impact: 'low' | 'medium' | 'high' = 'low';
    let recommendation = 'Manutenção do atributo';

    if (penaltyScore > 1) {
      impact = 'high';
      recommendation = 'Atributo crítico - Implementar imediatamente';
    } else if (penaltyScore > 0.5) {
      impact = 'medium';
      recommendation = 'Atributo importante - Priorizar em roadmap';
    } else if (penaltyScore < -0.5) {
      impact = 'high';
      recommendation = 'Atributo diferencial - Investir em destaque';
    }

    results.push({
      attribute: option.text || option.code.toString(),
      withAttribute: avgWith,
      withoutAttribute: avgWithout,
      penaltyScore,
      impact,
      recommendation,
    });
  });

  return results;
}

// ============================================================================
// IMPORTANCE x SATISFACTION MATRIX
// ============================================================================

export interface ImportanceSatisfactionItem {
  attribute: string;
  importance: number;
  satisfaction: number;
  quadrant: 'keep' | 'improve' | 'maintain' | 'low_priority';
  priority: number;
}

export function analyzeImportanceSatisfactionMatrix(
  responses: AnalysisResponse[],
  importanceQuestion: Question,
  satisfactionQuestion: Question
): ImportanceSatisfactionItem[] {
  const importKey = importanceQuestion.variableCode || importanceQuestion.id;
  const satKey = satisfactionQuestion.variableCode || satisfactionQuestion.id;

  const results: ImportanceSatisfactionItem[] = [];

  // Agrupa respostas de importância e satisfação
  const aggregated: Record<string, { importance: number[], satisfaction: number[] }> = {};

  responses.forEach(r => {
    const importance = r.answers[importKey];
    const satisfaction = r.answers[satKey];
    
    if (importance !== undefined && satisfaction !== undefined) {
      const key = `${importance}`;
      if (!aggregated[key]) {
        aggregated[key] = { importance: [], satisfaction: [] };
      }
      aggregated[key].importance.push(Number(importance));
      aggregated[key].satisfaction.push(Number(satisfaction));
    }
  });

  Object.entries(aggregated).forEach(([key, data]) => {
    const importance = data.importance.reduce((a, b) => a + b, 0) / data.importance.length;
    const satisfaction = data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length;

    let quadrant: 'keep' | 'improve' | 'maintain' | 'low_priority' = 'low_priority';
    let priority = 0;

    // Normaliza para escala 0-100
    const normImportance = (importance / 10) * 100;
    const normSatisfaction = (satisfaction / 10) * 100;

    if (normImportance > 50 && normSatisfaction > 50) {
      quadrant = 'keep';
      priority = 1;
    } else if (normImportance > 50 && normSatisfaction <= 50) {
      quadrant = 'improve';
      priority = 5; // Highest priority
    } else if (normImportance <= 50 && normSatisfaction > 50) {
      quadrant = 'maintain';
      priority = 2;
    } else {
      quadrant = 'low_priority';
      priority = 0;
    }

    results.push({
      attribute: key,
      importance: normImportance,
      satisfaction: normSatisfaction,
      quadrant,
      priority,
    });
  });

  return results.sort((a, b) => b.priority - a.priority);
}

// ============================================================================
// GAP ANALYSIS (Expectation vs Reality)
// ============================================================================

export interface GapAnalysisItem {
  attribute: string;
  expectation: number;
  reality: number;
  gap: number;
  gapPercentage: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'positive';
}

export function analyzeExpectationGap(
  responses: AnalysisResponse[],
  expectationQuestion: Question,
  realityQuestion: Question
): GapAnalysisItem[] {
  const expKey = expectationQuestion.variableCode || expectationQuestion.id;
  const realKey = realityQuestion.variableCode || realityQuestion.id;

  const expectations: number[] = [];
  const realities: number[] = [];

  responses.forEach(r => {
    const exp = r.answers[expKey];
    const real = r.answers[realKey];
    
    if (exp !== undefined && real !== undefined && !isNaN(exp) && !isNaN(real)) {
      expectations.push(Number(exp));
      realities.push(Number(real));
    }
  });

  const results: GapAnalysisItem[] = [];

  if (expectations.length > 0) {
    const avgExpectation = expectations.reduce((a, b) => a + b, 0) / expectations.length;
    const avgReality = realities.reduce((a, b) => a + b, 0) / realities.length;
    const gap = avgReality - avgExpectation;
    const gapPercentage = avgExpectation !== 0 ? (gap / avgExpectation) * 100 : 0;

    let severity: 'critical' | 'high' | 'medium' | 'low' | 'positive' = 'medium';
    
    if (gap < -2) severity = 'critical';
    else if (gap < -1) severity = 'high';
    else if (gap < 0) severity = 'medium';
    else if (gap < 0.5) severity = 'low';
    else severity = 'positive';

    results.push({
      attribute: 'Overall Gap',
      expectation: avgExpectation,
      reality: avgReality,
      gap,
      gapPercentage,
      severity,
    });
  }

  return results;
}

// ============================================================================
// CONVERSION FUNNEL ANALYSIS
// ============================================================================

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropoffRate: number;
}

export interface FunnelAnalysisResult {
  stages: FunnelStage[];
  totalEntered: number;
  totalConverted: number;
  conversionRate: number;
  bottleneck: string;
}

export function analyzeFunnel(
  responses: AnalysisResponse[],
  stages: Array<{ name: string; questionId: string; successCode: string | number }>
): FunnelAnalysisResult {
  const result: FunnelAnalysisResult = {
    stages: [],
    totalEntered: responses.length,
    totalConverted: 0,
    conversionRate: 0,
    bottleneck: '',
  };

  let previousCount = responses.length;

  stages.forEach((stage, index) => {
    const successCount = responses.filter(r => {
      const answer = r.answers[stage.questionId];
      return answer === stage.successCode;
    }).length;

    const percentage = responses.length > 0 ? (successCount / responses.length) * 100 : 0;
    const dropoff = previousCount > 0 ? ((previousCount - successCount) / previousCount) * 100 : 0;

    result.stages.push({
      stage: stage.name,
      count: successCount,
      percentage,
      dropoffRate: dropoff,
    });

    if (index === stages.length - 1) {
      result.totalConverted = successCount;
    }

    previousCount = successCount;
  });

  result.conversionRate = responses.length > 0 ? (result.totalConverted / responses.length) * 100 : 0;

  // Identifica o estágio com maior abandono
  const bottleneckStage = result.stages.reduce((prev, current) => 
    current.dropoffRate > prev.dropoffRate ? current : prev
  );

  result.bottleneck = bottleneckStage.stage;

  return result;
}

// ============================================================================
// NPS ANALYSIS
// ============================================================================

export interface NPSSegment {
  name: string;
  promoters: number;
  passives: number;
  detractors: number;
  nps: number;
  percentage: number;
}

export interface NPSAnalysisResult {
  overall: {
    nps: number;
    promotersCount: number;
    passivesCount: number;
    detractorsCount: number;
  };
  segments: NPSSegment[];
  keyInsights: string[];
}

export function analyzeNPS(
  responses: AnalysisResponse[],
  npsQuestion: Question,
  segmentQuestion?: Question
): NPSAnalysisResult {
  const npsKey = npsQuestion.variableCode || npsQuestion.id;
  const segmentKey = segmentQuestion ? (segmentQuestion.variableCode || segmentQuestion.id) : null;

  const npsScores = responses
    .map(r => Number(r.answers[npsKey]))
    .filter(v => !isNaN(v) && v >= 0 && v <= 10);

  const promoters = npsScores.filter(v => v >= 9).length;
  const passives = npsScores.filter(v => v >= 7 && v < 9).length;
  const detractors = npsScores.filter(v => v < 7).length;
  const total = npsScores.length;

  const overallNPS = total > 0 
    ? ((promoters - detractors) / total) * 100 
    : 0;

  const result: NPSAnalysisResult = {
    overall: {
      nps: Math.round(overallNPS),
      promotersCount: promoters,
      passivesCount: passives,
      detractorsCount: detractors,
    },
    segments: [],
    keyInsights: [],
  };

  // Segmentação (se disponível)
  if (segmentKey) {
    const segmentMap: Record<string, number[]> = {};

    responses.forEach(r => {
      const segment = String(r.answers[segmentKey]);
      const npsScore = Number(r.answers[npsKey]);
      
      if (!isNaN(npsScore) && npsScore >= 0 && npsScore <= 10) {
        if (!segmentMap[segment]) segmentMap[segment] = [];
        segmentMap[segment].push(npsScore);
      }
    });

    Object.entries(segmentMap).forEach(([segment, scores]) => {
      const promo = scores.filter(v => v >= 9).length;
      const pass = scores.filter(v => v >= 7 && v < 9).length;
      const detr = scores.filter(v => v < 7).length;
      const segTotal = scores.length;

      const segmentNPS = segTotal > 0 
        ? ((promo - detr) / segTotal) * 100 
        : 0;

      result.segments.push({
        name: segment,
        promoters: promo,
        passives: pass,
        detractors: detr,
        nps: Math.round(segmentNPS),
        percentage: (segTotal / total) * 100,
      });
    });
  }

  // Insights
  if (overallNPS > 50) {
    result.keyInsights.push('Excelente NPS - Forte lealdade de clientes');
  } else if (overallNPS > 0) {
    result.keyInsights.push('NPS positivo - Bom relacionamento com clientes');
  } else if (overallNPS === 0) {
    result.keyInsights.push('NPS neutro - Oportunidade de melhoria');
  } else {
    result.keyInsights.push('NPS negativo - Risco elevado de churn');
  }

  const promoterPercentage = (promoters / total) * 100;
  if (promoterPercentage > 50) {
    result.keyInsights.push('Maioria são promotores - Forte potencial de recomendação');
  }

  return result;
}

// ============================================================================
// SENTIMENT ANALYSIS (Text)
// ============================================================================

export interface SentimentResult {
  positive: number;
  neutral: number;
  negative: number;
  averageSentimentScore: number;
  topPositiveWords: Array<{ word: string; count: number }>;
  topNegativeWords: Array<{ word: string; count: number }>;
}

const POSITIVE_WORDS = [
  'excelente', 'ótimo', 'bom', 'adorei', 'perfeito', 'incrível', 'maravilhoso',
  'amor', 'lindo', 'gosto', 'feliz', 'satisfeito', 'contente', 'agradável',
  'qualidade', 'melhor', 'recomendo', 'gostaria'
];

const NEGATIVE_WORDS = [
  'ruim', 'péssimo', 'horrível', 'terrível', 'decepção', 'decepcionante', 'problema',
  'erro', 'falha', 'defeito', 'chato', 'raiva', 'ódio', 'pior', 'triste',
  'insatisfeito', 'reclamação', 'problema', 'lixo', 'nojento'
];

export function analyzeSentiment(textResponses: string[]): SentimentResult {
  let positiveCount = 0;
  let negativeCount = 0;
  let sentimentScores: number[] = [];
  const positiveWordFreq: Record<string, number> = {};
  const negativeWordFreq: Record<string, number> = {};

  textResponses.forEach(text => {
    const lowerText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = lowerText.split(/\s+/);

    let sentiment = 0;

    words.forEach(word => {
      if (POSITIVE_WORDS.includes(word)) {
        positiveCount++;
        sentiment += 1;
        positiveWordFreq[word] = (positiveWordFreq[word] || 0) + 1;
      } else if (NEGATIVE_WORDS.includes(word)) {
        negativeCount++;
        sentiment -= 1;
        negativeWordFreq[word] = (negativeWordFreq[word] || 0) + 1;
      }
    });

    sentimentScores.push(sentiment);
  });

  const total = textResponses.length;
  const averageSentimentScore = total > 0 
    ? sentimentScores.reduce((a, b) => a + b, 0) / total 
    : 0;

  const topPositiveWords = Object.entries(positiveWordFreq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topNegativeWords = Object.entries(negativeWordFreq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    positive: positiveCount,
    negative: negativeCount,
    neutral: total - positiveCount - negativeCount,
    averageSentimentScore,
    topPositiveWords,
    topNegativeWords,
  };
}

// ============================================================================
// SILHUETA SCORE (Cluster Quality)
// ============================================================================

export function calculateSilhouetteScore(
  data: number[][],
  labels: number[]
): number {
  if (data.length === 0) return 0;

  let totalScore = 0;

  data.forEach((point, i) => {
    const clusterLabel = labels[i];
    
    // Calcula distância média para pontos no mesmo cluster (a)
    const sameCluster = data.filter((_, j) => labels[j] === clusterLabel && i !== j);
    const a = sameCluster.length > 0
      ? sameCluster.reduce((sum, other) => sum + euclideanDistance(point, other), 0) / sameCluster.length
      : 0;

    // Calcula distância média para pontos no cluster mais próximo (b)
    const uniqueLabels = Array.from(new Set(labels));
    const otherClusters = uniqueLabels.filter(l => l !== clusterLabel);
    
    let b = Infinity;
    otherClusters.forEach(otherLabel => {
      const otherCluster = data.filter((_, j) => labels[j] === otherLabel);
      if (otherCluster.length > 0) {
        const avgDist = otherCluster.reduce((sum, other) => sum + euclideanDistance(point, other), 0) / otherCluster.length;
        b = Math.min(b, avgDist);
      }
    });

    if (b === Infinity) b = a;

    const s = Math.max(a, b) !== 0 ? (b - a) / Math.max(a, b) : 0;
    totalScore += s;
  });

  return totalScore / data.length;
}

function euclideanDistance(point1: number[], point2: number[]): number {
  let sum = 0;
  for (let i = 0; i < point1.length; i++) {
    sum += Math.pow(point1[i] - point2[i], 2);
  }
  return Math.sqrt(sum);
}

// ============================================================================
// CRONBACH'S ALPHA (Internal Consistency)
// ============================================================================

export function calculateCronbachAlpha(items: number[][]): number {
  // items: array de respondentes x itens
  if (items.length === 0 || items[0].length < 2) return 0;

  const n = items[0].length; // Número de itens
  const k = items.length; // Número de respondentes

  // Calcula variância de cada item
  const itemVariances: number[] = [];
  for (let i = 0; i < n; i++) {
    const itemScores = items.map(row => row[i]);
    const mean = itemScores.reduce((a, b) => a + b, 0) / k;
    const variance = itemScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / k;
    itemVariances.push(variance);
  }

  // Calcula variância total
  const totals = items.map(row => row.reduce((a, b) => a + b, 0));
  const meanTotal = totals.reduce((a, b) => a + b, 0) / k;
  const totalVariance = totals.reduce((sum, total) => sum + Math.pow(total - meanTotal, 2), 0) / k;

  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);

  if (totalVariance === 0) return 0;

  // Fórmula de Cronbach's Alpha
  const alpha = (n / (n - 1)) * (1 - (sumItemVariances / totalVariance));

  return Math.max(0, Math.min(1, alpha)); // Clamp entre 0 e 1
}
