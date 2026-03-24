/**
 * Sistema Completo de Metodologias - Clarifyse
 * Baseado no documento "Clarifyse_Metodologias.pdf"
 * Organiza todas as metodologias de análise de mercado e comportamento do consumidor
 */

// ============================================================================
// CATEGORY: Análises Descritivas e de Perfil
// ============================================================================

export const METODOLOGIA_DESCRITIVA = {
  'Distribuição Percentual e Média': {
    code: 'desc_distribuicao',
    category: 'descritiva',
    description: 'Análise básica de frequências, médias, medianas e desvios para descrever o perfil da amostra',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
  'Cruzamento de Perfil': {
    code: 'desc_cruzamento',
    category: 'descritiva',
    description: 'Tabelas de contingência entre variáveis categóricas para revelar padrões de comportamento',
    applicableQuestionTypes: ['single', 'multiple', 'boolean'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Quintis e Percentis': {
    code: 'desc_quintis',
    category: 'descritiva',
    description: 'Estratificação da amostra em faixas de distribuição para identificar grupos extremos',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Outliers': {
    code: 'desc_outliers',
    category: 'descritiva',
    description: 'Identificação de respostas atípicas por Z-score e distância de Mahalanobis',
    applicableQuestionTypes: ['number', 'rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Assimetria e Curtose': {
    code: 'desc_assimetria',
    category: 'descritiva',
    description: 'Avaliação da forma das distribuições para identificar vieses de resposta',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
  'Missing Data Analysis': {
    code: 'desc_missing_data',
    category: 'descritiva',
    description: 'Diagnóstico de padrões de dados ausentes e imputação',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'text', 'number'],
    hasAutomaticAnalysis: true,
  },
} as const;

// ============================================================================
// CATEGORY: Análises Comparativas
// ============================================================================

export const METODOLOGIA_COMPARATIVA = {
  'Teste Qui-Quadrado': {
    code: 'comp_qui_quadrado',
    category: 'comparativa',
    description: 'Teste não paramétrico para comparar distribuições entre grupos',
    applicableQuestionTypes: ['single', 'multiple', 'boolean'],
    hasAutomaticAnalysis: true,
  },
  'T-test': {
    code: 'comp_t_test',
    category: 'comparativa',
    description: 'Teste paramétrico para comparar médias entre dois grupos',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
  'ANOVA': {
    code: 'comp_anova',
    category: 'comparativa',
    description: 'Teste para comparar médias entre três ou mais grupos',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
  'Testes Post-Hoc': {
    code: 'comp_post_hoc',
    category: 'comparativa',
    description: 'Identificação de pares de subgrupos que diferem significativamente',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Mann-Whitney': {
    code: 'comp_mann_whitney',
    category: 'comparativa',
    description: 'Alternativa não paramétrica ao T-test para comparação de grupos',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
  'Kruskal-Wallis': {
    code: 'comp_kruskal_wallis',
    category: 'comparativa',
    description: 'Alternativa não paramétrica à ANOVA para múltiplos grupos',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
  'Effect Size': {
    code: 'comp_effect_size',
    category: 'comparativa',
    description: 'Mensuração da magnitude das diferenças (Cohen\'s d, eta²)',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
  'Teste de Proporções': {
    code: 'comp_proporcoes',
    category: 'comparativa',
    description: 'Comparação de frequências percentuais entre grupos',
    applicableQuestionTypes: ['single', 'multiple', 'boolean'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Variação Temporal': {
    code: 'comp_variacao_temporal',
    category: 'comparativa',
    description: 'Comparação de indicadores entre diferentes ondas de tracking',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análises Explicativas e Preditivas
// ============================================================================

export const METODOLOGIA_PREDITIVA = {
  'Regressão Linear Múltipla': {
    code: 'pred_regressao_linear',
    category: 'preditiva',
    description: 'Identificação de preditores de variáveis contínuas com controle de múltiplas variáveis',
    applicableQuestionTypes: ['number', 'rating', 'likert'],
    hasAutomaticAnalysis: false,
  },
  'Regressão Logística': {
    code: 'pred_regressao_logistica',
    category: 'preditiva',
    description: 'Modelagem de variáveis binárias ou categóricas',
    applicableQuestionTypes: ['single', 'multiple', 'boolean'],
    hasAutomaticAnalysis: false,
  },
  'Árvores de Decisão': {
    code: 'pred_arvores_decisao',
    category: 'preditiva',
    description: 'Identificação dos fatores com maior poder explicativo',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Random Forest': {
    code: 'pred_random_forest',
    category: 'preditiva',
    description: 'Ensemble de árvores para predição robusta',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Gradient Boosting': {
    code: 'pred_gradient_boosting',
    category: 'preditiva',
    description: 'Modelos de alta performance (XGBoost / LightGBM)',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Ridge, Lasso e Elastic Net': {
    code: 'pred_regularizacao',
    category: 'preditiva',
    description: 'Regressões regularizadas para contextos com muitas variáveis',
    applicableQuestionTypes: ['number', 'rating', 'likert'],
    hasAutomaticAnalysis: false,
  },
  'Regressão Quantílica': {
    code: 'pred_regressao_quantilica',
    category: 'preditiva',
    description: 'Modelagem de relações em diferentes percentis da variável dependente',
    applicableQuestionTypes: ['number', 'rating', 'likert'],
    hasAutomaticAnalysis: false,
  },
  'SVM': {
    code: 'pred_svm',
    category: 'preditiva',
    description: 'Classificação baseada em vetores de suporte',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'KNN': {
    code: 'pred_knn',
    category: 'preditiva',
    description: 'Classificação por vizinhos mais próximos',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Naïve Bayes': {
    code: 'pred_naive_bayes',
    category: 'preditiva',
    description: 'Classificação probabilística com pressupostos de independência',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'AutoML': {
    code: 'pred_automl',
    category: 'preditiva',
    description: 'Pipeline automatizado de seleção de modelos',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análise Fatorial e Componentes Principais
// ============================================================================

export const METODOLOGIA_FATORIAL = {
  'PCA': {
    code: 'fact_pca',
    category: 'fatorial',
    description: 'Redução de dimensionalidade via Análise de Componentes Principais',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Análise Fatorial Exploratória': {
    code: 'fact_exploratory',
    category: 'fatorial',
    description: 'Agrupamento de itens em fatores latentes',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Análise de Correspondência': {
    code: 'fact_correspondencia',
    category: 'fatorial',
    description: 'Mapa perceptual em espaço bidimensional',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
  'Análise Fatorial Confirmatória': {
    code: 'fact_confirmatory',
    category: 'fatorial',
    description: 'Teste de modelo fatorial com índices de ajuste (CFI, RMSEA)',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Análise de Bifactor': {
    code: 'fact_bifactor',
    category: 'fatorial',
    description: 'Separação de fator geral de fatores específicos',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'EFA com Rotação Oblíqua': {
    code: 'fact_efa_obliqua',
    category: 'fatorial',
    description: 'Extração de fatores com correlação entre dimensões',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análises de Penalty (Impacto / Importância x Performance)
// ============================================================================

export const METODOLOGIA_PENALTY = {
  'Penalty de Atributos': {
    code: 'pen_penalty_atributos',
    category: 'penalty',
    description: 'Avaliação do quanto a ausência de um atributo penaliza a percepção geral',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Kano': {
    code: 'pen_kano',
    category: 'penalty',
    description: 'Classificação de atributos (básicos, lineares, atrativos, indiferentes)',
    applicableQuestionTypes: ['rating', 'likert', 'single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
  'Matriz Importância x Satisfação': {
    code: 'pen_matriz_importance_satisfaction',
    category: 'penalty',
    description: 'Quadrante de priorização para identificar gaps críticos',
    applicableQuestionTypes: ['rating', 'likert', 'single', 'multiple'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Gap': {
    code: 'pen_gap_analysis',
    category: 'penalty',
    description: 'Comparação entre expectativa e realidade',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
} as const;

// ============================================================================
// CATEGORY: Análises de Clusterização e Tipologias
// ============================================================================

export const METODOLOGIA_CLUSTER = {
  'K-means': {
    code: 'clust_kmeans',
    category: 'cluster',
    description: 'Agrupamento para criação de perfis de consumidores',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Clusterização Hierárquica': {
    code: 'clust_hierarchical',
    category: 'cluster',
    description: 'Agrupamento com dendrograma para exploração de estrutura',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'DBSCAN': {
    code: 'clust_dbscan',
    category: 'cluster',
    description: 'Clusterização por densidade com detecção de outliers',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Análise de Silhueta': {
    code: 'clust_silhueta',
    category: 'cluster',
    description: 'Métrica de validação da qualidade e coesão dos clusters',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: true,
  },
  'Bootstrap Clustering': {
    code: 'clust_bootstrap',
    category: 'cluster',
    description: 'Avaliação da reprodutibilidade e estabilidade dos segmentos',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análise de Texto (Text Mining e NLP)
// ============================================================================

export const METODOLOGIA_TEXT = {
  'Extração de Termos': {
    code: 'text_extracao_termos',
    category: 'text',
    description: 'Identificação de palavras-chave em respostas abertas',
    applicableQuestionTypes: ['text'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Sentimento': {
    code: 'text_sentimento',
    category: 'text',
    description: 'Classificação automática de tom emocional (positivo/neutro/negativo)',
    applicableQuestionTypes: ['text'],
    hasAutomaticAnalysis: true,
  },
  'Modelagem de Tópicos': {
    code: 'text_topic_modeling',
    category: 'text',
    description: 'Identificação automática de temas latentes (LDA / BERTopic)',
    applicableQuestionTypes: ['text'],
    hasAutomaticAnalysis: false,
  },
  'Named Entity Recognition': {
    code: 'text_ner',
    category: 'text',
    description: 'Extração de marcas, produtos, locais em respostas abertas',
    applicableQuestionTypes: ['text'],
    hasAutomaticAnalysis: false,
  },
  'Embeddings Semânticos': {
    code: 'text_embeddings',
    category: 'text',
    description: 'Análise semântica com Word2Vec / BERT',
    applicableQuestionTypes: ['text'],
    hasAutomaticAnalysis: false,
  },
  'Co-ocorrência de Termos': {
    code: 'text_coocurrence',
    category: 'text',
    description: 'Mapeamento de palavras que aparecem frequentemente juntas',
    applicableQuestionTypes: ['text'],
    hasAutomaticAnalysis: true,
  },
  'Categorização Automática': {
    code: 'text_categorization',
    category: 'text',
    description: 'Classificação de respostas em categorias predefinidas',
    applicableQuestionTypes: ['text'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análises de Intenção e Barreiras
// ============================================================================

export const METODOLOGIA_INTENCAO = {
  'Cruzamento Intenção x Atributos': {
    code: 'int_intencao_atributos',
    category: 'intencao',
    description: 'Identificação de drivers e barreiras à intenção',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Funil de Conversão': {
    code: 'int_conversion_funnel',
    category: 'intencao',
    description: 'Mapeamento de awareness → consideração → intenção → compra',
    applicableQuestionTypes: ['single', 'multiple', 'boolean'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Barreiras': {
    code: 'int_barrier_analysis',
    category: 'intencao',
    description: 'Categorização de barreiras (racionais, emocionais, situacionais)',
    applicableQuestionTypes: ['single', 'multiple', 'text'],
    hasAutomaticAnalysis: true,
  },
  'Job-to-be-Done': {
    code: 'int_jtbd',
    category: 'intencao',
    description: 'Análise quantitativa baseada em framework JTBD',
    applicableQuestionTypes: ['text', 'single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análise de Importância Relativa (Shapley Values)
// ============================================================================

export const METODOLOGIA_IMPORTANCIA = {
  'Shapley Values': {
    code: 'imp_shapley',
    category: 'importancia',
    description: 'Quantificação justa da contribuição de cada variável',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'SHAP': {
    code: 'imp_shap',
    category: 'importancia',
    description: 'Interpretação granular de modelos ML',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'LIME': {
    code: 'imp_lime',
    category: 'importancia',
    description: 'Técnica de interpretabilidade local para modelos complexos',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análise de Decisão Conjunta (Conjoint e Simulações)
// ============================================================================

export const METODOLOGIA_CONJOINT = {
  'Conjoint Simulation': {
    code: 'conj_simulation',
    category: 'conjoint',
    description: 'Simulação de combinações de atributos para configuração ideal',
    applicableQuestionTypes: ['cbc', 'conjoint'],
    hasAutomaticAnalysis: false,
  },
  'Choice-Based Conjoint': {
    code: 'conj_cbc',
    category: 'conjoint',
    description: 'Respondente escolhe entre perfis completos de produto',
    applicableQuestionTypes: ['cbc'],
    hasAutomaticAnalysis: true,
  },
  'Adaptive Conjoint': {
    code: 'conj_adaptive',
    category: 'conjoint',
    description: 'Versão adaptativa que personaliza estímulos',
    applicableQuestionTypes: ['cbc'],
    hasAutomaticAnalysis: false,
  },
  'Menu-Based Conjoint': {
    code: 'conj_menu_based',
    category: 'conjoint',
    description: 'Seleção de múltiplos itens de um menu',
    applicableQuestionTypes: ['cbc'],
    hasAutomaticAnalysis: false,
  },
  'Willingness to Pay': {
    code: 'conj_wtp',
    category: 'conjoint',
    description: 'Estimativa de disposição máxima a pagar por atributos',
    applicableQuestionTypes: ['cbc'],
    hasAutomaticAnalysis: true,
  },
} as const;

// ============================================================================
// CATEGORY: NPS Analytics
// ============================================================================

export const METODOLOGIA_NPS = {
  'NPS Aprofundado': {
    code: 'nps_deep_analysis',
    category: 'nps',
    description: 'Análise de drivers que diferenciam promotores de detratores',
    applicableQuestionTypes: ['nps', 'rating'],
    hasAutomaticAnalysis: true,
  },
  'NPS Transacional vs. Relacional': {
    code: 'nps_transactional',
    category: 'nps',
    description: 'Diferenciação entre NPS de interação e relacionamento geral',
    applicableQuestionTypes: ['nps', 'rating'],
    hasAutomaticAnalysis: true,
  },
  'Verbatim Mining': {
    code: 'nps_verbatim',
    category: 'nps',
    description: 'Text mining aplicado às justificativas de score',
    applicableQuestionTypes: ['nps', 'text'],
    hasAutomaticAnalysis: true,
  },
  'NPS por Segmento': {
    code: 'nps_segmentation',
    category: 'nps',
    description: 'Decomposição por perfil de cliente, região, canal',
    applicableQuestionTypes: ['nps', 'rating'],
    hasAutomaticAnalysis: true,
  },
} as const;

// ============================================================================
// CATEGORY: Análise de Sensibilidade de Preço
// ============================================================================

export const METODOLOGIA_PRECO = {
  'Price Sensitivity Meter': {
    code: 'price_psm',
    category: 'preco',
    description: 'Mapeamento de faixas de preço (Van Westendorp)',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
  'Newton-Miller-Smith': {
    code: 'price_nms',
    category: 'preco',
    description: 'Extensão do PSM com intenção de compra',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
  'Elasticidade-Preço': {
    code: 'price_elasticity',
    category: 'preco',
    description: 'Modelagem da sensibilidade da demanda a variações de preço',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
  'Gabor-Granger': {
    code: 'price_gabor_granger',
    category: 'preco',
    description: 'Técnica de escalonamento com apresentação sequencial de preços',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análise de Redes (Network Analysis)
// ============================================================================

export const METODOLOGIA_REDE = {
  'Mapeamento de Conexões': {
    code: 'net_mapping',
    category: 'rede',
    description: 'Estruturas relacionais entre atributos e marcas',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
  'Centralidade de Rede': {
    code: 'net_centrality',
    category: 'rede',
    description: 'Identificação de atributos mais influentes (Betweenness, Degree)',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
  'Detecção de Comunidades': {
    code: 'net_community_detection',
    category: 'rede',
    description: 'Identificação de clusters de atributos coesos',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análise de Sobrevivência (Survival Analysis)
// ============================================================================

export const METODOLOGIA_SOBREVIVENCIA = {
  'Modelagem de Churn': {
    code: 'surv_churn',
    category: 'sobrevivencia',
    description: 'Modelagem do tempo até abandono de marca',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
  'Kaplan-Meier': {
    code: 'surv_kaplan_meier',
    category: 'sobrevivencia',
    description: 'Estimativa não paramétrica da função de sobrevivência',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
  'Cox Proportional Hazards': {
    code: 'surv_cox',
    category: 'sobrevivencia',
    description: 'Regressão de sobrevivência com geração de scores de risco',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: MaxDiff (Maximum Difference Scaling)
// ============================================================================

export const METODOLOGIA_MAXDIFF = {
  'MaxDiff Clássico': {
    code: 'maxdiff_classic',
    category: 'maxdiff',
    description: 'Priorização baseada em escolhas best-worst',
    applicableQuestionTypes: ['maxdiff', 'max_diff'],
    hasAutomaticAnalysis: true,
  },
  'MaxDiff com Segmentação': {
    code: 'maxdiff_segmentation',
    category: 'maxdiff',
    description: 'Combinação com análise de classes latentes',
    applicableQuestionTypes: ['maxdiff', 'max_diff'],
    hasAutomaticAnalysis: false,
  },
  'Anchored MaxDiff': {
    code: 'maxdiff_anchored',
    category: 'maxdiff',
    description: 'Versão com escala de intensidade',
    applicableQuestionTypes: ['maxdiff', 'max_diff'],
    hasAutomaticAnalysis: true,
  },
} as const;

// ============================================================================
// CATEGORY: Análise de Mediação e Moderação
// ============================================================================

export const METODOLOGIA_MEDIACAO = {
  'Mediação Simples': {
    code: 'med_simple',
    category: 'mediacao',
    description: 'Identificação do mecanismo causal',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Mediação em Série': {
    code: 'med_serial',
    category: 'mediacao',
    description: 'Cadeias causais com múltiplos mediadores',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Moderação': {
    code: 'med_moderation',
    category: 'mediacao',
    description: 'Identificação das condições em que a relação vale',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Moderated Mediation': {
    code: 'med_moderated_mediation',
    category: 'mediacao',
    description: 'Combinação de mediação e moderação',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Floodlight Analysis': {
    code: 'med_floodlight',
    category: 'mediacao',
    description: 'Identificação de pontos exatos onde o efeito muda',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Modelagem de Equações Estruturais (SEM)
// ============================================================================

export const METODOLOGIA_SEM = {
  'SEM Clássico': {
    code: 'sem_classic',
    category: 'sem',
    description: 'Teste simultâneo de relações causais (LISREL / AMOS)',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'PLS-SEM': {
    code: 'sem_pls',
    category: 'sem',
    description: 'Partial Least Squares SEM para amostras menores',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'SEM Multigrupo': {
    code: 'sem_multigroup',
    category: 'sem',
    description: 'Teste de invariância e comparação entre grupos',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'SEM com Dados de Painel': {
    code: 'sem_panel',
    category: 'sem',
    description: 'Extensão para estruturas longitudinais',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análises Estatísticas Avançadas
// ============================================================================

export const METODOLOGIA_AVANCADA = {
  'Análise Discriminante': {
    code: 'adv_discriminant',
    category: 'avancada',
    description: 'Classificação de respondentes em grupos predefinidos',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Escalonamento Multidimensional': {
    code: 'adv_mds',
    category: 'avancada',
    description: 'Representação visual de similaridade entre marcas',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
  'Análise de Séries Temporais': {
    code: 'adv_timeseries',
    category: 'avancada',
    description: 'Modelagem de tendências e sazonalidades (ARIMA / SARIMA)',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
  'MANOVA': {
    code: 'adv_manova',
    category: 'avancada',
    description: 'Comparação de múltiplas variáveis dependentes',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'GEE': {
    code: 'adv_gee',
    category: 'avancada',
    description: 'Modelagem de dados longitudinais',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Kappa de Cohen': {
    code: 'adv_cohen_kappa',
    category: 'avancada',
    description: 'Medida de concordância entre avaliadores',
    applicableQuestionTypes: ['single', 'multiple', 'boolean'],
    hasAutomaticAnalysis: true,
  },
  'Simulação Monte Carlo': {
    code: 'adv_monte_carlo',
    category: 'avancada',
    description: 'Geração de cenários para estimativa de incerteza',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
  'Análise Bayesiana': {
    code: 'adv_bayesian',
    category: 'avancada',
    description: 'Estimação com incorporação de conhecimento prévio',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Logit / Probit Multinomial': {
    code: 'adv_logit_probit',
    category: 'avancada',
    description: 'Modelagem de escolha entre múltiplas alternativas',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
  'Alpha de Cronbach': {
    code: 'adv_cronbach',
    category: 'avancada',
    description: 'Medida de consistência interna de escalas',
    applicableQuestionTypes: ['rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'IRT': {
    code: 'adv_irt',
    category: 'avancada',
    description: 'Teoria de Resposta ao Item',
    applicableQuestionTypes: ['rating', 'likert'],
    hasAutomaticAnalysis: false,
  },
  'Análise de Classes Latentes': {
    code: 'adv_lca',
    category: 'avancada',
    description: 'Identificação de subgrupos ocultos sem definição prévia',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert'],
    hasAutomaticAnalysis: false,
  },
  'Modelos de Mistura Gaussiana': {
    code: 'adv_gmm',
    category: 'avancada',
    description: 'Clusterização probabilística',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Regressão de Poisson': {
    code: 'adv_poisson',
    category: 'avancada',
    description: 'Modelos para variáveis de contagem',
    applicableQuestionTypes: ['number'],
    hasAutomaticAnalysis: false,
  },
  'ICA': {
    code: 'adv_ica',
    category: 'avancada',
    description: 'Análise de Componentes Independentes',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
  'Bootstrap e Reamostragem': {
    code: 'adv_bootstrap',
    category: 'avancada',
    description: 'Testes quando premissas paramétricas não são atendidas',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Análise de Sensibilidade': {
    code: 'adv_sensitivity',
    category: 'avancada',
    description: 'Simulação de cenários What-If',
    applicableQuestionTypes: ['number', 'rating', 'likert'],
    hasAutomaticAnalysis: false,
  },
  'Modelos Hierárquicos': {
    code: 'adv_hlm',
    category: 'avancada',
    description: 'Modelagem de dados com estrutura aninhada',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'ROC e AUC': {
    code: 'adv_roc_auc',
    category: 'avancada',
    description: 'Avaliação de capacidade discriminante de modelos',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análises de Propensão e Causalidade
// ============================================================================

export const METODOLOGIA_CAUSALIDADE = {
  'Propensity Score Matching': {
    code: 'caus_psm',
    category: 'causalidade',
    description: 'Estimativa de probabilidade de adoção para controlar viés de seleção',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Difference-in-Differences': {
    code: 'caus_did',
    category: 'causalidade',
    description: 'Estimação de efeitos causais comparando grupo exposto vs. controle',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Regressão Descontínua': {
    code: 'caus_rdd',
    category: 'causalidade',
    description: 'Identificação de efeitos causais em torno de um limiar',
    applicableQuestionTypes: ['number', 'rating'],
    hasAutomaticAnalysis: false,
  },
  'Variáveis Instrumentais': {
    code: 'caus_iv',
    category: 'causalidade',
    description: 'Estimação com variáveis endógenas utilizando instrumentos',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
  'Contrafactual Analysis': {
    code: 'caus_counterfactual',
    category: 'causalidade',
    description: 'Framework formal para inferência causal',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análises de Experiência e Jornada do Consumidor
// ============================================================================

export const METODOLOGIA_EXPERIENCIA = {
  'Customer Effort Score': {
    code: 'exp_ces',
    category: 'experiencia',
    description: 'Análise do esforço percebido em cada ponto de contato',
    applicableQuestionTypes: ['rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Customer Satisfaction Score': {
    code: 'exp_csat',
    category: 'experiencia',
    description: 'Análise granular do CSAT por etapa e canal',
    applicableQuestionTypes: ['rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Momentos da Verdade': {
    code: 'exp_moments_of_truth',
    category: 'experiencia',
    description: 'Mapeamento de pontos de impacto emocional crítico',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Journey Mapping Quantitativo': {
    code: 'exp_journey_mapping',
    category: 'experiencia',
    description: 'Construção de mapas de jornada baseados em dados',
    applicableQuestionTypes: ['rating', 'likert', 'single', 'multiple'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Ponto de Inflexão': {
    code: 'exp_inflection_point',
    category: 'experiencia',
    description: 'Identificação de momentos críticos de perda ou ganho',
    applicableQuestionTypes: ['rating', 'likert', 'number'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análises de Marca e Comunicação
// ============================================================================

export const METODOLOGIA_MARCA = {
  'Brand Equity Tracking': {
    code: 'brand_equity',
    category: 'marca',
    description: 'Mensuração longitudinal de pilares de brand equity',
    applicableQuestionTypes: ['rating', 'likert', 'single', 'multiple'],
    hasAutomaticAnalysis: true,
  },
  'Brand Personality Mapping': {
    code: 'brand_personality',
    category: 'marca',
    description: 'Mensuração de dimensões de personalidade atribuídas a marcas',
    applicableQuestionTypes: ['rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Brand Funnel Analytics': {
    code: 'brand_funnel',
    category: 'marca',
    description: 'Análise de conversão ao longo do funil de brand',
    applicableQuestionTypes: ['single', 'multiple', 'boolean'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Atribuição': {
    code: 'brand_attribution',
    category: 'marca',
    description: 'Mensuração da contribuição de cada canal de comunicação',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert'],
    hasAutomaticAnalysis: false,
  },
  'Self-Congruity': {
    code: 'brand_self_congruity',
    category: 'marca',
    description: 'Correspondência entre imagem da marca e autoimagem do consumidor',
    applicableQuestionTypes: ['rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Copy Testing': {
    code: 'brand_copy_testing',
    category: 'marca',
    description: 'Análise estruturada de peças criativas',
    applicableQuestionTypes: ['rating', 'likert', 'text'],
    hasAutomaticAnalysis: true,
  },
} as const;

// ============================================================================
// CATEGORY: Análises de Mercado e Competição
// ============================================================================

export const METODOLOGIA_MERCADO = {
  'Share of Preference': {
    code: 'market_share_of_preference',
    category: 'mercado',
    description: 'Estimativa de participação de mercado potencial',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Switching': {
    code: 'market_switching',
    category: 'mercado',
    description: 'Modelagem de probabilidade de migração entre marcas',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: true,
  },
  'Rivalidade Perceptual': {
    code: 'market_perceptual_rivalry',
    category: 'mercado',
    description: 'Mapeamento de marcas percebidas como próximas ou distantes',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: true,
  },
  'White Space Analysis': {
    code: 'market_white_space',
    category: 'mercado',
    description: 'Identificação de brechas de mercado ainda não exploradas',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Análise de Concentração': {
    code: 'market_concentration',
    category: 'mercado',
    description: 'Mensuração do grau de concentração do mercado (HHI)',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// CATEGORY: Análises Comportamentais e Experimentais
// ============================================================================

export const METODOLOGIA_COMPORTAMENTAL = {
  'A/B Testing': {
    code: 'behav_ab_testing',
    category: 'comportamental',
    description: 'Design e análise de experimentos controlados',
    applicableQuestionTypes: ['rating', 'likert', 'single', 'multiple'],
    hasAutomaticAnalysis: true,
  },
  'Multi-Armed Bandit': {
    code: 'behav_bandit',
    category: 'comportamental',
    description: 'Otimização dinâmica em experimentos contínuos',
    applicableQuestionTypes: ['rating', 'likert'],
    hasAutomaticAnalysis: false,
  },
  'Preferência Revelada vs. Declarada': {
    code: 'behav_revealed_vs_stated',
    category: 'comportamental',
    description: 'Comparação entre o que o consumidor diz e o que faz',
    applicableQuestionTypes: ['single', 'multiple', 'rating', 'likert'],
    hasAutomaticAnalysis: true,
  },
  'Behavioral Economics': {
    code: 'behav_behavioral_econ',
    category: 'comportamental',
    description: 'Análise de heurísticas e vieses cognitivos',
    applicableQuestionTypes: ['rating', 'likert', 'text'],
    hasAutomaticAnalysis: false,
  },
  'Eye Tracking': {
    code: 'behav_eye_tracking',
    category: 'comportamental',
    description: 'Análise quantitativa de rastreamento ocular',
    applicableQuestionTypes: ['image_choice'],
    hasAutomaticAnalysis: false,
  },
  'Reaction Time Analysis': {
    code: 'behav_reaction_time',
    category: 'comportamental',
    description: 'Mensuração de latência em tarefas de associação implícita',
    applicableQuestionTypes: ['single', 'multiple'],
    hasAutomaticAnalysis: false,
  },
} as const;

// ============================================================================
// AGGREGATED METHODOLOGIES
// ============================================================================

export const ALL_METHODOLOGIES = {
  ...METODOLOGIA_DESCRITIVA,
  ...METODOLOGIA_COMPARATIVA,
  ...METODOLOGIA_PREDITIVA,
  ...METODOLOGIA_FATORIAL,
  ...METODOLOGIA_PENALTY,
  ...METODOLOGIA_CLUSTER,
  ...METODOLOGIA_TEXT,
  ...METODOLOGIA_INTENCAO,
  ...METODOLOGIA_IMPORTANCIA,
  ...METODOLOGIA_CONJOINT,
  ...METODOLOGIA_NPS,
  ...METODOLOGIA_PRECO,
  ...METODOLOGIA_REDE,
  ...METODOLOGIA_SOBREVIVENCIA,
  ...METODOLOGIA_MAXDIFF,
  ...METODOLOGIA_MEDIACAO,
  ...METODOLOGIA_SEM,
  ...METODOLOGIA_AVANCADA,
  ...METODOLOGIA_CAUSALIDADE,
  ...METODOLOGIA_EXPERIENCIA,
  ...METODOLOGIA_MARCA,
  ...METODOLOGIA_MERCADO,
  ...METODOLOGIA_COMPORTAMENTAL,
} as const;

// ============================================================================
// CATEGORY LABELS
// ============================================================================

export const CATEGORY_LABELS: Record<string, string> = {
  descritiva: 'Análises Descritivas e de Perfil',
  comparativa: 'Análises Comparativas',
  preditiva: 'Análises Explicativas e Preditivas',
  fatorial: 'Análise Fatorial e Componentes Principais',
  penalty: 'Análises de Penalty',
  cluster: 'Análises de Clusterização',
  text: 'Análise de Texto',
  intencao: 'Análises de Intenção e Barreiras',
  importancia: 'Análise de Importância Relativa',
  conjoint: 'Análise de Decisão Conjunta',
  nps: 'NPS Analytics',
  preco: 'Análise de Sensibilidade de Preço',
  rede: 'Análise de Redes',
  sobrevivencia: 'Análise de Sobrevivência',
  maxdiff: 'MaxDiff',
  mediacao: 'Análise de Mediação e Moderação',
  sem: 'Modelagem de Equações Estruturais',
  avancada: 'Análises Estatísticas Avançadas',
  causalidade: 'Análises de Propensão e Causalidade',
  experiencia: 'Análises de Experiência e Jornada',
  marca: 'Análises de Marca e Comunicação',
  mercado: 'Análises de Mercado e Competição',
  comportamental: 'Análises Comportamentais e Experimentais',
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MethodologyKey = keyof typeof ALL_METHODOLOGIES;
export type CategoryType = keyof typeof CATEGORY_LABELS;

export interface MethodologyInfo {
  code: string;
  category: CategoryType;
  description: string;
  applicableQuestionTypes: string[];
  hasAutomaticAnalysis: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all applicable methodologies for a given question type
 */
export function getApplicableMethodologies(questionType: string): MethodologyInfo[] {
  return Object.values(ALL_METHODOLOGIES).filter(m =>
    m.applicableQuestionTypes.includes(questionType)
  ) as MethodologyInfo[];
}

/**
 * Get methodologies by category
 */
export function getMethodologiesByCategory(category: CategoryType): MethodologyInfo[] {
  return Object.values(ALL_METHODOLOGIES).filter(m =>
    m.category === category
  ) as MethodologyInfo[];
}

/**
 * Get methodology info by key
 */
export function getMethodologyInfo(key: MethodologyKey): MethodologyInfo {
  return ALL_METHODOLOGIES[key] as MethodologyInfo;
}

/**
 * Get all categories
 */
export function getAllCategories(): CategoryType[] {
  return Object.keys(CATEGORY_LABELS) as CategoryType[];
}
