export type CategoryType =
  | 'descritiva'
  | 'comparativa'
  | 'preditiva'
  | 'fatorial'
  | 'penalty'
  | 'cluster'
  | 'text'
  | 'intencao'
  | 'causalidade'
  | 'comportamental'
  | 'mercado'
  | 'valor_cliente'
  | 'pricing'
  | 'nps_analytics'
  | 'experiencia'
  | 'marca'
  | 'estatistica_avancada'
  | 'mediacao'
  | 'sem'
  | 'sobrevivencia'
  | 'rede'
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
  'Distribuição Percentual e Média por Variável': createMethodology(
    'desc_distribuicao_percentual_media',
    'descritiva',
    'Análise básica de frequências, médias, medianas e desvios para descrever o perfil da amostra e os padrões de resposta em cada variável.',
    ['single', 'multiple', 'rating', 'likert', 'number'],
    true
  ),
  'Cruzamento de Perfil entre Variáveis de Segmentação e Comportamento': createMethodology(
    'desc_cruzamento_perfil_segmentacao_comportamento',
    'descritiva',
    'Tabelas de contingência e cruzamentos entre variáveis categóricas para revelar padrões de comportamento por perfil demográfico ou psicográfico.',
    ['single', 'multiple', 'boolean'],
    true
  ),
  'Segmentação por Cluster / K-means': createMethodology(
    'desc_segmentacao_cluster_kmeans',
    'descritiva',
    'Agrupamento de respondentes com base em critérios de interesse, conhecimento e percepções, formando segmentos homogêneos internamente e heterogêneos entre si.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Análise de Quintis e Percentis': createMethodology(
    'desc_quintis_percentis',
    'descritiva',
    'Estratificação da amostra em faixas de distribuição para identificar grupos extremos (top box / bottom box) e analisar comportamentos em cada estrato da curva de resposta.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Análise de Outliers e Dados Atípicos': createMethodology(
    'desc_outliers_dados_atipicos',
    'descritiva',
    'Identificação e tratamento de respostas atípicas por meio de boxplots, Z-score e distância de Mahalanobis, garantindo que os resultados não sejam distorcidos por observações extremas.',
    ['number', 'rating', 'likert'],
    true
  ),
  'Análise de Assimetria e Curtose': createMethodology(
    'desc_assimetria_curtose',
    'descritiva',
    'Avaliação da forma das distribuições de resposta para identificar vieses de aquiescência, efeito teto/piso e outras distorções que afetam a interpretação de escalas.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Análise de Padrão de Não-Resposta (Missing Data Analysis)': createMethodology(
    'desc_missing_data_analysis',
    'descritiva',
    'Diagnóstico dos padrões de dados ausentes (MCAR, MAR, MNAR) e aplicação de técnicas de imputação como Imputação Múltipla (MICE) ou imputação por média/moda para preservar a integridade da amostra.',
    ['single', 'multiple', 'rating', 'likert', 'text', 'number'],
    true
  ),
  'Análise de Viés de Resposta e Aquiescência': createMethodology(
    'desc_vies_resposta_aquiescencia',
    'descritiva',
    'Identificação de respondentes com padrão de resposta extremo ou concordância sistemática (yea-saying), com ajuste ou ponderação para garantir qualidade dos dados.',
    ['single', 'multiple', 'rating', 'likert', 'boolean'],
    true
  ),
} as const;

export const METODOLOGIA_COMPARATIVA = {
  'Testes de Significância: Qui-quadrado, T-test e ANOVA': createMethodology(
    'comp_testes_significancia',
    'comparativa',
    'Testes paramétricos e não paramétricos para comparar distribuições e médias entre grupos distintos de respondentes.',
    ['single', 'multiple', 'boolean', 'rating', 'likert', 'number'],
    true
  ),
  'Testes Post-Hoc (Newman-Keuls / Tukey HSD)': createMethodology(
    'comp_testes_post_hoc',
    'comparativa',
    'Identificação de quais pares de subgrupos diferem significativamente após ANOVA, controlando o erro tipo I acumulado.',
    ['rating', 'likert', 'number']
  ),
  'Comparações entre grupos de usuários e não usuários': createMethodology(
    'comp_usuarios_vs_nao_usuarios',
    'comparativa',
    'Análise diferencial entre perfis de relacionamento com a marca ou categoria para mapear brechas de percepção e comportamento.',
    ['single', 'multiple', 'boolean', 'rating', 'likert'],
    true
  ),
  'Teste de Mann-Whitney e Kruskal-Wallis': createMethodology(
    'comp_mann_whitney_kruskal_wallis',
    'comparativa',
    'Alternativas não paramétricas ao T-test e ANOVA para comparação de grupos quando as premissas de normalidade não são atendidas, amplamente utilizados em escalas ordinais.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Análise de Equivalência (Equivalence Testing / TOST)': createMethodology(
    'comp_equivalence_tost',
    'comparativa',
    'Testa se dois grupos são suficientemente similares dentro de uma margem prática, complementando o teste de diferença tradicional — útil para validação de instrumentos e comparação de versões de produto.',
    ['rating', 'likert', 'number']
  ),
  "Análise de Efeito Prático (Effect Size: Cohen's d, eta²)": createMethodology(
    'comp_effect_size',
    'comparativa',
    'Mensuração da magnitude das diferenças entre grupos, indo além da significância estatística para avaliar a relevância prática das diferenças encontradas.',
    ['rating', 'likert', 'number'],
    true
  ),
  'Teste de Proporções (Z-test para Proporções)': createMethodology(
    'comp_z_test_proporcoes',
    'comparativa',
    'Comparação de frequências percentuais entre grupos independentes para verificar se diferenças em distribuições categóricas são estatisticamente significativas.',
    ['single', 'multiple', 'boolean'],
    true
  ),
  'Análise de Variação Temporal (Comparação de Ondas)': createMethodology(
    'comp_variacao_temporal_ondas',
    'comparativa',
    'Comparação de indicadores entre diferentes momentos de coleta (ondas de tracking) para identificar evolução, deterioração ou estabilidade de percepções e comportamentos ao longo do tempo.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_PREDITIVA = {
  'Regressão Linear Múltipla': createMethodology(
    'pred_regressao_linear_multipla',
    'preditiva',
    'Identificação de preditores de variáveis contínuas como satisfação geral, propensão de compra e avaliação de marca com controle simultâneo de múltiplas variáveis.',
    ['number', 'rating', 'likert']
  ),
  'Regressão Logística': createMethodology(
    'pred_regressao_logistica',
    'preditiva',
    'Modelagem de variáveis binárias ou categóricas como intenção de compra (sim/não) ou adoção de produto.',
    ['single', 'multiple', 'boolean']
  ),
  'Árvores de Decisão e Random Forest': createMethodology(
    'pred_arvores_decisao_random_forest',
    'preditiva',
    'Identificação dos fatores com maior poder explicativo sobre variáveis-alvo, com interpretação visual da hierarquia de decisão.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Gradient Boosting (XGBoost / LightGBM)': createMethodology(
    'pred_gradient_boosting',
    'preditiva',
    'Modelos preditivos de alta performance baseados em ensemble de árvores de decisão sequenciais, com capacidade de capturar relações não lineares e interações complexas entre variáveis — superiores ao Random Forest em precisão preditiva em contextos de alta dimensionalidade.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Regressão Ridge, Lasso e Elastic Net': createMethodology(
    'pred_ridge_lasso_elastic_net',
    'preditiva',
    'Regressões regularizadas para contextos com muitas variáveis preditoras, penalizando coeficientes irrelevantes e selecionando automaticamente os preditores mais relevantes — essenciais em modelos de drivers de satisfação com baterias extensas de atributos.',
    ['number', 'rating', 'likert']
  ),
  'Regressão Quantílica': createMethodology(
    'pred_regressao_quantilica',
    'preditiva',
    'Modelagem da relação entre preditores e diferentes percentis da variável dependente, permitindo entender se os drivers de satisfação atuam de forma diferente entre consumidores com baixa, média e alta avaliação.',
    ['number', 'rating', 'likert']
  ),
  'Modelos de Aprendizado de Máquina Supervisionado (SVM, KNN, Naïve Bayes)': createMethodology(
    'pred_ml_supervisionado',
    'preditiva',
    'Algoritmos de classificação e predição para segmentação, detecção de perfis e classificação de respondentes em categorias de interesse com base em padrões de resposta.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'AutoML e Seleção Automática de Modelos': createMethodology(
    'pred_automl',
    'preditiva',
    'Pipeline automatizado de treinamento, validação e comparação de modelos preditivos, garantindo que o modelo de maior performance seja selecionado de forma sistemática e reproduzível.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Modelos de Redes Neurais e Deep Learning': createMethodology(
    'pred_redes_neurais_deep_learning',
    'preditiva',
    'Modelagem preditiva com arquiteturas profundas (MLP, CNN, Transformers) para capturar interações não lineares e padrões complexos em dados multimodais (texto + imagem + variáveis numéricas), especialmente em previsão de intenção de compra e preferência em alta dimensionalidade.',
    ['single', 'multiple', 'rating', 'likert', 'number', 'text']
  ),
  'Modelos Hierárquicos Bayesianos': createMethodology(
    'pred_modelos_hierarquicos_bayesianos',
    'preditiva',
    'Estimação bayesiana de modelos com estrutura hierárquica, ideal para Conjoint individualizado e segmentação personalizada, incorporando incerteza e priors informativos para maior robustez em amostras médias.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_FATORIAL = {
  'PCA e Análise Fatorial Exploratória': createMethodology(
    'fact_pca_efa',
    'fatorial',
    'Redução de dimensionalidade e agrupamento de itens em fatores latentes para simplificar baterias extensas de atributos.',
    ['rating', 'likert', 'number']
  ),
  'Análise de Correspondência': createMethodology(
    'fact_analise_correspondencia',
    'fatorial',
    'Mapa perceptual associando atributos e perfis de respondentes em um espaço bidimensional.',
    ['single', 'multiple']
  ),
  'Análise Fatorial Confirmatória (CFA)': createMethodology(
    'fact_confirmatory_factor_analysis',
    'fatorial',
    'Teste de um modelo fatorial teórico predefinido para verificar se a estrutura de dimensões hipotetizada é suportada pelos dados, com avaliação de índices de ajuste (CFI, RMSEA, SRMR) — essencial na validação de escalas em pesquisas de brand equity e satisfação.',
    ['rating', 'likert', 'number']
  ),
  'Análise de Bifactor': createMethodology(
    'fact_bifactor',
    'fatorial',
    'Modelagem fatorial que separa um fator geral (g) de fatores específicos, útil para distinguir a contribuição de dimensões distintas em construtos multidimensionais como qualidade percebida ou experiência de marca.',
    ['rating', 'likert', 'number']
  ),
  'Análise Fatorial Exploratória com Rotação Oblíqua (Promax / Oblimin)': createMethodology(
    'fact_rotacao_obliqua',
    'fatorial',
    'Extração de fatores admitindo correlação entre as dimensões latentes — mais adequada para construtos psicológicos onde os fatores não são ortogonais, produzindo estruturas mais realistas e interpretáveis.',
    ['rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_PENALTY = {
  'Penalty de Atributos': createMethodology(
    'pen_penalty_atributos',
    'penalty',
    'Avaliação do quanto a ausência de determinado atributo penaliza a percepção geral, identificando atributos básicos (must-have) versus diferenciais.',
    ['single', 'multiple', 'rating', 'likert'],
    true
  ),
  'Análise de Kano': createMethodology(
    'pen_kano',
    'penalty',
    'Classificação de atributos em categorias funcionais (básicos, lineares, atrativos e indiferentes) com base na relação entre presença/ausência do atributo e satisfação declarada — permite priorizar inovações com maior impacto na percepção de valor.',
    ['rating', 'likert', 'single', 'multiple']
  ),
  'Matriz de Prioridade (Importância x Satisfação)': createMethodology(
    'pen_matriz_prioridade',
    'penalty',
    'Quadrante de priorização cruzando importância declarada e avaliação de performance para identificar gaps críticos que demandam ação imediata versus atributos de manutenção.',
    ['rating', 'likert', 'single', 'multiple'],
    true
  ),
  'Análise de Gap (Expectativa x Realidade)': createMethodology(
    'pen_gap_expectativa_realidade',
    'penalty',
    'Comparação entre o que o consumidor espera de uma categoria ou marca e o que efetivamente percebe, quantificando brechas de entrega que afetam satisfação e fidelização.',
    ['rating', 'likert', 'number'],
    true
  ),
} as const;

export const METODOLOGIA_CLUSTER = {
  'K-means e Clusterização Hierárquica': createMethodology(
    'clust_kmeans_hierarquica',
    'cluster',
    'Algoritmos de agrupamento para criação de perfis de consumidores com base em variáveis de percepção e comportamento.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Clusterização por DBSCAN': createMethodology(
    'clust_dbscan',
    'cluster',
    'Algoritmo de densidade para identificação de clusters de formato irregular e detecção de outliers — vantajoso sobre K-means quando os segmentos não têm formato esférico ou quando há respondentes atípicos que não pertencem a nenhum grupo.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Análise de Silhueta e Índice de Davies-Bouldin': createMethodology(
    'clust_silhueta_davies_bouldin',
    'cluster',
    'Métricas de validação da qualidade e coesão dos clusters formados, garantindo que o número de segmentos e a solução de agrupamento escolhida são estatisticamente robustos.',
    ['single', 'multiple', 'rating', 'likert', 'number'],
    true
  ),
  'Análise de Estabilidade de Clusters (Bootstrap Clustering)': createMethodology(
    'clust_bootstrap_stability',
    'cluster',
    'Avaliação da reprodutibilidade dos segmentos por reamostragem, verificando se os perfis encontrados são estáveis e não artefatos da amostra específica coletada.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_TEXT = {
  'Extração e Categorização de Termos': createMethodology(
    'text_extracao_categorizacao_termos',
    'text',
    'Identificação de adjetivos, substantivos e expressões recorrentes em respostas abertas com nuvens de palavras e análise de frequência.',
    ['text'],
    true
  ),
  'Análise de Sentimento (Sentiment Analysis)': createMethodology(
    'text_sentiment_analysis',
    'text',
    'Classificação automática do tom emocional de respostas abertas em positivo, neutro ou negativo, com possibilidade de gradação de intensidade — aplicada em avaliações de produto, comentários de marca e pesquisas de satisfação qualitativa.',
    ['text'],
    true
  ),
  'Modelagem de Tópicos (LDA / BERTopic)': createMethodology(
    'text_topic_modeling',
    'text',
    'Identificação automática de temas latentes em grandes volumes de respostas abertas sem categorização prévia, revelando os assuntos dominantes na fala do consumidor de forma não supervisionada.',
    ['text']
  ),
  'Named Entity Recognition (NER)': createMethodology(
    'text_named_entity_recognition',
    'text',
    'Extração automática de entidades como marcas, produtos, locais e pessoas mencionados em respostas abertas, permitindo mapear o ecossistema de referências do consumidor.',
    ['text']
  ),
  'Análise Semântica com Embeddings (Word2Vec / BERT)': createMethodology(
    'text_embeddings_semanticos',
    'text',
    'Representação vetorial de palavras e frases para capturar similaridade semântica entre conceitos, identificando associações implícitas entre atributos de marca e percepções do consumidor.',
    ['text']
  ),
  'Análise de Co-ocorrência de Termos': createMethodology(
    'text_coocorrencia_termos',
    'text',
    'Mapeamento de quais palavras e conceitos aparecem juntos com maior frequência nos discursos dos consumidores, revelando associações mentais e arquiteturas de percepção.',
    ['text'],
    true
  ),
  'Categorização Automática por Regras e ML': createMethodology(
    'text_categorizacao_regras_ml',
    'text',
    'Classificação de respostas abertas em categorias predefinidas por meio de modelos supervisionados ou dicionários de regras, permitindo quantificar temas qualitativos em escala.',
    ['text']
  ),
  'Análise de Sentimento Aspect-Based (ABSA)': createMethodology(
    'text_absa_aspect_based_sentiment',
    'text',
    'Identificação automática de sentimentos associados a atributos ou aspectos específicos mencionados em respostas abertas, permitindo análise granular de drivers de satisfação e insatisfação por elemento do produto/serviço.',
    ['text'],
    true
  ),
  'Análise Assistida por Large Language Models (LLM-assisted Insights)': createMethodology(
    'text_llm_assisted_insights',
    'text',
    'Uso de modelos de linguagem de grande escala para sumarização inteligente, extração de insights temáticos e síntese qualitativa de grandes volumes de verbatims, complementando e acelerando análises tradicionais de NLP.',
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
  'Double Machine Learning (DML)': createMethodology(
    'caus_double_machine_learning',
    'causalidade',
    'Framework de inferência causal que combina machine learning com estimação paramétrica para obter efeitos causais robustos em ambientes de alta dimensionalidade e com muitos confounders não observados.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Synthetic Control Method (SCM)': createMethodology(
    'caus_synthetic_control_method',
    'causalidade',
    'Construção de um grupo controle sintético a partir de combinação ponderada de unidades não tratadas, permitindo avaliação de impacto causal em estudos de caso único ou com poucos períodos (ex.: lançamento regional ou campanha específica).',
    ['number', 'rating']
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
  'Teste de Associação Implícita (IAT – Implicit Association Test)': createMethodology(
    'behav_iat_implicit_association_test',
    'comportamental',
    'Mensuração de atitudes e associações automáticas subconscientes por meio de tempos de resposta em tarefas de pareamento, revelando preferências implícitas de marca ou categoria não capturadas por medidas declarativas.',
    ['single', 'multiple']
  ),
  'Mouse Tracking Analytics': createMethodology(
    'behav_mouse_tracking_analytics',
    'comportamental',
    'Análise quantitativa dos movimentos do cursor em questionários online ou protótipos digitais para inferir hesitação, atenção seletiva e processo decisório, complementando eye-tracking com dados comportamentais de baixa intrusividade.',
    ['single', 'multiple', 'rating', 'likert']
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
  'Análise TURF (Total Unduplicated Reach and Frequency)': createMethodology(
    'market_turf_analysis',
    'mercado',
    'Otimização de portfólio de produtos, atributos ou mensagens para maximizar alcance único e frequência de preferência, identificando as combinações que cobrem o maior número de consumidores sem redundância.',
    ['single', 'multiple', 'rating', 'likert']
  ),
  'Modelagem de Cadeia de Markov para Switching de Marca': createMethodology(
    'market_markov_chain_switching',
    'mercado',
    'Previsão probabilística de transições entre marcas ao longo do tempo com base em matrizes de transição, permitindo simular retenção, churn e equilíbrio de longo prazo do mercado.',
    ['single', 'multiple', 'number']
  ),
} as const;

export const METODOLOGIA_VALOR_CLIENTE = {
  'Customer Lifetime Value (CLV) Modeling': createMethodology(
    'clv_customer_lifetime_value',
    'valor_cliente',
    'Estimação do valor monetário esperado de cada cliente ou segmento ao longo do tempo, integrando padrões de retenção, frequência de compra e margem para priorização estratégica de aquisição e retenção.',
    ['number', 'rating', 'single', 'multiple']
  ),
  'Análise de Coortes (Cohort Analysis)': createMethodology(
    'clv_cohort_analysis',
    'valor_cliente',
    'Acompanhamento de grupos de clientes formados pela data de aquisição ou primeiro contato para identificar padrões de retenção, evolução de comportamento e impacto de ações específicas ao longo do ciclo de vida.',
    ['number', 'rating', 'single', 'multiple'],
    true
  ),
} as const;

// ============================================================================
// NEW: PRICING METHODOLOGIES
// ============================================================================

export const METODOLOGIA_PRICING = {
  'Price Sensitivity Meter (Van Westendorp)': createMethodology(
    'price_van_westendorp',
    'pricing',
    'Mapeamento das faixas de preço aceitável, caro demais e barato demais na percepção do consumidor, com identificação do ponto de preço ótimo e faixa aceitável.',
    ['vanwestendorp'],
    true
  ),
  'Newton-Miller-Smith Extension (NMS)': createMethodology(
    'price_nms',
    'pricing',
    'Extensão do PSM de Van Westendorp que adiciona intenção de compra às curvas de preço.',
    ['vanwestendorp']
  ),
  'Análise de Elasticidade-Preço da Demanda': createMethodology(
    'price_elasticidade',
    'pricing',
    'Modelagem da sensibilidade da intenção de compra a variações de preço por meio de simulações conjoint ou curvas de resposta.',
    ['cbc', 'gabor_granger', 'number'],
    true
  ),
  'Gabor-Granger Pricing': createMethodology(
    'price_gabor_granger',
    'pricing',
    'Técnica de escalonamento de preços em que o respondente avalia sua intenção de compra a diferentes níveis de preço apresentados sequencialmente.',
    ['gabor_granger'],
    true
  ),
  'Willingness to Pay (WTP) via Conjoint': createMethodology(
    'price_wtp_conjoint',
    'pricing',
    'Estimativa da disposição máxima a pagar por atributos específicos derivada das utilidades conjoint.',
    ['cbc']
  ),
} as const;

// ============================================================================
// NEW: NPS ANALYTICS METHODOLOGIES
// ============================================================================

export const METODOLOGIA_NPS = {
  'NPS Aprofundado com Drivers': createMethodology(
    'nps_aprofundado_drivers',
    'nps_analytics',
    'Análise além do índice agregado para identificar os drivers que diferenciam promotores de detratores.',
    ['nps', 'rating', 'likert'],
    true
  ),
  'NPS Transacional vs. Relacional': createMethodology(
    'nps_transacional_relacional',
    'nps_analytics',
    'Diferenciação entre NPS medido após interação específica e NPS de relacionamento geral com a marca.',
    ['nps'],
    true
  ),
  'Análise de Verbatim de Promotores e Detratores': createMethodology(
    'nps_verbatim',
    'nps_analytics',
    'Text mining aplicado às justificativas de score para extrair temas que motivam recomendação ou detração.',
    ['nps', 'text'],
    true
  ),
  'NPS por Segmento e Jornada': createMethodology(
    'nps_segmento_jornada',
    'nps_analytics',
    'Decomposição do NPS por perfil de cliente, região, canal e etapa da jornada.',
    ['nps', 'single', 'multiple'],
    true
  ),
} as const;

// ============================================================================
// NEW: EXPERIÊNCIA E JORNADA
// ============================================================================

export const METODOLOGIA_EXPERIENCIA = {
  'Customer Effort Score (CES) Analytics': createMethodology(
    'exp_ces',
    'experiencia',
    'Análise do esforço percebido em cada ponto de contato da jornada, identificando fricções que impactam a satisfação e retenção.',
    ['ces', 'rating', 'likert'],
    true
  ),
  'Customer Satisfaction Score (CSAT) Aprofundado': createMethodology(
    'exp_csat',
    'experiencia',
    'Análise granular do CSAT por etapa da jornada, canal e perfil de cliente.',
    ['csat', 'rating', 'likert'],
    true
  ),
  'Análise de Momentos da Verdade': createMethodology(
    'exp_momentos_verdade',
    'experiencia',
    'Mapeamento e priorização dos pontos de contato com maior impacto emocional e decisório na jornada.',
    ['rating', 'likert', 'single']
  ),
  'Jornada do Cliente Baseada em Dados': createMethodology(
    'exp_data_driven_journey',
    'experiencia',
    'Construção de mapas de jornada quantitativos a partir de dados de pesquisa.',
    ['rating', 'likert', 'single', 'multiple']
  ),
  'Job-to-be-Done Analytics': createMethodology(
    'exp_jtbd',
    'experiencia',
    'Análise quantitativa baseada no framework JTBD para identificar trabalhos funcionais, emocionais e sociais.',
    ['rating', 'likert', 'single', 'multiple']
  ),
} as const;

// ============================================================================
// NEW: MARCA E COMUNICAÇÃO
// ============================================================================

export const METODOLOGIA_MARCA = {
  'Brand Equity Tracking Quantitativo': createMethodology(
    'marca_brand_equity',
    'marca',
    'Mensuração longitudinal dos pilares de brand equity (awareness, associações, qualidade percebida, lealdade).',
    ['rating', 'likert', 'single', 'multiple', 'brand_funnel'],
    true
  ),
  'Brand Funnel Analytics': createMethodology(
    'marca_brand_funnel',
    'marca',
    'Análise de conversão ao longo do funil de brand (awareness → consideração → preferência → uso → recomendação).',
    ['brand_funnel', 'single', 'multiple'],
    true
  ),
  'Análise de Personalidade de Marca': createMethodology(
    'marca_personalidade',
    'marca',
    'Mensuração das dimensões de personalidade atribuídas a marcas e comparação entre competidores.',
    ['rating', 'likert', 'single', 'multiple']
  ),
  'Copy Testing Analytics': createMethodology(
    'marca_copy_testing',
    'marca',
    'Análise estruturada de peças criativas com métricas de atenção, compreensão, relevância e intenção.',
    ['rating', 'likert', 'single']
  ),
  'Análise de Congruência Marca-Consumidor': createMethodology(
    'marca_self_congruity',
    'marca',
    'Mensuração da correspondência entre imagem percebida da marca e autoimagem do consumidor.',
    ['rating', 'likert']
  ),
} as const;

// ============================================================================
// NEW: ANÁLISE DE KANO
// ============================================================================

export const METODOLOGIA_KANO = {
  'Análise de Kano Completa': createMethodology(
    'kano_full',
    'penalty',
    'Classificação de atributos em categorias funcionais (básicos, lineares, atrativos, indiferentes e reversos) com base em questionário funcional/disfuncional.',
    ['kano'],
    true
  ),
} as const;

// ============================================================================
// NEW: MEDIAÇÃO / MODERAÇÃO / SEM
// ============================================================================

export const METODOLOGIA_MEDIACAO = {
  'Mediação e Moderação': createMethodology(
    'med_mediacao_moderacao',
    'mediacao',
    'Mediação identifica o mecanismo causal; moderação identifica as condições em que a relação vale.',
    ['rating', 'likert', 'number']
  ),
  'Mediação em Série (Serial Mediation)': createMethodology(
    'med_serial_mediation',
    'mediacao',
    'Extensão da mediação simples para cadeias causais com múltiplos mediadores sequenciais.',
    ['rating', 'likert', 'number']
  ),
  'Moderação por Variáveis Contínuas (Floodlight Analysis)': createMethodology(
    'med_floodlight',
    'mediacao',
    'Identificação dos pontos exatos da escala onde o efeito muda de direção ou significância.',
    ['rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_SEM = {
  'SEM Clássico (LISREL / AMOS)': createMethodology(
    'sem_classico',
    'sem',
    'Teste simultâneo de relações causais entre variáveis latentes e observadas.',
    ['rating', 'likert', 'number']
  ),
  'PLS-SEM': createMethodology(
    'sem_pls',
    'sem',
    'Alternativa ao SEM para amostras menores ou normalidade não atendida.',
    ['rating', 'likert', 'number']
  ),
  'SEM Multigrupo (MSEM)': createMethodology(
    'sem_multigrupo',
    'sem',
    'Comparação de parâmetros estruturais entre grupos distintos.',
    ['rating', 'likert', 'number']
  ),
} as const;

// ============================================================================
// NEW: SOBREVIVÊNCIA / REDE / VALIDAÇÃO / ESTATÍSTICA AVANÇADA
// ============================================================================

export const METODOLOGIA_SOBREVIVENCIA = {
  'Modelagem de Tempo até Abandono / Churn': createMethodology(
    'surv_tempo_churn',
    'sobrevivencia',
    'Modelagem do tempo até abandono de marca ou descontinuidade de uso.',
    ['number', 'date', 'single']
  ),
  'Curvas de Kaplan-Meier': createMethodology(
    'surv_kaplan_meier',
    'sobrevivencia',
    'Estimativa não paramétrica da função de sobrevivência ao longo do tempo.',
    ['number', 'date', 'single']
  ),
  'Modelo de Cox (Cox Proportional Hazards)': createMethodology(
    'surv_cox',
    'sobrevivencia',
    'Regressão de sobrevivência que identifica variáveis que aumentam ou reduzem o risco de churn.',
    ['number', 'date', 'single', 'rating']
  ),
} as const;

export const METODOLOGIA_REDE = {
  'Mapeamento de Conexões entre Atributos e Marcas': createMethodology(
    'rede_conexoes',
    'rede',
    'Estruturas relacionais para entender quais atributos se associam e reforçam mutuamente.',
    ['single', 'multiple', 'rating']
  ),
  'Análise de Centralidade de Rede': createMethodology(
    'rede_centralidade',
    'rede',
    'Identificação dos atributos ou conceitos mais influentes na rede de percepções.',
    ['single', 'multiple', 'rating']
  ),
} as const;

export const METODOLOGIA_ESTATISTICA_AVANCADA = {
  'Análise Discriminante': createMethodology(
    'stat_discriminante',
    'estatistica_avancada',
    'Classificação de respondentes em grupos predefinidos com base em variáveis preditoras.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
  'Escalonamento Multidimensional (MDS)': createMethodology(
    'stat_mds',
    'estatistica_avancada',
    'Representação visual da percepção de similaridade e diferença entre marcas em mapa perceptual.',
    ['single', 'multiple', 'rating']
  ),
  'Análise de Séries Temporais (ARIMA / SARIMA)': createMethodology(
    'stat_arima',
    'estatistica_avancada',
    'Modelagem de tendências e sazonalidades para previsão de indicadores de brand tracking.',
    ['number', 'rating']
  ),
  'MANOVA': createMethodology(
    'stat_manova',
    'estatistica_avancada',
    'Comparação simultânea de múltiplas variáveis dependentes entre grupos.',
    ['rating', 'likert', 'number']
  ),
  'Alpha de Cronbach': createMethodology(
    'stat_cronbach_alpha',
    'estatistica_avancada',
    'Medida de consistência interna de escalas, avaliando coerência dos itens.',
    ['rating', 'likert'],
    true
  ),
  'Análise de Classes Latentes (LCA)': createMethodology(
    'stat_lca',
    'estatistica_avancada',
    'Identificação de subgrupos ocultos na população com base em padrões de resposta.',
    ['single', 'multiple', 'rating', 'likert']
  ),
  'Bootstrap e Reamostragem': createMethodology(
    'stat_bootstrap',
    'estatistica_avancada',
    'Estimativa de intervalos de confiança quando premissas paramétricas não são atendidas.',
    ['number', 'rating', 'likert'],
    true
  ),
  'Simulação de Monte Carlo': createMethodology(
    'stat_monte_carlo',
    'estatistica_avancada',
    'Geração de múltiplos cenários por amostragem de distribuições de probabilidade.',
    ['number', 'rating']
  ),
  'Análise Bayesiana': createMethodology(
    'stat_bayesiana',
    'estatistica_avancada',
    'Estimação de parâmetros incorporando conhecimento prévio.',
    ['number', 'rating', 'likert', 'cbc']
  ),
  'Logit / Probit Multinomial': createMethodology(
    'stat_logit_probit_multinomial',
    'estatistica_avancada',
    'Modelagem de escolha entre múltiplas alternativas mutuamente exclusivas.',
    ['single', 'multiple', 'cbc']
  ),
  'TRI / IRT (Teoria de Resposta ao Item)': createMethodology(
    'stat_irt',
    'estatistica_avancada',
    'Modelagem da relação entre traço latente e probabilidade de resposta a cada item.',
    ['rating', 'likert']
  ),
  'Shapley Values e Relative Importance Analysis': createMethodology(
    'stat_shapley',
    'estatistica_avancada',
    'Quantificação da contribuição relativa de cada variável preditora sobre a variável dependente, com base em teoria dos jogos cooperativos.',
    ['rating', 'likert', 'number'],
    true
  ),
  'SHAP (SHapley Additive exPlanations)': createMethodology(
    'stat_shap',
    'estatistica_avancada',
    'Interpretação granular de modelos de ML por meio de valores SHAP.',
    ['single', 'multiple', 'rating', 'likert', 'number']
  ),
} as const;

export const METODOLOGIA_VALIDACAO = {
  'Validação Cruzada (Cross-Validation k-fold)': createMethodology(
    'val_cross_validation',
    'validacao',
    'Avaliação da capacidade de generalização de modelos preditivos.',
    ['number', 'rating', 'likert']
  ),
  'Análise de Multicolinearidade (VIF)': createMethodology(
    'val_vif',
    'validacao',
    'Diagnóstico da colinearidade entre variáveis preditoras em modelos de regressão.',
    ['number', 'rating', 'likert']
  ),
  'Análise de Invariância de Medida': createMethodology(
    'val_invariancia',
    'validacao',
    'Teste de se uma escala mede o mesmo construto de forma equivalente em diferentes grupos.',
    ['rating', 'likert']
  ),
  'Análise de Curva ROC e AUC': createMethodology(
    'val_roc_auc',
    'validacao',
    'Avaliação da capacidade discriminante de modelos de classificação.',
    ['single', 'multiple', 'boolean']
  ),
  'Análise de Precisão e Recall (F1-Score)': createMethodology(
    'val_f1_score',
    'validacao',
    'Avaliação balanceada de modelos de classificação com classes desequilibradas.',
    ['single', 'multiple', 'boolean']
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
  ...METODOLOGIA_CAUSALIDADE,
  ...METODOLOGIA_COMPORTAMENTAL,
  ...METODOLOGIA_MERCADO,
  ...METODOLOGIA_VALOR_CLIENTE,
  ...METODOLOGIA_PRICING,
  ...METODOLOGIA_NPS,
  ...METODOLOGIA_EXPERIENCIA,
  ...METODOLOGIA_MARCA,
  ...METODOLOGIA_KANO,
  ...METODOLOGIA_MEDIACAO,
  ...METODOLOGIA_SEM,
  ...METODOLOGIA_SOBREVIVENCIA,
  ...METODOLOGIA_REDE,
  ...METODOLOGIA_ESTATISTICA_AVANCADA,
  ...METODOLOGIA_VALIDACAO,
} as const;

export type SpecificMethodologyKey = keyof typeof ALL_METHODOLOGIES;

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  descritiva: 'Análises Descritivas e de Perfil',
  comparativa: 'Análises Comparativas',
  preditiva: 'Análises Explicativas e Preditivas',
  fatorial: 'Análise Fatorial e Componentes Principais',
  penalty: 'Análises de Penalty (Impacto / Importância x Performance)',
  cluster: 'Análises de Clusterização e Tipologias',
  text: 'Análise de Texto (Text Mining e NLP)',
  intencao: 'Análises de Intenção e Barreiras',
  causalidade: 'Análises de Propensão e Causalidade',
  comportamental: 'Análises Comportamentais e Experimentais',
  mercado: 'Análises de Mercado e Competição',
  valor_cliente: 'Análises de Valor do Cliente e Retenção',
  pricing: 'Análise de Sensibilidade de Preço',
  nps_analytics: 'NPS Analytics',
  experiencia: 'Análises de Experiência e Jornada do Consumidor',
  marca: 'Análises de Marca e Comunicação',
  mediacao: 'Análise de Mediação e Moderação',
  sem: 'Modelagem de Equações Estruturais (SEM)',
  sobrevivencia: 'Análise de Sobrevivência',
  rede: 'Análise de Redes',
  estatistica_avancada: 'Análises Estatísticas Avançadas',
  validacao: 'Métricas e Validação de Modelos',
};

export const getAllCategories = (): CategoryType[] => {
  const categories = new Set<CategoryType>();
  Object.values(ALL_METHODOLOGIES).forEach(m => categories.add(m.category));
  return Array.from(categories);
};

export const getMethodologiesByCategory = (category: CategoryType): MethodologyInfo[] => {
  return Object.values(ALL_METHODOLOGIES).filter(m => m.category === category);
};

export const getApplicableMethodologies = (questionType: string): MethodologyInfo[] => {
  return Object.values(ALL_METHODOLOGIES).filter(m => 
    m.applicableQuestionTypes.includes(questionType)
  );
};
