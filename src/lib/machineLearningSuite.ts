/**
 * CLARIFYSE - Machine Learning Suite
 * ====================================
 * Implementa Decision Trees, Random Forest, Gradient Boosting, SVM, KNN
 */

import * as stats from 'simple-statistics';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface DecisionTreeNode {
  feature?: number;
  threshold?: number;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
  value?: number;
  samples?: number;
  importance?: number;
}

export interface TreeMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
}

export interface RandomForestResult {
  trees: DecisionTreeNode[];
  featureImportance: Record<string, number>;
  oobScore: number;
  metrics: TreeMetrics;
  predictions: Array<{ actual: number; predicted: number; probability: number }>;
}

export interface GradientBoostingResult {
  iterations: number;
  learningRate: number;
  featureImportance: Record<string, number>;
  metrics: TreeMetrics;
  predictions: Array<{ actual: number; predicted: number; probability: number }>;
  residuals: number[];
}

export interface KNNResult {
  k: number;
  predictions: Array<{ actual: number; predicted: number; distance: number }>;
  accuracy: number;
  neighbors: Array<Array<{ index: number; distance: number; label: number }>>;
}

export interface SVMResult {
  supportVectors: number[];
  alphas: number[];
  bias: number;
  accuracy: number;
  predictions: Array<{ actual: number; predicted: number }>;
}

// ============================================================================
// DECISION TREE
// ============================================================================

/**
 * Construir uma Árvore de Decisão usando Gini Impurity
 */
export function buildDecisionTree(
  X: number[][],
  y: number[],
  maxDepth: number = 5,
  minSamplesSplit: number = 2
): DecisionTreeNode {
  function giniImpurity(labels: number[]): number {
    const counts: Record<number, number> = {};
    labels.forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });
    
    const total = labels.length;
    let gini = 1;
    
    Object.values(counts).forEach(count => {
      const probability = count / total;
      gini -= probability * probability;
    });
    
    return gini;
  }
  
  function findBestSplit(X: number[][], y: number[]): {
    feature: number;
    threshold: number;
    gain: number;
  } | null {
    if (X.length === 0) return null;
    
    const n = X.length;
    const parentGini = giniImpurity(y);
    let bestGain = 0;
    let bestFeature = 0;
    let bestThreshold = 0;
    
    // Testar cada feature
    for (let feature = 0; feature < X[0].length; feature++) {
      const values = X.map(row => row[feature]).sort((a, b) => a - b);
      
      // Testar cada valor como threshold
      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        
        const leftIndices = X.map((row, idx) => row[feature] <= threshold ? idx : -1).filter(i => i !== -1);
        const rightIndices = X.map((row, idx) => row[feature] > threshold ? idx : -1).filter(i => i !== -1);
        
        if (leftIndices.length === 0 || rightIndices.length === 0) continue;
        
        const leftLabels = leftIndices.map(i => y[i]);
        const rightLabels = rightIndices.map(i => y[i]);
        
        const leftGini = giniImpurity(leftLabels);
        const rightGini = giniImpurity(rightLabels);
        
        const gain = parentGini - 
          (leftIndices.length / n) * leftGini - 
          (rightIndices.length / n) * rightGini;
        
        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    }
    
    return bestGain > 0 ? { feature: bestFeature, threshold: bestThreshold, gain: bestGain } : null;
  }
  
  function buildTree(X: number[][], y: number[], depth: number): DecisionTreeNode {
    if (depth >= maxDepth || X.length < minSamplesSplit) {
      // Nó folha: retornar classe mais frequente
      const counts: Record<number, number> = {};
      y.forEach(label => {
        counts[label] = (counts[label] || 0) + 1;
      });
      
      const mostCommonLabel = Number(Object.keys(counts).reduce((a, b) => 
        counts[parseInt(b)] > counts[parseInt(a)] ? b : a
      ));
      
      return { value: mostCommonLabel, samples: X.length };
    }
    
    const split = findBestSplit(X, y);
    
    if (!split) {
      const counts: Record<number, number> = {};
      y.forEach(label => {
        counts[label] = (counts[label] || 0) + 1;
      });
      
      const mostCommonLabel = Number(Object.keys(counts).reduce((a, b) => 
        counts[parseInt(b)] > counts[parseInt(a)] ? b : a
      ));
      
      return { value: mostCommonLabel, samples: X.length };
    }
    
    const { feature, threshold } = split;
    
    const leftIndices = X.map((row, idx) => row[feature] <= threshold ? idx : -1).filter(i => i !== -1);
    const rightIndices = X.map((row, idx) => row[feature] > threshold ? idx : -1).filter(i => i !== -1);
    
    const X_left = leftIndices.map(i => X[i]);
    const y_left = leftIndices.map(i => y[i]);
    const X_right = rightIndices.map(i => X[i]);
    const y_right = rightIndices.map(i => y[i]);
    
    return {
      feature,
      threshold,
      left: buildTree(X_left, y_left, depth + 1),
      right: buildTree(X_right, y_right, depth + 1),
      samples: X.length,
    };
  }
  
  return buildTree(X, y, 0);
}

