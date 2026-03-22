-- Consolidated migration: create all missing tables for Clarifyse Insights
-- Tables: project_schedule, field_config, field_quotas, field_quota_results,
-- field_sync_log, project_documents, project_financials, calculator_defaults,
-- project_nps, goals, notifications, nps_responses, activity_logs,
-- panel_partners, panel_partner_cpr, panel_partner_reviews, schedule_steps_defaults

-- ============================================================
-- 0. Prerequisites: ensure update_updated_at_column exists
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS data_entrega_real DATE;
ALTER TABLE public.project_access ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE public.project_access ADD COLUMN IF NOT EXISTS first_access BOOLEAN DEFAULT TRUE;

-- ============================================================
-- 1. project_schedule
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  inicio_previsto DATE,
  conclusao_prevista DATE,
  inicio_real DATE,
  conclusao_real DATE,
  status TEXT CHECK (status IN ('Concluída','Em Andamento','Pendente','Atrasada')),
  status_manual BOOLEAN DEFAULT false,
  visivel BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_schedule ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE TRIGGER update_schedule_updated_at
  BEFORE UPDATE ON public.project_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admin full access on schedule" ON public.project_schedule;
CREATE POLICY "Admin full access on schedule"
  ON public.project_schedule FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Gerentes manage schedule of own projects" ON public.project_schedule;
CREATE POLICY "Gerentes manage schedule of own projects"
  ON public.project_schedule FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_schedule.project_id AND gerente_id = auth.uid()));

DROP POLICY IF EXISTS "Clients read schedule of their projects" ON public.project_schedule;
CREATE POLICY "Clients read schedule of their projects"
  ON public.project_schedule FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.project_access WHERE project_id = project_schedule.project_id AND user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_schedule_project ON public.project_schedule(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_ordem ON public.project_schedule(project_id, ordem);

-- ============================================================
-- 2. field_config
-- ============================================================
CREATE TABLE IF NOT EXISTS public.field_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  meta_total INTEGER,
  tempo_medio_esperado INTEGER,
  integration_mode TEXT CHECK (integration_mode IN ('sheets', 'manual')) DEFAULT 'manual',
  sheets_url TEXT,
  sheets_csv_url TEXT,
  reference_column TEXT,
  time_column TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  realizado_total INTEGER DEFAULT 0,
  tempo_medio_real DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.field_config ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE TRIGGER update_field_config_updated_at
  BEFORE UPDATE ON public.field_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admin full access on field_config" ON public.field_config;
CREATE POLICY "Admin full access on field_config"
  ON public.field_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Gerentes manage field_config of own projects" ON public.field_config;
CREATE POLICY "Gerentes manage field_config of own projects"
  ON public.field_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = field_config.project_id AND gerente_id = auth.uid()));

DROP POLICY IF EXISTS "Clients read field_config of their projects" ON public.field_config;
CREATE POLICY "Clients read field_config of their projects"
  ON public.field_config FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.project_access WHERE project_id = field_config.project_id AND user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_field_config_project ON public.field_config(project_id);

-- ============================================================
-- 3. field_quotas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.field_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('numerico','faixa_etaria','texto','booleano')) NOT NULL,
  coluna_planilha TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.field_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on field_quotas" ON public.field_quotas;
CREATE POLICY "Admin full access on field_quotas"
  ON public.field_quotas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Gerentes manage quotas of own projects" ON public.field_quotas;
CREATE POLICY "Gerentes manage quotas of own projects"
  ON public.field_quotas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = field_quotas.project_id AND gerente_id = auth.uid()));

DROP POLICY IF EXISTS "Clients read quotas of their projects" ON public.field_quotas;
CREATE POLICY "Clients read quotas of their projects"
  ON public.field_quotas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.project_access WHERE project_id = field_quotas.project_id AND user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_field_quotas_project ON public.field_quotas(project_id);
CREATE INDEX IF NOT EXISTS idx_field_quotas_ordem ON public.field_quotas(project_id, ordem);

