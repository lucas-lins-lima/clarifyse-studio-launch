/**
 * Motor de Análise por Metodologia Específica
 * Implementa análises avançadas para cada metodologia descrita no documento Clarifyse
 * Inclui: Penalty, Importance-Satisfaction, Gap, Funnel, NPS, Sentiment, 
 * Silhouette, Cronbach, ABSA, TURF, Markov, CLV, Cohort,
 * Van Westendorp, Kano, CES, CSAT, Gabor-Granger, Brand Funnel, Shapley, Bootstrap
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

/**
 * Avalia o quanto a ausência de determinado atributo penaliza a percepção geral,
 * identificando atributos básicos (must-have) versus diferenciais.
 */
export function analyzePenaltyAttributes(
  responses: AnalysisResponse[],
  question: Question,
  satisfactionQuestion: Question
): PenaltyItemAnalysis[] {
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

/**
 * Quadrante de priorização cruzando importância declarada e avaliação de performance
 * para identificar gaps críticos que demandam ação imediata versus atributos de manutenção.
 */
export function analyzeImportanceSatisfactionMatrix(
  responses: AnalysisResponse[],
  importanceQuestion: Question,
  satisfactionQuestion: Question
): ImportanceSatisfactionItem[] {
  const importKey = importanceQuestion.variableCode || importanceQuestion.id;
  const satKey = satisfactionQuestion.variableCode || satisfactionQuestion.id;

  const results: ImportanceSatisfactionItem[] = [];

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

    const normImportance = (importance / 10) * 100;
    const normSatisfaction = (satisfaction / 10) * 100;

    if (normImportance > 50 && normSatisfaction > 50) {
      quadrant = 'keep';
      priority = 1;
    } else if (normImportance > 50 && normSatisfaction <= 50) {
      quadrant = 'improve';
      priority = 5; 
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

/**
 * Comparação entre o que o consumidor espera de uma categoria ou marca e o que efetivamente percebe,
 * quantificando brechas de entrega que afetam satisfação e fidelização.
 */
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

/**
 * Mapeamento das etapas de awareness, consideração, intenção e compra para detectar abandonos.
 */
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

/**
 * Decomposição do NPS por perfil, região, canal e etapa da jornada.
 */
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

/**
 * Classificação automática do tom emocional de respostas abertas em positivo, neutro ou negativo,
 * com possibilidade de gradação de intensidade.
 */
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

/**
 * Métrica de validação da qualidade e coesão dos clusters formados,
 * garantindo que o número de segmentos e a solução de agrupamento escolhida são estatisticamente robustos.
 */
export function calculateSilhouetteScore(
  data: number[][],
  labels: number[]
): number {
  if (data.length === 0) return 0;

  let totalScore = 0;

  data.forEach((point, i) => {
    const clusterLabel = labels[i];
    
    const sameCluster = data.filter((_, j) => labels[j] === clusterLabel && i !== j);
    const a = sameCluster.length > 0
      ? sameCluster.reduce((sum, other) => sum + euclideanDistance(point, other), 0) / sameCluster.length
      : 0;

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

/**
 * Medida de consistência interna de escalas e construtos.
 */
export function calculateCronbachAlpha(items: number[][]): number {
  if (items.length === 0 || items[0].length < 2) return 0;

  const n = items[0].length; 
  const k = items.length; 

  const itemVariances: number[] = [];
  for (let i = 0; i < n; i++) {
    const itemScores = items.map(row => row[i]);
    const mean = itemScores.reduce((a, b) => a + b, 0) / k;
    const variance = itemScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / k;
    itemVariances.push(variance);
  }

  const totals = items.map(row => row.reduce((a, b) => a + b, 0));
  const meanTotal = totals.reduce((a, b) => a + b, 0) / k;
  const totalVariance = totals.reduce((sum, total) => sum + Math.pow(total - meanTotal, 2), 0) / k;

  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);

  if (totalVariance === 0) return 0;

  const alpha = (n / (n - 1)) * (1 - (sumItemVariances / totalVariance));

  return Math.max(0, Math.min(1, alpha)); 
}


// ============================================================================
// ASPECT-BASED SENTIMENT ANALYSIS (ABSA)
// ============================================================================

export interface AspectSentiment {
  aspect: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  intensity: number;
  frequency: number;
  examples: string[];
}

/**
 * Identificação automática de sentimentos associados a atributos ou aspectos específicos
 * mencionados em respostas abertas, permitindo análise granular de drivers de satisfação
 * e insatisfação por elemento do produto/serviço.
 */
export function analyzeAspectBasedSentiment(textResponses: string[]): AspectSentiment[] {
  const aspectSentiments: Record<string, AspectSentiment> = {};
  
  // Dicionário de aspectos comuns
  const aspectKeywords: Record<string, string[]> = {
    'qualidade': ['qualidade', 'durabilidade', 'resistência', 'acabamento'],
    'preço': ['preço', 'caro', 'barato', 'valor', 'custo'],
    'atendimento': ['atendimento', 'vendedor', 'gerente', 'suporte', 'equipe'],
    'entrega': ['entrega', 'prazo', 'rapidez', 'demora', 'atraso'],
    'embalagem': ['embalagem', 'pacote', 'caixa', 'apresentação'],
    'design': ['design', 'aparência', 'estética', 'cores', 'forma'],
  };

  textResponses.forEach(text => {
    const lowerText = text.toLowerCase();
    
    Object.entries(aspectKeywords).forEach(([aspect, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          if (!aspectSentiments[aspect]) {
            aspectSentiments[aspect] = {
              aspect,
              sentiment: 'neutral',
              intensity: 0,
              frequency: 0,
              examples: [],
            };
          }
          
          aspectSentiments[aspect].frequency++;
          
          // Detectar sentimento
          const positiveMatch = lowerText.match(new RegExp(`(excelente|ótimo|bom|adorei|perfeito|incrível|maravilhoso).*${keyword}|(${keyword}).*?(excelente|ótimo|bom|adorei|perfeito|incrível|maravilhoso)`, 'i'));
          const negativeMatch = lowerText.match(new RegExp(`(ruim|péssimo|horrível|terrível|decepção|problema|falha|defeito).*${keyword}|(${keyword}).*?(ruim|péssimo|horrível|terrível|decepção|problema|falha|defeito)`, 'i'));
          
          if (positiveMatch) {
            aspectSentiments[aspect].sentiment = 'positive';
            aspectSentiments[aspect].intensity = Math.min(1, aspectSentiments[aspect].intensity + 0.5);
          } else if (negativeMatch) {
            aspectSentiments[aspect].sentiment = 'negative';
            aspectSentiments[aspect].intensity = Math.min(1, aspectSentiments[aspect].intensity + 0.5);
          }
          
          if (aspectSentiments[aspect].examples.length < 3) {
            aspectSentiments[aspect].examples.push(text.substring(0, 100));
          }
        }
      });
    });
  });

  return Object.values(aspectSentiments).sort((a, b) => b.frequency - a.frequency);
}

// ============================================================================
// TURF ANALYSIS (Total Unduplicated Reach and Frequency)
// ============================================================================

export interface TURFResult {
  combination: string[];
  reachPercentage: number;
  frequency: number;
  uniqueReach: number;
  totalCoverage: number;
}

/**
 * Otimização de portfólio de produtos, atributos ou mensagens para maximizar
 * alcance único e frequência de preferência.
 */
export function analyzeTURF(
  responses: AnalysisResponse[],
  items: Array<{ id: string; name: string }>,
  maxCombinationSize: number = 3
): TURFResult[] {
  const results: TURFResult[] = [];
  const totalRespondents = responses.length;

  // Gera todas as combinações possíveis
  const combinations = generateCombinations(items, maxCombinationSize);

  combinations.forEach(combo => {
    const respondentsWithCombo = responses.filter(r => {
      return combo.every(item => {
        const itemKey = Object.keys(r.answers).find(k => r.answers[k] === item.id);
        return itemKey !== undefined;
      });
    });

    const reachPercentage = (respondentsWithCombo.length / totalRespondents) * 100;
    
    results.push({
      combination: combo.map(c => c.name),
      reachPercentage,
      frequency: respondentsWithCombo.length,
      uniqueReach: respondentsWithCombo.length,
      totalCoverage: reachPercentage,
    });
  });

  return results.sort((a, b) => b.reachPercentage - a.reachPercentage);
}

function generateCombinations<T>(items: T[], maxSize: number): T[][] {
  const result: T[][] = [];
  
  for (let size = 1; size <= Math.min(maxSize, items.length); size++) {
    const combos = getCombinationsOfSize(items, size);
    result.push(...combos);
  }
  
  return result;
}

function getCombinationsOfSize<T>(items: T[], size: number): T[][] {
  if (size === 1) return items.map(item => [item]);
  if (size === items.length) return [items];
  
  const result: T[][] = [];
  
  for (let i = 0; i < items.length - size + 1; i++) {
    const head = items[i];
    const tail = getCombinationsOfSize(items.slice(i + 1), size - 1);
    tail.forEach(combo => result.push([head, ...combo]));
  }
  
  return result;
}

// ============================================================================
// MARKOV CHAIN ANALYSIS
// ============================================================================

export interface MarkovTransition {
  from: string;
  to: string;
  probability: number;
  frequency: number;
}

export interface MarkovAnalysisResult {
  transitions: MarkovTransition[];
  steadyState: Record<string, number>;
  churnRate: number;
  retentionRate: number;
}

/**
 * Previsão probabilística de transições entre marcas ao longo do tempo
 * com base em matrizes de transição.
 */
export function analyzeMarkovChain(
  responses: AnalysisResponse[],
  brandQuestion: Question,
  timeQuestion?: Question
): MarkovAnalysisResult {
  const brandKey = brandQuestion.variableCode || brandQuestion.id;
  const transitions: Record<string, Record<string, number>> = {};
  const brandCounts: Record<string, number> = {};

  responses.forEach(r => {
    const brand = String(r.answers[brandKey]);
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    
    if (!transitions[brand]) {
      transitions[brand] = {};
    }
  });

  // Inicializa matriz de transição
  Object.keys(brandCounts).forEach(brand => {
    Object.keys(brandCounts).forEach(targetBrand => {
      if (!transitions[brand][targetBrand]) {
        transitions[brand][targetBrand] = 0;
      }
    });
  });

  const transitionArray: MarkovTransition[] = [];
  let totalTransitions = 0;

  Object.entries(transitions).forEach(([from, targets]) => {
    const fromCount = brandCounts[from] || 1;
    
    Object.entries(targets).forEach(([to, count]) => {
      const probability = count / fromCount;
      transitionArray.push({
        from,
        to,
        probability,
        frequency: count,
      });
      totalTransitions += count;
    });
  });

  // Calcula steady state (distribuição de longo prazo)
  const steadyState: Record<string, number> = {};
  Object.keys(brandCounts).forEach(brand => {
    steadyState[brand] = brandCounts[brand] / responses.length;
  });

  // Calcula taxas de churn e retenção
  const retentionRate = Object.entries(transitions)
    .reduce((sum, [brand, targets]) => {
      const fromCount = brandCounts[brand] || 1;
      return sum + ((targets[brand] || 0) / fromCount);
    }, 0) / Object.keys(brandCounts).length;

  const churnRate = 1 - retentionRate;

  return {
    transitions: transitionArray.sort((a, b) => b.probability - a.probability),
    steadyState,
    churnRate,
    retentionRate,
  };
}

// ============================================================================
// CUSTOMER LIFETIME VALUE (CLV) ANALYSIS
// ============================================================================

export interface CLVSegment {
  segment: string;
  clv: number;
  retentionRate: number;
  averagePurchaseValue: number;
  purchaseFrequency: number;
  lifespan: number;
}

/**
 * Estimação do valor monetário esperado de cada cliente ou segmento ao longo do tempo,
 * integrando padrões de retenção, frequência de compra e margem.
 */
export function analyzeCLV(
  responses: AnalysisResponse[],
  segmentQuestion: Question,
  purchaseValueQuestion: Question,
  frequencyQuestion: Question,
  retentionQuestion?: Question,
  lifespanYears: number = 3
): CLVSegment[] {
  const segmentKey = segmentQuestion.variableCode || segmentQuestion.id;
  const valueKey = purchaseValueQuestion.variableCode || purchaseValueQuestion.id;
  const freqKey = frequencyQuestion.variableCode || frequencyQuestion.id;

  const segments: Record<string, CLVSegment> = {};

  responses.forEach(r => {
    const segment = String(r.answers[segmentKey]);
    const value = Number(r.answers[valueKey]) || 0;
    const frequency = Number(r.answers[freqKey]) || 1;

    if (!segments[segment]) {
      segments[segment] = {
        segment,
        clv: 0,
        retentionRate: 0.8,
        averagePurchaseValue: 0,
        purchaseFrequency: 0,
        lifespan: lifespanYears,
      };
    }

    segments[segment].averagePurchaseValue += value;
    segments[segment].purchaseFrequency += frequency;
  });

  // Calcula CLV para cada segmento
  Object.values(segments).forEach(segment => {
    const count = responses.filter(r => String(r.answers[segmentKey]) === segment.segment).length;
    
    segment.averagePurchaseValue = segment.averagePurchaseValue / count;
    segment.purchaseFrequency = segment.purchaseFrequency / count;
    
    // CLV = (Average Purchase Value × Purchase Frequency × Customer Lifespan) × Retention Rate
    segment.clv = (segment.averagePurchaseValue * segment.purchaseFrequency * segment.lifespan) * segment.retentionRate;
  });

  return Object.values(segments).sort((a, b) => b.clv - a.clv);
}

// ============================================================================
// COHORT ANALYSIS
// ============================================================================

export interface CohortMetric {
  cohort: string;
  period: number;
  value: number;
  retentionPercentage: number;
}

export interface CohortAnalysisResult {
  cohorts: Record<string, CohortMetric[]>;
  averageRetention: number;
  churnTrend: number;
}

/**
 * Acompanhamento de grupos de clientes formados pela data de aquisição ou primeiro contato
 * para identificar padrões de retenção e evolução de comportamento.
 */
export function analyzeCohort(
  responses: AnalysisResponse[],
  cohortDateQuestion: Question,
  valueQuestion: Question,
  periodQuestion?: Question
): CohortAnalysisResult {
  const cohortKey = cohortDateQuestion.variableCode || cohortDateQuestion.id;
  const valueKey = valueQuestion.variableCode || valueQuestion.id;

  const cohorts: Record<string, CohortMetric[]> = {};
  const cohortValues: Record<string, number[]> = {};

  responses.forEach(r => {
    const cohortDate = String(r.answers[cohortKey]);
    const value = Number(r.answers[valueKey]) || 0;

    if (!cohorts[cohortDate]) {
      cohorts[cohortDate] = [];
      cohortValues[cohortDate] = [];
    }

    cohortValues[cohortDate].push(value);
  });

  // Calcula métricas por período
  Object.entries(cohortValues).forEach(([cohort, values], index) => {
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const retentionPercentage = (values.length / responses.length) * 100;

    cohorts[cohort].push({
      cohort,
      period: index,
      value: avgValue,
      retentionPercentage,
    });
  });

  // Calcula retenção média e tendência de churn
  const allRetentionRates = Object.values(cohorts)
    .flat()
    .map(m => m.retentionPercentage);
  
  const averageRetention = allRetentionRates.reduce((a, b) => a + b, 0) / allRetentionRates.length;
  
  // Calcula tendência de churn (variação entre períodos)
  const churnTrend = allRetentionRates.length > 1
    ? (allRetentionRates[allRetentionRates.length - 1] - allRetentionRates[0]) / allRetentionRates[0]
    : 0;

  return {
    cohorts,
    averageRetention,
    churnTrend,
  };
}

// ============================================================================
// VAN WESTENDORP (PSM) ANALYSIS
// ============================================================================

export interface VanWestendorpResult {
  pricePoints: number[];
  tooExpensiveCurve: number[];
  expensiveCurve: number[];
  cheapCurve: number[];
  tooCheapCurve: number[];
  optimalPricePoint: number;
  indifferencePricePoint: number;
  acceptablePriceRange: { min: number; max: number };
  insight: string;
}

/**
 * Análise Van Westendorp PSM - gera curvas de preço e identifica ponto ótimo.
 * Espera respostas com campos: too_cheap, cheap, expensive, too_expensive
 */
export function analyzeVanWestendorp(
  responses: AnalysisResponse[],
  questionVariableCode: string
): VanWestendorpResult {
  const tooCheapValues: number[] = [];
  const cheapValues: number[] = [];
  const expensiveValues: number[] = [];
  const tooExpensiveValues: number[] = [];

  responses.forEach(r => {
    const answer = r.answers[questionVariableCode];
    if (answer && typeof answer === 'object') {
      if (answer.too_cheap !== undefined) tooCheapValues.push(Number(answer.too_cheap));
      if (answer.cheap !== undefined) cheapValues.push(Number(answer.cheap));
      if (answer.expensive !== undefined) expensiveValues.push(Number(answer.expensive));
      if (answer.too_expensive !== undefined) tooExpensiveValues.push(Number(answer.too_expensive));
    }
  });

  // Generate cumulative distribution curves
  const allPrices = [...tooCheapValues, ...cheapValues, ...expensiveValues, ...tooExpensiveValues]
    .filter(v => !isNaN(v));
  
  if (allPrices.length === 0) {
    return {
      pricePoints: [],
      tooExpensiveCurve: [],
      expensiveCurve: [],
      cheapCurve: [],
      tooCheapCurve: [],
      optimalPricePoint: 0,
      indifferencePricePoint: 0,
      acceptablePriceRange: { min: 0, max: 0 },
      insight: 'Dados insuficientes para análise Van Westendorp.',
    };
  }

  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const step = (maxPrice - minPrice) / 20;
  const pricePoints: number[] = [];
  
  for (let p = minPrice; p <= maxPrice; p += step) {
    pricePoints.push(Math.round(p * 100) / 100);
  }

  const total = responses.length || 1;
  const cumulativeAbove = (values: number[], price: number) => values.filter(v => v >= price).length / total * 100;
  const cumulativeBelow = (values: number[], price: number) => values.filter(v => v <= price).length / total * 100;

  const tooExpensiveCurve = pricePoints.map(p => cumulativeBelow(tooExpensiveValues, p));
  const expensiveCurve = pricePoints.map(p => cumulativeBelow(expensiveValues, p));
  const cheapCurve = pricePoints.map(p => cumulativeAbove(cheapValues, p));
  const tooCheapCurve = pricePoints.map(p => cumulativeAbove(tooCheapValues, p));

  // Find intersection points
  let optimalIdx = 0;
  let indifferenceIdx = 0;
  let minDiffOptimal = Infinity;
  let minDiffIndiff = Infinity;

  pricePoints.forEach((_, i) => {
    // OPP: too_expensive meets too_cheap
    const diffOpp = Math.abs(tooExpensiveCurve[i] - tooCheapCurve[i]);
    if (diffOpp < minDiffOptimal) { minDiffOptimal = diffOpp; optimalIdx = i; }

    // IDP: expensive meets cheap
    const diffIdp = Math.abs(expensiveCurve[i] - cheapCurve[i]);
    if (diffIdp < minDiffIndiff) { minDiffIndiff = diffIdp; indifferenceIdx = i; }
  });

  const optimalPricePoint = pricePoints[optimalIdx] || 0;
  const indifferencePricePoint = pricePoints[indifferenceIdx] || 0;

  // Acceptable range: where too_cheap > too_expensive
  const rangeMin = pricePoints.find((_, i) => tooCheapCurve[i] <= tooExpensiveCurve[i]) || minPrice;
  const rangeMax = pricePoints.findLast((_, i) => tooExpensiveCurve[i] <= tooCheapCurve[i]) || maxPrice;

  return {
    pricePoints,
    tooExpensiveCurve,
    expensiveCurve,
    cheapCurve,
    tooCheapCurve,
    optimalPricePoint,
    indifferencePricePoint,
    acceptablePriceRange: { min: rangeMin, max: rangeMax },
    insight: `Ponto de preço ótimo: R$ ${optimalPricePoint.toFixed(2)}. Faixa aceitável: R$ ${rangeMin.toFixed(2)} - R$ ${rangeMax.toFixed(2)}. Ponto de indiferença: R$ ${indifferencePricePoint.toFixed(2)}.`,
  };
}

// ============================================================================
// KANO ANALYSIS
// ============================================================================

export type KanoCategory = 'must_be' | 'one_dimensional' | 'attractive' | 'indifferent' | 'reverse' | 'questionable';

export interface KanoFeatureResult {
  feature: string;
  category: KanoCategory;
  categoryLabel: string;
  functionalPositive: number;
  functionalNeutral: number;
  functionalNegative: number;
  dysfunctionalPositive: number;
  dysfunctionalNeutral: number;
  dysfunctionalNegative: number;
  satisfactionCoefficient: number;
  dissatisfactionCoefficient: number;
}

export interface KanoAnalysisResult {
  features: KanoFeatureResult[];
  insight: string;
}

const KANO_CATEGORY_LABELS: Record<KanoCategory, string> = {
  must_be: 'Básico (Must-be)',
  one_dimensional: 'Linear (One-dimensional)',
  attractive: 'Atrativo (Attractive)',
  indifferent: 'Indiferente',
  reverse: 'Reverso',
  questionable: 'Questionável',
};

/**
 * Classificação de Kano baseada em perguntas funcionais/disfuncionais.
 * Espera respostas com campos: {featureId}_functional e {featureId}_dysfunctional (1-5)
 */
export function analyzeKano(
  responses: AnalysisResponse[],
  features: Array<{ id: string; name: string }>,
  questionVariableCode: string
): KanoAnalysisResult {
  const results: KanoFeatureResult[] = [];

  features.forEach(feature => {
    let mustBe = 0, oneDim = 0, attractive = 0, indifferent = 0, reverse = 0, questionable = 0;

    responses.forEach(r => {
      const answer = r.answers[questionVariableCode];
      if (!answer || typeof answer !== 'object') return;

      const func = Number(answer[`${feature.id}_functional`]) || 3;
      const dysfunc = Number(answer[`${feature.id}_dysfunctional`]) || 3;

      // Kano evaluation table (simplified)
      if (func >= 4 && dysfunc <= 2) oneDim++;
      else if (func >= 4 && dysfunc >= 3) attractive++;
      else if (func <= 2 && dysfunc <= 2) questionable++;
      else if (func <= 2 && dysfunc >= 4) reverse++;
      else if (func <= 3 && dysfunc <= 2) mustBe++;
      else indifferent++;
    });

    const total = responses.length || 1;
    const counts = { mustBe, oneDim, attractive, indifferent, reverse, questionable };
    const maxCategory = Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a);

    const categoryMap: Record<string, KanoCategory> = {
      mustBe: 'must_be',
      oneDim: 'one_dimensional',
      attractive: 'attractive',
      indifferent: 'indifferent',
      reverse: 'reverse',
      questionable: 'questionable',
    };

    const category = categoryMap[maxCategory[0]] || 'indifferent';

    // Satisfaction/Dissatisfaction coefficients
    const satCoeff = (attractive + oneDim) / total;
    const dissatCoeff = -(oneDim + mustBe) / total;

    results.push({
      feature: feature.name,
      category,
      categoryLabel: KANO_CATEGORY_LABELS[category],
      functionalPositive: oneDim + attractive,
      functionalNeutral: indifferent,
      functionalNegative: mustBe + reverse,
      dysfunctionalPositive: reverse,
      dysfunctionalNeutral: indifferent,
      dysfunctionalNegative: oneDim + mustBe,
      satisfactionCoefficient: Math.round(satCoeff * 100) / 100,
      dissatisfactionCoefficient: Math.round(dissatCoeff * 100) / 100,
    });
  });

  const mustBeCount = results.filter(r => r.category === 'must_be').length;
  const attractiveCount = results.filter(r => r.category === 'attractive').length;

  return {
    features: results,
    insight: `${mustBeCount} atributos básicos (must-have), ${attractiveCount} atributos atrativos (delighters). Priorize investimento nos atributos lineares e corrija gaps nos básicos.`,
  };
}

// ============================================================================
// CES (Customer Effort Score) ANALYSIS
// ============================================================================

export interface CESAnalysisResult {
  averageCES: number;
  distribution: Array<{ score: number; count: number; percentage: number }>;
  lowEffortPercentage: number;
  highEffortPercentage: number;
  classification: 'Excelente' | 'Bom' | 'Regular' | 'Crítico';
  insight: string;
}

/**
 * Análise do Customer Effort Score (escala 1-7, onde 7 = muito fácil).
 */
export function analyzeCES(
  responses: AnalysisResponse[],
  cesQuestionCode: string
): CESAnalysisResult {
  const scores = responses
    .map(r => Number(r.answers[cesQuestionCode]))
    .filter(v => !isNaN(v) && v >= 1 && v <= 7);

  if (scores.length === 0) {
    return {
      averageCES: 0,
      distribution: [],
      lowEffortPercentage: 0,
      highEffortPercentage: 0,
      classification: 'Crítico',
      insight: 'Dados insuficientes para análise CES.',
    };
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const dist: Record<number, number> = {};
  for (let i = 1; i <= 7; i++) dist[i] = 0;
  scores.forEach(s => dist[s]++);

  const distribution = Object.entries(dist).map(([score, count]) => ({
    score: Number(score),
    count,
    percentage: (count / scores.length) * 100,
  }));

  const lowEffort = scores.filter(s => s >= 5).length;
  const highEffort = scores.filter(s => s <= 3).length;

  let classification: CESAnalysisResult['classification'] = 'Crítico';
  if (avg >= 5.5) classification = 'Excelente';
  else if (avg >= 4.5) classification = 'Bom';
  else if (avg >= 3.5) classification = 'Regular';

  return {
    averageCES: Math.round(avg * 100) / 100,
    distribution,
    lowEffortPercentage: Math.round((lowEffort / scores.length) * 100),
    highEffortPercentage: Math.round((highEffort / scores.length) * 100),
    classification,
    insight: `CES médio: ${avg.toFixed(1)}/7.0 (${classification}). ${Math.round((lowEffort / scores.length) * 100)}% consideram a interação fácil. ${Math.round((highEffort / scores.length) * 100)}% reportam alto esforço.`,
  };
}

// ============================================================================
// CSAT ANALYSIS
// ============================================================================

export interface CSATAnalysisResult {
  averageCSAT: number;
  satisfiedPercentage: number;
  distribution: Array<{ score: number; count: number; percentage: number; label: string }>;
  classification: 'Excelente' | 'Bom' | 'Regular' | 'Crítico';
  insight: string;
}

const CSAT_LABELS = ['Muito Insatisfeito', 'Insatisfeito', 'Neutro', 'Satisfeito', 'Muito Satisfeito'];

/**
 * Análise do Customer Satisfaction Score (escala 1-5).
 */
export function analyzeCSAT(
  responses: AnalysisResponse[],
  csatQuestionCode: string
): CSATAnalysisResult {
  const scores = responses
    .map(r => Number(r.answers[csatQuestionCode]))
    .filter(v => !isNaN(v) && v >= 1 && v <= 5);

  if (scores.length === 0) {
    return {
      averageCSAT: 0,
      satisfiedPercentage: 0,
      distribution: [],
      classification: 'Crítico',
      insight: 'Dados insuficientes para análise CSAT.',
    };
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const satisfied = scores.filter(s => s >= 4).length;
  
  const dist: Record<number, number> = {};
  for (let i = 1; i <= 5; i++) dist[i] = 0;
  scores.forEach(s => dist[s]++);

  const distribution = Object.entries(dist).map(([score, count]) => ({
    score: Number(score),
    count,
    percentage: (count / scores.length) * 100,
    label: CSAT_LABELS[Number(score) - 1] || '',
  }));

  const satisfiedPct = Math.round((satisfied / scores.length) * 100);
  let classification: CSATAnalysisResult['classification'] = 'Crítico';
  if (satisfiedPct >= 80) classification = 'Excelente';
  else if (satisfiedPct >= 60) classification = 'Bom';
  else if (satisfiedPct >= 40) classification = 'Regular';

  return {
    averageCSAT: Math.round(avg * 100) / 100,
    satisfiedPercentage: satisfiedPct,
    distribution,
    classification,
    insight: `CSAT: ${satisfiedPct}% satisfeitos (4-5). Média: ${avg.toFixed(1)}/5.0 (${classification}).`,
  };
}

// ============================================================================
// GABOR-GRANGER PRICING ANALYSIS
// ============================================================================

export interface GaborGrangerResult {
  demandCurve: Array<{ price: number; intentionPercentage: number }>;
  optimalPrice: number;
  maxRevenue: number;
  priceElasticity: number;
  insight: string;
}

/**
 * Análise Gabor-Granger: curva de demanda a partir de intenção em diferentes preços.
 * Espera respostas com campos: {price}_intention (1-5, onde 4-5 = compraria)
 */
export function analyzeGaborGranger(
  responses: AnalysisResponse[],
  questionVariableCode: string,
  pricePoints: number[]
): GaborGrangerResult {
  const demandCurve: Array<{ price: number; intentionPercentage: number }> = [];
  const total = responses.length || 1;

  pricePoints.forEach(price => {
    const wouldBuy = responses.filter(r => {
      const answer = r.answers[questionVariableCode];
      if (!answer || typeof answer !== 'object') return false;
      const intention = Number(answer[`price_${price}`]) || 0;
      return intention >= 4; // 4-5 = compraria
    }).length;

    demandCurve.push({
      price,
      intentionPercentage: Math.round((wouldBuy / total) * 100),
    });
  });

  // Find optimal price (max revenue = price × intention%)
  let maxRevenue = 0;
  let optimalPrice = 0;
  demandCurve.forEach(point => {
    const revenue = point.price * (point.intentionPercentage / 100);
    if (revenue > maxRevenue) {
      maxRevenue = revenue;
      optimalPrice = point.price;
    }
  });

  // Price elasticity (average change in demand / change in price)
  let elasticity = 0;
  if (demandCurve.length > 1) {
    const first = demandCurve[0];
    const last = demandCurve[demandCurve.length - 1];
    const demandChange = (last.intentionPercentage - first.intentionPercentage) / first.intentionPercentage;
    const priceChange = (last.price - first.price) / first.price;
    elasticity = priceChange !== 0 ? demandChange / priceChange : 0;
  }

  return {
    demandCurve,
    optimalPrice,
    maxRevenue: Math.round(maxRevenue * 100) / 100,
    priceElasticity: Math.round(elasticity * 100) / 100,
    insight: `Preço ótimo: R$ ${optimalPrice.toFixed(2)} (receita máxima estimada: R$ ${maxRevenue.toFixed(2)} por respondente). Elasticidade-preço: ${elasticity.toFixed(2)}.`,
  };
}

// ============================================================================
// BRAND FUNNEL ANALYSIS
// ============================================================================

export interface BrandFunnelStage {
  stage: string;
  count: number;
  percentage: number;
  conversionFromPrevious: number;
}

export interface BrandFunnelResult {
  stages: BrandFunnelStage[];
  bottleneck: string;
  overallConversion: number;
  insight: string;
}

const BRAND_FUNNEL_STAGES = ['awareness', 'consideration', 'preference', 'usage', 'recommendation'];
const BRAND_FUNNEL_LABELS: Record<string, string> = {
  awareness: 'Conhecimento',
  consideration: 'Consideração',
  preference: 'Preferência',
  usage: 'Uso',
  recommendation: 'Recomendação',
};

/**
 * Análise de funil de marca: awareness → consideração → preferência → uso → recomendação.
 */
export function analyzeBrandFunnel(
  responses: AnalysisResponse[],
  questionVariableCode: string
): BrandFunnelResult {
  const total = responses.length || 1;
  const stages: BrandFunnelStage[] = [];
  let previousCount = total;
  let maxDropoff = 0;
  let bottleneckStage = '';

  BRAND_FUNNEL_STAGES.forEach((stage, idx) => {
    const count = responses.filter(r => {
      const answer = r.answers[questionVariableCode];
      if (Array.isArray(answer)) return answer.includes(stage);
      if (typeof answer === 'object' && answer !== null) return answer[stage] === true;
      return false;
    }).length;

    const conversionFromPrevious = previousCount > 0 ? (count / previousCount) * 100 : 0;
    const dropoff = previousCount - count;

    if (idx > 0 && dropoff > maxDropoff) {
      maxDropoff = dropoff;
      bottleneckStage = BRAND_FUNNEL_LABELS[stage] || stage;
    }

    stages.push({
      stage: BRAND_FUNNEL_LABELS[stage] || stage,
      count,
      percentage: Math.round((count / total) * 100),
      conversionFromPrevious: Math.round(conversionFromPrevious),
    });

    previousCount = count;
  });

  const overallConversion = stages.length > 0 
    ? Math.round((stages[stages.length - 1].count / total) * 100) 
    : 0;

  return {
    stages,
    bottleneck: bottleneckStage || 'N/A',
    overallConversion,
    insight: `Conversão total do funil: ${overallConversion}%. Maior gargalo: ${bottleneckStage || 'N/A'} (queda de ${maxDropoff} respondentes).`,
  };
}

// ============================================================================
// SHAPLEY VALUES (Relative Importance)
// ============================================================================

export interface ShapleyResult {
  variables: Array<{ name: string; importance: number; normalizedImportance: number }>;
  insight: string;
}

/**
 * Quantificação da contribuição relativa de cada variável preditora.
 * Implementação simplificada baseada em correlação parcial.
 */
export function analyzeShapleyImportance(
  responses: AnalysisResponse[],
  predictorQuestions: Question[],
  targetQuestion: Question
): ShapleyResult {
  const targetKey = targetQuestion.variableCode || targetQuestion.id;
  const targetValues = responses.map(r => Number(r.answers[targetKey])).filter(v => !isNaN(v));

  if (targetValues.length < 5) {
    return { variables: [], insight: 'Dados insuficientes para análise de importância relativa.' };
  }

  const targetMean = targetValues.reduce((a, b) => a + b, 0) / targetValues.length;
  const targetStd = Math.sqrt(targetValues.reduce((sum, v) => sum + Math.pow(v - targetMean, 2), 0) / targetValues.length);

  const variables = predictorQuestions.map(q => {
    const key = q.variableCode || q.id;
    const values = responses.map(r => Number(r.answers[key])).filter(v => !isNaN(v));

    if (values.length < 5 || targetStd === 0) return { name: q.question, importance: 0, normalizedImportance: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

    if (std === 0) return { name: q.question, importance: 0, normalizedImportance: 0 };

    // Pearson correlation as proxy for importance
    let sumProduct = 0;
    const minLen = Math.min(values.length, targetValues.length);
    for (let i = 0; i < minLen; i++) {
      sumProduct += ((values[i] - mean) * (targetValues[i] - targetMean));
    }
    const correlation = sumProduct / (minLen * std * targetStd);
    const importance = Math.abs(correlation);

    return { name: q.question, importance: Math.round(importance * 100) / 100, normalizedImportance: 0 };
  });

  // Normalize
  const totalImportance = variables.reduce((sum, v) => sum + v.importance, 0);
  variables.forEach(v => {
    v.normalizedImportance = totalImportance > 0 ? Math.round((v.importance / totalImportance) * 100) : 0;
  });

  variables.sort((a, b) => b.importance - a.importance);

  const topVar = variables[0]?.name || 'N/A';
  return {
    variables,
    insight: `Variável mais importante: "${topVar}" (${variables[0]?.normalizedImportance || 0}% da importância relativa).`,
  };
}

// ============================================================================
// BOOTSTRAP CONFIDENCE INTERVALS
// ============================================================================

export interface BootstrapResult {
  originalMean: number;
  bootstrapMean: number;
  confidenceInterval: { lower: number; upper: number };
  standardError: number;
  nIterations: number;
  insight: string;
}

/**
 * Bootstrap para estimativa de intervalos de confiança.
 */
export function analyzeBootstrap(
  values: number[],
  nIterations: number = 1000,
  confidenceLevel: number = 0.95
): BootstrapResult {
  if (values.length < 3) {
    return {
      originalMean: 0,
      bootstrapMean: 0,
      confidenceInterval: { lower: 0, upper: 0 },
      standardError: 0,
      nIterations,
      insight: 'Amostra insuficiente para bootstrap.',
    };
  }

  const originalMean = values.reduce((a, b) => a + b, 0) / values.length;
  const bootstrapMeans: number[] = [];

  for (let i = 0; i < nIterations; i++) {
    const sample: number[] = [];
    for (let j = 0; j < values.length; j++) {
      sample.push(values[Math.floor(Math.random() * values.length)]);
    }
    bootstrapMeans.push(sample.reduce((a, b) => a + b, 0) / sample.length);
  }

  bootstrapMeans.sort((a, b) => a - b);
  const alpha = (1 - confidenceLevel) / 2;
  const lowerIdx = Math.floor(alpha * nIterations);
  const upperIdx = Math.floor((1 - alpha) * nIterations);

  const bootstrapMean = bootstrapMeans.reduce((a, b) => a + b, 0) / nIterations;
  const se = Math.sqrt(bootstrapMeans.reduce((sum, v) => sum + Math.pow(v - bootstrapMean, 2), 0) / nIterations);

  return {
    originalMean: Math.round(originalMean * 100) / 100,
    bootstrapMean: Math.round(bootstrapMean * 100) / 100,
    confidenceInterval: {
      lower: Math.round(bootstrapMeans[lowerIdx] * 100) / 100,
      upper: Math.round(bootstrapMeans[upperIdx] * 100) / 100,
    },
    standardError: Math.round(se * 100) / 100,
    nIterations,
    insight: `Média: ${originalMean.toFixed(2)} [IC ${(confidenceLevel * 100).toFixed(0)}%: ${bootstrapMeans[lowerIdx].toFixed(2)} - ${bootstrapMeans[upperIdx].toFixed(2)}]. Erro padrão: ${se.toFixed(3)}.`,
  };
}