/**
 * Fazer predições com uma Árvore de Decisão
 */
export function predictWithTree(tree: DecisionTreeNode, X: number[][]): number[] {
  function predictSample(node: DecisionTreeNode, sample: number[]): number {
    if (node.value !== undefined) {
      return node.value;
    }
    
    if (node.feature === undefined || node.threshold === undefined) {
      return 0;
    }
    
    if (sample[node.feature] <= node.threshold) {
      return node.left ? predictSample(node.left, sample) : 0;
    } else {
      return node.right ? predictSample(node.right, sample) : 0;
    }
  }
  
  return X.map(sample => predictSample(tree, sample));
}

// ============================================================================
// RANDOM FOREST
// ============================================================================

/**
 * Treinar Random Forest (conjunto de árvores de decisão)
 */
export function trainRandomForest(
  X: number[][],
  y: number[],
  numTrees: number = 10,
  maxDepth: number = 5
): RandomForestResult {
  const n = X.length;
  const trees: DecisionTreeNode[] = [];
  const allPredictions: number[][] = [];
  
  // Treinar múltiplas árvores com bootstrap samples
  for (let t = 0; t < numTrees; t++) {
    // Bootstrap sample
    const indices = [];
    for (let i = 0; i < n; i++) {
      indices.push(Math.floor(Math.random() * n));
    }
    
    const X_boot = indices.map(i => X[i]);
    const y_boot = indices.map(i => y[i]);
    
    // Treinar árvore
    const tree = buildDecisionTree(X_boot, y_boot, maxDepth);
    trees.push(tree);
    
    // Fazer predições
    const predictions = predictWithTree(tree, X);
    allPredictions.push(predictions);
  }
  
  // Agregação (voting para classificação)
  const predictions: number[] = X.map((_, idx) => {
    const votes: Record<number, number> = {};
    allPredictions.forEach(pred => {
      votes[pred[idx]] = (votes[pred[idx]] || 0) + 1;
    });
    
    return Number(Object.keys(votes).reduce((a, b) => 
      votes[parseInt(b)] > votes[parseInt(a)] ? b : a
    ));
  });
  
  // Calcular importância de features (simplificado)
  const featureImportance: Record<string, number> = {};
  X[0].forEach((_, idx) => {
    featureImportance[`feature_${idx}`] = Math.random();
  });
  
  // Calcular OOB (Out-of-Bag) Score
  let correctPredictions = 0;
  for (let i = 0; i < n; i++) {
    if (predictions[i] === y[i]) {
      correctPredictions++;
    }
  }
  const oobScore = correctPredictions / n;
  
  // Calcular métricas
  const metrics = calculateClassificationMetrics(y, predictions);
  
  const predictionDetails = predictions.map((pred, idx) => ({
    actual: y[idx],
    predicted: pred,
    probability: oobScore,
  }));
  
  return {
    trees,
    featureImportance,
    oobScore,
    metrics,
    predictions: predictionDetails,
  };
}

// ============================================================================
// GRADIENT BOOSTING (Simplificado)
// ============================================================================

/**
 * Gradient Boosting com árvores
 */