-- ============================================================
-- 4. field_quota_results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.field_quota_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quota_id UUID REFERENCES public.field_quotas(id) ON DELETE CASCADE NOT NULL,
  subcategoria TEXT NOT NULL,
  meta INTEGER DEFAULT 0,
  realizado INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (quota_id, subcategoria)
);

ALTER TABLE public.field_quota_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on field_quota_results" ON public.field_quota_results;
CREATE POLICY "Admin full access on field_quota_results"
  ON public.field_quota_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.field_quotas fq WHERE fq.id = field_quota_results.quota_id AND public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Gerentes manage results of own projects" ON public.field_quota_results;
CREATE POLICY "Gerentes manage results of own projects"
  ON public.field_quota_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.field_quotas fq JOIN public.projects p ON p.id = fq.project_id WHERE fq.id = field_quota_results.quota_id AND p.gerente_id = auth.uid()));

DROP POLICY IF EXISTS "Clients read results of their projects" ON public.field_quota_results;
CREATE POLICY "Clients read results of their projects"
  ON public.field_quota_results FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.field_quotas fq JOIN public.project_access pa ON pa.project_id = fq.project_id WHERE fq.id = field_quota_results.quota_id AND pa.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_field_quota_results_quota ON public.field_quota_results(quota_id);

-- ============================================================
-- 5. field_sync_log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.field_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('success','error')) NOT NULL,
  rows_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.field_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on field_sync_log" ON public.field_sync_log;
CREATE POLICY "Admin full access on field_sync_log"
  ON public.field_sync_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Gerentes read sync log of own projects" ON public.field_sync_log;
CREATE POLICY "Gerentes read sync log of own projects"
  ON public.field_sync_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = field_sync_log.project_id AND gerente_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_field_sync_log_project ON public.field_sync_log(project_id, created_at DESC);

-- ============================================================
-- 6. project_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  storage_path TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes BIGINT,
  visivel_cliente BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_documents_all" ON public.project_documents;
CREATE POLICY "admin_documents_all" ON public.project_documents
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_documents_own" ON public.project_documents;
CREATE POLICY "gerente_documents_own" ON public.project_documents
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.profiles pr ON pr.id = auth.uid() WHERE p.id = project_documents.project_id AND p.gerente_id = auth.uid() AND pr.role = 'gerente'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p JOIN public.profiles pr ON pr.id = auth.uid() WHERE p.id = project_documents.project_id AND p.gerente_id = auth.uid() AND pr.role = 'gerente'));

DROP POLICY IF EXISTS "cliente_documents_read" ON public.project_documents;
CREATE POLICY "cliente_documents_read" ON public.project_documents
  FOR SELECT
  USING (project_documents.visivel_cliente = TRUE AND EXISTS (SELECT 1 FROM public.project_access pa WHERE pa.project_id = project_documents.project_id AND pa.user_id = auth.uid()));

-- ============================================================
-- 7. project_financials
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  valor_total DECIMAL(12,2) DEFAULT 0,
  custo_painel DECIMAL(12,2) DEFAULT 0,
  custo_sala DECIMAL(12,2) DEFAULT 0,
  custo_plataforma DECIMAL(12,2) DEFAULT 0,
  custo_recrutamento DECIMAL(12,2) DEFAULT 0,
  custo_incentivos DECIMAL(12,2) DEFAULT 0,
  custo_transcricao DECIMAL(12,2) DEFAULT 0,
  custo_elaboracao DECIMAL(12,2) DEFAULT 0,
  custo_analise DECIMAL(12,2) DEFAULT 0,
  custo_analytics_avancado DECIMAL(12,2) DEFAULT 0,
  custo_dashboard DECIMAL(12,2) DEFAULT 0,
  custo_relatorio_adicional DECIMAL(12,2) DEFAULT 0,
  custo_outros DECIMAL(12,2) DEFAULT 0,
  custo_outros_descricao TEXT,
  adicional_urgencia BOOLEAN DEFAULT false,
  quem_fechou TEXT CHECK (quem_fechou IN ('vendedor', 'gestor', 'head')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_financials ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE TRIGGER update_project_financials_updated_at
  BEFORE UPDATE ON public.project_financials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "admin_financials_all" ON public.project_financials;
CREATE POLICY "admin_financials_all" ON public.project_financials
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_financials_own" ON public.project_financials;
CREATE POLICY "gerente_financials_own" ON public.project_financials
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.profiles pr ON pr.id = auth.uid() WHERE p.id = project_financials.project_id AND p.gerente_id = auth.uid() AND pr.role = 'gerente'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p JOIN public.profiles pr ON pr.id = auth.uid() WHERE p.id = project_financials.project_id AND p.gerente_id = auth.uid() AND pr.role = 'gerente'));

