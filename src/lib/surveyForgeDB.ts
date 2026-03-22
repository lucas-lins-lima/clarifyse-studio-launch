export interface QuotaGroup {
  name: string;
  codes: (number | string)[];
  target: number;
}

export interface Quota {
  id: string;
  name: string;
  questionCode: string;
  questionName: string;
  groups: QuotaGroup[];
  type: 'numeric' | 'age_range' | 'text' | 'boolean';
}

export interface QuestionOption {
  code: number | string;
  label: string;
}

export interface BranchingRule {
  answerCode: number | string;
  jumpToQuestionId: string;
}

export interface FormQuestion {
  id: string;
  type:
    | 'single_choice'
    | 'multiple_choice'
    | 'likert'
    | 'nps'
    | 'rating'
    | 'ranking'
    | 'matrix'
    | 'open_text'
    | 'number'
    | 'date'
    | 'boolean'
    | 'image_upload'
    | 'conjoint'
    | 'maxdiff'
    | 'image_choice';
  text: string;
  variableCode: string;
  options?: QuestionOption[];
  required: boolean;
  helpText?: string;
  branchingRules?: BranchingRule[];
  scale?: number;
  matrixRows?: string[];
  matrixColumns?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface Response {
  id: string;
  timestamp: string;
  answers: Record<string, number | string | number[] | string[]>;
  quotaGroup: string;
  timeSpentSeconds: number;
  projectId: string;
  qualityFlag: 'OK' | 'SUSPEITA' | 'INVÁLIDA';
  quotaProfile?: Record<string, string>;
}

export interface Project {
  id: string;
  name: string;
  objective: string;
  sampleSize: number;
  pilar: 'DISCOVER' | 'BRAND' | 'INNOVATE' | 'DECIDE' | 'EXPERIENCE' | 'ANALYTICS';
  quotas: Quota[];
  formQuestions: FormQuestion[];
  responses: Response[];
  status: 'Rascunho' | 'Formulário Pronto' | 'Em Campo' | 'Análise Disponível' | 'Encerrado';
  createdAt: string;
  lastResponseAt?: string;
}

export interface SurveyForgeDB {
  projects: Project[];
  settings: {
    nomeEmpresa: string;
    slogan: string;
  };
}

const DB_KEY = 'surveyForgeDB';

export function loadDB(): SurveyForgeDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      return JSON.parse(raw) as SurveyForgeDB;
    }
  } catch {
    // ignore
  }

  const initialDB: SurveyForgeDB = {
    projects: [
      {
        id: 'demo-project-001',
        name: 'Pesquisa de Satisfação — Clarifyse Q4',
        objective: 'Avaliar a satisfação dos consumidores com as principais marcas do setor de cosméticos e identificar oportunidades de crescimento para a Avon no mercado brasileiro.',
        sampleSize: 500,
        pilar: 'BRAND',
        quotas: [
          {
            id: 'quota-1',
            name: 'Gênero',
            questionCode: 'q_genero',
            questionName: 'Gênero',
            type: 'numeric',
            groups: [
              { name: 'Feminino', codes: [1], target: 300 },
              { name: 'Masculino', codes: [2], target: 200 },
            ],
          },
          {
            id: 'quota-2',
            name: 'Usuário Avon vs Concorrentes',
            questionCode: 'q_marca_atual',
            questionName: 'Qual sua marca atual?',
            type: 'numeric',
            groups: [
              { name: 'Usuário Avon', codes: [1], target: 250 },
              { name: 'Concorrentes', codes: [2, 3, 4, 5, 6, 7], target: 250 },
            ],
          },
        ],
        formQuestions: [
          {
            id: 'q1',
            type: 'single_choice',
            text: 'Qual é o seu gênero?',
            variableCode: 'q_genero',
            required: true,
            options: [
              { code: 1, label: 'Feminino' },
              { code: 2, label: 'Masculino' },
              { code: 3, label: 'Prefiro não informar' },
            ],
          },
          {
            id: 'q2',
            type: 'single_choice',
            text: 'Qual é a sua faixa etária?',
            variableCode: 'q_faixa_etaria',
            required: true,
            options: [
              { code: 1, label: '18 a 24 anos' },
              { code: 2, label: '25 a 34 anos' },
              { code: 3, label: '35 a 44 anos' },
              { code: 4, label: '45 a 54 anos' },
              { code: 5, label: '55 anos ou mais' },
            ],
          },
          {
            id: 'q3',
            type: 'single_choice',
            text: 'Qual é a sua marca de cosméticos atual?',
            variableCode: 'q_marca_atual',
            required: true,
            options: [
              { code: 1, label: 'Avon' },
              { code: 2, label: 'Natura' },
              { code: 3, label: 'O Boticário' },
              { code: 4, label: 'Mary Kay' },
              { code: 5, label: 'L\'Oréal' },
              { code: 6, label: 'Nivea' },
              { code: 7, label: 'Outra' },
            ],
          },
          {
            id: 'q4',
            type: 'nps',
            text: 'Em uma escala de 0 a 10, o quanto você recomendaria a Avon para um amigo ou familiar?',
            variableCode: 'q_nps_avon',
            required: true,
          },
          {
            id: 'q5',
            type: 'likert',
            text: 'Como você avalia a qualidade dos produtos Avon?',
            variableCode: 'q_qualidade_avon',
            required: true,
            scale: 5,
            options: [
              { code: 1, label: 'Muito ruim' },
              { code: 2, label: 'Ruim' },
              { code: 3, label: 'Regular' },
              { code: 4, label: 'Bom' },
              { code: 5, label: 'Muito bom' },
            ],
          },
          {
            id: 'q6',
            type: 'open_text',
            text: 'Quais são os principais motivos que te levam a escolher sua marca preferida?',
            variableCode: 'q_motivos_escolha',
            required: false,
            helpText: 'Descreva com suas próprias palavras',
          },
        ],
        responses: generateDemoResponses('demo-project-001', 347),
        status: 'Em Campo',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        lastResponseAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-project-002',
        name: 'Mapeamento de Marca — Natura 2025',
        objective: 'Mapear a percepção de marca da Natura entre consumidores millennials e Gen-Z para embasar estratégia de comunicação 2025.',
        sampleSize: 200,
        pilar: 'DISCOVER',
        quotas: [
          {
            id: 'quota-3',
            name: 'Faixa Etária',
            questionCode: 'q_faixa_etaria',
            questionName: 'Faixa Etária',
            type: 'numeric',
            groups: [
              { name: 'Millennials (25-40)', codes: [2, 3], target: 100 },
              { name: 'Gen-Z (18-24)', codes: [1], target: 100 },
            ],
          },
        ],
        formQuestions: [
          {
            id: 'q1',
            type: 'single_choice',
            text: 'Qual é a sua faixa etária?',
            variableCode: 'q_faixa_etaria',
            required: true,
            options: [
              { code: 1, label: '18 a 24 anos' },
              { code: 2, label: '25 a 34 anos' },
              { code: 3, label: '35 a 40 anos' },
            ],
          },
          {
            id: 'q2',
            type: 'rating',
            text: 'Como você avalia a Natura em sustentabilidade?',
            variableCode: 'q_sustentabilidade',
            required: true,
            minValue: 1,
            maxValue: 5,
          },
          {
            id: 'q3',
            type: 'open_text',
            text: 'O que vem à sua mente quando pensa na marca Natura?',
            variableCode: 'q_associacoes_natura',
            required: true,
          },
        ],
        responses: generateDemoResponses('demo-project-002', 89),
        status: 'Em Campo',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastResponseAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-project-003',
        name: 'Teste de Conceito — Linha Premium',
        objective: 'Avaliar receptividade a uma nova linha premium de produtos da Avon entre consumidoras de alta renda.',
        sampleSize: 150,
        pilar: 'INNOVATE',
        quotas: [],
        formQuestions: [],
        responses: [],
        status: 'Rascunho',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    settings: {
      nomeEmpresa: 'Clarifyse Strategy & Research',
      slogan: 'Where questions become clarity.',
    },
  };

  saveDB(initialDB);
  return initialDB;
}

function generateDemoResponses(projectId: string, count: number): Response[] {
  const responses: Response[] = [];
  const quotaGroups = ['Feminino', 'Masculino', 'Usuário Avon', 'Concorrentes', 'Millennials (25-40)', 'Gen-Z (18-24)'];
  const openTexts = [
    'Qualidade superior e preço justo',
    'Tradição e confiança na marca',
    'Variedade de produtos e inovação',
    'Sustentabilidade e responsabilidade social',
    'Preço acessível e boa relação custo-benefício',
    'Atendimento excelente e facilidade de compra',
  ];

  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 15);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000)).toISOString();
    const timeSpent = 60 + Math.floor(Math.random() * 300);
    const qualityOptions: Response['qualityFlag'][] = ['OK', 'OK', 'OK', 'OK', 'SUSPEITA', 'INVÁLIDA'];
    const quality = qualityOptions[Math.floor(Math.random() * qualityOptions.length)];

    responses.push({
      id: `resp-${projectId}-${i}`,
      timestamp,
      answers: {
        q_genero: Math.random() > 0.4 ? 1 : 2,
        q_faixa_etaria: Math.floor(Math.random() * 5) + 1,
        q_marca_atual: Math.floor(Math.random() * 7) + 1,
        q_nps_avon: Math.floor(Math.random() * 11),
        q_qualidade_avon: Math.floor(Math.random() * 5) + 1,
        q_motivos_escolha: openTexts[Math.floor(Math.random() * openTexts.length)],
        q_sustentabilidade: Math.floor(Math.random() * 5) + 1,
        q_associacoes_natura: openTexts[Math.floor(Math.random() * openTexts.length)],
      },
      quotaGroup: quotaGroups[Math.floor(Math.random() * quotaGroups.length)],
      timeSpentSeconds: timeSpent,
      projectId,
      qualityFlag: quality,
    });
  }

  return responses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function saveDB(data: SurveyForgeDB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export function getProjectById(id: string): Project | undefined {
  const db = loadDB();
  return db.projects.find((p) => p.id === id);
}

export function addResponse(projectId: string, answersObject: Response): void {
  const db = loadDB();
  const project = db.projects.find((p) => p.id === projectId);
  if (project) {
    project.responses.push(answersObject);
    project.lastResponseAt = new Date().toISOString();
    if (project.status === 'Formulário Pronto') {
      project.status = 'Em Campo';
    }
    saveDB(db);
  }
}

export function deleteProject(projectId: string): void {
  const db = loadDB();
  db.projects = db.projects.filter((p) => p.id !== projectId);
  saveDB(db);
}

export function resetProjectResponses(projectId: string): void {
  const db = loadDB();
  const project = db.projects.find((p) => p.id === projectId);
  if (project) {
    project.responses = [];
    project.lastResponseAt = undefined;
    if (project.status === 'Em Campo' || project.status === 'Análise Disponível') {
      project.status = 'Formulário Pronto';
    }
    saveDB(db);
  }
}

export function createProject(data: Omit<Project, 'id' | 'responses' | 'createdAt' | 'quotas' | 'formQuestions'>): Project {
  const db = loadDB();
  const newProject: Project = {
    ...data,
    id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    quotas: [],
    formQuestions: [],
    responses: [],
    createdAt: new Date().toISOString(),
  };
  db.projects.unshift(newProject);
  saveDB(db);
  return newProject;
}

export function updateProject(projectId: string, updates: Partial<Project>): void {
  const db = loadDB();
  const idx = db.projects.findIndex((p) => p.id === projectId);
  if (idx !== -1) {
    db.projects[idx] = { ...db.projects[idx], ...updates };
    saveDB(db);
  }
}
