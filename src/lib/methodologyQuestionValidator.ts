/**
 * Validador de Tipos de Perguntas por Metodologia
 * Fornece recomendações automáticas de tipos de perguntas
 */

export type QuestionType =
  | 'text'
  | 'single_choice'
  | 'multiple_choice'
  | 'matrix'
  | 'rating'
  | 'scale'
  | 'slider'
  | 'nps'
  | 'ranking'
  | 'conjoint'
  | 'maxdiff'
  | 'vanwestendorp'
  | 'kano'
  | 'ces'
  | 'csat'
  | 'gabor_granger'
  | 'image_choice'
  | 'file_upload'
  | 'email'
  | 'phone'
  | 'number'
  | 'date';

export type MethodologyType =
  | 'frequency_distribution'
  | 'descriptive_stats'
  | 'clustering'
  | 'outlier_detection'
  | 't_test'
  | 'anova'
  | 'chi_square'
  | 'linear_regression'
  | 'logistic_regression'
  | 'pca'
  | 'factor_analysis'
  | 'penalty_analysis'
  | 'importance_satisfaction'
  | 'gap_analysis'
  | 'kano_analysis'
  | 'van_westendorp'
  | 'gabor_granger'
  | 'nps_analysis'
  | 'ces_analysis'
  | 'csat_analysis'
  | 'conversion_funnel'
  | 'sentiment_analysis'
  | 'kmeans'
  | 'conjoint_simulation'
  | 'maxdiff_analysis'
  | 'brand_equity'
  | 'network_analysis'
  | 'survival_analysis'
  | 'mediation_analysis'
  | 'sem_analysis'
  | 'propensity_score'
  | 'difference_in_differences'
  | 'uplift_modeling'
  | 'turf_analysis'
  | 'shapley_values'
  | 'brand_funnel'
  | 'cluster_stability';

export interface QuestionRequirement {
  questionType: QuestionType;
  minQuestions: number;
  maxQuestions?: number;
  description: string;
  example: string;
}

export interface MethodologyRequirements {
  methodology: MethodologyType;
  minResponses: number;
  requiredQuestionTypes: QuestionRequirement[];
  optionalQuestionTypes: QuestionType[];
  validationNotes: string;
}

/**
 * Mapa de requisitos por metodologia
 */
