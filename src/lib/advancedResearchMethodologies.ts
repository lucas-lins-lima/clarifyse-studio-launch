/**
 * CLARIFYSE - Metodologias Avançadas de Pesquisa
 * ================================================
 * Conjoint Analysis, MaxDiff, TURF, Markov Chain, CLV, Cohort Analysis
 */

import stats from 'simple-statistics';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ConjointUtility {
  attribute: string;
  level: string;
  utility: number;
  relativeImportance: number;
}

export interface ConjointProfile {
  name: string;
  attributes: Record<string, string>;
  predictedUtility: number;
  probability: number;
}

export interface MaxDiffResult {
  items: Array<{ item: string; score: number; rank: number }>;
  analysis: string;
}

export interface TURFResult {
  configurations: Array<{
    items: string[];
    reach: number;
    frequency: number;
    unduplicated: number;
  }>;
  optimalConfiguration: string[];
  undupReach: number;
}

export interface MarkovChainResult {
  transitionMatrix: number[][];
  steadyState: number[];
  churn: number;
  retention: number;
  interpretation: string;
}

export interface CLVSegment {
  segment: string;
  avgPurchaseFrequency: number;
  avgOrderValue: number;
  retention: number;
  clv: number;
}

export interface CohortMetrics {
  cohort: string;
  acquired: number;
  retained: Record<string, number>; // month -> count
  retentionRate: number[];
  churnRate: number[];
}

// ============================================================================
// CONJOINT ANALYSIS
// ============================================================================

/**
 * Análise de Conjoint - Estimar utilidades dos atributos
 */
export function analyzeConjoint(
  profiles: Array<{ attributes: Record<string, string>; preference: number }>,
  attributes: Record<string, string[]>
): {
  utilities: ConjointUtility[];
  relativeImportances: Record<string, number>;
  scenarios: ConjointProfile[];
} {
  // Extrair atributos únicos e níveis
  const attributeList = Object.entries(attributes);
  const utilities: ConjointUtility[] = [];
  
  // Estimar utilidades para cada nível (simplificado usando regressão)
  const utilityMap: Record<string, number> = {};
  
  attributeList.forEach(([attrName, levels]) => {
    levels.forEach((level, idx) => {
      // Utilidade baseada em frequência de preferência
      const matchingProfiles = profiles.filter(p => p.attributes[attrName] === level);
      const avgPreference = matchingProfiles.length > 0
        ? matchingProfiles.reduce((sum, p) => sum + p.preference, 0) / matchingProfiles.length
        : 0.5;
      
      utilityMap[`${attrName}:${level}`] = avgPreference - 0.5; // Centralizar em 0
    });
  });
  
  // Calcular importância relativa
  const importances: Record<string, number> = {};
  let totalRange = 0;
  
  attributeList.forEach(([attrName, levels]) => {
    const utilities_attr = levels.map(level => utilityMap[`${attrName}:${level}`] || 0);
    const range = Math.max(...utilities_attr) - Math.min(...utilities_attr);
    importances[attrName] = range;
    totalRange += range;
  });
  
  // Normalizar importâncias para soma = 100%
  Object.keys(importances).forEach(attr => {
    importances[attr] = (importances[attr] / totalRange) * 100;
  });
  
  // Criar tabela de utilidades
  attributeList.forEach(([attrName, levels]) => {
    levels.forEach(level => {
      const utility = utilityMap[`${attrName}:${level}`] || 0;
      utilities.push({
        attribute: attrName,
        level,
        utility,
        relativeImportance: importances[attrName],
      });
    });
  });
  
  // Gerar cenários de produtos
  const scenarios: ConjointProfile[] = [];
  const numScenarios = Math.min(8, attributeList.reduce((mult, [, levels]) => mult * levels.length, 1));
  
  for (let s = 0; s < numScenarios; s++) {
    const scenario: Record<string, string> = {};
    let totalUtility = 0;
    
    attributeList.forEach(([attrName, levels], idx) => {
      const levelIdx = (s >> idx) % levels.length;
      scenario[attrName] = levels[levelIdx];
      totalUtility += utilityMap[`${attrName}:${levels[levelIdx]}`] || 0;
    });
    
    scenarios.push({
      name: `Configuração ${s + 1}`,
      attributes: scenario,
      predictedUtility: totalUtility,
      probability: Math.exp(totalUtility) / (1 + Math.exp(totalUtility)), // Logística
    });
  }
  
  // Ordenar cenários por utilidade
  scenarios.sort((a, b) => b.predictedUtility - a.predictedUtility);
  
  return {
    utilities,
    relativeImportances: importances,
    scenarios,
  };
}

