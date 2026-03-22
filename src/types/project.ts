export type ProjectStatus =
  | 'Briefing'
  | 'Elaboração do Instrumento'
  | 'Campo'
  | 'Análise dos Dados'
  | 'Produção do Entregável'
  | 'Entrega Final'
  | 'Encerrado'
  | 'Pausado';

export type ProjectPilar =
  | 'DISCOVER'
  | 'BRAND'
  | 'INNOVATE'
  | 'DECIDE'
  | 'EXPERIENCE'
  | 'ANALYTICS';

export const PROJECT_STATUS_LIST: ProjectStatus[] = [
  'Briefing',
  'Elaboração do Instrumento',
  'Campo',
  'Análise dos Dados',
  'Produção do Entregável',
  'Entrega Final',
  'Encerrado',
  'Pausado',
];

export const PROJECT_PILAR_LIST: ProjectPilar[] = [
  'DISCOVER',
  'BRAND',
  'INNOVATE',
  'DECIDE',
  'EXPERIENCE',
  'ANALYTICS',
];

export const METODOLOGIA_OPTIONS = [
  'Pesquisa Qualitativa',
  'Pesquisa Quantitativa',
  'Pesquisa Mista',
  'Ciência de Dados / Analytics',
];

export interface Project {
  id: string;
  nome: string;
  cliente_empresa: string | null;
  objetivo: string | null;
  metodologia: string[];
  pilar: ProjectPilar | null;
  status: ProjectStatus;
  data_inicio: string | null;
  data_entrega_prevista: string | null;
  gerente_id: string | null;
  observacoes_internas: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithGerente extends Project {
  gerente_name?: string | null;
}

export interface ProjectHistory {
  id: string;
  project_id: string;
  descricao: string;
  user_id: string | null;
  created_at: string;
}

export interface GerenteProfile {
  id: string;
  name: string;
  email: string;
}

export type ScheduleStatus = 'Concluída' | 'Em Andamento' | 'Pendente' | 'Atrasada';

export interface ScheduleItem {
  id: string;
  project_id: string;
  nome: string;
  ordem: number;
  inicio_previsto: string | null;
  conclusao_prevista: string | null;
  inicio_real: string | null;
  conclusao_real: string | null;
  status: ScheduleStatus | null;
  status_manual: boolean;
  visivel: boolean;
  created_at: string;
  updated_at: string;
}

export type ScheduleItemDraft = Omit<ScheduleItem, 'project_id' | 'created_at' | 'updated_at'>;

// --- Phase 6: Field Monitoring ---

export type QuotaType = 'numerico' | 'faixa_etaria' | 'texto' | 'booleano';
export type IntegrationMode = 'sheets' | 'manual';

export interface QuotaSubcategoria {
  rotulo: string;
  valor: string;
  meta: number;
}

export interface QuotaFaixa {
  rotulo: string;
  min: number;
  max: number;
  meta: number;
}

export interface QuotaCategoria {
  valor: string;
  meta: number;
}

export interface QuotaConfigNumerico {
  subcategorias: QuotaSubcategoria[];
}

export interface QuotaConfigFaixaEtaria {
  faixas: QuotaFaixa[];
}

export interface QuotaConfigTexto {
  categorias: QuotaCategoria[];
}

export interface QuotaConfigBooleano {
  valor_sim: string;
  valor_nao: string;
  meta_sim: number;
  meta_nao: number;
}

export type QuotaConfig =
  | QuotaConfigNumerico
  | QuotaConfigFaixaEtaria
  | QuotaConfigTexto
  | QuotaConfigBooleano;

export interface FieldQuota {
  id: string;
  project_id: string;
  nome: string;
  tipo: QuotaType;
  coluna_planilha: string | null;
  ordem: number;
  config: QuotaConfig;
  created_at: string;
}

export interface FieldQuotaResult {
  id: string;
  quota_id: string;
  subcategoria: string;
  meta: number;
  realizado: number;
  updated_at: string;
}

// --- Phase 7: Documents ---

export interface ProjectDocument {
  id: string;
  project_id: string;
  nome: string;
  descricao: string | null;
  storage_path: string;
  tipo_arquivo: string | null;
  tamanho_bytes: number | null;
  visivel_cliente: boolean;
  uploaded_by: string | null;
  created_at: string;
}

export interface FieldConfig {
  id: string;
  project_id: string;
  meta_total: number | null;
  tempo_medio_esperado: number | null;
  integration_mode: IntegrationMode;
  sheets_url: string | null;
  sheets_csv_url: string | null;
  reference_column: string | null;
  time_column: string | null;
  last_sync_at: string | null;
  last_sync_error: string | null;
  realizado_total: number;
  tempo_medio_real: number | null;
  created_at: string;
  updated_at: string;
}

// --- Phase 8: Financeiro ---

export type QuemFechou = 'vendedor' | 'gestor' | 'head';

export interface ProjectFinancials {
  id: string;
  project_id: string;
  valor_total: number;
  custo_painel: number;
  custo_sala: number;
  custo_plataforma: number;
  custo_recrutamento: number;
  custo_incentivos: number;
  custo_transcricao: number;
  custo_elaboracao: number;
  custo_analise: number;
  custo_analytics_avancado: number;
  custo_dashboard: number;
  custo_relatorio_adicional: number;
  custo_outros: number;
  custo_outros_descricao: string | null;
  adicional_urgencia: boolean;
  quem_fechou: QuemFechou | null;
  created_at: string;
  updated_at: string;
}

export interface CalculatorDefault {
  id: string;
  key: string;
  value: number | null;
  updated_at: string;
}

export interface ProjectWithFinancials extends Project {
  project_financials?: ProjectFinancials | null;
  gerente?: { name: string } | null;
}

// --- Phase 9: Goals & Notifications ---

export type GoalPeriodType = 'mensal' | 'trimestral';

export interface Goal {
  id: string;
  periodo_tipo: GoalPeriodType;
  periodo_referencia: string;
  meta_receita: number | null;
  meta_projetos_encerrados: number | null;
  meta_margem_media: number | null;
  meta_nps_medio: number | null;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 
  | 'status_changed'
  | 'nps_received'
  | 'field_complete'
  | 'deadline_risk'
  | 'goal_alert'
  | 'project_created'
  | 'document_added'
  | 'schedule_updated'
  | 'sync_error'
  | 'general'
  | 'info'
  | 'warning'
  | 'success'
  | 'error';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface RiskAlert {
  project_id: string;
  project_name: string;
  message: string;
  level: 'attention' | 'critical' | 'informative';
  type: string;
}

// --- Phase 10: NPS & Activity Logs ---

export type PrazoResposta = 'no_prazo' | 'pequeno_atraso' | 'atraso_significativo';

export interface NPSResponse {
  id: string;
  project_id: string;
  client_id: string;
  token: string;
  nps_score: number | null;
  satisfaction_stars: number | null;
  prazo_resposta: PrazoResposta | null;
  comentario: string | null;
  respondido: boolean;
  expires_at: string;
  responded_at: string | null;
  email_sent_at: string | null;
  created_at: string;
}

export interface NPSResponseWithClient extends NPSResponse {
  client?: {
    name: string;
    email: string;
  };
}

export type ActivityCategory = 
  | 'autenticacao'
  | 'projetos'
  | 'clientes'
  | 'gerentes'
  | 'campo'
  | 'financeiro'
  | 'documentos'
  | 'configuracoes'
  | 'acessos'
  | 'nps';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  user_role: string;
  action: string;
  category: ActivityCategory;
  context: string | null;
  ip_address: string | null;
  created_at: string;
}

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  autenticacao: 'Autenticacao',
  projetos: 'Projetos',
  clientes: 'Clientes',
  gerentes: 'Gerentes',
  campo: 'Campo',
  financeiro: 'Financeiro',
  documentos: 'Documentos',
  configuracoes: 'Configuracoes',
  acessos: 'Acessos',
  nps: 'NPS',
};

export function getNPSClassification(score: number): { label: string; color: string } {
  if (score >= 9) return { label: 'Promotor', color: 'bg-green-500' };
  if (score >= 7) return { label: 'Neutro', color: 'bg-gray-500' };
  return { label: 'Detrator', color: 'bg-red-500' };
}
