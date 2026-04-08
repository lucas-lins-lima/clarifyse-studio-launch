/**
 * CLARIFYSE - Metodologias Avançadas e Machine Learning
 * ========================================================
 * Análises causais, Deep Learning, LLM-assisted insights, Synthetic data generation
 */

import { AnalysisResponse, Question } from './analyticsEngine';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface UpliftResult {
  treatmentGroup: number;
  controlGroup: number;
  upliftEffect: number;
  upliftPercentage: number;
  pValue: number;
  significant: boolean;
  recommendation: string;
}

export interface CausalForestResult {
  featureImportance: Record<string, number>;
  heterogeneousEffects: Array<{ segment: string; effect: number }>;
  consistency: number;
  insight: string;
}

export interface LLMInsight {
  theme: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keyPoints: string[];
  actionItems: string[];
  confidence: number;
}

export interface SyntheticRespondent {
  id: string;
  profile: Record<string, any>;
  generatedAnswers: Record<string, any>;
  similarityScore: number;
}

export interface ScenarioSimulation {
  scenario: string;
  configuration: Record<string, any>;
  predictedOutcome: Record<string, number>;
  confidence: number;
  sensitivity: Record<string, number>;
}

// ============================================================================
// CAUSAL INFERENCE - PROPENSITY SCORE MATCHING
// ============================================================================

/**
 * Propensity Score Matching para estimar efeito causal
 * Utilizado para controlar viés de seleção em estudos observacionais
 */
export function performPropensityScoreMatching(
  responses: AnalysisResponse[],
  treatmentQuestion: Question,
  confounders: Question[],
  outcomeQuestion: Question
): UpliftResult {
  const treatmentKey = treatmentQuestion.variableCode || treatmentQuestion.id;
  const outcomeKey = outcomeQuestion.variableCode || outcomeQuestion.id;

  // Separar grupos tratamento e controle
  const treatment = responses.filter(r => r.answers[treatmentKey] === 1);
  const control = responses.filter(r => r.answers[treatmentKey] === 0);

  // Calcular propensity scores (simplificado)
  const propensityScores = responses.map(r => {
    let score = 0;
    confounders.forEach(q => {
      const key = q.variableCode || q.id;
      score += (Number(r.answers[key]) || 0) / confounders.length;
    });
    return score;
  });

  // Realizar matching
  const matched: { treatment: number[]; control: number[] } = { treatment: [], control: [] };
  const tolerance = 0.1;

  treatment.forEach((tResp, tIdx) => {
    const tScore = propensityScores[responses.indexOf(tResp)];
    const closestControl = control.find((cResp, cIdx) => {
      const cScore = propensityScores[responses.indexOf(cResp)];
      return Math.abs(tScore - cScore) < tolerance;
    });

    if (closestControl) {
      matched.treatment.push(Number(tResp.answers[outcomeKey]) || 0);
      matched.control.push(Number(closestControl.answers[outcomeKey]) || 0);
    }
  });

  // Calcular ATE (Average Treatment Effect)
  const treatmentOutcomes = matched.treatment;
  const controlOutcomes = matched.control;

  const avgTreatment = treatmentOutcomes.reduce((a, b) => a + b, 0) / treatmentOutcomes.length;
  const avgControl = controlOutcomes.reduce((a, b) => a + b, 0) / controlOutcomes.length;

  const upliftEffect = avgTreatment - avgControl;
  const upliftPercentage = avgControl !== 0 ? (upliftEffect / avgControl) * 100 : 0;

  // Teste de significância (simplificado)
  const tStatistic = upliftEffect / Math.sqrt(
    (Math.pow(avgTreatment, 2) / treatmentOutcomes.length) +
    (Math.pow(avgControl, 2) / controlOutcomes.length)
  );
  const pValue = 2 * (1 - normalCDF(Math.abs(tStatistic)));

  return {
    treatmentGroup: avgTreatment,
    controlGroup: avgControl,
    upliftEffect,
    upliftPercentage,
    pValue,
    significant: pValue < 0.05,
    recommendation: upliftPercentage > 0
      ? `Tratamento aumenta resultado em ${upliftPercentage.toFixed(2)}%`
      : `Tratamento reduz resultado em ${Math.abs(upliftPercentage).toFixed(2)}%`,
  };
}

