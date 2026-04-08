/**
 * Hook para análises em tempo real
 * Otimizado para reatividade e performance
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { generateInsights, AnalysisResponse, Question } from '@/lib/analyticsEngine';
import { 
  analyzeNPS,
  analyzeImportanceSatisfactionMatrix,
  analyzePenaltyAttributes,
  analyzeExpectationGap,
  analyzeFunnel,
  analyzeSentiment,
  analyzeVanWestendorp,
  analyzeKano,
  analyzeCES,
  analyzeCSAT,
  analyzeGaborGranger,
  analyzeBrandFunnel,
  analyzeShapleyImportance,
  analyzeTURF,
  analyzeMaxDiff,
  analyzeConjointUtilities,
  analyzeBrandEquity,
  analyzeNetworkAnalysis,
  analyzeSurvivalAnalysis,
  analyzeClusterStability,
  analyzeMediationAnalysis,
  analyzeSEMModel,
  analyzePropensityScore,
  analyzeDifferenceInDifferences,
  analyzeUpliftModeling,
} from '@/lib/methodologyAnalytics';
import { dispatchAnalyses } from '@/lib/analysisDispatcher';

export interface RealtimeAnalyticsResult {
  isPending: boolean;
  mainInsights: any;
  methodologyResults: Record<string, any>;
  qualityScore: number;
  responseCount: number;
  lastUpdated: string;
  error?: string;
}

interface UseRealtimeAnalyticsProps {
  responses: AnalysisResponse[];
  questions: Question[];
  quotas: any[];
  methodologies: string[];
  sampleSize: number;
  enabled?: boolean;
}

export function useRealtimeAnalytics({
  responses,
  questions,
  quotas,
  methodologies,
  sampleSize,
  enabled = true,
}: UseRealtimeAnalyticsProps): RealtimeAnalyticsResult {
  const [lastUpdateTime, setLastUpdateTime] = useState<string>(new Date().toISOString());
  const [error, setError] = useState<string>();

  // Análise principal (insights gerais)
  const mainInsights = useMemo(() => {
    if (!enabled || responses.length === 0) return null;
    try {
      setError(undefined);
      return generateInsights(responses, questions, quotas, sampleSize);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao gerar insights';
      setError(errorMsg);
      return null;
    }
  }, [responses, questions, quotas, sampleSize, enabled]);

  // Análises por metodologia (otimizadas com dispatcher)
  const methodologyResults = useMemo(() => {
    if (!enabled || responses.length === 0 || methodologies.length === 0) return {};

    try {
      const results: Record<string, any> = {};

      // Usar dispatcher para análises condicionais baseadas em volume de dados
      const dispatchConfig = {
        responseCount: responses.length,
        methodologiesRequested: methodologies,
        questions: questions,
        responses: responses,
        quotas: quotas,
      };

      const dispatchedAnalyses = dispatchAnalyses(dispatchConfig);

      // Executar análises despachadas
      methodologies.forEach(method => {
        try {
          switch (method) {
            case 'nps_analysis': {
              const npsQuestion = questions.find(q => q.type === 'nps');
              if (npsQuestion) {
                results.nps_analysis = analyzeNPS(responses, npsQuestion);
              }
              break;
            }

            case 'importance_satisfaction': {
              const importanceQ = questions.find(q => q.type === 'importance');
              const satisfactionQ = questions.find(q => q.type === 'satisfaction');
              if (importanceQ && satisfactionQ) {
                results.importance_satisfaction = analyzeImportanceSatisfactionMatrix(
                  responses,
                  importanceQ,
                  satisfactionQ
                );
              }
              break;
            }

            case 'penalty_analysis': {
              const attributeQ = questions.find(q => q.type === 'rating');
              const satisfactionQ = questions.find(q => q.type === 'satisfaction');
              if (attributeQ && satisfactionQ) {
                results.penalty_analysis = analyzePenaltyAttributes(
                  responses,
                  attributeQ,
                  satisfactionQ
                );
              }
              break;
            }

            case 'gap_analysis': {
              const expectationQ = questions.find(q => q.variableCode?.includes('expectation'));
              const realityQ = questions.find(q => q.variableCode?.includes('reality'));
              if (expectationQ && realityQ) {
                results.gap_analysis = analyzeExpectationGap(
                  responses,
                  expectationQ,
                  realityQ
                );
              }
              break;
            }

            case 'conversion_funnel': {
              const funnelQuestions = questions.filter(q => q.type === 'funnel_step');
              if (funnelQuestions.length > 0) {
                results.conversion_funnel = analyzeFunnel(responses, funnelQuestions);
              }
              break;
            }

            case 'sentiment_analysis': {
              const openQuestions = questions.filter(q => q.type === 'text');
              if (openQuestions.length > 0) {
                results.sentiment_analysis = analyzeSentiment(responses, openQuestions);
              }
              break;
            }

            case 'van_westendorp': {
              const priceQuestion = questions.find(q => q.type === 'vanwestendorp');
              if (priceQuestion) {
                results.van_westendorp = analyzeVanWestendorp(responses, priceQuestion);
              }
              break;
            }

            case 'kano_analysis': {
              const kanoQuestion = questions.find(q => q.type === 'kano');
              if (kanoQuestion) {
                results.kano_analysis = analyzeKano(responses, kanoQuestion);
              }
              break;
            }

            case 'ces_analysis': {
              const cesQuestion = questions.find(q => q.type === 'ces');
              if (cesQuestion) {
                results.ces_analysis = analyzeCES(responses, cesQuestion);
              }
              break;
            }

            case 'csat_analysis': {
              const csatQuestion = questions.find(q => q.type === 'csat');
              if (csatQuestion) {
                results.csat_analysis = analyzeCSAT(responses, csatQuestion);
              }
              break;
            }

            case 'gabor_granger': {
              const gbgQuestion = questions.find(q => q.type === 'gabor_granger');
              if (gbgQuestion) {
                results.gabor_granger = analyzeGaborGranger(responses, gbgQuestion);
              }
              break;
            }

            case 'brand_funnel': {
              const brandFunnelQuestions = questions.filter(q => q.type === 'brand_funnel_step');
              if (brandFunnelQuestions.length > 0) {
                results.brand_funnel = analyzeBrandFunnel(responses, brandFunnelQuestions);
              }
              break;
            }

            case 'shapley_values': {
              const numericalQuestions = questions.filter(q => ['rating', 'slider', 'scale'].includes(q.type));
              if (numericalQuestions.length > 1) {
                results.shapley_values = analyzeShapleyImportance(responses, numericalQuestions);
              }
              break;
            }

            case 'turf_analysis': {
              const turf = questions.find(q => q.type === 'maxdiff' || q.type === 'turf');
              if (turf) {
                results.turf_analysis = analyzeTURF(responses, turf);
              }
              break;
            }

            case 'maxdiff_analysis': {
              const maxdiff = questions.find(q => q.type === 'maxdiff');
              if (maxdiff) {
                results.maxdiff_analysis = analyzeMaxDiff(responses, maxdiff);
              }
              break;
            }

            case 'conjoint_simulation': {
              const conjoint = questions.find(q => q.type === 'conjoint');
              if (conjoint) {
                results.conjoint_simulation = analyzeConjointUtilities(responses, conjoint);
              }
              break;
            }

            case 'brand_equity': {
              const brandQuestions = questions.filter(q => q.type === 'brand_attribute');
              if (brandQuestions.length > 0) {
                results.brand_equity = analyzeBrandEquity(responses, brandQuestions);
              }
              break;
            }

            case 'network_analysis': {
              results.network_analysis = analyzeNetworkAnalysis(responses, questions);
              break;
            }

            case 'survival_analysis': {
              results.survival_analysis = analyzeSurvivalAnalysis(responses, questions);
              break;
            }

            case 'cluster_stability': {
              results.cluster_stability = analyzeClusterStability(responses, questions);
              break;
            }

            case 'mediation_analysis': {
              const mediatorQuestions = questions.filter(q => q.type !== 'text');
              if (mediatorQuestions.length >= 3) {
                results.mediation_analysis = analyzeMediationAnalysis(responses, mediatorQuestions);
              }
              break;
            }

            case 'sem_analysis': {
              results.sem_analysis = analyzeSEMModel(responses, questions);
              break;
            }

            case 'propensity_score': {
              results.propensity_score = analyzePropensityScore(responses, questions);
              break;
            }

            case 'difference_in_differences': {
              results.difference_in_differences = analyzeDifferenceInDifferences(responses, questions);
              break;
            }

            case 'uplift_modeling': {
              results.uplift_modeling = analyzeUpliftModeling(responses, questions);
              break;
            }
          }
        } catch (err) {
          console.warn(`Error in methodology ${method}:`, err);
          // Continue with other methodologies
        }
      });

      setError(undefined);
      return results;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao calcular metodologias';
      setError(errorMsg);
      return {};
    }
  }, [responses, questions, methodologies, quotas, enabled]);

  // Atualizar timestamp
  useEffect(() => {
    setLastUpdateTime(new Date().toISOString());
  }, [responses.length]);

  // Calcular quality score
  const qualityScore = useMemo(() => {
    if (!mainInsights) return 0;
    return mainInsights.qualityScore || 0;
  }, [mainInsights]);

  return {
    isPending: !mainInsights,
    mainInsights,
    methodologyResults,
    qualityScore,
    responseCount: responses.length,
    lastUpdated: lastUpdateTime,
    error,
  };
}