export const METHODOLOGY_REQUIREMENTS: Record<MethodologyType, MethodologyRequirements> = {
  frequency_distribution: {
    methodology: 'frequency_distribution',
    minResponses: 5,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 1,
        description: 'Pergunta com opções para distribuição de frequência',
        example: 'Qual é seu gênero?',
      },
    ],
    optionalQuestionTypes: ['multiple_choice', 'rating'],
    validationNotes: 'Qualquer tipo de pergunta com respostas categóricas ou numéricas funciona.',
  },

  descriptive_stats: {
    methodology: 'descriptive_stats',
    minResponses: 5,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 1,
        description: 'Pergunta com escala numérica (1-10 ou similar)',
        example: 'Qual sua satisfação de 1 a 10?',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider', 'number'],
    validationNotes: 'Requer dados numéricos para calcular média, mediana, desvio padrão.',
  },

  clustering: {
    methodology: 'clustering',
    minResponses: 20,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 3,
        description: 'Múltiplas escalas para identificar padrões',
        example: 'Avalie qualidade, preço, design (1-10)',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Quanto mais variáveis numéricas, melhor a qualidade do clustering.',
  },

  outlier_detection: {
    methodology: 'outlier_detection',
    minResponses: 10,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 1,
        description: 'Dados numéricos para detecção de outliers',
        example: 'Escala de satisfação',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider', 'number'],
    validationNotes: 'Identifica respostas atípicas automaticamente.',
  },

  t_test: {
    methodology: 't_test',
    minResponses: 10,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 1,
        description: 'Variável de segmentação (grupos)',
        example: 'Qual é seu gênero?',
      },
      {
        questionType: 'rating',
        minQuestions: 1,
        description: 'Variável contínua para comparação',
        example: 'Satisfação geral (1-10)',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Compara médias entre 2 grupos.',
  },

  anova: {
    methodology: 'anova',
    minResponses: 15,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 1,
        description: 'Variável de segmentação (3+ grupos)',
        example: 'Faixa etária',
      },
      {
        questionType: 'rating',
        minQuestions: 1,
        description: 'Variável contínua para comparação',
        example: 'Satisfação (1-10)',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Compara médias entre 3 ou mais grupos.',
  },

  chi_square: {
    methodology: 'chi_square',
    minResponses: 20,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 2,
        description: 'Variáveis categóricas',
        example: 'Gênero e Resposta (Sim/Não)',
      },
    ],
    optionalQuestionTypes: ['multiple_choice'],
    validationNotes: 'Testa independência entre variáveis categóricas.',
  },

  linear_regression: {
    methodology: 'linear_regression',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 2,
        description: 'Variáveis independentes (numéricos)',
        example: 'Qualidade, Preço (1-10)',
      },
      {
        questionType: 'rating',
        minQuestions: 1,
        description: 'Variável dependente (numérico)',
        example: 'Intenção de compra (1-10)',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider', 'number'],
    validationNotes: 'Requer 2+ variáveis independentes e 1 dependente.',
  },

  kano_analysis: {
    methodology: 'kano_analysis',
    minResponses: 20,
    requiredQuestionTypes: [
      {
        questionType: 'kano',
        minQuestions: 1,
        description: 'Questão Kano com pares de cenários',
        example: 'Se tivesse X vs se não tivesse X',
      },
    ],
    optionalQuestionTypes: [],
    validationNotes: 'Classifica atributos em básicos, lineares, atrativos.',
  },

  van_westendorp: {
    methodology: 'van_westendorp',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'vanwestendorp',
        minQuestions: 1,
        description: 'Questão com 4 faixas de preço',
        example: 'Preço muito caro / caro / barato / muito barato',
      },
    ],
    optionalQuestionTypes: [],
    validationNotes: 'Identifica range de preço ótimo.',
  },

  gabor_granger: {
    methodology: 'gabor_granger',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'gabor_granger',
        minQuestions: 1,
        description: 'Sequência de pontos de preço com intenção',
        example: 'Compraria a R$10? R$20? R$30?',
      },
    ],
    optionalQuestionTypes: [],
    validationNotes: 'Modela curva de demanda por preço.',
  },

  nps_analysis: {
    methodology: 'nps_analysis',
    minResponses: 10,
    requiredQuestionTypes: [
      {
        questionType: 'nps',
        minQuestions: 1,
        description: 'Pergunta NPS (0-10)',
        example: 'Qual a probabilidade de recomendar? (0-10)',
      },
    ],
    optionalQuestionTypes: ['text'],
    validationNotes: 'Calcula NPS geral e por segmentos.',
  },

  sentiment_analysis: {
    methodology: 'sentiment_analysis',
    minResponses: 10,
    requiredQuestionTypes: [
      {
        questionType: 'text',
        minQuestions: 1,
        description: 'Resposta aberta para análise de sentimento',
        example: 'O que você acha do nosso produto?',
      },
    ],
    optionalQuestionTypes: [],
    validationNotes: 'Detecta sentimento positivo/neutro/negativo.',
  },

  conjoint_simulation: {
    methodology: 'conjoint_simulation',
    minResponses: 40,
    requiredQuestionTypes: [
      {
        questionType: 'conjoint',
        minQuestions: 1,
        description: 'Questão com perfis de produto',
        example: 'Qual perfil de produto você prefere?',
      },
    ],
    optionalQuestionTypes: [],
    validationNotes: 'Estima preferência por atributos do produto.',
  },

  maxdiff_analysis: {
    methodology: 'maxdiff_analysis',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'maxdiff',
        minQuestions: 1,
        description: 'Pergunta de melhor vs pior',
        example: 'Qual é o atributo mais e menos importante?',
      },
    ],
    optionalQuestionTypes: [],
    validationNotes: 'Hierarquia de preferências robusta.',
  },

  ces_analysis: {
    methodology: 'ces_analysis',
    minResponses: 20,
    requiredQuestionTypes: [
      {
        questionType: 'ces',
        minQuestions: 1,
        description: 'Pergunta de esforço percebido',
        example: 'Foi fácil/difícil usar nosso serviço?',
      },
    ],
    optionalQuestionTypes: [],
    validationNotes: 'Mede facilidade de interação.',
  },

  csat_analysis: {
    methodology: 'csat_analysis',
    minResponses: 20,
    requiredQuestionTypes: [
      {
        questionType: 'csat',
        minQuestions: 1,
        description: 'Pergunta de satisfação',
        example: 'Qual seu nível de satisfação? (1-5)',
      },
    ],
    optionalQuestionTypes: ['rating'],
    validationNotes: 'Mede satisfação transacional.',
  },

  conversion_funnel: {
    methodology: 'conversion_funnel',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 3,
        description: 'Etapas do funil (awareness, consideração, compra)',
        example: 'Conhece? Considera? Comprou?',
      },
    ],
    optionalQuestionTypes: ['multiple_choice'],
    validationNotes: 'Identifica gargalos de conversão.',
  },

  importance_satisfaction: {
    methodology: 'importance_satisfaction',
    minResponses: 20,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 2,
        description: 'Uma para importância, outra para satisfação',
        example: 'Importância do atributo vs Satisfação',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Cria matriz de priorização.',
  },

  gap_analysis: {
    methodology: 'gap_analysis',
    minResponses: 20,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 2,
        description: 'Uma para expectativa, outra para realidade',
        example: 'Expectativa vs Entrega',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Quantifica gaps de expectativa.',
  },

  penalty_analysis: {
    methodology: 'penalty_analysis',
    minResponses: 20,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 1,
        description: 'Atributos como opções',
        example: 'Qual atributo não pode faltar?',
      },
      {
        questionType: 'rating',
        minQuestions: 1,
        description: 'Satisfação geral',
        example: 'Satisfação (1-10)',
      },
    ],
    optionalQuestionTypes: ['multiple_choice'],
    validationNotes: 'Identifica atributos básicos vs diferenciais.',
  },

  brand_equity: {
    methodology: 'brand_equity',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 3,
        description: 'Avaliações de marca em diferentes dimensões',
        example: 'Qualidade percebida, lealdade, consciência',
      },
    ],
    optionalQuestionTypes: ['scale', 'single_choice'],
    validationNotes: 'Mede valor total da marca.',
  },

  brand_funnel: {
    methodology: 'brand_funnel',
    minResponses: 40,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 4,
        description: 'Etapas do funil de marca',
        example: 'Awareness, Consideration, Preference, Usage',
      },
    ],
    optionalQuestionTypes: [],
    validationNotes: 'Mapeia jornada de marca.',
  },

  shapley_values: {
    methodology: 'shapley_values',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 3,
        description: 'Múltiplas variáveis preditoras',
        example: 'Qualidade, Preço, Serviço como preditores de Satisfação',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Distribui importância relativa fairly.',
  },

  network_analysis: {
    methodology: 'network_analysis',
    minResponses: 40,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 5,
        description: 'Múltiplas atributos correlacionados',
        example: 'Vários atributos de marca/produto',
      },
    ],
    optionalQuestionTypes: ['scale', 'multiple_choice'],
    validationNotes: 'Mapeia conexões entre atributos.',
  },

  survival_analysis: {
    methodology: 'survival_analysis',
    minResponses: 50,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 1,
        description: 'Evento de churn/retenção',
        example: 'Ainda usa o produto? Sim/Não',
      },
    ],
    optionalQuestionTypes: ['date', 'number'],
    validationNotes: 'Modela risco de abandono ao longo do tempo.',
  },

  mediation_analysis: {
    methodology: 'mediation_analysis',
    minResponses: 40,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 3,
        description: 'Variável independente, mediador, dependente',
        example: 'Preço → Percepção Qualidade → Intenção Compra',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Identifica mecanismos causais.',
  },

  sem_analysis: {
    methodology: 'sem_analysis',
    minResponses: 60,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 5,
        description: 'Múltiplas variáveis com relações teóricas',
        example: 'Variáveis observadas e latentes',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Testa modelos estruturais complexos.',
  },

  propensity_score: {
    methodology: 'propensity_score',
    minResponses: 50,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 1,
        description: 'Variável de tratamento/grupo',
        example: 'Recebeu promoção? Sim/Não',
      },
      {
        questionType: 'rating',
        minQuestions: 2,
        description: 'Covariáveis de ajuste',
        example: 'Características do cliente',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Controla viés de seleção.',
  },

  difference_in_differences: {
    methodology: 'difference_in_differences',
    minResponses: 60,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 2,
        description: 'Antes/Depois e Tratado/Controle',
        example: 'Período e Grupo de intervenção',
      },
      {
        questionType: 'rating',
        minQuestions: 1,
        description: 'Variável de resultado',
        example: 'Outcome (1-10)',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Estima efeito causal de intervenção.',
  },

  uplift_modeling: {
    methodology: 'uplift_modeling',
    minResponses: 50,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 1,
        description: 'Indicador de tratamento',
        example: 'Recebeu campanha? Sim/Não',
      },
      {
        questionType: 'rating',
        minQuestions: 1,
        description: 'Métrica de resposta',
        example: 'Propensão de compra (1-10)',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Estima efeito incremental heterogêneo.',
  },

  turf_analysis: {
    methodology: 'turf_analysis',
    minResponses: 40,
    requiredQuestionTypes: [
      {
        questionType: 'multiple_choice',
        minQuestions: 1,
        description: 'Preferências múltiplas de itens',
        example: 'Qual combinação de atributos você quer?',
      },
    ],
    optionalQuestionTypes: [],
    validationNotes: 'Otimiza portfólio de produtos/atributos.',
  },

  cluster_stability: {
    methodology: 'cluster_stability',
    minResponses: 50,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 4,
        description: 'Múltiplas variáveis para clusterização',
        example: 'Atributos de segmentação',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Valida robustez de clusters.',
  },

  pca: {
    methodology: 'pca',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 4,
        description: 'Múltiplas variáveis correlacionadas',
        example: 'Atributos de produto (1-10)',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Reduz dimensionalidade.',
  },

  factor_analysis: {
    methodology: 'factor_analysis',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 5,
        description: 'Bateria de atributos',
        example: 'Escala de atributos (1-10)',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Identifica fatores latentes.',
  },

  kmeans: {
    methodology: 'kmeans',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'rating',
        minQuestions: 3,
        description: 'Múltiplas dimensões de segmentação',
        example: 'Comportamento, perfil, atitudes',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider'],
    validationNotes: 'Cria segmentos homogêneos.',
  },

  logistic_regression: {
    methodology: 'logistic_regression',
    minResponses: 30,
    requiredQuestionTypes: [
      {
        questionType: 'single_choice',
        minQuestions: 1,
        description: 'Variável dependente binária',
        example: 'Comprou? Sim/Não',
      },
      {
        questionType: 'rating',
        minQuestions: 2,
        description: 'Variáveis independentes',
        example: 'Preço, Qualidade (1-10)',
      },
    ],
    optionalQuestionTypes: ['scale', 'slider', 'number'],
    validationNotes: 'Prediz probabilidade de evento binário.',
  },
};