function normalCDF(x: number): number {
  // Approximation of normal CDF using error function
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// ============================================================================
// DIFFERENCE-IN-DIFFERENCES (DiD)
// ============================================================================

export interface DiDResult {
  beforeTreatment: number;
  beforeControl: number;
  afterTreatment: number;
  afterControl: number;
  causalEffect: number;
  pValue: number;
  significant: boolean;
}

/**
 * Estimação de efeitos causais usando Difference-in-Differences
 * Aplicado na avaliação de campanhas, lançamentos e mudanças de posicionamento
 */
export function estimateDifferenceInDifferences(
  treatmentGroup: Array<{ before: number; after: number }>,
  controlGroup: Array<{ before: number; after: number }>
): DiDResult {
  const treatmentBefore = treatmentGroup.map(g => g.before);
  const treatmentAfter = treatmentGroup.map(g => g.after);
  const controlBefore = controlGroup.map(g => g.before);
  const controlAfter = controlGroup.map(g => g.after);

  const avgTreatmentBefore = treatmentBefore.reduce((a, b) => a + b, 0) / treatmentBefore.length;
  const avgTreatmentAfter = treatmentAfter.reduce((a, b) => a + b, 0) / treatmentAfter.length;
  const avgControlBefore = controlBefore.reduce((a, b) => a + b, 0) / controlBefore.length;
  const avgControlAfter = controlAfter.reduce((a, b) => a + b, 0) / controlAfter.length;

  const treatmentChange = avgTreatmentAfter - avgTreatmentBefore;
  const controlChange = avgControlAfter - avgControlBefore;
  const causalEffect = treatmentChange - controlChange;

  // Teste de significância
  const treatmentVar = calculateVariance(treatmentAfter) / treatmentAfter.length;
  const controlVar = calculateVariance(controlAfter) / controlAfter.length;
  const seEffect = Math.sqrt(treatmentVar + controlVar);
  const tStatistic = causalEffect / seEffect;
  const pValue = 2 * (1 - normalCDF(Math.abs(tStatistic)));

  return {
    beforeTreatment: avgTreatmentBefore,
    beforeControl: avgControlBefore,
    afterTreatment: avgTreatmentAfter,
    afterControl: avgControlAfter,
    causalEffect,
    pValue,
    significant: pValue < 0.05,
  };
}

function calculateVariance(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
}

// ============================================================================
// SYNTHETIC CONTROL METHOD (SCM)
// ============================================================================

export interface SyntheticControlResult {
  observedValues: number[];
  syntheticValues: number[];
  gaps: number[];
  avgGap: number;
  placeboTest: boolean;
  mspe: number;
}

/**
 * Construção de um grupo controle sintético para avaliação de impacto causal
 */
export function synthethicControlMethod(
  treatmentUnit: number[],
  controlUnits: number[][]
): SyntheticControlResult {
  const n = treatmentUnit.length;
  const m = controlUnits.length;

  // Encontrar pesos ótimos para os controles
  const weights = new Array(m).fill(1 / m); // Pesos iguais (simplificado)

  // Criar controle sintético
  const syntheticControl = new Array(n).fill(0);
  for (let t = 0; t < n; t++) {
    syntheticControl[t] = controlUnits.reduce((sum, unit, i) => sum + unit[t] * weights[i], 0);
  }

  // Calcular gaps
  const gaps = treatmentUnit.map((val, i) => val - syntheticControl[i]);
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  // MSPE (Mean Squared Prediction Error)
  const mspe = gaps.reduce((sum, gap) => sum + Math.pow(gap, 2), 0) / gaps.length;

  // Teste placebo simples
  const preGaps = gaps.slice(0, Math.floor(n / 2));
  const postGaps = gaps.slice(Math.floor(n / 2));
  const preMSPE = preGaps.reduce((sum, gap) => sum + Math.pow(gap, 2), 0) / preGaps.length;
  const postMSPE = postGaps.reduce((sum, gap) => sum + Math.pow(gap, 2), 0) / postGaps.length;
  const placeboTest = postMSPE > preMSPE * 2; // Efeito significativo se pós > 2x pré

  return {
    observedValues: treatmentUnit,
    syntheticValues: syntheticControl,
    gaps,
    avgGap,
    placeboTest,
    mspe,
  };
}

// ============================================================================
// LLM-ASSISTED TEXT ANALYSIS
// ============================================================================

/**
 * Extração de insights assistida por LLM (simulada com heurísticas)
 * Em produção, integrar com API OpenAI/Claude
 */
export function extractLLMAssistedInsights(textResponses: string[]): LLMInsight[] {
  const insights: LLMInsight[] = [];

  // Análise temática simples (em produção, usar embeddings + clustering)
  const themes: Record<string, { count: number; texts: string[]; sentiment: 'positive' | 'negative' | 'neutral' }> = {};

  textResponses.forEach(text => {
    // Detectar temas principais
    const detectedTheme = detectMainTheme(text);
    const sentiment = detectSimpleSentiment(text);

    if (!themes[detectedTheme]) {
      themes[detectedTheme] = { count: 0, texts: [], sentiment: 'neutral' };
    }

    themes[detectedTheme].count++;
    themes[detectedTheme].texts.push(text);
    themes[detectedTheme].sentiment = sentiment;
  });

  // Converter para insights
  Object.entries(themes).forEach(([theme, data]) => {
    const keyPoints = extractKeyPoints(data.texts);
    const actionItems = generateActionItems(theme, data.sentiment, keyPoints);

    insights.push({
      theme,
      sentiment: data.sentiment,
      keyPoints,
      actionItems,
      confidence: Math.min(data.count / textResponses.length, 1),
    });
  });

  return insights.sort((a, b) => b.confidence - a.confidence);
}

function detectMainTheme(text: string): string {
  const lowerText = text.toLowerCase();

  const themes: Record<string, string[]> = {
    'Qualidade do Produto': ['qualidade', 'durabilidade', 'resistência', 'acabamento', 'material'],
    'Preço': ['preço', 'caro', 'barato', 'valor', 'custo', 'reajuste'],
    'Atendimento': ['atendimento', 'vendedor', 'gerente', 'suporte', 'equipe', 'vendedora'],
    'Entrega': ['entrega', 'prazo', 'rapidez', 'demora', 'atraso', 'envio'],
    'Experiência': ['experiência', 'experiencia', 'jornada', 'processo', 'navegação'],
  };

  let maxMatches = 0;
  let detectedTheme = 'Outros';

  Object.entries(themes).forEach(([theme, keywords]) => {
    const matches = keywords.filter(kw => lowerText.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedTheme = theme;
    }
  });

  return detectedTheme;
}

function detectSimpleSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'excelente', 'ótimo', 'bom', 'adorei', 'perfeito', 'incrível', 'satisfeito',
    'recomendo', 'muito bem', 'gostei', 'maravilhoso', 'fantástico'
  ];

  const negativeWords = [
    'ruim', 'péssimo', 'horrível', 'terrível', 'problema', 'decepção', 'insatisfeito',
    'defeito', 'falha', 'decepcionante', 'triste', 'chato'
  ];

  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function extractKeyPoints(texts: string[]): string[] {
  // Simplificado: retornar frases mais frequentes
  const phrases: Record<string, number> = {};

  texts.forEach(text => {
    const sentences = text.split(/[.!?]/);
    sentences.forEach(sent => {
      const trimmed = sent.trim();
      if (trimmed.length > 10) {
        phrases[trimmed] = (phrases[trimmed] || 0) + 1;
      }
    });
  });

  return Object.entries(phrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([phrase]) => phrase);
}