// ============================================================================
// MaxDIFF ANALYSIS
// ============================================================================

/**
 * MaxDiff Analysis - Priorização de atributos via escolhas best-worst
 */
export function analyzeMaxDiff(
  choiceData: Array<{ bestIndex: number; worstIndex: number; items: string[] }>
): MaxDiffResult {
  const items = new Set<string>();
  choiceData.forEach(choice => choice.items.forEach(item => items.add(item)));
  const itemList = Array.from(items);
  
  // Contar escolhas
  const scores: Record<string, number> = {};
  itemList.forEach(item => scores[item] = 0);
  
  choiceData.forEach(choice => {
    const best = choice.items[choice.bestIndex];
    const worst = choice.items[choice.worstIndex];
    
    scores[best] = (scores[best] || 0) + 1;
    scores[worst] = (scores[worst] || 0) - 1;
  });
  
  // Ranking e normalização
  const ranking = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([item, score], rank) => ({
      item,
      score: Math.max(0, (score + itemList.length) / (itemList.length * 2)), // Normalizar para 0-1
      rank: rank + 1,
    }));
  
  const analysis = `MaxDiff ranking: ${ranking.map(r => `${r.item} (score: ${r.score.toFixed(2)})`).join(', ')}`;
  
  return {
    items: ranking,
    analysis,
  };
}

// ============================================================================
// TURF ANALYSIS
// ============================================================================

/**
 * TURF (Total Unduplicated Reach and Frequency)
 * Otimizar combinação de produtos/atributos
 */
export function analyzeTURF(
  preferences: Array<Record<string, boolean>>,
  items: string[],
  maxConfig: number = 3
): TURFResult {
  const configurations: Array<{
    items: string[];
    reach: number;
    frequency: number;
    unduplicated: number;
  }> = [];
  
  // Gerar todas as combinações possíveis
  const generateCombinations = (items: string[], max: number): string[][] => {
    const result: string[][] = [];
    
    const combine = (current: string[], start: number) => {
      if (current.length <= max) {
        result.push([...current]);
      }
      if (current.length === max) return;
      
      for (let i = start; i < items.length; i++) {
        current.push(items[i]);
        combine(current, i + 1);
        current.pop();
      }
    };
    
    combine([], 0);
    return result;
  };
  
  const allCombinations = generateCombinations(items, maxConfig);
  
  // Avaliar cada combinação
  allCombinations.forEach(combo => {
    let reach = 0;
    let frequency = 0;
    
    preferences.forEach(pref => {
      const hasAny = combo.some(item => pref[item]);
      if (hasAny) {
        reach++;
        frequency += combo.filter(item => pref[item]).length;
      }
    });
    
    configurations.push({
      items: combo,
      reach: (reach / preferences.length) * 100,
      frequency: (frequency / preferences.length),
      unduplicated: reach,
    });
  });
  
  // Encontrar configuração ótima
  configurations.sort((a, b) => b.reach - a.reach);
  const optimalConfiguration = configurations[0]?.items || [];
  const undupReach = configurations[0]?.reach || 0;
  
  return {
    configurations: configurations.slice(0, 10), // Top 10
    optimalConfiguration,
    undupReach,
  };
}

// ============================================================================
// MARKOV CHAIN SWITCHING
// ============================================================================

/**
 * Markov Chain para prever switching entre marcas
 */
