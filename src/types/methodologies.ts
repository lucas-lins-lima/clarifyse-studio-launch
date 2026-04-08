/**
 * Tipos e Utilitários para Metodologias de Pesquisa
 * Integração completa de todas as 142+ metodologias Clarifyse
 */

export type MethodologyType =
  // Descritivas
  | 'frequency_distribution'
  | 'descriptive_stats'
  | 'clustering'
  | 'outlier_detection'
  | 'quintiles'
  | 'skewness_kurtosis'
  // Comparativas
  | 't_test'
  | 'anova'
  | 'chi_square'
  | 'mann_whitney'
  | 'kruskal_wallis'
  | 'effect_size'
  // Regressão
  | 'linear_regression'
  | 'logistic_regression'
  | 'ridge_regression'
  | 'lasso_regression'
  | 'random_forest'
  // Fatores
  | 'pca'
  | 'factor_analysis'
  | 'correspondence_analysis'
  // Penalty & Priorização
  | 'penalty_analysis'
  | 'importance_satisfaction'
  | 'gap_analysis'
  | 'kano_analysis'
  | 'importance_matrix'
  // Preços
  | 'van_westendorp'
  | 'gabor_granger'
  | 'price_elasticity'
  | 'wtp_analysis'
  // Clusterização
  | 'kmeans'
  | 'hierarchical_clustering'
  | 'dbscan'
  | 'silhouette_analysis'
  | 'davies_bouldin'
  // Texto
  | 'sentiment_analysis'
  | 'aspect_based_sentiment'
  | 'word_frequency'
  | 'topic_modeling'
  | 'ner'
  | 'word_embedding'
  // Intenção
  | 'conversion_funnel'
  | 'barrier_analysis'
  | 'job_to_be_done'
  // Importância
  | 'shapley_values'
  | 'shap_analysis'
  | 'lime_analysis'
  // Conjoint & Simulação
  | 'conjoint_simulation'
  | 'choice_based_conjoint'
  | 'adaptive_conjoint'
  | 'menu_based_conjoint'
  // NPS & Satisfação
  | 'nps_analysis'
  | 'ces_analysis'
  | 'csat_analysis'
  | 'brand_funnel'
  | 'brand_equity'
  // Rede
  | 'network_analysis'
  | 'network_centrality'
  | 'community_detection'
  // Sobrevivência
  | 'survival_analysis'
  | 'kaplan_meier'
  | 'cox_model'
  // MaxDiff
  | 'maxdiff_analysis'
  | 'maxdiff_latent'
  // Mediação
  | 'mediation_analysis'
  | 'moderation_analysis'
  | 'mediated_moderation'
  // SEM
  | 'sem_analysis'
  | 'pls_sem'
  | 'multigroup_sem'
  | 'dynamic_sem'
  // Causalidade
  | 'propensity_score'
  | 'difference_in_differences'
  | 'regression_discontinuity'
  | 'instrumental_variables'
  | 'causal_inference'
  // Experiência
  | 'journey_mapping'
  | 'touchpoint_analysis'
  | 'inflection_point'
  // Marca
  | 'copy_testing'
  | 'brand_personality'
  | 'self_congruity'
  | 'positioning_map'
  // Mercado
  | 'market_share'
  | 'switching_analysis'
  | 'perceptual_rivalry'
  | 'white_space'
  | 'concentration_hhi'
  | 'turf_analysis'
  // Comportamental
  | 'ab_testing'
  | 'multi_armed_bandit'
  | 'behavioral_economics'
  | 'eye_tracking'
  | 'reaction_time'
  | 'implicit_association'
  // Validação
  | 'cross_validation'
  | 'multicollinearity'
  | 'measurement_invariance'
  | 'precision_recall'
  | 'model_calibration'
  // Avançadas
  | 'deep_learning'
  | 'hierarchical_bayesian'
  | 'double_machine_learning'
  | 'synthetic_control'
  | 'causal_forest'
  | 'uplift_modeling'
  | 'llm_assisted'
  | 'synthetic_respondents'
  | 'scenario_modeling'
  // Valor
  | 'clv_analysis'
  | 'cohort_analysis'
  // Adicionais
  | 'cronbach_alpha'
  | 'bootstrap_ci'
  | 'monte_carlo';