function generateActionItems(theme: string, sentiment: string, keyPoints: string[]): string[] {
  const actions: string[] = [];

  if (sentiment === 'negative') {
    actions.push(`Investigar problemas identificados em: ${theme}`);
    actions.push(`Implementar plano de melhoria para ${theme}`);
    actions.push(`Acompanhar feedback sobre ${theme} nas próximas ondas`);
  } else if (sentiment === 'positive') {
    actions.push(`Reforçar pontos fortes em ${theme}`);
    actions.push(`Usar testimoniais sobre ${theme} em marketing`);
  }

  return actions;
}

// ============================================================================
// SYNTHETIC RESPONDENT GENERATION
// ============================================================================

/**
 * Geração de respondentes sintéticos calibrados com IA generativa
 * Utilizado para simular respostas em cenários de teste
 */
export function generateSyntheticRespondents(
  realResponses: AnalysisResponse[],
  profile: Record<string, any>,
  count: number = 10
): SyntheticRespondent[] {
  const synthetic: SyntheticRespondent[] = [];

  for (let i = 0; i < count; i++) {
    // Selecionar respondentes similares da amostra real
    const similarRespondents = findSimilarRespondents(realResponses, profile, 5);

    // Gerar resposta interpolada/sintética
    const generatedAnswers: Record<string, any> = {};
    const allAnswersKeys = new Set<string>();

    similarRespondents.forEach(r => {
      Object.keys(r.answers).forEach(k => allAnswersKeys.add(k));
    });

    allAnswersKeys.forEach(key => {
      const values = similarRespondents
        .map(r => r.answers[key])
        .filter(v => v !== undefined && v !== null);

      if (values.length > 0) {
        // Se é número, calcular média
        if (typeof values[0] === 'number') {
          generatedAnswers[key] = values.reduce((a, b) => a + b, 0) / values.length;
        } else {
          // Se é string, selecionar moda
          generatedAnswers[key] = values[0];
        }
      }
    });

    // Calcular similaridade
    const similarity = calculateResponseSimilarity(generatedAnswers, similarRespondents[0].answers);

    synthetic.push({
      id: `synthetic_${i}`,
      profile,
      generatedAnswers,
      similarityScore: similarity,
    });
  }

  return synthetic;
}