export function analyzeMarkovChain(
  transitions: Array<{ from: string; to: string; count: number }>,
  brands: string[]
): MarkovChainResult {
  // Criar matriz de transição
  const n = brands.length;
  const transitionMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  // Preencher matriz
  const totals: number[] = Array(n).fill(0);
  
  transitions.forEach(trans => {
    const fromIdx = brands.indexOf(trans.from);
    const toIdx = brands.indexOf(trans.to);
    
    if (fromIdx >= 0 && toIdx >= 0) {
      transitionMatrix[fromIdx][toIdx] += trans.count;
      totals[fromIdx] += trans.count;
    }
  });
  
  // Normalizar para probabilidades
  transitionMatrix.forEach((row, idx) => {
    row.forEach((_, jdx) => {
      transitionMatrix[idx][jdx] = totals[idx] > 0 ? row[jdx] / totals[idx] : 0;
    });
  });
  
  // Calcular estado estacionário (Markov steady state)
  const steadyState = calculateSteadyState(transitionMatrix);
  
  // Calcular churn e retention
  const retention = (transitionMatrix[0][0] + transitionMatrix[1]?.[1] || 0) / 2;
  const churn = 1 - retention;
  
  const interpretation = `Retention: ${(retention * 100).toFixed(1)}% | Churn: ${(churn * 100).toFixed(1)}% | 
    Distribuição de equilíbrio: ${steadyState.map((p, idx) => `${brands[idx]}: ${(p * 100).toFixed(1)}%`).join(' | ')}`;
  
  return {
    transitionMatrix,
    steadyState,
    churn,
    retention,
    interpretation,
  };
}

// ============================================================================
// CUSTOMER LIFETIME VALUE (CLV)
// ============================================================================

/**
 * Calcular Customer Lifetime Value por segmento
 */
export function calculateCLV(
  customers: Array<{
    segment: string;
    purchaseFrequency: number; // vezes por período
    avgOrderValue: number; // valor médio
    retention: number; // 0-1
  }>,
  period: number = 12, // meses
  discountRate: number = 0.1
): CLVSegment[] {
  const segments = [...new Set(customers.map(c => c.segment))];
  
  return segments.map(segment => {
    const segmentCustomers = customers.filter(c => c.segment === segment);
    
    const avgFrequency = stats.mean(segmentCustomers.map(c => c.purchaseFrequency));
    const avgValue = stats.mean(segmentCustomers.map(c => c.avgOrderValue));
    const avgRetention = stats.mean(segmentCustomers.map(c => c.retention));
    
    // CLV = (Annual Revenue * Margin) * Retention / (1 + Discount Rate - Retention)
    const annualRevenue = avgFrequency * avgValue * 12;
    const clv = (annualRevenue * 0.3) / (1 + discountRate - avgRetention); // 30% margin
    
    return {
      segment,
      avgPurchaseFrequency: avgFrequency,
      avgOrderValue: avgValue,
      retention: avgRetention,
      clv: Math.max(0, clv),
    };
  }).sort((a, b) => b.clv - a.clv);
}

// ============================================================================
// COHORT ANALYSIS
// ============================================================================

/**
 * Análise de Coortes - rastrear retenção ao longo do tempo
 */
export function analyzeCohorts(
  cohortData: Array<{
    userId: string;
    cohortMonth: string;
    activeMonth: string;
  }>
): CohortMetrics[] {
  const cohorts = [...new Set(cohortData.map(d => d.cohortMonth))].sort();
  
  return cohorts.map(cohort => {
    const cohortUsers = cohortData.filter(d => d.cohortMonth === cohort);
    const cohortUserIds = new Set(cohortUsers.map(d => d.userId));
    
    // Rastrear retenção por mês
    const retainedByMonth: Record<string, number> = {};
    const months = [...new Set(cohortUsers.map(d => d.activeMonth))].sort();
    
    months.forEach(month => {
      const activeInMonth = new Set(
        cohortUsers.filter(d => d.activeMonth === month).map(d => d.userId)
      );
      retainedByMonth[month] = activeInMonth.size;
    });
    
    // Calcular taxas de retenção
    const retentionRates = Object.values(retainedByMonth).map(retained =>
      (retained / cohortUserIds.size) * 100
    );
    
    const churnRates = retentionRates.map(rate => 100 - rate);
    
    return {
      cohort,
      acquired: cohortUserIds.size,
      retained: retainedByMonth,
      retentionRate: retentionRates,
      churnRate: churnRates,
    };
  });
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcular estado estacionário de uma matriz de transição
 */
function calculateSteadyState(transitionMatrix: number[][]): number[] {
  const n = transitionMatrix.length;
  let state = Array(n).fill(1 / n); // Distribuição uniforme inicial
  
  // Iterar até convergência
  for (let iter = 0; iter < 100; iter++) {
    const newState = Array(n).fill(0);
    
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        newState[j] += state[i] * transitionMatrix[i][j];
      }
    }
    
    state = newState;
  }
  
  return state;
}

export default {
  analyzeConjoint,
  analyzeMaxDiff,
  analyzeTURF,
  analyzeMarkovChain,
  calculateCLV,
  analyzeCohorts,
};