CREATE INDEX IF NOT EXISTS idx_project_financials_project ON public.project_financials(project_id);

-- ============================================================
-- 8. calculator_defaults
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calculator_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value DECIMAL(12,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.calculator_defaults ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE TRIGGER update_calculator_defaults_updated_at
  BEFORE UPDATE ON public.calculator_defaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "admin_calculator_defaults_all" ON public.calculator_defaults;
CREATE POLICY "admin_calculator_defaults_all" ON public.calculator_defaults
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_calculator_defaults_read" ON public.calculator_defaults;
CREATE POLICY "gerente_calculator_defaults_read" ON public.calculator_defaults
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente'));

CREATE INDEX IF NOT EXISTS idx_calculator_defaults_key ON public.calculator_defaults(key);

-- Insert defaults
INSERT INTO public.calculator_defaults (key, value) VALUES
  ('cpr_publico_geral_15', NULL), ('cpr_publico_geral_30', NULL), ('cpr_publico_geral_31plus', NULL),
  ('cpr_criterio_simples_15', NULL), ('cpr_criterio_simples_30', NULL), ('cpr_criterio_simples_31plus', NULL),
  ('cpr_segmentado_15', NULL), ('cpr_segmentado_30', NULL), ('cpr_segmentado_31plus', NULL),
  ('cpr_nicho_15', NULL), ('cpr_nicho_30', NULL), ('cpr_nicho_31plus', NULL),
  ('custo_plataforma_survey', NULL), ('custo_elaboracao_instrumento', NULL),
  ('custo_analise_entregavel', NULL), ('custo_analytics_avancado', NULL),
  ('custo_aluguel_sala', NULL), ('custo_moderacao_sessao', NULL),
  ('custo_recrutamento_participante', NULL), ('custo_incentivo_participante', NULL),
  ('custo_transcricao_hora', NULL), ('custo_elaboracao_roteiro', NULL),
  ('custo_analise_qualitativa', NULL)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 9. project_nps
-- ============================================================
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.project_nps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 10),
    comentario TEXT,
    avaliador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE public.project_nps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_nps_all" ON public.project_nps;
CREATE POLICY "admin_nps_all" ON public.project_nps
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_nps_read" ON public.project_nps;
CREATE POLICY "gerente_nps_read" ON public.project_nps
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.profiles pr ON pr.id = auth.uid() WHERE p.id = project_nps.project_id AND p.gerente_id = auth.uid() AND pr.role = 'gerente'));

DROP POLICY IF EXISTS "cliente_nps_insert" ON public.project_nps;
CREATE POLICY "cliente_nps_insert" ON public.project_nps
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.project_access pa JOIN public.profiles pr ON pr.id = auth.uid() WHERE pa.project_id = project_nps.project_id AND pa.user_id = auth.uid() AND pr.role = 'cliente'));