export interface MethodologyConfig {
  type: MethodologyType;
  name: string;
  description: string;
  category: 'descriptive' | 'comparative' | 'explanatory' | 'text' | 'pricing' | 'causal' | 'advanced';
  applicableQuestionTypes: string[];
  enabled: boolean;
  parameters?: Record<string, any>;
  requires?: string[]; // Outras metodologias necessárias
}

export interface QuestionMethodologies {
  [questionId: string]: MethodologyConfig[];
}

export const METHODOLOGIES_CATALOG: Record<MethodologyType, MethodologyConfig> = {
  // Análises Descritivas
  frequency_distribution: {
    type: 'frequency_distribution',
    name: 'Distribuição de Frequências',
    description: 'Análise básica de frequências, médias, medianas para descrever padrões de resposta',
    category: 'descriptive',
    applicableQuestionTypes: ['single', 'multiple', 'likert', 'nps', 'rating', 'ranking'],
    enabled: true,
  },
  descriptive_stats: {
    type: 'descriptive_stats',
    name: 'Estatísticas Descritivas',
    description: 'Média, mediana, desvio padrão, variância, min/max',
    category: 'descriptive',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },
  clustering: {
    type: 'clustering',
    name: 'Segmentação por Cluster',
    description: 'Agrupamento de respondentes em segmentos homogêneos (K-Means)',
    category: 'descriptive',
    applicableQuestionTypes: ['multiple', 'likert'],
    enabled: true,
  },
  outlier_detection: {
    type: 'outlier_detection',
    name: 'Detecção de Outliers',
    description: 'Identificação de respostas atípicas por Z-score ou IQR',
    category: 'descriptive',
    applicableQuestionTypes: ['number', 'likert', 'rating'],
    enabled: true,
  },
  quintiles: {
    type: 'quintiles',
    name: 'Análise de Quintis',
    description: 'Estratificação em faixas de distribuição (top/bottom box)',
    category: 'descriptive',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },
  skewness_kurtosis: {
    type: 'skewness_kurtosis',
    name: 'Assimetria e Curtose',
    description: 'Avaliação da forma das distribuições (assimetria, curtose)',
    category: 'descriptive',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },

  // Análises Comparativas
  t_test: {
    type: 't_test',
    name: 'Teste T',
    description: 'Comparação de médias entre dois grupos',
    category: 'comparative',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },
  anova: {
    type: 'anova',
    name: 'ANOVA',
    description: 'Comparação de médias entre múltiplos grupos',
    category: 'comparative',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },
  chi_square: {
    type: 'chi_square',
    name: 'Teste Qui-Quadrado',
    description: 'Teste de independência entre variáveis categóricas',
    category: 'comparative',
    applicableQuestionTypes: ['single', 'multiple', 'boolean'],
    enabled: true,
  },
  mann_whitney: {
    type: 'mann_whitney',
    name: 'Mann-Whitney U Test',
    description: 'Alternativa não-paramétrica ao T-test',
    category: 'comparative',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },
  kruskal_wallis: {
    type: 'kruskal_wallis',
    name: 'Kruskal-Wallis',
    description: 'Alternativa não-paramétrica ao ANOVA',
    category: 'comparative',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },
  effect_size: {
    type: 'effect_size',
    name: 'Effect Size (Cohen\'s d)',
    description: 'Magnitude prática das diferenças entre grupos',
    category: 'comparative',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },

  // Regressão
  linear_regression: {
    type: 'linear_regression',
    name: 'Regressão Linear',
    description: 'Predição de variáveis contínuas com múltiplos preditores',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },
  logistic_regression: {
    type: 'logistic_regression',
    name: 'Regressão Logística',
    description: 'Predição de variáveis binárias ou categóricas',
    category: 'explanatory',
    applicableQuestionTypes: ['boolean', 'single'],
    enabled: true,
  },
  ridge_regression: {
    type: 'ridge_regression',
    name: 'Regressão Ridge',
    description: 'Regressão regularizada para contextos com muitas variáveis',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },
  lasso_regression: {
    type: 'lasso_regression',
    name: 'Regressão Lasso',
    description: 'Regressão com seleção automática de variáveis',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number'],
    enabled: true,
  },
  random_forest: {
    type: 'random_forest',
    name: 'Random Forest',
    description: 'Árvores de decisão ensembladas para predição',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'nps', 'rating', 'number', 'single'],
    enabled: true,
  },

  // Fatores
  pca: {
    type: 'pca',
    name: 'Análise de Componentes Principais',
    description: 'Redução de dimensionalidade e agrupamento de itens',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  factor_analysis: {
    type: 'factor_analysis',
    name: 'Análise Fatorial',
    description: 'Agrupamento de itens em fatores latentes',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  correspondence_analysis: {
    type: 'correspondence_analysis',
    name: 'Análise de Correspondência',
    description: 'Mapa perceptual associando atributos e perfis',
    category: 'explanatory',
    applicableQuestionTypes: ['single', 'multiple'],
    enabled: true,
  },

  // Penalty
  penalty_analysis: {
    type: 'penalty_analysis',
    name: 'Análise de Penalty',
    description: 'Avalia impacto da ausência de atributos',
    category: 'explanatory',
    applicableQuestionTypes: ['multiple', 'likert'],
    enabled: true,
  },
  importance_satisfaction: {
    type: 'importance_satisfaction',
    name: 'Matriz Importância × Satisfação',
    description: 'Quadrante de priorização de atributos',
    category: 'explanatory',
    applicableQuestionTypes: ['likert'],
    enabled: true,
  },
  gap_analysis: {
    type: 'gap_analysis',
    name: 'Análise de Gap (Expectativa × Realidade)',
    description: 'Comparação entre expectativas e percepção',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  kano_analysis: {
    type: 'kano_analysis',
    name: 'Análise de Kano',
    description: 'Classificação de atributos (básicos, lineares, atrativos)',
    category: 'explanatory',
    applicableQuestionTypes: ['likert'],
    enabled: true,
  },

  // Preços
  van_westendorp: {
    type: 'van_westendorp',
    name: 'Van Westendorp (PSM)',
    description: 'Curvas de preço aceitável e análise PSM',
    category: 'pricing',
    applicableQuestionTypes: ['number'],
    enabled: true,
  },
  gabor_granger: {
    type: 'gabor_granger',
    name: 'Gabor-Granger Pricing',
    description: 'Curva de demanda via escalonamento de preços',
    category: 'pricing',
    applicableQuestionTypes: ['boolean', 'likert'],
    enabled: true,
  },
  price_elasticity: {
    type: 'price_elasticity',
    name: 'Elasticidade-Preço da Demanda',
    description: 'Sensibilidade da intenção a variações de preço',
    category: 'pricing',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  wtp_analysis: {
    type: 'wtp_analysis',
    name: 'Willingness to Pay (WTP)',
    description: 'Disposição a pagar por atributos específicos',
    category: 'pricing',
    applicableQuestionTypes: ['number', 'likert'],
    enabled: true,
  },

  // Clusterização
  kmeans: {
    type: 'kmeans',
    name: 'K-Means Clustering',
    description: 'Algoritmo de agrupamento padrão',
    category: 'descriptive',
    applicableQuestionTypes: ['likert', 'rating', 'multiple'],
    enabled: true,
  },
  hierarchical_clustering: {
    type: 'hierarchical_clustering',
    name: 'Clusterização Hierárquica',
    description: 'Agrupamento com dendrograma',
    category: 'descriptive',
    applicableQuestionTypes: ['likert', 'rating', 'multiple'],
    enabled: true,
  },
  dbscan: {
    type: 'dbscan',
    name: 'DBSCAN',
    description: 'Clusterização baseada em densidade',
    category: 'descriptive',
    applicableQuestionTypes: ['likert', 'rating', 'multiple'],
    enabled: true,
  },
  silhouette_analysis: {
    type: 'silhouette_analysis',
    name: 'Análise de Silhueta',
    description: 'Validação da qualidade dos clusters',
    category: 'descriptive',
    applicableQuestionTypes: ['likert', 'rating', 'multiple'],
    enabled: true,
  },
  davies_bouldin: {
    type: 'davies_bouldin',
    name: 'Índice de Davies-Bouldin',
    description: 'Métrica de validação de coesão de clusters',
    category: 'descriptive',
    applicableQuestionTypes: ['likert', 'rating', 'multiple'],
    enabled: true,
  },

  // Texto
  sentiment_analysis: {
    type: 'sentiment_analysis',
    name: 'Análise de Sentimento',
    description: 'Classificação em positivo, neutro ou negativo',
    category: 'text',
    applicableQuestionTypes: ['text'],
    enabled: true,
  },
  aspect_based_sentiment: {
    type: 'aspect_based_sentiment',
    name: 'ABSA (Aspect-Based Sentiment)',
    description: 'Sentimentos por aspecto específico mencionado',
    category: 'text',
    applicableQuestionTypes: ['text'],
    enabled: true,
  },
  word_frequency: {
    type: 'word_frequency',
    name: 'Frequência de Palavras',
    description: 'Palavras mais frequentes e nuvem de palavras',
    category: 'text',
    applicableQuestionTypes: ['text'],
    enabled: true,
  },
  topic_modeling: {
    type: 'topic_modeling',
    name: 'Modelagem de Tópicos (LDA)',
    description: 'Temas latentes em respostas abertas',
    category: 'text',
    applicableQuestionTypes: ['text'],
    enabled: true,
  },
  ner: {
    type: 'ner',
    name: 'Named Entity Recognition',
    description: 'Extração de marcas, produtos, locais',
    category: 'text',
    applicableQuestionTypes: ['text'],
    enabled: true,
  },
  word_embedding: {
    type: 'word_embedding',
    name: 'Word Embeddings (Word2Vec)',
    description: 'Similaridade semântica entre conceitos',
    category: 'text',
    applicableQuestionTypes: ['text'],
    enabled: true,
  },

  // Intenção
  conversion_funnel: {
    type: 'conversion_funnel',
    name: 'Funil de Conversão',
    description: 'Awareness → Consideração → Intenção → Compra',
    category: 'explanatory',
    applicableQuestionTypes: ['boolean', 'single'],
    enabled: true,
  },
  barrier_analysis: {
    type: 'barrier_analysis',
    name: 'Análise de Barreiras',
    description: 'Barreiras racionais, emocionais e situacionais',
    category: 'explanatory',
    applicableQuestionTypes: ['text', 'multiple'],
    enabled: true,
  },
  job_to_be_done: {
    type: 'job_to_be_done',
    name: 'Job-to-be-Done Analytics',
    description: 'Trabalhos funcionais, emocionais e sociais',
    category: 'explanatory',
    applicableQuestionTypes: ['text', 'multiple'],
    enabled: true,
  },

  // Importância
  shapley_values: {
    type: 'shapley_values',
    name: 'Shapley Values',
    description: 'Contribuição relativa de variáveis preditoras',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  shap_analysis: {
    type: 'shap_analysis',
    name: 'SHAP (SHapley Additive exPlanations)',
    description: 'Interpretabilidade granular de modelos ML',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  lime_analysis: {
    type: 'lime_analysis',
    name: 'LIME (Local Interpretable Model-agnostic)',
    description: 'Interpretabilidade local de modelos complexos',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },

  // Conjoint
  conjoint_simulation: {
    type: 'conjoint_simulation',
    name: 'Simulação de Conjoint',
    description: 'Combinações ótimas de atributos',
    category: 'explanatory',
    applicableQuestionTypes: ['cbc', 'multiple'],
    enabled: true,
  },
  choice_based_conjoint: {
    type: 'choice_based_conjoint',
    name: 'Choice-Based Conjoint',
    description: 'Escolhas entre perfis completos',
    category: 'explanatory',
    applicableQuestionTypes: ['cbc'],
    enabled: true,
  },
  adaptive_conjoint: {
    type: 'adaptive_conjoint',
    name: 'Adaptive Conjoint (ACA)',
    description: 'Conjoint adaptativo personalizado',
    category: 'explanatory',
    applicableQuestionTypes: ['cbc'],
    enabled: true,
  },
  menu_based_conjoint: {
    type: 'menu_based_conjoint',
    name: 'Menu-Based Conjoint',
    description: 'Seleção de múltiplos itens (à la carte)',
    category: 'explanatory',
    applicableQuestionTypes: ['multiple', 'cbc'],
    enabled: true,
  },

  // NPS
  nps_analysis: {
    type: 'nps_analysis',
    name: 'NPS Analytics',
    description: 'Análise completa de NPS com drivers',
    category: 'explanatory',
    applicableQuestionTypes: ['nps'],
    enabled: true,
  },
  ces_analysis: {
    type: 'ces_analysis',
    name: 'CES (Customer Effort Score)',
    description: 'Análise de esforço percebido',
    category: 'explanatory',
    applicableQuestionTypes: ['ces', 'likert'],
    enabled: true,
  },
  csat_analysis: {
    type: 'csat_analysis',
    name: 'CSAT (Customer Satisfaction)',
    description: 'Análise de satisfação transacional',
    category: 'explanatory',
    applicableQuestionTypes: ['csat', 'likert', 'rating'],
    enabled: true,
  },
  brand_funnel: {
    type: 'brand_funnel',
    name: 'Brand Funnel Analytics',
    description: 'Funil de marca com conversão',
    category: 'explanatory',
    applicableQuestionTypes: ['brand_funnel', 'multiple'],
    enabled: true,
  },
  brand_equity: {
    type: 'brand_equity',
    name: 'Brand Equity Tracking',
    description: 'Mensuração de pilares de brand equity',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },

  // Rede
  network_analysis: {
    type: 'network_analysis',
    name: 'Análise de Redes',
    description: 'Mapeamento de conexões entre atributos',
    category: 'explanatory',
    applicableQuestionTypes: ['multiple', 'likert'],
    enabled: true,
  },
  network_centrality: {
    type: 'network_centrality',
    name: 'Centralidade de Rede',
    description: 'Atributos mais influentes na rede',
    category: 'explanatory',
    applicableQuestionTypes: ['multiple', 'likert'],
    enabled: true,
  },
  community_detection: {
    type: 'community_detection',
    name: 'Detecção de Comunidades',
    description: 'Clusters de atributos coesos',
    category: 'explanatory',
    applicableQuestionTypes: ['multiple', 'likert'],
    enabled: true,
  },

  // Sobrevivência
  survival_analysis: {
    type: 'survival_analysis',
    name: 'Análise de Sobrevivência',
    description: 'Modelagem de tempo até abandono/churn',
    category: 'explanatory',
    applicableQuestionTypes: ['number'],
    enabled: true,
  },
  kaplan_meier: {
    type: 'kaplan_meier',
    name: 'Curvas de Kaplan-Meier',
    description: 'Estimativa não-paramétrica de retenção',
    category: 'explanatory',
    applicableQuestionTypes: ['number'],
    enabled: true,
  },
  cox_model: {
    type: 'cox_model',
    name: 'Modelo de Cox',
    description: 'Regressão de sobrevivência',
    category: 'explanatory',
    applicableQuestionTypes: ['number'],
    enabled: true,
  },

  // MaxDiff
  maxdiff_analysis: {
    type: 'maxdiff_analysis',
    name: 'MaxDiff (Maximum Difference)',
    description: 'Priorização via escolhas best-worst',
    category: 'explanatory',
    applicableQuestionTypes: ['maxdiff', 'ranking'],
    enabled: true,
  },
  maxdiff_latent: {
    type: 'maxdiff_latent',
    name: 'MaxDiff com Segmentação Latente',
    description: 'MaxDiff com classes latentes',
    category: 'explanatory',
    applicableQuestionTypes: ['maxdiff'],
    enabled: true,
  },

  // Mediação
  mediation_analysis: {
    type: 'mediation_analysis',
    name: 'Análise de Mediação',
    description: 'Mecanismo causal: o "como"',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  moderation_analysis: {
    type: 'moderation_analysis',
    name: 'Análise de Moderação',
    description: 'Condições em que a relação vale: o "quando"',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  mediated_moderation: {
    type: 'mediated_moderation',
    name: 'Efeito Indireto Condicional',
    description: 'Combinação de mediação e moderação',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },

  // SEM
  sem_analysis: {
    type: 'sem_analysis',
    name: 'SEM (Structural Equation Modeling)',
    description: 'Teste de relações causais complexas',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  pls_sem: {
    type: 'pls_sem',
    name: 'PLS-SEM',
    description: 'SEM com mínimos quadrados parciais',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  multigroup_sem: {
    type: 'multigroup_sem',
    name: 'SEM Multigrupo',
    description: 'Comparação de modelos entre segmentos',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  dynamic_sem: {
    type: 'dynamic_sem',
    name: 'SEM Dinâmico',
    description: 'SEM com dados de painel longitudinal',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },

  // Causalidade
  propensity_score: {
    type: 'propensity_score',
    name: 'Propensity Score Matching',
    description: 'Controle de viés de seleção',
    category: 'causal',
    applicableQuestionTypes: ['boolean', 'single'],
    enabled: true,
  },
  difference_in_differences: {
    type: 'difference_in_differences',
    name: 'Difference-in-Differences',
    description: 'Estimação de efeitos causais pré/pós',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  regression_discontinuity: {
    type: 'regression_discontinuity',
    name: 'Regressão Descontínua',
    description: 'Efeitos causais em torno de limiares',
    category: 'causal',
    applicableQuestionTypes: ['number'],
    enabled: true,
  },
  instrumental_variables: {
    type: 'instrumental_variables',
    name: 'Variáveis Instrumentais',
    description: 'Isolamento de variação causal',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  causal_inference: {
    type: 'causal_inference',
    name: 'Análise de Contrafactual',
    description: 'Framework formal de inferência causal',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },

  // Experiência
  journey_mapping: {
    type: 'journey_mapping',
    name: 'Journey Mapping Quantitativa',
    description: 'Mapas de jornada baseados em dados',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  touchpoint_analysis: {
    type: 'touchpoint_analysis',
    name: 'Análise de Momentos da Verdade',
    description: 'Priorização de pontos de contato críticos',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  inflection_point: {
    type: 'inflection_point',
    name: 'Análise de Ponto de Inflexão',
    description: 'Pontos de maior sensibilidade de experiência',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },

  // Marca
  copy_testing: {
    type: 'copy_testing',
    name: 'Copy Testing Analytics',
    description: 'Análise de criativas com métricas de impacto',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating', 'text'],
    enabled: true,
  },
  brand_personality: {
    type: 'brand_personality',
    name: 'Brand Personality Mapping',
    description: 'Mensuração de dimensões de personalidade',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  self_congruity: {
    type: 'self_congruity',
    name: 'Self-Congruity (Marca-Consumidor)',
    description: 'Congruência entre imagem de marca e autoimagem',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },

  // Mercado
  market_share: {
    type: 'market_share',
    name: 'Share of Preference',
    description: 'Simulador de participação de mercado',
    category: 'explanatory',
    applicableQuestionTypes: ['rating', 'ranking'],
    enabled: true,
  },
  switching_analysis: {
    type: 'switching_analysis',
    name: 'Switching & Fidelidade',
    description: 'Probabilidade de migração entre marcas',
    category: 'explanatory',
    applicableQuestionTypes: ['single', 'boolean'],
    enabled: true,
  },
  perceptual_rivalry: {
    type: 'perceptual_rivalry',
    name: 'Rivalidade Perceptual',
    description: 'Mapeamento de marcas concorrentes',
    category: 'explanatory',
    applicableQuestionTypes: ['multiple', 'likert'],
    enabled: true,
  },
  white_space: {
    type: 'white_space',
    name: 'White Space Analysis',
    description: 'Brechas de mercado não exploradas',
    category: 'explanatory',
    applicableQuestionTypes: ['multiple', 'likert'],
    enabled: true,
  },
  concentration_hhi: {
    type: 'concentration_hhi',
    name: 'HHI (Herfindahl-Hirschman)',
    description: 'Concentração de mercado',
    category: 'explanatory',
    applicableQuestionTypes: ['single', 'multiple'],
    enabled: true,
  },
  turf_analysis: {
    type: 'turf_analysis',
    name: 'TURF Analysis',
    description: 'Otimização de portfólio de produtos',
    category: 'explanatory',
    applicableQuestionTypes: ['multiple', 'single'],
    enabled: true,
  },

  // Comportamental
  ab_testing: {
    type: 'ab_testing',
    name: 'A/B Testing',
    description: 'Experimentação controlada de variantes',
    category: 'causal',
    applicableQuestionTypes: ['boolean', 'likert', 'rating'],
    enabled: true,
  },
  multi_armed_bandit: {
    type: 'multi_armed_bandit',
    name: 'Multi-Armed Bandit',
    description: 'Otimização dinâmica de variantes',
    category: 'causal',
    applicableQuestionTypes: ['single', 'boolean'],
    enabled: true,
  },
  behavioral_economics: {
    type: 'behavioral_economics',
    name: 'Behavioral Economics Analytics',
    description: 'Análise de heurísticas e vieses',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating', 'text'],
    enabled: true,
  },
  eye_tracking: {
    type: 'eye_tracking',
    name: 'Eye Tracking Analytics',
    description: 'Análise de rastreamento ocular',
    category: 'advanced',
    applicableQuestionTypes: ['image_choice'],
    enabled: true,
  },
  reaction_time: {
    type: 'reaction_time',
    name: 'Reaction Time Analysis',
    description: 'Análise de latência de resposta',
    category: 'advanced',
    applicableQuestionTypes: ['single', 'multiple'],
    enabled: true,
  },
  implicit_association: {
    type: 'implicit_association',
    name: 'Implicit Association Test',
    description: 'Atitudes automáticas subconscientes',
    category: 'advanced',
    applicableQuestionTypes: ['ranking', 'maxdiff'],
    enabled: true,
  },

  // Validação
  cross_validation: {
    type: 'cross_validation',
    name: 'Cross-Validation',
    description: 'Avaliação de generalização de modelos',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  multicollinearity: {
    type: 'multicollinearity',
    name: 'Multicolinearidade (VIF)',
    description: 'Diagnóstico de colinearidade entre variáveis',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  measurement_invariance: {
    type: 'measurement_invariance',
    name: 'Invariância de Medida',
    description: 'Teste de equivalência entre grupos',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  precision_recall: {
    type: 'precision_recall',
    name: 'Precision/Recall (F1-Score)',
    description: 'Performance de modelos de classificação',
    category: 'explanatory',
    applicableQuestionTypes: ['single', 'boolean'],
    enabled: true,
  },
  model_calibration: {
    type: 'model_calibration',
    name: 'Calibração de Modelos',
    description: 'Validação de probabilidades preditas',
    category: 'explanatory',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },

  // Avançadas
  deep_learning: {
    type: 'deep_learning',
    name: 'Deep Learning Neural Networks',
    description: 'Modelos profundos para padrões complexos',
    category: 'advanced',
    applicableQuestionTypes: ['text', 'image_choice', 'matrix'],
    enabled: true,
  },
  hierarchical_bayesian: {
    type: 'hierarchical_bayesian',
    name: 'Hierarchical Bayesian Models',
    description: 'Estimação Bayesiana com estrutura hierárquica',
    category: 'advanced',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  double_machine_learning: {
    type: 'double_machine_learning',
    name: 'Double Machine Learning (DML)',
    description: 'Inferência causal com machine learning',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  synthetic_control: {
    type: 'synthetic_control',
    name: 'Synthetic Control Method',
    description: 'Grupo controle sintético para causalidade',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  causal_forest: {
    type: 'causal_forest',
    name: 'Causal Forests',
    description: 'Florestas para estimação de efeitos heterogêneos',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  uplift_modeling: {
    type: 'uplift_modeling',
    name: 'Uplift Modeling',
    description: 'Efeito incremental personalizado por cliente',
    category: 'causal',
    applicableQuestionTypes: ['likert', 'rating', 'boolean'],
    enabled: true,
  },
  llm_assisted: {
    type: 'llm_assisted',
    name: 'LLM-Assisted Insights',
    description: 'Extração de insights com modelos de linguagem',
    category: 'text',
    applicableQuestionTypes: ['text'],
    enabled: true,
  },
  synthetic_respondents: {
    type: 'synthetic_respondents',
    name: 'Synthetic Respondent Generation',
    description: 'Geração de respondentes sintéticos calibrados',
    category: 'advanced',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },
  scenario_modeling: {
    type: 'scenario_modeling',
    name: 'Scenario Modeling & Simulation',
    description: 'Simulação de múltiplos cenários futuros',
    category: 'advanced',
    applicableQuestionTypes: ['likert', 'rating', 'number'],
    enabled: true,
  },

  // Valor do Cliente
  clv_analysis: {
    type: 'clv_analysis',
    name: 'Customer Lifetime Value',
    description: 'Valor monetário esperado por cliente',
    category: 'explanatory',
    applicableQuestionTypes: ['number', 'likert'],
    enabled: true,
  },
  cohort_analysis: {
    type: 'cohort_analysis',
    name: 'Cohort Analysis',
    description: 'Acompanhamento de coortes ao longo do tempo',
    category: 'explanatory',
    applicableQuestionTypes: ['number', 'likert'],
    enabled: true,
  },

  // Adicionais
  cronbach_alpha: {
    type: 'cronbach_alpha',
    name: 'Cronbach\'s Alpha',
    description: 'Consistência interna de escalas',
    category: 'descriptive',
    applicableQuestionTypes: ['likert', 'rating'],
    enabled: true,
  },
  bootstrap_ci: {
    type: 'bootstrap_ci',
    name: 'Bootstrap Confidence Intervals',
    description: 'Intervalos de confiança por reamostragem',
    category: 'descriptive',
    applicableQuestionTypes: ['number', 'likert', 'rating'],
    enabled: true,
  },
  monte_carlo: {
    type: 'monte_carlo',
    name: 'Monte Carlo Simulation',
    description: 'Simulação de cenários via amostragem',
    category: 'advanced',
    applicableQuestionTypes: ['number', 'likert', 'rating'],
    enabled: true,
  },
};

/**
 * Retorna metodologias aplicáveis para um tipo de pergunta
 */
export function getApplicableMethodologies(questionType: string): MethodologyConfig[] {
  return Object.values(METHODOLOGIES_CATALOG)
    .filter(m => m.applicableQuestionTypes.includes(questionType) && m.enabled)
    .sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Metodologias padrão por tipo de pergunta
 */
export const DEFAULT_METHODOLOGIES_BY_TYPE: Record<string, MethodologyType[]> = {
  'single': ['frequency_distribution', 'chi_square', 'conversion_funnel'],
  'multiple': ['frequency_distribution', 'chi_square', 'clustering'],
  'likert': ['descriptive_stats', 't_test', 'anova', 'importance_satisfaction'],
  'nps': ['nps_analysis', 'descriptive_stats'],
  'rating': ['descriptive_stats', 't_test', 'effect_size'],
  'matrix': ['descriptive_stats', 'anova', 'network_analysis'],
  'text': ['sentiment_analysis', 'word_frequency', 'aspect_based_sentiment'],
  'number': ['descriptive_stats', 't_test', 'linear_regression'],
  'ranking': ['maxdiff_analysis', 'clustering'],
  'cbc': ['conjoint_simulation', 'choice_based_conjoint'],
  'vanwestendorp': ['van_westendorp'],
  'kano': ['kano_analysis'],
  'ces': ['ces_analysis'],
  'csat': ['csat_analysis'],
  'brand_funnel': ['brand_funnel'],
};

export default {
  METHODOLOGIES_CATALOG,
  getApplicableMethodologies,
  DEFAULT_METHODOLOGIES_BY_TYPE,
};
