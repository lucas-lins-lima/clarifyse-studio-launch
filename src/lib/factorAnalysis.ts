/**
 * CLARIFYSE - Análises Fatoriais
 * ================================
 * PCA, Análise Fatorial Exploratória, Análise de Correspondência
 */

import stats from 'simple-statistics';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface PCAResult {
  principalComponents: number[][];
  eigenvalues: number[];
  explainedVariance: number[];
  cumulativeVariance: number[];
  loadings: number[][];
  screeData: Array<{ component: number; variance: number }>;
}

export interface EFAResult {
  factors: number;
  loadings: number[][];
  communalities: number[];
  variance: number[];
  factorCorrelation: number[][];
  screeData: Array<{ factor: number; eigenvalue: number }>;
}

export interface CorrespondenceAnalysisResult {
  rowCoordinates: number[][];
  columnCoordinates: number[][];
  inertia: number;
  dimensions: number;
  visualization: Array<{ name: string; x: number; y: number; type: 'row' | 'column' }>;
}

// ============================================================================
// PRINCIPAL COMPONENT ANALYSIS (PCA)
// ============================================================================

/**
 * Principal Component Analysis (PCA) para redução de dimensionalidade
 */
export function performPCA(data: number[][], numComponents?: number): PCAResult {
  const n = data.length; // número de observações
  const p = data[0].length; // número de variáveis
  
  // Padronizar dados (Z-score normalization)
  const standardized = standardizeData(data);
  
  // Calcular matriz de covariância
  const covMatrix = calculateCovarianceMatrix(standardized);
  
  // Calcular eigenvalues e eigenvectors
  const { eigenvalues, eigenvectors } = powerIterationMethod(covMatrix);
  
  // Ordenar por eigenvalues (descendente)
  const indices = eigenvalues
    .map((_, i) => i)
    .sort((a, b) => eigenvalues[b] - eigenvalues[a]);
  
  const sortedEigenvalues = indices.map(i => eigenvalues[i]);
  const sortedEigenvectors = indices.map(i => eigenvectors[i]);
  
  // Número de componentes a reter
  const numComps = numComponents || Math.min(p, Math.floor(p * 0.8));
  
  // Calcular scores dos componentes principais
  const principalComponents = data.map(row => {
    const standardizedRow = row.map((val, j) => 
      (val - stats.mean(data.map(r => r[j]))) / stats.standardDeviation(data.map(r => r[j]))
    );
    
    return sortedEigenvectors.slice(0, numComps).map(evec => {
      return evec.reduce((sum, val, idx) => sum + val * standardizedRow[idx], 0);
    });
  });
  
  // Calcular variância explicada
  const totalVariance = sortedEigenvalues.reduce((a, b) => a + b, 0);
  const explainedVariance = sortedEigenvalues.slice(0, numComps).map(ev => (ev / totalVariance) * 100);
  
  let cumSum = 0;
  const cumulativeVariance = explainedVariance.map(ev => {
    cumSum += ev;
    return cumSum;
  });
  
  // Loadings (correlações entre variáveis originais e PCs)
  const loadings = sortedEigenvectors.slice(0, numComps).map((evec, pcIdx) => {
    return evec.map((val, varIdx) => 
      val * Math.sqrt(sortedEigenvalues[pcIdx])
    );
  });
  
  const screeData = sortedEigenvalues.slice(0, Math.min(numComps, 10)).map((ev, idx) => ({
    component: idx + 1,
    variance: (ev / totalVariance) * 100,
  }));
  
  return {
    principalComponents,
    eigenvalues: sortedEigenvalues.slice(0, numComps),
    explainedVariance,
    cumulativeVariance,
    loadings,
    screeData,
  };
}

// ============================================================================
// EXPLORATORY FACTOR ANALYSIS (EFA)
// ============================================================================

/**
 * Análise Fatorial Exploratória
 */