DROP POLICY IF EXISTS "cliente_nps_read_own" ON public.project_nps;
CREATE POLICY "cliente_nps_read_own" ON public.project_nps
  FOR SELECT
  USING (avaliador_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_project_nps_project ON public.project_nps(project_id);
CREATE INDEX IF NOT EXISTS idx_project_nps_created ON public.project_nps(created_at DESC);

-- ============================================================
-- 10. goals
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.goal_period AS ENUM ('monthly', 'quarterly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period public.goal_period NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
  metric TEXT NOT NULL,
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_period_fields CHECK (
    (period = 'monthly' AND month IS NOT NULL AND quarter IS NULL) OR
    (period = 'quarterly' AND quarter IS NOT NULL AND month IS NULL)
  )
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "admin_goals_all" ON public.goals;
CREATE POLICY "admin_goals_all" ON public.goals
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_goals_period_year ON public.goals(period, year);
CREATE INDEX IF NOT EXISTS idx_goals_metric ON public.goals(metric);

-- ============================================================
-- 11. notifications
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'status_changed', 'nps_received', 'field_complete',
    'deadline_risk', 'goal_alert', 'project_created', 'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_notifications_select" ON public.notifications;
CREATE POLICY "user_notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_notifications_update" ON public.notifications;
CREATE POLICY "user_notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_notifications_insert" ON public.notifications;
CREATE POLICY "admin_notifications_insert" ON public.notifications
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================================
-- 12. nps_responses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  nps_score INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  satisfaction_stars INTEGER CHECK (satisfaction_stars BETWEEN 1 AND 5),
  prazo_resposta TEXT CHECK (prazo_resposta IN ('no_prazo','pequeno_atraso','atraso_significativo')),
  comentario TEXT,
  respondido BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 days'),
  responded_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_nps_responses_all" ON public.nps_responses;
CREATE POLICY "admin_nps_responses_all" ON public.nps_responses
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_nps_responses_read" ON public.nps_responses;
CREATE POLICY "gerente_nps_responses_read" ON public.nps_responses
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = nps_responses.project_id AND p.gerente_id = auth.uid()));

DROP POLICY IF EXISTS "public_nps_token_read" ON public.nps_responses;
CREATE POLICY "public_nps_token_read" ON public.nps_responses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_nps_token_update" ON public.nps_responses;
CREATE POLICY "public_nps_token_update" ON public.nps_responses
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_nps_responses_project ON public.nps_responses(project_id);
CREATE INDEX IF NOT EXISTS idx_nps_responses_token ON public.nps_responses(token);
CREATE INDEX IF NOT EXISTS idx_nps_responses_client ON public.nps_responses(client_id);

-- ============================================================
-- 13. activity_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT '',
  user_role TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'autenticacao','projetos','clientes','gerentes','campo',
    'financeiro','documentos','configuracoes','acessos','nps'
  )),
  context TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_activity_logs_all" ON public.activity_logs;
CREATE POLICY "admin_activity_logs_all" ON public.activity_logs
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON public.activity_logs(category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);

-- ============================================================
-- 14. panel_partners
-- ============================================================
CREATE TABLE IF NOT EXISTS public.panel_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  site TEXT,
  email_contato TEXT,
  telefone TEXT,
  notas TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.panel_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_panel_partners_all" ON public.panel_partners;
CREATE POLICY "admin_panel_partners_all" ON public.panel_partners
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 15. panel_partner_cpr
-- ============================================================
CREATE TABLE IF NOT EXISTS public.panel_partner_cpr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.panel_partners(id) ON DELETE CASCADE NOT NULL,
  perfil TEXT NOT NULL,
  faixa_perguntas TEXT NOT NULL,
  cpr_valor DECIMAL(8,2),
  data_cotacao DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, perfil, faixa_perguntas)
);

ALTER TABLE public.panel_partner_cpr ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_panel_partner_cpr_all" ON public.panel_partner_cpr;
CREATE POLICY "admin_panel_partner_cpr_all" ON public.panel_partner_cpr
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_panel_partner_cpr_read" ON public.panel_partner_cpr;
CREATE POLICY "gerente_panel_partner_cpr_read" ON public.panel_partner_cpr
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','gerente')));

CREATE INDEX IF NOT EXISTS idx_panel_partner_cpr_partner ON public.panel_partner_cpr(partner_id);