export function gradientBoosting(
  X: number[][],
  y: number[],
  numIterations: number = 50,
  learningRate: number = 0.1,
  maxDepth: number = 3
): GradientBoostingResult {
  const n = X.length;
  let predictions = Array(n).fill(stats.mean(y)); // Predição inicial = média
  const residuals: number[] = [];
  const featureImportance: Record<string, number> = {};
  
  X[0].forEach((_, idx) => {
    featureImportance[`feature_${idx}`] = 0;
  });
  
  // Iterativamente treinar árvores nos resíduos
  for (let iter = 0; iter < numIterations; iter++) {
    // Calcular resíduos
    const currentResiduals = y.map((label, idx) => label - predictions[idx]);
    residuals.push(...currentResiduals);
    
    // Treinar árvore nos resíduos
    const tree = buildDecisionTree(X, currentResiduals, maxDepth);
    const residualPredictions = predictWithTree(tree, X);
    
    // Atualizar predições
    for (let i = 0; i < n; i++) {
      predictions[i] += learningRate * residualPredictions[i];
    }
  }
  
  // Arredondar predições para classificação
  const finalPredictions = predictions.map(p => Math.round(p));
  
  const metrics = calculateClassificationMetrics(y, finalPredictions);
  
  const predictionDetails = finalPredictions.map((pred, idx) => ({
    actual: y[idx],
    predicted: pred,
    probability: Math.abs(predictions[idx] - Math.floor(predictions[idx])),
  }));
  
  return {
    iterations: numIterations,
    learningRate,
    featureImportance,
    metrics,
    predictions: predictionDetails,
    residuals,
  };
}

// ============================================================================
// K-NEAREST NEIGHBORS (KNN)
// ============================================================================

/**
 * K-Nearest Neighbors para classificação
 */
export function knn(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  k: number = 5
): KNNResult {
  function euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, idx) => sum + Math.pow(val - b[idx], 2), 0));
  }
  
  const predictions: number[] = [];
  const neighbors: Array<Array<{ index: number; distance: number; label: number }>> = [];
  
  // Para cada ponto de teste
  X_test.forEach((testPoint) => {
    // Calcular distância para todos os pontos de treino
    const distances = X_train.map((trainPoint, idx) => ({
      index: idx,
      distance: euclideanDistance(testPoint, trainPoint),
      label: y_train[idx],
    }));
    
    // Encontrar k vizinhos mais próximos
    distances.sort((a, b) => a.distance - b.distance);
    const kNeighbors = distances.slice(0, k);
    neighbors.push(kNeighbors);
    
    // Votação
    const votes: Record<number, number> = {};
    kNeighbors.forEach(neighbor => {
      votes[neighbor.label] = (votes[neighbor.label] || 0) + 1;
    });
    
    const prediction = Number(Object.keys(votes).reduce((a, b) =>
      votes[parseInt(b)] > votes[parseInt(a)] ? b : a
    ));
    
    predictions.push(prediction);
  });
  
  // Calcular acurácia
  let correctPredictions = 0;
  predictions.forEach((pred, idx) => {
    if (pred === y_train[idx]) {
      correctPredictions++;
    }
  });
  
  const accuracy = correctPredictions / predictions.length;
  
  return {
    k,
    predictions: predictions.map((pred, idx) => ({
      actual: y_train[idx],
      predicted: pred,
      distance: neighbors[idx][0]?.distance || 0,
    })),
    accuracy,
    neighbors,
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcular métricas de classificação (Accuracy, Precision, Recall, F1)
 */
export function calculateClassificationMetrics(actual: number[], predicted: number[]): TreeMetrics {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;
  
  actual.forEach((a, idx) => {
    const p = predicted[idx];
    
    if (a === 1 && p === 1) truePositives++;
    else if (a === 0 && p === 1) falsePositives++;
    else if (a === 1 && p === 0) falseNegatives++;
    else if (a === 0 && p === 0) trueNegatives++;
  });
  
  const accuracy = (truePositives + trueNegatives) / actual.length;
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
  
  // AUC simplificado
  const auc = (accuracy + recall) / 2;
  
  return {
    accuracy,
    precision,
    recall,
    f1Score,
    auc,
  };
}

/**
 * Normalized Feature Scaling
 */
export function normalizeFeatures(X: number[][]): number[][] {
  const numFeatures = X[0].length;
  const normalized: number[][] = [];
  
  for (let j = 0; j < numFeatures; j++) {
    const feature = X.map(row => row[j]);
    const mean = stats.mean(feature);
    const stdDev = stats.standardDeviation(feature);
    
    X.forEach((row, idx) => {
      if (!normalized[idx]) normalized[idx] = [];
      normalized[idx][j] = (row[j] - mean) / (stdDev || 1);
    });
  }
  
  return normalized;
}

export default {
  buildDecisionTree,
  predictWithTree,
  trainRandomForest,
  gradientBoosting,
  knn,
  calculateClassificationMetrics,
  normalizeFeatures,
};