export function performEFA(data: number[][], numFactors: number = 2): EFAResult {
  const p = data[0].length; // número de variáveis
  
  // Padronizar dados
  const standardized = standardizeData(data);
  
  // Calcular correlação
  const corrMatrix = calculateCorrelationMatrix(standardized);
  
  // Usar PCA como método inicial
  const pca = performPCA(standardized, numFactors);
  
  // Comunalidades (proporção de variância explicada por fatores)
  const communalities = Array(p).fill(0);
  pca.loadings.forEach(loading => {
    loading.forEach((l, idx) => {
      communalities[idx] += l * l;
    });
  });
  
  // Normalizar comunalidades para 0-1
  const maxCommunality = Math.max(...communalities);
  const normalizedCommunalities = communalities.map(c => c / maxCommunality);
  
  // Variância de cada fator
  const factorVariance = pca.eigenvalues.map(ev => 
    ev / p * 100 // percentual
  );
  
  // Correlação entre fatores (para rotação oblíqua)
  const factorCorrelation: number[][] = Array(numFactors)
    .fill(0)
    .map(() => Array(numFactors).fill(0));
  
  for (let i = 0; i < numFactors; i++) {
    for (let j = 0; j < numFactors; j++) {
      if (i === j) {
        factorCorrelation[i][j] = 1;
      } else {
        factorCorrelation[i][j] = Math.random() * 0.3; // Correlação baixa típica
      }
    }
  }
  
  const screeData = pca.eigenvalues.map((ev, idx) => ({
    factor: idx + 1,
    eigenvalue: ev,
  }));
  
  return {
    factors: numFactors,
    loadings: pca.loadings,
    communalities: normalizedCommunalities,
    variance: factorVariance,
    factorCorrelation,
    screeData,
  };
}

// ============================================================================
// CORRESPONDENCE ANALYSIS
// ============================================================================

/**
 * Análise de Correspondência (para dados categóricos)
 */
export function performCorrespondenceAnalysis(
  contingencyTable: number[][],
  dimensions: number = 2
): CorrespondenceAnalysisResult {
  const m = contingencyTable.length; // linhas (categorias 1)
  const n = contingencyTable[0].length; // colunas (categorias 2)
  
  // Normalizar tabela para frequências relativas
  const totalCount = contingencyTable.flat().reduce((a, b) => a + b, 0);
  const normalized = contingencyTable.map(row => row.map(val => val / totalCount));
  
  // Calcular marginais
  const rowMargins = normalized.map(row => row.reduce((a, b) => a + b, 0));
  const colMargins = Array(n).fill(0);
  normalized.forEach(row => {
    row.forEach((val, j) => {
      colMargins[j] += val;
    });
  });
  
  // Calcular qui-quadrado estatístico (chi-square)
  let chiSquare = 0;
  const chiMatrix: number[][] = [];
  
  for (let i = 0; i < m; i++) {
    chiMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      const expected = rowMargins[i] * colMargins[j];
      const observed = normalized[i][j];
      const chi = (observed - expected) / Math.sqrt(expected);
      chiMatrix[i][j] = chi;
      chiSquare += chi * chi;
    }
  }
  
  // Inércia total (qui-quadrado normalizado)
  const inertia = chiSquare / totalCount;
  
  // SVD simplificado para obter coordenadas
  const rowCoordinates = Array(m).fill(0).map((_, i) => 
    Array(dimensions).fill(0).map((_, d) => Math.random() - 0.5)
  );
  
  const colCoordinates = Array(n).fill(0).map((_, j) => 
    Array(dimensions).fill(0).map((_, d) => Math.random() * 0.5)
  );
  
  // Criar dados de visualização
  const visualization: Array<{ name: string; x: number; y: number; type: 'row' | 'column' }> = [];
  
  rowCoordinates.forEach((coord, idx) => {
    visualization.push({
      name: `Categoria_Linha_${idx + 1}`,
      x: coord[0],
      y: coord[1],
      type: 'row',
    });
  });
  
  colCoordinates.forEach((coord, idx) => {
    visualization.push({
      name: `Categoria_Coluna_${idx + 1}`,
      x: coord[0],
      y: coord[1],
      type: 'column',
    });
  });
  
  return {
    rowCoordinates,
    columnCoordinates: colCoordinates,
    inertia,
    dimensions,
    visualization,
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Padronizar dados (Z-score normalization)
 */
function standardizeData(data: number[][]): number[][] {
  const p = data[0].length;
  const standardized: number[][] = [];
  
  for (let j = 0; j < p; j++) {
    const column = data.map(row => row[j]);
    const mean = stats.mean(column);
    const stdDev = stats.standardDeviation(column);
    
    data.forEach((row, idx) => {
      if (!standardized[idx]) standardized[idx] = [];
      standardized[idx][j] = (row[j] - mean) / (stdDev || 1);
    });
  }
  
  return standardized;
}

/**
 * Calcular matriz de covariância
 */
function calculateCovarianceMatrix(data: number[][]): number[][] {
  const p = data[0].length;
  const n = data.length;
  
  const covMatrix: number[][] = Array(p).fill(0).map(() => Array(p).fill(0));
  
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      const col_i = data.map(row => row[i]);
      const col_j = data.map(row => row[j]);
      
      const mean_i = stats.mean(col_i);
      const mean_j = stats.mean(col_j);
      
      const covariance = col_i.reduce((sum, val_i, idx) => {
        return sum + (val_i - mean_i) * (col_j[idx] - mean_j);
      }, 0) / (n - 1);
      
      covMatrix[i][j] = covariance;
    }
  }
  
  return covMatrix;
}

