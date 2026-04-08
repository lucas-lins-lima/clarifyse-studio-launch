/**
 * Analysis Dispatcher - Coordena disparo automático de análises
 * =============================================================
 * Ativa análises baseado no número de respostas:
 * - 1+ respostas: Análises Básicas
 * - 10+ respostas: Análises Intermediárias
 * - 30+ respostas: Análises Avançadas
 */

import * as statsLib from './statisticalMethods';
import * as mlLib from './machineLearningSuite';
import * as factorLib from './factorAnalysis';
import * as advancedLib from './advancedResearchMethodologies';
import * as methodLib from './methodologyAnalytics';

export interface AnalysisConfig {
  numResponses: number;
  questions: any[];
  responses: any[];
  quotas?: any[];
}

export interface DispatchResult {
  basicAnalyses: Record<string, any>;
  intermediateAnalyses: Record<string, any>;
  advancedAnalyses: Record<string, any>;
  availableAt: {
    basic: boolean;
    intermediate: boolean;
    advanced: boolean;
  };
  thresholds: {
    intermediate: number;
    advanced: number;
  };
}

// ============================================================================
// DISPATCHER PRINCIPAL
// ============================================================================

/**
 * Disparar análises apropriadas baseado no número de respostas
 */
export function dispatchAnalyses(config: AnalysisConfig): DispatchResult {
  const { numResponses, questions, responses } = config;
  
  const basicAnalyses: Record<string, any> = {};
  const intermediateAnalyses: Record<string, any> = {};
  const advancedAnalyses: Record<string, any> = {};
  
  const THRESHOLD_INTERMEDIATE = 10;
  const THRESHOLD_ADVANCED = 30;
  
  try {
    // ========================================================================
    // ANÁLISES BÁSICAS (1+ respostas)
    // ========================================================================
    if (numResponses >= 1) {
      // Frequency distribution
      basicAnalyses.frequency_distribution = calculateFrequencyDistribution(
        responses,
        questions
      );
      
      // Descriptive statistics
      basicAnalyses.descriptive_stats = calculateBasicDescriptiveStats(
        responses,
        questions
      );
      
      // Sentiment analysis
      const openQuestions = questions.filter(q => q.type === 'text');
      if (openQuestions.length > 0) {
        basicAnalyses.sentiment_analysis = calculateBasicSentiment(
          responses,
          openQuestions
        );
      }
      
      // Missing data analysis
      basicAnalyses.missing_data = analyzeMissingData(responses, questions);
    }
    
    // ========================================================================
    // ANÁLISES INTERMEDIÁRIAS (10+ respostas)
    // ========================================================================
    if (numResponses >= THRESHOLD_INTERMEDIATE) {
      // T-test e ANOVA
      const scaleQuestions = questions.filter(q => 
        ['likert', 'rating', 'nps'].includes(q.type)
      );
      
      if (scaleQuestions.length >= 2) {
        try {
          const values1 = responses
            .map(r => Number(r.answers[scaleQuestions[0].id || scaleQuestions[0].variableCode]))
            .filter(v => !isNaN(v));
          const values2 = responses
            .map(r => Number(r.answers[scaleQuestions[1].id || scaleQuestions[1].variableCode]))
            .filter(v => !isNaN(v));
          
          if (values1.length > 2 && values2.length > 2) {
            intermediateAnalyses.t_test = statsLib.tTest(values1, values2);
          }
        } catch (e) {
          console.warn('Erro ao calcular T-test:', e);
        }
      }
      
      // Clustering (K-Means)
      try {
        const numericValues = extractNumericData(responses, questions);
        if (numericValues.length > 2) {
          const clusterResult = statsLib.performKMeansClustering(
            numericValues,
            Math.min(3, Math.floor(Math.sqrt(numResponses)))
          );
          intermediateAnalyses.clustering = clusterResult;
        }
      } catch (e) {
        console.warn('Erro ao calcular clustering:', e);
      }
      
      // Regressão Linear
      try {
        const linearRegData = prepareRegressionData(responses, questions);
        if (linearRegData && linearRegData.x.length > 1) {
          intermediateAnalyses.linear_regression = statsLib.linearRegression(
            linearRegData.x,
            linearRegData.y
          );
        }
      } catch (e) {
        console.warn('Erro ao calcular regressão linear:', e);
      }
      
      // Kano Analysis
      const kanoQuestion = questions.find(q => q.type === 'kano');
      if (kanoQuestion) {
        try {
          intermediateAnalyses.kano = methodLib.analyzeKano(
            responses,
            kanoQuestion
          );
        } catch (e) {
          console.warn('Erro ao calcular Kano:', e);
        }
      }
      
      // NPS Analysis
      const npsQuestion = questions.find(q => q.type === 'nps');
      if (npsQuestion) {
        try {
          intermediateAnalyses.nps = methodLib.analyzeNPS(
            responses.map((r: any) => ({
              id: r.id,
              timestamp: r.timestamp,
              answers: r.answers,
              quotaProfile: {},
              timeSpent: r.timeSpentSeconds || 0,
              qualityFlag: r.qualityFlag || 'good',
            })),
            npsQuestion
          );
        } catch (e) {
          console.warn('Erro ao calcular NPS:', e);
        }
      }
    }
    
    // ========================================================================
    // ANÁLISES AVANÇADAS (30+ respostas)
    // ========================================================================
    if (numResponses >= THRESHOLD_ADVANCED) {
      // Random Forest
      try {
        const mlData = prepareMLData(responses, questions);
        if (mlData && mlData.X.length > 10) {
          advancedAnalyses.random_forest = mlLib.trainRandomForest(
            mlData.X,
            mlData.y,
            5, // numTrees
            4  // maxDepth
          );
        }
      } catch (e) {
        console.warn('Erro ao treinar Random Forest:', e);
      }
      
      // PCA
      try {
        const numericData = extractNumericData(responses, questions);
        if (numericData.length > 5) {
          advancedAnalyses.pca = factorLib.performPCA(numericData, 2);
        }
      } catch (e) {
        console.warn('Erro ao calcular PCA:', e);
      }
      
      // Gradient Boosting
      try {
        const gbData = prepareMLData(responses, questions);
        if (gbData && gbData.X.length > 10) {
          advancedAnalyses.gradient_boosting = mlLib.gradientBoosting(
            gbData.X,
            gbData.y,
            20 // numIterations
          );
        }
      } catch (e) {
        console.warn('Erro ao calcular Gradient Boosting:', e);
      }
      
      // Conjoint Analysis
      const conjointQuestion = questions.find(q => q.type === 'cbc' || q.type === 'conjoint');
      if (conjointQuestion) {
        try {
          // Preparar dados de conjoint (simplificado)
          const profiles = responses.map((r: any) => ({
            attributes: r.answers || {},
            preference: r.preference || 0.5,
          }));
          
          const attributes: Record<string, string[]> = {};
          conjointQuestion.attributes?.forEach((attr: any) => {
            attributes[attr.name] = attr.levels || [];
          });
          
          advancedAnalyses.conjoint = advancedLib.analyzeConjoint(
            profiles,
            attributes
          );
        } catch (e) {
          console.warn('Erro ao calcular Conjoint:', e);
        }
      }
      
      // MaxDiff Analysis
      const maxdiffQuestion = questions.find(q => q.type === 'maxdiff');
      if (maxdiffQuestion) {
        try {
          const choiceData = responses.map((r: any) => ({
            items: maxdiffQuestion.items || [],
            bestIndex: r.answers[maxdiffQuestion.id || maxdiffQuestion.variableCode] || 0,
            worstIndex: r.answers[`${maxdiffQuestion.id}_worst`] || 0,
          }));
          
          advancedAnalyses.maxdiff = advancedLib.analyzeMaxDiff(choiceData);
        } catch (e) {
          console.warn('Erro ao calcular MaxDiff:', e);
        }
      }
      
      // CLV Analysis
      try {
        const clvData = responses.map((r: any) => ({
          segment: r.answers.segment || 'default',
          purchaseFrequency: Number(r.answers.frequency) || 1,
          avgOrderValue: Number(r.answers.value) || 100,
          retention: Math.random(), // Simplificado
        }));
        
        advancedAnalyses.clv = advancedLib.calculateCLV(clvData);
      } catch (e) {
        console.warn('Erro ao calcular CLV:', e);
      }
    }
    
  } catch (error) {
    console.error('Erro ao disparar análises:', error);
  }
  
  return {
    basicAnalyses,
    intermediateAnalyses,
    advancedAnalyses,
    availableAt: {
      basic: numResponses >= 1,
      intermediate: numResponses >= THRESHOLD_INTERMEDIATE,
      advanced: numResponses >= THRESHOLD_ADVANCED,
    },
    thresholds: {
      intermediate: THRESHOLD_INTERMEDIATE,
      advanced: THRESHOLD_ADVANCED,
    },
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES DE CÁLCULO
// ============================================================================

/**
 * Calcular distribuição de frequências
 */
function calculateFrequencyDistribution(responses: any[], questions: any[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  questions.forEach(q => {
    const key = q.variableCode || q.id;
    const distribution: Record<string, number> = {};
    
    responses.forEach(r => {
      const answer = String(r.answers[key]);
      distribution[answer] = (distribution[answer] || 0) + 1;
    });
    
    result[q.question] = Object.entries(distribution)
      .map(([label, count]) => ({
        label,
        count,
        percentage: (count / responses.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  });
  
  return result;
}

/**
 * Calcular estatísticas descritivas básicas
 */
function calculateBasicDescriptiveStats(responses: any[], questions: any[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  questions.forEach(q => {
    const key = q.variableCode || q.id;
    const values = responses
      .map(r => Number(r.answers[key]))
      .filter(v => !isNaN(v));
    
    if (values.length > 0) {
      result[q.question] = {
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }
  });
  
  return result;
}

/**
 * Análise de sentimento básica
 */
function calculateBasicSentiment(responses: any[], questions: any[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  questions.forEach(q => {
    const key = q.variableCode || q.id;
    const texts = responses
      .map(r => String(r.answers[key]))
      .filter(t => t.length > 0);
    
    let positive = 0, neutral = 0, negative = 0;
    
    texts.forEach(text => {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('bom') || lowerText.includes('ótim') || lowerText.includes('excelen')) {
        positive++;
      } else if (lowerText.includes('ruim') || lowerText.includes('péss') || lowerText.includes('horrí')) {
        negative++;
      } else {
        neutral++;
      }
    });
    
    result[q.question] = {
      positive: (positive / texts.length) * 100 || 0,
      neutral: (neutral / texts.length) * 100 || 0,
      negative: (negative / texts.length) * 100 || 0,
    };
  });
  
  return result;
}

/**
 * Analisar dados ausentes
 */
function analyzeMissingData(responses: any[], questions: any[]): Record<string, number> {
  const result: Record<string, number> = {};
  
  questions.forEach(q => {
    const key = q.variableCode || q.id;
    const missing = responses.filter(r => r.answers[key] === undefined || r.answers[key] === null).length;
    result[q.question] = (missing / responses.length) * 100;
  });
  
  return result;
}

/**
 * Extrair dados numéricos
 */
function extractNumericData(responses: any[], questions: any[]): number[][] {
  const result: number[][] = [];
  
  responses.forEach(r => {
    const row: number[] = [];
    questions.forEach(q => {
      const key = q.variableCode || q.id;
      const value = Number(r.answers[key]);
      if (!isNaN(value)) {
        row.push(value);
      }
    });
    if (row.length > 0) {
      result.push(row);
    }
  });
  
  return result;
}

/**
 * Preparar dados para regressão
 */
function prepareRegressionData(responses: any[], questions: any[]): { x: number[]; y: number[] } | null {
  if (questions.length < 2) return null;
  
  const xKey = questions[0].variableCode || questions[0].id;
  const yKey = questions[1].variableCode || questions[1].id;
  
  const x: number[] = [];
  const y: number[] = [];
  
  responses.forEach(r => {
    const xVal = Number(r.answers[xKey]);
    const yVal = Number(r.answers[yKey]);
    
    if (!isNaN(xVal) && !isNaN(yVal)) {
      x.push(xVal);
      y.push(yVal);
    }
  });
  
  return x.length > 1 ? { x, y } : null;
}

/**
 * Preparar dados para Machine Learning
 */
function prepareMLData(responses: any[], questions: any[]): { X: number[][]; y: number[] } | null {
  const X: number[][] = [];
  const y: number[] = [];
  
  responses.forEach(r => {
    const row: number[] = [];
    let targetValue = 0;
    
    questions.forEach((q, idx) => {
      const key = q.variableCode || q.id;
      const value = Number(r.answers[key]);
      
      if (!isNaN(value)) {
        row.push(value);
        if (idx === questions.length - 1) {
          targetValue = Math.round(value); // Última pergunta é target
        }
      }
    });
    
    if (row.length >= 2) {
      X.push(row.slice(0, -1)); // Features
      y.push(targetValue);
    }
  });
  
  return X.length > 2 ? { X, y } : null;
}

export default {
  dispatchAnalyses,
};