/**
 * Validador de projeto por metodologias selecionadas
 */
export class MethodologyValidator {
  /**
   * Validar se o projeto atende requisitos de metodologias
   */
  static validateProject(
    questions: Array<{ id: string; type: QuestionType }>,
    responses: Array<any>,
    selectedMethodologies: MethodologyType[]
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    selectedMethodologies.forEach(methodology => {
      const requirements = METHODOLOGY_REQUIREMENTS[methodology];
      if (!requirements) return;

      // Check min responses
      if (responses.length < requirements.minResponses) {
        errors.push(
          `${methodology}: Mínimo ${requirements.minResponses} respostas (você tem ${responses.length})`
        );
      }

      // Check required question types
      requirements.requiredQuestionTypes.forEach(req => {
        const matchingQuestions = questions.filter(q => q.type === req.questionType);
        if (matchingQuestions.length < req.minQuestions) {
          errors.push(
            `${methodology}: Requer ${req.minQuestions} pergunta(s) do tipo "${req.questionType}" (${req.description})`
          );
        }
      });

      // Recommendations for optional types
      if (requirements.optionalQuestionTypes.length > 0) {
        const hasOptional = requirements.optionalQuestionTypes.some(
          type => questions.findIndex(q => q.type === type) !== -1
        );
        if (!hasOptional) {
          recommendations.push(
            `${methodology}: Considere adicionar perguntas dos tipos ${requirements.optionalQuestionTypes.join(', ')} para melhorar a análise`
          );
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  /**
   * Sugerir metodologias baseadas em tipos de perguntas
   */
  static suggestMethodologies(questions: Array<{ type: QuestionType }>): MethodologyType[] {
    const suggestions: MethodologyType[] = [];
    const questionTypes = new Set(questions.map(q => q.type));

    // Rule-based suggestions
    if (questionTypes.has('rating') || questionTypes.has('scale')) {
      suggestions.push('descriptive_stats', 'linear_regression', 't_test', 'shapley_values');
    }

    if (questionTypes.has('nps')) {
      suggestions.push('nps_analysis');
    }

    if (questionTypes.has('text')) {
      suggestions.push('sentiment_analysis');
    }

    if (questionTypes.has('single_choice')) {
      suggestions.push('frequency_distribution', 'chi_square');
    }

    if (questionTypes.has('conjoint')) {
      suggestions.push('conjoint_simulation');
    }

    if (questionTypes.has('maxdiff')) {
      suggestions.push('maxdiff_analysis');
    }

    if (questionTypes.has('vanwestendorp')) {
      suggestions.push('van_westendorp');
    }

    if (questionTypes.size >= 3) {
      suggestions.push('clustering', 'network_analysis', 'factor_analysis', 'pca');
    }

    return [...new Set(suggestions)];
  }

  /**
   * Obter recomendações de tipos de perguntas para uma metodologia
   */
  static getRecommendedQuestionTypes(methodology: MethodologyType): {
    required: QuestionRequirement[];
    optional: QuestionType[];
  } {
    const requirements = METHODOLOGY_REQUIREMENTS[methodology];
    if (!requirements) {
      return { required: [], optional: [] };
    }

    return {
      required: requirements.requiredQuestionTypes,
      optional: requirements.optionalQuestionTypes,
    };
  }
}

// Export para uso em componentes
export default MethodologyValidator;