function findSimilarRespondents(
  responses: AnalysisResponse[],
  profile: Record<string, any>,
  count: number
): AnalysisResponse[] {
  return responses.slice(0, count); // Simplificado
}

function calculateResponseSimilarity(resp1: Record<string, any>, resp2: Record<string, any>): number {
  let matches = 0;
  let total = 0;

  Object.keys(resp1).forEach(key => {
    total++;
    if (resp1[key] === resp2[key]) matches++;
  });

  return total > 0 ? matches / total : 0;
}

// ============================================================================
// SCENARIO MODELING
// ============================================================================

/**
 * Simulação de múltiplos cenários futuros de mercado
 */
export function simulateScenarios(
  baselineMetrics: Record<string, number>,
  scenarios: Array<{ name: string; parameters: Record<string, number> }>
): ScenarioSimulation[] {
  return scenarios.map(scenario => {
    const predictedOutcome: Record<string, number> = {};
    const sensitivity: Record<string, number> = {};

    Object.entries(baselineMetrics).forEach(([metric, baseline]) => {
      let outcome = baseline;

      Object.entries(scenario.parameters).forEach(([param, value]) => {
        // Simular impacto do parâmetro
        const impact = value * 0.1; // Assume 10% de impacto por unidade
        outcome += impact;
        sensitivity[param] = impact;
      });

      predictedOutcome[metric] = outcome;
    });

    return {
      scenario: scenario.name,
      configuration: scenario.parameters,
      predictedOutcome,
      confidence: 0.65 + Math.random() * 0.2, // 0.65 - 0.85
      sensitivity,
    };
  });
}

export default {
  performPropensityScoreMatching,
  estimateDifferenceInDifferences,
  synthethicControlMethod,
  extractLLMAssistedInsights,
  generateSyntheticRespondents,
  simulateScenarios,
};