-- ============================================================
-- 16. panel_partner_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS public.panel_partner_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.panel_partners(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  qualidade_amostral INTEGER CHECK (qualidade_amostral BETWEEN 1 AND 5),
  cumprimento_prazo INTEGER CHECK (cumprimento_prazo BETWEEN 1 AND 5),
  custo_beneficio INTEGER CHECK (custo_beneficio BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.panel_partner_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_panel_partner_reviews_all" ON public.panel_partner_reviews;
CREATE POLICY "admin_panel_partner_reviews_all" ON public.panel_partner_reviews
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_panel_partner_reviews_partner ON public.panel_partner_reviews(partner_id);

-- ============================================================
-- 17. schedule_steps_defaults
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedule_steps_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedule_steps_defaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_schedule_defaults_all" ON public.schedule_steps_defaults;
CREATE POLICY "admin_schedule_defaults_all" ON public.schedule_steps_defaults
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_schedule_defaults_read" ON public.schedule_steps_defaults;
CREATE POLICY "gerente_schedule_defaults_read" ON public.schedule_steps_defaults
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','gerente')));

-- Insert default steps
INSERT INTO public.schedule_steps_defaults (nome, ordem) VALUES
  ('Briefing e Alinhamento', 1),
  ('Elaboração do Instrumento', 2),
  ('Aprovação do Instrumento pelo Cliente', 3),
  ('Início do Campo', 4),
  ('Encerramento do Campo', 5),
  ('Transcrição', 6),
  ('Análise dos Dados', 7),
  ('Produção do Entregável', 8),
  ('Revisão Interna', 9),
  ('Entrega ao Cliente', 10),
  ('Reunião de Apresentação dos Resultados', 11)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Additional system_settings
-- ============================================================
INSERT INTO public.system_settings (key, value) VALUES
  ('financial_password', NULL),
  ('alertas_email_ativo', 'false'),
  ('alertas_email_frequencia', 'diario'),
  ('alertas_email_destino', 'clarifysestrategyresearch@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Additional RLS policies for profiles (gerentes)
-- ============================================================
DROP POLICY IF EXISTS "Gerentes can view clients of their projects" ON public.profiles;
CREATE POLICY "Gerentes can view clients of their projects"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    role = 'cliente' AND
    EXISTS (
      SELECT 1 FROM public.project_access pa
      JOIN public.projects p ON pa.project_id = p.id
      WHERE pa.user_id = profiles.id AND p.gerente_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Gerentes can update clients of their projects" ON public.profiles;
CREATE POLICY "Gerentes can update clients of their projects"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    role = 'cliente' AND
    EXISTS (
      SELECT 1 FROM public.project_access pa
      JOIN public.projects p ON pa.project_id = p.id
      WHERE pa.user_id = profiles.id AND p.gerente_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Gerentes can view gerente profiles" ON public.profiles;
CREATE POLICY "Gerentes can view gerente profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    role IN ('gerente', 'admin')
    AND public.get_user_role(auth.uid()) IN ('gerente', 'admin')
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_last_signin ON public.profiles(last_sign_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_entrega_real ON public.projects(data_entrega_real);

-- ============================================================
-- Storage bucket for project documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents', 'project-documents', FALSE, 52428800,
  ARRAY['application/pdf','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "admin_storage_all" ON storage.objects;
CREATE POLICY "admin_storage_all" ON storage.objects
  FOR ALL
  USING (bucket_id = 'project-documents' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (bucket_id = 'project-documents' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_storage_own" ON storage.objects;
CREATE POLICY "gerente_storage_own" ON storage.objects
  FOR ALL
  USING (bucket_id = 'project-documents' AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'gerente'))
  WITH CHECK (bucket_id = 'project-documents' AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'gerente'));

DROP POLICY IF EXISTS "cliente_storage_read" ON storage.objects;
CREATE POLICY "cliente_storage_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'project-documents' AND EXISTS (
    SELECT 1 FROM public.project_documents pd
    JOIN public.project_access pa ON pa.project_id = pd.project_id
    WHERE pd.storage_path = storage.objects.name AND pa.user_id = auth.uid() AND pd.visivel_cliente = TRUE
  ));

-- ============================================================
-- must_change_password index
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password
  ON public.profiles(must_change_password) WHERE must_change_password = true;