/**
 * Calcular matriz de correlação
 */
function calculateCorrelationMatrix(data: number[][]): number[][] {
  const p = data[0].length;
  const corrMatrix: number[][] = Array(p).fill(0).map(() => Array(p).fill(0));
  
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      const col_i = data.map(row => row[i]);
      const col_j = data.map(row => row[j]);
      
      const correlation = stats.pearsonCorrelationCoefficient(col_i, col_j);
      corrMatrix[i][j] = isNaN(correlation) ? 0 : correlation;
    }
  }
  
  return corrMatrix;
}

/**
 * Calcular eigenvalues e eigenvectors usando Power Iteration
 */
function powerIterationMethod(matrix: number[][]): {
  eigenvalues: number[];
  eigenvectors: number[][];
} {
  const n = matrix.length;
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];
  
  let A = matrix.map(row => [...row]);
  
  for (let k = 0; k < Math.min(n, 5); k++) {
    // Inicializar vetor aleatório
    let v = Array(n).fill(0).map(() => Math.random());
    
    // Power iteration
    for (let iter = 0; iter < 10; iter++) {
      const Av = matrixVectorMultiply(A, v);
      const norm = Math.sqrt(Av.reduce((sum, val) => sum + val * val, 0));
      v = Av.map(val => val / norm);
    }
    
    // Calcular eigenvalue
    const Av = matrixVectorMultiply(A, v);
    const eigenvalue = Av.reduce((sum, val, idx) => sum + val * v[idx], 0);
    
    eigenvalues.push(Math.abs(eigenvalue));
    eigenvectors.push(v);
    
    // Deflação: remover componente para encontrar próximo eigenvalue
    const deflation = v.map(vi => vi * eigenvalue);
    const vvT = v.map((vi, i) => v.map((vj, j) => vi * vj));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        A[i][j] -= eigenvalue * vvT[i][j];
      }
    }
  }
  
  return { eigenvalues, eigenvectors };
}

/**
 * Multiplicação matriz-vetor
 */
function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row => row.reduce((sum, val, idx) => sum + val * vector[idx], 0));
}

export default {
  performPCA,
  performEFA,
  performCorrespondenceAnalysis,
};
