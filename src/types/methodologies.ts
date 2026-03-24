export type CategoryType =
  | 'descritiva'
  | 'comparativa'
  | 'preditiva'
  | 'fatorial'
  | 'penalty'
  | 'cluster'
  | 'text'
  | 'intencao'
  | 'importancia'
  | 'conjoint'
  | 'nps'
  | 'preco'
  | 'rede'
  | 'sobrevivencia'
  | 'maxdiff'
  | 'mediacao'
  | 'sem'
  | 'avancada'
  | 'causalidade'
  | 'experiencia'
  | 'marca'
  | 'mercado'
  | 'comportamental'
  | 'validacao';

export interface MethodologyInfo {
  code: string;
  category: CategoryType;
  description: string;
  applicableQuestionTypes: string[];
  hasAutomaticAnalysis: boolean;
}

const createMethodology = (
  code: string,
  category: CategoryType,
  description: string,
  applicableQuestionTypes: string[],
  hasAutomaticAnalysis = false
) => ({
  code,
  category,
  description,
  applicableQuestionTypes,
  hasAutomaticAnalysis,
}) as const;

export const METODOLOGIA_DESCRITIVA = {
  'Distribuição Percentual e Média': createMethodology(
    'desc_distribuicao_percentual_media',
    'descritiva',
    'Análise de frequências, médias, medianas e dispersões para descrever o perfil da amostra e os padrões de resposta.',
    ['single', 'multiple', 'rating', 'likert', 'number'],
    true
  ),
  'Cruzamento de Perfil entre Variáveis de Segmentação e Comportamento': createMethodology(
    'desc_cruzamento_perfil_segmentacao_comportamento',
    'descritiva',
    'Tabelas de contingência entre variáveis categóricas para revelar diferenças de comportamento por perfil demográfico ou psicográfico.',
    ['single', 'multiple', 'boolean'],
    true
  ),
  'Segmentação por Cluster / K-means': createMethodology(
    'desc_segmentacao_cluster_kmeans',
    'descritiva',
    'Agrupamento de respondentes em segmentos homogêneos internamente e heterogêneos entre si.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Análise de Quintis e Percentis': createMethodology(
    'desc_quintis_percentis',
    'descritiva',
    'Estratificação da amostra em faixas de distribuição para identificar grupos extremos e padrões ao longo da curva de resposta.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Análise de Outliers e Dados Atípicos': createMethodology(
    'desc_outliers_dados_atipicos',
    'descritiva',
    'Identificação e tratamento de observações extremas por boxplot, Z-score e distância de Mahalanobis.',
    ['number', 'rating', 'likert'],
    true
  ),
  'Análise de Assimetria e Curtose': createMethodology(
    'desc_assimetria_curtose',
    'descritiva',
    'Avaliação da forma das distribuições para identificar efeito teto, piso e outros vieses de escala.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Análise de Padrão de Não-Resposta (Missing Data Analysis)': createMethodology(
    'desc_missing_data_analysis',
    'descritiva',
    'Diagnóstico de padrões de dados ausentes (MCAR, MAR, MNAR) e suporte à imputação.',
    ['single', 'multiple', 'rating', 'likert', 'text', 'number'],
    true
  ),
  'Análise de Viés de Resposta e Aquiescência': createMethodology(
    'desc_vies_resposta_aquiescencia',
    'descritiva',
    'Identificação de respondentes com padrão extremo, concordância sistemática ou baixa qualidade de resposta.',
    ['single', 'multiple', 'rating', 'likert', 'boolean'],
    true
  ),
} as const;

export const METODOLOGIA_COMPARATIVA = {
  'Teste Qui-Quadrado': createMethodology(
    'comp_teste_qui_quadrado',
    'comparativa',
    'Teste não paramétrico para comparar distribuições categóricas entre grupos independentes.',
    ['single', 'multiple', 'boolean'],
    true
  ),
  'T-test': createMethodology(
    'comp_t_test',
    'comparativa',
    'Teste paramétrico para comparar médias entre dois grupos.',
    ['rating', 'likert', 'number'],
    true
  ),
  ANOVA: createMethodology(
    'comp_anova',
    'comparativa',
    'Teste para comparar médias entre três ou mais grupos.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Testes Post-Hoc (Newman-Keuls / Tukey HSD)': createMethodology(
    'comp_testes_post_hoc',
    'comparativa',
    'Identificação dos pares de subgrupos que diferem significativamente após ANOVA, controlando erro tipo I.',
    ['rating', 'likert', 'number']
  ),
  'Comparações entre Grupos de Usuários e Não Usuários': createMethodology(
    'comp_usuarios_vs_nao_usuarios',
    'comparativa',
    'Análise diferencial entre grupos de relacionamento com a marca ou categoria para mapear gaps de percepção e comportamento.',
    ['single', 'multiple', 'boolean', 'rating', 'likert'],
    true
  ),
  'Mann-Whitney': createMethodology(
    'comp_mann_whitney',
    'comparativa',
    'Alternativa não paramétrica ao T-test quando a normalidade não é atendida.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Kruskal-Wallis': createMethodology(
    'comp_kruskal_wallis',
    'comparativa',
    'Alternativa não paramétrica à ANOVA para múltiplos grupos.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Análise de Equivalência (Equivalence Testing / TOST)': createMethodology(
    'comp_equivalence_tost',
    'comparativa',
    'Teste se dois grupos são suficientemente similares dentro de uma margem prática predefinida.',
    ['rating', 'likert', 'number']
  ),
  "Análise de Efeito Prático (Effect Size: Cohen's d, eta²)": createMethodology(
    'comp_effect_size',
    'comparativa',
    'Mensuração da magnitude prática das diferenças entre grupos, além da significância estatística.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Teste de Proporções (Z-test para Proporções)': createMethodology(
    'comp_z_test_proporcoes',
    'comparativa',
    'Comparação de frequências percentuais entre grupos independentes.',
    ['single', 'multiple', 'boolean'],
    true
  ),
  'Análise de Variação Temporal (Comparação de Ondas)': createMethodology(
    'comp_variacao_temporal_ondas',
    'comparativa',
    'Comparação de indicadores entre diferentes momentos de coleta para tracking e séries de onda.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_PREDITIVA = {
  'Regressão Linear Múltipla': createMethodology(
    'pred_regressao_linear_multipla',
    'preditiva',
    'Modelagem de preditores de variáveis contínuas com controle simultâneo de múltiplas variáveis.',
    ['number', 'rating', 'likert']
  ),
  'Regressão Logística': createMethodology(
    'pred_regressao_logistica',
    'preditiva',
    'Modelagem de variáveis binárias ou categóricas, como intenção de compra e adoção.',
    ['single', 'multiple', 'boolean']
  ),
  'Árvores de Decisão': createMethodology(
    'pred_arvores_decisao',
    'preditiva',
    'Modelos visuais para identificar a hierarquia de decisão e fatores com maior poder explicativo.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Random Forest': createMethodology(
    'pred_random_forest',
    'preditiva',
    'Ensemble de árvores para predição robusta e captura de interações complexas.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Gradient Boosting (XGBoost / LightGBM)': createMethodology(
    'pred_gradient_boosting',
    'preditiva',
    'Modelos sequenciais de alta performance para relações não lineares e alta dimensionalidade.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Regressão Ridge, Lasso e Elastic Net': createMethodology(
    'pred_ridge_lasso_elastic_net',
    'preditiva',
    'Regressões regularizadas para reduzir colinearidade, penalizar coeficientes irrelevantes e selecionar drivers.',
    ['number', 'rating', 'likert']
  ),
  'Regressão Quantílica': createMethodology(
    'pred_regressao_quantilica',
    'preditiva',
    'Modelagem dos efeitos dos preditores em diferentes percentis da variável dependente.',
    ['number', 'rating', 'likert']
  ),
  SVM: createMethodology(
    'pred_svm',
    'preditiva',
    'Algoritmo supervisionado para classificação e segmentação com margens máximas.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  KNN: createMethodology(
    'pred_knn',
    'preditiva',
    'Classificação por vizinhos mais próximos com base em similaridade entre respondentes.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Naïve Bayes': createMethodology(
    'pred_naive_bayes',
    'preditiva',
    'Classificação probabilística baseada em independência condicional entre atributos.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'AutoML e Seleção Automática de Modelos': createMethodology(
    'pred_automl',
    'preditiva',
    'Pipeline automatizado de treinamento, validação e comparação sistemática de modelos.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_FATORIAL = {
  PCA: createMethodology(
    'fact_pca',
    'fatorial',
    'Redução de dimensionalidade via análise de componentes principais.',
    ['rating', 'likert', 'number']
  ),
  'Análise Fatorial Exploratória': createMethodology(
    'fact_analise_fatorial_exploratoria',
    'fatorial',
    'Agrupamento de itens em fatores latentes para simplificar baterias extensas de atributos.',
    ['rating', 'likert', 'number']
  ),
  'Análise de Correspondência': createMethodology(
    'fact_analise_correspondencia',
    'fatorial',
    'Mapa perceptual que associa atributos e perfis em um espaço bidimensional.',
    ['single', 'multiple']
  ),
  'Análise Fatorial Confirmatória (CFA)': createMethodology(
    'fact_confirmatory_factor_analysis',
    'fatorial',
    'Teste de estrutura fatorial teórica com avaliação de índices de ajuste como CFI, RMSEA e SRMR.',
    ['rating', 'likert', 'number']
  ),
  'Análise de Bifactor': createMethodology(
    'fact_bifactor',
    'fatorial',
    'Separação entre fator geral e fatores específicos em construtos multidimensionais.',
    ['rating', 'likert', 'number']
  ),
  'Análise Fatorial Exploratória com Rotação Oblíqua (Promax / Oblimin)': createMethodology(
    'fact_rotacao_obliqua',
    'fatorial',
    'Extração de fatores permitindo correlação entre dimensões latentes para estruturas mais realistas.',
    ['rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_PENALTY = {
  'Penalty de Atributos': createMethodology(
    'pen_penalty_atributos',
    'penalty',
    'Avalia o quanto a ausência de um atributo penaliza a percepção geral.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Análise de Kano': createMethodology(
    'pen_kano',
    'penalty',
    'Classificação funcional de atributos em básicos, lineares, atrativos e indiferentes.',
    ['rating', 'likert', 'single', 'multiple']
  ),
  'Matriz de Prioridade (Importância x Satisfação)': createMethodology(
    'pen_matriz_prioridade',
    'penalty',
    'Quadrante de priorização cruzando importância declarada e avaliação de performance.',
    ['rating', 'likert', 'single', 'multiple'],
    true
  ),
  'Análise de Gap (Expectativa x Realidade)': createMethodology(
    'pen_gap_expectativa_realidade',
    'penalty',
    'Comparação entre o que o consumidor espera e o que efetivamente percebe.',
    ['rating', 'likert', 'number'],
    true
  ),
} as const;

export const METODOLOGIA_CLUSTER = {
  'K-means': createMethodology(
    'clust_kmeans',
    'cluster',
    'Algoritmo de agrupamento para criação de perfis de consumidores com base em percepção e comportamento.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Clusterização Hierárquica': createMethodology(
    'clust_hierarquica',
    'cluster',
    'Agrupamento com visão de dendrograma para explorar a estrutura de segmentos.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Clusterização por DBSCAN': createMethodology(
    'clust_dbscan',
    'cluster',
    'Clusterização por densidade para identificar grupos irregulares e detectar outliers.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Análise de Silhueta': createMethodology(
    'clust_silhueta',
    'cluster',
    'Métrica de validação da coesão e separação dos clusters formados.',
    ['single', 'multiple', 'rating', 'likert', 'number'],
    true
  ),
  'Índice de Davies-Bouldin': createMethodology(
    'clust_davies_bouldin',
    'cluster',
    'Métrica de validação para comparar qualidade, compactação e separação entre clusters.',
    ['single', 'multiple', 'rating', 'likert', 'number'],
    true
  ),
  'Análise de Estabilidade de Clusters (Bootstrap Clustering)': createMethodology(
    'clust_bootstrap_stability',
    'cluster',
    'Avaliação da reprodutibilidade dos segmentos por reamostragem.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_TEXT = {
  'Extração e Categorização de Termos': createMethodology(
    'text_extracao_categorizacao_termos',
    'text',
    'Identificação de termos, expressões recorrentes e categorias analíticas em respostas abertas.',
    ['text'],
    true
  ),
  'Análise de Sentimento (Sentiment Analysis)': createMethodology(
    'text_sentiment_analysis',
    'text',
    'Classificação do tom emocional das respostas em positivo, neutro ou negativo, com gradação de intensidade.',
    ['text'],
    true
  ),
  'Modelagem de Tópicos (LDA / BERTopic)': createMethodology(
    'text_topic_modeling',
    'text',
    'Identificação automática de temas latentes em grandes volumes de respostas abertas.',
    ['text']
  ),
  'Named Entity Recognition (NER)': createMethodology(
    'text_named_entity_recognition',
    'text',
    'Extração automática de marcas, produtos, locais e pessoas mencionados nas respostas.',
    ['text']
  ),
  'Análise Semântica com Embeddings (Word2Vec / BERT)': createMethodology(
    'text_embeddings_semanticos',
    'text',
    'Representação vetorial de palavras e frases para capturar similaridade semântica entre conceitos.',
    ['text']
  ),
  'Análise de Co-ocorrência de Termos': createMethodology(
    'text_coocorrencia_termos',
    'text',
    'Mapeamento de palavras e conceitos que aparecem juntos com maior frequência.',
    ['text'],
    true
  ),
  'Categorização Automática por Regras e ML': createMethodology(
    'text_categorizacao_regras_ml',
    'text',
    'Classificação de respostas abertas em categorias predefinidas por regras ou modelos supervisionados.',
    ['text']
  ),
} as const;

export const METODOLOGIA_INTENCAO = {
  'Cruzamento de Intenção de Compra com Atributos': createMethodology(
    'int_intencao_compra_atributos',
    'intencao',
    'Identificação de drivers e barreiras à intenção declarada por cruzamento com atributos avaliados.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Análise de Funil de Conversão Declarada': createMethodology(
    'int_funil_conversao_declarada',
    'intencao',
    'Mapeamento das etapas de awareness, consideração, intenção e compra para detectar abandonos.',
    ['single', 'multiple', 'boolean'],
    true
  ),
  'Análise de Barreiras por Tipo (Racionais, Emocionais, Situacionais)': createMethodology(
    'int_barreiras_por_tipo',
    'intencao',
    'Categorização e quantificação das barreiras à adoção por natureza funcional, emocional ou situacional.',
    ['single', 'multiple', 'text'],
    true
  ),
  'Job-to-be-Done Analytics': createMethodology(
    'int_jtbd_analytics',
    'intencao',
    'Aplicação quantitativa do framework JTBD para identificar trabalhos funcionais, emocionais e sociais.',
    ['text', 'single', 'multiple']
  ),
} as const;

export const METODOLOGIA_IMPORTANCIA = {
  'Shapley Values e Relative Importance Analysis': createMethodology(
    'imp_shapley_relative_importance',
    'importancia',
    'Quantificação da contribuição relativa de cada variável preditora sobre a variável dependente.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'SHAP (SHapley Additive exPlanations)': createMethodology(
    'imp_shap',
    'importancia',
    'Interpretação global e individual de modelos de machine learning por valores SHAP.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'LIME (Local Interpretable Model-agnostic Explanations)': createMethodology(
    'imp_lime',
    'importancia',
    'Explicação local do comportamento de modelos complexos por aproximações mais simples.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_CONJOINT = {
  'Conjoint Simulation': createMethodology(
    'conj_simulation',
    'conjoint',
    'Simulação de combinações de atributos para identificar a configuração ideal de produto, serviço ou oferta.',
    ['cbc']
  ),
  'Choice-Based Conjoint (CBC)': createMethodology(
    'conj_cbc',
    'conjoint',
    'Escolha entre perfis completos de produto, simulando decisões de compra mais realistas.',
    ['cbc'],
    true
  ),
  'Adaptive Conjoint Analysis (ACA)': createMethodology(
    'conj_aca',
    'conjoint',
    'Versão adaptativa do conjoint que personaliza os estímulos com base nas respostas anteriores.',
    ['cbc']
  ),
  'Menu-Based Conjoint (MBC)': createMethodology(
    'conj_mbc',
    'conjoint',
    'Modelagem de escolhas em formato de menu, permitindo múltiplos itens e composições de pacote.',
    ['cbc']
  ),
  'Willingness to Pay (WTP) via Conjoint': createMethodology(
    'conj_wtp',
    'conjoint',
    'Estimativa da disposição máxima a pagar por atributos específicos a partir das utilidades conjoint.',
    ['cbc'],
    true
  ),
} as const;

export const METODOLOGIA_NPS = {
  'NPS Aprofundado com Drivers': createMethodology(
    'nps_aprofundado_drivers',
    'nps',
    'Análise dos drivers que diferenciam promotores, passivos e detratores.',
    ['nps', 'rating'],
    true
  ),
  'NPS Transacional vs. Relacional': createMethodology(
    'nps_transacional_relacional',
    'nps',
    'Comparação entre NPS medido após interação específica e NPS de relacionamento geral.',
    ['nps', 'rating'],
    true
  ),
  'Análise de Verbatim de Promotores e Detratores': createMethodology(
    'nps_verbatim_promotores_detratores',
    'nps',
    'Text mining aplicado às justificativas de score para extrair temas que motivam recomendação ou detração.',
    ['nps', 'text'],
    true
  ),
  'NPS por Segmento e Jornada': createMethodology(
    'nps_segmento_jornada',
    'nps',
    'Decomposição do NPS por perfil, região, canal e etapa da jornada.',
    ['nps', 'rating'],
    true
  ),
} as const;

export const METODOLOGIA_PRECO = {
  'Price Sensitivity Meter (Van Westendorp)': createMethodology(
    'price_psm_van_westendorp',
    'preco',
    'Mapeamento das faixas de preço aceitável, caro demais e barato demais na percepção do consumidor.',
    ['number', 'rating']
  ),
  'Newton-Miller-Smith Extension (NMS)': createMethodology(
    'price_nms',
    'preco',
    'Extensão do PSM que adiciona intenção de compra às curvas de preço.',
    ['number', 'rating']
  ),
  'Análise de Elasticidade-Preço da Demanda': createMethodology(
    'price_elasticidade_demanda',
    'preco',
    'Modelagem da sensibilidade da intenção de compra a variações de preço.',
    ['number', 'rating']
  ),
  'Gabor-Granger Pricing': createMethodology(
    'price_gabor_granger',
    'preco',
    'Escalonamento sequencial de preços para gerar curva de demanda declarada.',
    ['number', 'rating']
  ),
} as const;

export const METODOLOGIA_REDE = {
  'Mapeamento de Conexões entre Atributos e Marcas': createMethodology(
    'net_mapping_atributos_marcas',
    'rede',
    'Mapeamento de estruturas relacionais entre atributos, marcas e associações mentais do consumidor.',
    ['single', 'multiple']
  ),
  'Análise de Centralidade de Rede (Betweenness, Degree, Eigenvector)': createMethodology(
    'net_centralidade',
    'rede',
    'Identificação dos atributos ou conceitos mais influentes na rede de percepções.',
    ['single', 'multiple']
  ),
  'Detecção de Comunidades em Redes de Percepção': createMethodology(
    'net_comunidades_percepcao',
    'rede',
    'Identificação de clusters de atributos que formam dimensões coesas na mente do consumidor.',
    ['single', 'multiple']
  ),
} as const;

export const METODOLOGIA_SOBREVIVENCIA = {
  'Modelagem de Tempo até Abandono / Churn': createMethodology(
    'surv_tempo_abandono_churn',
    'sobrevivencia',
    'Modelagem do tempo até a ocorrência de abandono de marca ou descontinuidade de uso.',
    ['number', 'rating']
  ),
  'Curvas de Kaplan-Meier': createMethodology(
    'surv_kaplan_meier',
    'sobrevivencia',
    'Estimativa não paramétrica da função de sobrevivência ao longo do tempo.',
    ['number', 'rating']
  ),
  'Modelo de Cox (Cox Proportional Hazards)': createMethodology(
    'surv_cox_proportional_hazards',
    'sobrevivencia',
    'Regressão de sobrevivência para identificar variáveis que aumentam ou reduzem o risco de churn.',
    ['number', 'rating']
  ),
} as const;

export const METODOLOGIA_MAXDIFF = {
  'MaxDiff Clássico': createMethodology(
    'maxdiff_classico',
    'maxdiff',
    'Priorização de atributos baseada em escolhas best-worst.',
    ['maxdiff'],
    true
  ),
  'MaxDiff com Segmentação Latente': createMethodology(
    'maxdiff_segmentacao_latente',
    'maxdiff',
    'Combinação de MaxDiff com classes latentes para identificar hierarquias de preferência distintas.',
    ['maxdiff']
  ),
  'Anchored MaxDiff': createMethodology(
    'maxdiff_anchored',
    'maxdiff',
    'Versão ancorada do MaxDiff com escala adicional de intensidade.',
    ['maxdiff'],
    true
  ),
} as const;

export const METODOLOGIA_MEDIACAO = {
  'Mediação e Moderação': createMethodology(
    'med_mediacao_moderacao',
    'mediacao',
    'Testa mecanismos causais, condições de efeito e diferenças entre segmentos ou contextos.',
    ['rating', 'likert', 'number']
  ),
  'Mediação em Série (Serial Mediation)': createMethodology(
    'med_serial_mediation',
    'mediacao',
    'Extensão da mediação simples para cadeias causais com múltiplos mediadores sequenciais.',
    ['rating', 'likert', 'number']
  ),
  'Análise de Efeito Indireto Condicional (Moderated Mediation)': createMethodology(
    'med_moderated_mediation',
    'mediacao',
    'Teste se o mecanismo causal opera de forma diferente para distintos segmentos ou contextos.',
    ['rating', 'likert', 'number']
  ),
  'Moderação por Variáveis Contínuas (Floodlight Analysis)': createMethodology(
    'med_floodlight_analysis',
    'mediacao',
    'Identificação dos pontos da escala do moderador a partir dos quais o efeito muda de direção ou significância.',
    ['rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_SEM = {
  'SEM Clássico (LISREL / AMOS)': createMethodology(
    'sem_classico_lisrel_amos',
    'sem',
    'Teste simultâneo de relações causais entre variáveis latentes e observadas.',
    ['rating', 'likert', 'number']
  ),
  'PLS-SEM (Partial Least Squares SEM)': createMethodology(
    'sem_pls_sem',
    'sem',
    'Alternativa ao SEM covariance-based para amostras menores ou dados sem normalidade multivariada.',
    ['rating', 'likert', 'number']
  ),
  'SEM Multigrupo (MSEM)': createMethodology(
    'sem_multigrupo_msem',
    'sem',
    'Teste de invariância de medida e comparação de parâmetros estruturais entre grupos.',
    ['rating', 'likert', 'number']
  ),
  'SEM Dinâmico com Dados de Painel': createMethodology(
    'sem_dinamico_painel',
    'sem',
    'Extensão longitudinal do SEM para modelar relações causais ao longo do tempo.',
    ['rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_AVANCADA = {
  'Análise Discriminante': createMethodology(
    'adv_analise_discriminante',
    'avancada',
    'Classificação de respondentes em grupos predefinidos com base em variáveis preditoras.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Escalonamento Multidimensional (MDS)': createMethodology(
    'adv_mds',
    'avancada',
    'Representação visual da similaridade e diferença entre marcas em um mapa perceptual.',
    ['single', 'multiple']
  ),
  'Análise de Séries Temporais (ARIMA / SARIMA)': createMethodology(
    'adv_series_temporais_arima_sarima',
    'avancada',
    'Modelagem de tendências e sazonalidades para previsão de indicadores de tracking.',
    ['number', 'rating']
  ),
  MANOVA: createMethodology(
    'adv_manova',
    'avancada',
    'Comparação simultânea de múltiplas variáveis dependentes entre grupos.',
    ['rating', 'likert', 'number']
  ),
  'GEE (Generalized Estimating Equations)': createMethodology(
    'adv_gee',
    'avancada',
    'Modelagem de dados longitudinais com controle de correlações entre medidas repetidas.',
    ['rating', 'likert', 'number']
  ),
  'Kappa de Cohen': createMethodology(
    'adv_kappa_cohen',
    'avancada',
    'Medida de concordância entre avaliadores, descontando o acaso.',
    ['single', 'multiple', 'boolean'],
    true
  ),
  'Simulação de Monte Carlo': createMethodology(
    'adv_simulacao_monte_carlo',
    'avancada',
    'Geração de múltiplos cenários por amostragem de distribuições de probabilidade.',
    ['number', 'rating']
  ),
  'Análise Bayesiana': createMethodology(
    'adv_analise_bayesiana',
    'avancada',
    'Estimação de parâmetros incorporando conhecimento prévio e distribuições a priori.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Logit / Probit Multinomial': createMethodology(
    'adv_logit_probit_multinomial',
    'avancada',
    'Modelagem de escolha entre múltiplas alternativas mutuamente exclusivas.',
    ['single', 'multiple']
  ),
  'Alpha de Cronbach': createMethodology(
    'adv_alpha_cronbach',
    'avancada',
    'Medida de consistência interna de escalas e construtos.',
    ['rating', 'likert'],
    true
  ),
  'TRI / IRT': createMethodology(
    'adv_tri_irt',
    'avancada',
    'Modelagem da relação entre traço latente e probabilidade de resposta a cada item.',
    ['rating', 'likert']
  ),
  'Análise de Classes Latentes (LCA)': createMethodology(
    'adv_lca',
    'avancada',
    'Identificação de subgrupos ocultos na população sem definição a priori.',
    ['single', 'multiple', 'rating', 'likert']
  ),
  'Modelos de Mistura Gaussiana (GMM)': createMethodology(
    'adv_gmm',
    'avancada',
    'Clusterização probabilística em que cada respondente recebe probabilidades de pertencimento a segmentos.',
    ['rating', 'likert', 'number']
  ),
  'Regressão de Poisson': createMethodology(
    'adv_regressao_poisson',
    'avancada',
    'Modelo para variáveis de contagem como frequência de compra e número de interações.',
    ['number']
  ),
  'Regressão Binomial Negativa': createMethodology(
    'adv_regressao_binomial_negativa',
    'avancada',
    'Modelo de contagem indicado quando há sobredispersão em relação à distribuição de Poisson.',
    ['number']
  ),
  'ICA (Análise de Componentes Independentes)': createMethodology(
    'adv_ica',
    'avancada',
    'Separação de sinais em fontes estatisticamente independentes.',
    ['number', 'rating']
  ),
  'Bootstrap e Reamostragem': createMethodology(
    'adv_bootstrap_reamostragem',
    'avancada',
    'Estimativa de intervalos de confiança e testes quando premissas paramétricas não são atendidas.',
    ['rating', 'likert', 'number']
  ),
  'Análise de Sensibilidade e Cenários (What-If)': createMethodology(
    'adv_sensibilidade_cenarios_what_if',
    'avancada',
    'Avaliação de como variações nas entradas afetam os resultados de um modelo.',
    ['number', 'rating', 'likert']
  ),
  'Modelos Hierárquicos e Multinível (HLM)': createMethodology(
    'adv_hlm',
    'avancada',
    'Modelagem de dados com estrutura aninhada, separando efeitos individuais e de contexto.',
    ['rating', 'likert', 'number']
  ),
  'Análise de Curva ROC e AUC': createMethodology(
    'adv_roc_auc',
    'avancada',
    'Avaliação da capacidade discriminante de modelos de classificação.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_CAUSALIDADE = {
  'Propensity Score Matching (PSM)': createMethodology(
    'caus_psm',
    'causalidade',
    'Estimativa da probabilidade de adoção e controle de viés de seleção em estudos observacionais.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Difference-in-Differences (DiD)': createMethodology(
    'caus_did',
    'causalidade',
    'Estimação de efeitos causais comparando grupo exposto e controle antes e depois da intervenção.',
    ['rating', 'likert', 'number']
  ),
  'Regressão Descontínua (RDD)': createMethodology(
    'caus_rdd',
    'causalidade',
    'Identificação de efeitos causais em torno de um limiar de corte.',
    ['number', 'rating']
  ),
  'Variáveis Instrumentais (IV)': createMethodology(
    'caus_iv',
    'causalidade',
    'Estimação de relações causais na presença de endogeneidade por meio de instrumentos exógenos.',
    ['rating', 'likert', 'number']
  ),
  'Análise de Contrafactual (Causal Inference / Potential Outcomes)': createMethodology(
    'caus_contrafactual',
    'causalidade',
    'Framework formal de inferência causal baseado em contrafactuais e resultados potenciais.',
    ['rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_EXPERIENCIA = {
  'Customer Effort Score (CES) Analytics': createMethodology(
    'exp_ces_analytics',
    'experiencia',
    'Análise do esforço percebido em cada ponto de contato da jornada.',
    ['rating', 'likert'],
    true
  ),
  'Customer Satisfaction Score (CSAT) Aprofundado': createMethodology(
    'exp_csat_aprofundado',
    'experiencia',
    'Análise granular do CSAT por etapa da jornada, canal e perfil de cliente.',
    ['rating', 'likert'],
    true
  ),
  'Análise de Momentos da Verdade': createMethodology(
    'exp_momentos_verdade',
    'experiencia',
    'Mapeamento e priorização dos pontos de contato com maior impacto emocional e decisório.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Jornada do Cliente Baseada em Dados (Data-Driven Journey Mapping)': createMethodology(
    'exp_data_driven_journey_mapping',
    'experiencia',
    'Construção de mapas de jornada quantitativos combinando frequência, importância e satisfação por touchpoint.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Análise de Ponto de Inflexão da Jornada': createMethodology(
    'exp_ponto_inflexao_jornada',
    'experiencia',
    'Identificação dos momentos em que a probabilidade de perda ou ganho do cliente é mais sensível à experiência.',
    ['rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_MARCA = {
  'Brand Equity Tracking Quantitativo': createMethodology(
    'brand_equity_tracking_quantitativo',
    'marca',
    'Mensuração longitudinal dos pilares de brand equity com índices ponderados e evolução temporal.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Análise de Personalidade de Marca (Brand Personality Mapping)': createMethodology(
    'brand_personality_mapping',
    'marca',
    'Mensuração das dimensões de personalidade atribuídas às marcas e comparação com competidores.',
    ['rating', 'likert'],
    true
  ),
  'Brand Funnel Analytics': createMethodology(
    'brand_funnel_analytics',
    'marca',
    'Análise de conversão ao longo do funil de brand, da awareness ao uso frequente.',
    ['single', 'multiple', 'boolean'],
    true
  ),
  'Análise de Atribuição de Comunicação': createMethodology(
    'brand_atribuicao_comunicacao',
    'marca',
    'Mensuração da contribuição de cada canal e mensagem de comunicação para indicadores de marca.',
    ['single', 'multiple', 'rating', 'likert']
  ),
  'Análise de Congruência Marca-Consumidor (Self-Congruity)': createMethodology(
    'brand_self_congruity',
    'marca',
    'Mensuração da correspondência entre a imagem percebida da marca e a autoimagem do consumidor.',
    ['rating', 'likert'],
    true
  ),
  'Copy Testing Analytics': createMethodology(
    'brand_copy_testing_analytics',
    'marca',
    'Análise estruturada de peças criativas com métricas de atenção, compreensão, relevância e intenção de ação.',
    ['rating', 'likert', 'text'],
    true
  ),
} as const;

export const METODOLOGIA_MERCADO = {
  'Share of Preference (Simulador de Mercado)': createMethodology(
    'market_share_of_preference',
    'mercado',
    'Estimativa da participação de mercado potencial de diferentes marcas ou ofertas.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Análise de Switching e Fidelidade': createMethodology(
    'market_switching_fidelidade',
    'mercado',
    'Modelagem da probabilidade de migração entre marcas e identificação de fontes de ganho e perda de clientes.',
    ['single', 'multiple'],
    true
  ),
  'Análise de Rivalidade Perceptual': createMethodology(
    'market_rivalidade_perceptual',
    'mercado',
    'Mapeamento de quais marcas são percebidas como mais próximas ou distantes na mente do consumidor.',
    ['single', 'multiple'],
    true
  ),
  'Análise de Brechas de Mercado (White Space Analysis)': createMethodology(
    'market_white_space_analysis',
    'mercado',
    'Identificação de combinações de atributos valorizadas que nenhuma marca atual entrega de forma satisfatória.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Análise de Concentração de Mercado (HHI e CR)': createMethodology(
    'market_concentracao_hhi_cr',
    'mercado',
    'Mensuração do grau de concentração do mercado por meio de HHI e razões de concentração.',
    ['single', 'multiple']
  ),
} as const;

export const METODOLOGIA_COMPORTAMENTAL = {
  'A/B Testing e Experimentação Controlada': createMethodology(
    'behav_ab_testing_experimentacao_controlada',
    'comportamental',
    'Desenho e análise de experimentos controlados para testar produto, preço, comunicação ou experiência.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Multi-Armed Bandit': createMethodology(
    'behav_multi_armed_bandit',
    'comportamental',
    'Otimização dinâmica de variantes em experimentos contínuos com alocação adaptativa.',
    ['rating', 'likert']
  ),
  'Análise de Preferência Revelada vs. Declarada': createMethodology(
    'behav_preferencia_revelada_vs_declarada',
    'comportamental',
    'Comparação entre o que o consumidor declara e o que efetivamente faz.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Behavioral Economics Analytics': createMethodology(
    'behav_behavioral_economics_analytics',
    'comportamental',
    'Análise de heurísticas e vieses cognitivos que influenciam decisões de compra.',
    ['rating', 'likert', 'text']
  ),
  'Eye Tracking Analytics': createMethodology(
    'behav_eye_tracking_analytics',
    'comportamental',
    'Mensuração quantitativa da atenção visual em embalagem, comunicação ou interface.',
    ['image_choice']
  ),
  'Análise de Tempo de Resposta (Reaction Time Analysis)': createMethodology(
    'behav_reaction_time_analysis',
    'comportamental',
    'Mensuração da latência de resposta em tarefas de associação implícita.',
    ['single', 'multiple']
  ),
} as const;

export const METODOLOGIA_VALIDACAO = {
  'Validação Cruzada (Cross-Validation k-fold)': createMethodology(
    'val_cross_validation_k_fold',
    'validacao',
    'Avaliação da capacidade de generalização de modelos por particionamento repetido em treino e teste.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Análise de Multicolinearidade (VIF)': createMethodology(
    'val_vif_multicolinearidade',
    'validacao',
    'Diagnóstico da colinearidade entre variáveis preditoras para garantir estabilidade dos coeficientes.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Análise de Invariância de Medida (Measurement Invariance)': createMethodology(
    'val_measurement_invariance',
    'validacao',
    'Teste se uma escala mede o mesmo construto de forma equivalente em diferentes grupos.',
    ['rating', 'likert']
  ),
  'Análise de Precisão e Recall (F1-Score)': createMethodology(
    'val_precision_recall_f1',
    'validacao',
    'Avaliação balanceada de modelos de classificação considerando precisão, recall e F1-score.',
    ['single', 'multiple', 'boolean']
  ),
  'Análise de Calibração de Modelos': createMethodology(
    'val_model_calibration',
    'validacao',
    'Avaliação se as probabilidades preditas por um modelo correspondem às frequências observadas.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

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
  ...METODOLOGIA_VALIDACAO,
} as const;

export type MethodologyKey = keyof typeof ALL_METHODOLOGIES;

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  descritiva: 'Análises Descritivas e de Perfil',
  comparativa: 'Análises Comparativas',
  preditiva: 'Análises Explicativas e Preditivas',
  fatorial: 'Análise Fatorial e Componentes Principais',
  penalty: 'Análises de Penalty (Impacto / Importância x Performance)',
  cluster: 'Análises de Clusterização e Tipologias',
  text: 'Análise de Texto (Text Mining e NLP)',
  intencao: 'Análises de Intenção e Barreiras',
  importancia: 'Análise de Importância Relativa (Shapley Values)',
  conjoint: 'Análise de Decisão Conjunta (Conjoint e Simulações)',
  nps: 'NPS Analytics',
  preco: 'Análise de Sensibilidade de Preço (PSM / Van Westendorp)',
  rede: 'Análise de Redes (Network Analysis)',
  sobrevivencia: 'Análise de Sobrevivência (Survival Analysis)',
  maxdiff: 'MaxDiff (Maximum Difference Scaling)',
  mediacao: 'Análise de Mediação e Moderação',
  sem: 'Modelagem de Equações Estruturais (SEM)',
  avancada: 'Análises Estatísticas Avançadas',
  causalidade: 'Análises de Propensão e Causalidade',
  experiencia: 'Análises de Experiência e Jornada do Consumidor',
  marca: 'Análises de Marca e Comunicação',
  mercado: 'Análises de Mercado e Competição',
  comportamental: 'Análises Comportamentais e Experimentais',
  validacao: 'Métricas e Validação de Modelos',
};

export const LEGACY_METHODOLOGY_ALIASES: Partial<Record<string, MethodologyKey>> = {
  'Cruzamento de Perfil': 'Cruzamento de Perfil entre Variáveis de Segmentação e Comportamento',
  'Análise de Outliers': 'Análise de Outliers e Dados Atípicos',
  'Missing Data Analysis': 'Análise de Padrão de Não-Resposta (Missing Data Analysis)',
  'Testes Post-Hoc': 'Testes Post-Hoc (Newman-Keuls / Tukey HSD)',
  'Effect Size': "Análise de Efeito Prático (Effect Size: Cohen's d, eta²)",
  'Teste de Proporções': 'Teste de Proporções (Z-test para Proporções)',
  'Análise de Variação Temporal': 'Análise de Variação Temporal (Comparação de Ondas)',
  'Gradient Boosting': 'Gradient Boosting (XGBoost / LightGBM)',
  'Ridge, Lasso e Elastic Net': 'Regressão Ridge, Lasso e Elastic Net',
  AutoML: 'AutoML e Seleção Automática de Modelos',
  'Análise Fatorial Confirmatória': 'Análise Fatorial Confirmatória (CFA)',
  'EFA com Rotação Oblíqua': 'Análise Fatorial Exploratória com Rotação Oblíqua (Promax / Oblimin)',
  'Matriz Importância x Satisfação': 'Matriz de Prioridade (Importância x Satisfação)',
  'Análise de Gap': 'Análise de Gap (Expectativa x Realidade)',
  DBSCAN: 'Clusterização por DBSCAN',
  'Bootstrap Clustering': 'Análise de Estabilidade de Clusters (Bootstrap Clustering)',
  'Extração de Termos': 'Extração e Categorização de Termos',
  'Análise de Sentimento': 'Análise de Sentimento (Sentiment Analysis)',
  'Modelagem de Tópicos': 'Modelagem de Tópicos (LDA / BERTopic)',
  'Named Entity Recognition': 'Named Entity Recognition (NER)',
  'Embeddings Semânticos': 'Análise Semântica com Embeddings (Word2Vec / BERT)',
  'Co-ocorrência de Termos': 'Análise de Co-ocorrência de Termos',
  'Categorização Automática': 'Categorização Automática por Regras e ML',
  'Cruzamento Intenção x Atributos': 'Cruzamento de Intenção de Compra com Atributos',
  'Funil de Conversão': 'Análise de Funil de Conversão Declarada',
  'Análise de Barreiras': 'Análise de Barreiras por Tipo (Racionais, Emocionais, Situacionais)',
  'Job-to-be-Done': 'Job-to-be-Done Analytics',
  'Shapley Values': 'Shapley Values e Relative Importance Analysis',
  SHAP: 'SHAP (SHapley Additive exPlanations)',
  LIME: 'LIME (Local Interpretable Model-agnostic Explanations)',
  'Choice-Based Conjoint': 'Choice-Based Conjoint (CBC)',
  'Adaptive Conjoint': 'Adaptive Conjoint Analysis (ACA)',
  'Menu-Based Conjoint': 'Menu-Based Conjoint (MBC)',
  'Willingness to Pay': 'Willingness to Pay (WTP) via Conjoint',
  'NPS Aprofundado': 'NPS Aprofundado com Drivers',
  'Verbatim Mining': 'Análise de Verbatim de Promotores e Detratores',
  'NPS por Segmento': 'NPS por Segmento e Jornada',
  'Price Sensitivity Meter': 'Price Sensitivity Meter (Van Westendorp)',
  'Newton-Miller-Smith': 'Newton-Miller-Smith Extension (NMS)',
  'Elasticidade-Preço': 'Análise de Elasticidade-Preço da Demanda',
  'Gabor-Granger': 'Gabor-Granger Pricing',
  'Mapeamento de Conexões': 'Mapeamento de Conexões entre Atributos e Marcas',
  'Centralidade de Rede': 'Análise de Centralidade de Rede (Betweenness, Degree, Eigenvector)',
  'Detecção de Comunidades': 'Detecção de Comunidades em Redes de Percepção',
  'Modelagem de Churn': 'Modelagem de Tempo até Abandono / Churn',
  'Kaplan-Meier': 'Curvas de Kaplan-Meier',
  'Cox Proportional Hazards': 'Modelo de Cox (Cox Proportional Hazards)',
  'MaxDiff com Segmentação': 'MaxDiff com Segmentação Latente',
  'Mediação Simples': 'Mediação e Moderação',
  'Mediação em Série': 'Mediação em Série (Serial Mediation)',
  'Moderated Mediation': 'Análise de Efeito Indireto Condicional (Moderated Mediation)',
  'Floodlight Analysis': 'Moderação por Variáveis Contínuas (Floodlight Analysis)',
  'SEM Clássico': 'SEM Clássico (LISREL / AMOS)',
  'PLS-SEM': 'PLS-SEM (Partial Least Squares SEM)',
  'SEM Multigrupo': 'SEM Multigrupo (MSEM)',
  'SEM com Dados de Painel': 'SEM Dinâmico com Dados de Painel',
  'Escalonamento Multidimensional': 'Escalonamento Multidimensional (MDS)',
  'Análise de Séries Temporais': 'Análise de Séries Temporais (ARIMA / SARIMA)',
  GEE: 'GEE (Generalized Estimating Equations)',
  'Simulação Monte Carlo': 'Simulação de Monte Carlo',
  IRT: 'TRI / IRT',
  'Análise de Classes Latentes': 'Análise de Classes Latentes (LCA)',
  'Modelos de Mistura Gaussiana': 'Modelos de Mistura Gaussiana (GMM)',
  ICA: 'ICA (Análise de Componentes Independentes)',
  'Análise de Sensibilidade': 'Análise de Sensibilidade e Cenários (What-If)',
  'Modelos Hierárquicos': 'Modelos Hierárquicos e Multinível (HLM)',
  'ROC e AUC': 'Análise de Curva ROC e AUC',
  'Propensity Score Matching': 'Propensity Score Matching (PSM)',
  'Difference-in-Differences': 'Difference-in-Differences (DiD)',
  'Regressão Descontínua': 'Regressão Descontínua (RDD)',
  'Variáveis Instrumentais': 'Variáveis Instrumentais (IV)',
  'Contrafactual Analysis': 'Análise de Contrafactual (Causal Inference / Potential Outcomes)',
  'Customer Effort Score': 'Customer Effort Score (CES) Analytics',
  'Customer Satisfaction Score': 'Customer Satisfaction Score (CSAT) Aprofundado',
  'Momentos da Verdade': 'Análise de Momentos da Verdade',
  'Journey Mapping Quantitativo': 'Jornada do Cliente Baseada em Dados (Data-Driven Journey Mapping)',
  'Análise de Ponto de Inflexão': 'Análise de Ponto de Inflexão da Jornada',
  'Brand Equity Tracking': 'Brand Equity Tracking Quantitativo',
  'Brand Personality Mapping': 'Análise de Personalidade de Marca (Brand Personality Mapping)',
  'Análise de Atribuição': 'Análise de Atribuição de Comunicação',
  'Self-Congruity': 'Análise de Congruência Marca-Consumidor (Self-Congruity)',
  'Copy Testing': 'Copy Testing Analytics',
  'Share of Preference': 'Share of Preference (Simulador de Mercado)',
  'Análise de Switching': 'Análise de Switching e Fidelidade',
  'Rivalidade Perceptual': 'Análise de Rivalidade Perceptual',
  'White Space Analysis': 'Análise de Brechas de Mercado (White Space Analysis)',
  'Análise de Concentração': 'Análise de Concentração de Mercado (HHI e CR)',
  'A/B Testing': 'A/B Testing e Experimentação Controlada',
  'Preferência Revelada vs. Declarada': 'Análise de Preferência Revelada vs. Declarada',
  'Behavioral Economics': 'Behavioral Economics Analytics',
  'Eye Tracking': 'Eye Tracking Analytics',
  'Reaction Time Analysis': 'Análise de Tempo de Resposta (Reaction Time Analysis)',
};

export function normalizeMethodologyKey(value: string): MethodologyKey | null {
  if (value in ALL_METHODOLOGIES) {
    return value as MethodologyKey;
  }

  return LEGACY_METHODOLOGY_ALIASES[value] ?? null;
}

export function normalizeMethodologySelection(values: string[] = []): MethodologyKey[] {
  return Array.from(
    new Set(
      values
        .map(normalizeMethodologyKey)
        .filter((value): value is MethodologyKey => Boolean(value))
    )
  );
}

export function getMethodologyDisplayName(value: string): string {
  return normalizeMethodologyKey(value) ?? value;
}

export function getApplicableMethodologies(questionType: string): MethodologyInfo[] {
  return Object.values(ALL_METHODOLOGIES).filter(methodology =>
    methodology.applicableQuestionTypes.includes(questionType)
  ) as MethodologyInfo[];
}

export function getApplicableMethodologyEntries(questionType: string): Array<{ key: MethodologyKey; info: MethodologyInfo }> {
  return (Object.entries(ALL_METHODOLOGIES) as Array<[MethodologyKey, MethodologyInfo]>).filter(([, info]) =>
    info.applicableQuestionTypes.includes(questionType)
  ).map(([key, info]) => ({ key, info }));
}

export function getMethodologiesByCategory(category: CategoryType): MethodologyInfo[] {
  return Object.values(ALL_METHODOLOGIES).filter(methodology =>
    methodology.category === category
  ) as MethodologyInfo[];
}

export function getMethodologyInfo(key: MethodologyKey): MethodologyInfo {
  return ALL_METHODOLOGIES[key] as MethodologyInfo;
}

export function getMethodologyInfoByAnyKey(value: string): MethodologyInfo | null {
  const key = normalizeMethodologyKey(value);
  return key ? getMethodologyInfo(key) : null;
}

export function getAllCategories(): CategoryType[] {
  return Object.keys(CATEGORY_LABELS) as CategoryType[];
}
