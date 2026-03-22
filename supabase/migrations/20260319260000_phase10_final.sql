-- Phase 10: NPS automático, log de atividades, parceiros de painel, etapas padrão

-- 1. nps_responses table (if not exists) with email_sent_at
CREATE TABLE IF NOT EXISTS nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

-- If table already exists, add email_sent_at column if not present
ALTER TABLE nps_responses ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- RLS for nps_responses
DROP POLICY IF EXISTS "admin_nps_responses_all" ON nps_responses;
CREATE POLICY "admin_nps_responses_all" ON nps_responses
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_nps_responses_read" ON nps_responses;
CREATE POLICY "gerente_nps_responses_read" ON nps_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = nps_responses.project_id AND p.gerente_id = auth.uid()
    )
  );

-- Public read for token validation (no auth needed) -- handled by anon key + select policy
DROP POLICY IF EXISTS "public_nps_token_read" ON nps_responses;
CREATE POLICY "public_nps_token_read" ON nps_responses
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "public_nps_token_update" ON nps_responses;
CREATE POLICY "public_nps_token_update" ON nps_responses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nps_responses_project ON nps_responses(project_id);
CREATE INDEX IF NOT EXISTS idx_nps_responses_token ON nps_responses(token);
CREATE INDEX IF NOT EXISTS idx_nps_responses_client ON nps_responses(client_id);

-- Function to create NPS tokens for all clients of a project
CREATE OR REPLACE FUNCTION create_nps_tokens_for_project(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_client_id UUID;
BEGIN
  FOR v_client_id IN
    SELECT user_id FROM project_access WHERE project_id = p_project_id
  LOOP
    INSERT INTO nps_responses (project_id, client_id)
    VALUES (p_project_id, v_client_id)
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS: only admin can read
DROP POLICY IF EXISTS "admin_activity_logs_all" ON activity_logs;
CREATE POLICY "admin_activity_logs_all" ON activity_logs
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- pg_cron: delete activity logs older than 90 days
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'delete-old-activity-logs',
      '0 4 * * *',
      $$DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '90 days'$$
    );
  END IF;
END;
$$;


-- 3. panel_partners tables
CREATE TABLE IF NOT EXISTS panel_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  site TEXT,
  email_contato TEXT,
  telefone TEXT,
  notas TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE panel_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_panel_partners_all" ON panel_partners;
CREATE POLICY "admin_panel_partners_all" ON panel_partners
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS panel_partner_cpr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES panel_partners(id) ON DELETE CASCADE NOT NULL,
  perfil TEXT NOT NULL,
  faixa_perguntas TEXT NOT NULL,
  cpr_valor DECIMAL(8,2),
  data_cotacao DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, perfil, faixa_perguntas)
);

ALTER TABLE panel_partner_cpr ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_panel_partner_cpr_all" ON panel_partner_cpr;
CREATE POLICY "admin_panel_partner_cpr_all" ON panel_partner_cpr
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Gerentes can read cpr for calculator integration
DROP POLICY IF EXISTS "gerente_panel_partner_cpr_read" ON panel_partner_cpr;
CREATE POLICY "gerente_panel_partner_cpr_read" ON panel_partner_cpr
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','gerente')));

CREATE TABLE IF NOT EXISTS panel_partner_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES panel_partners(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  qualidade_amostral INTEGER CHECK (qualidade_amostral BETWEEN 1 AND 5),
  cumprimento_prazo INTEGER CHECK (cumprimento_prazo BETWEEN 1 AND 5),
  custo_beneficio INTEGER CHECK (custo_beneficio BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE panel_partner_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_panel_partner_reviews_all" ON panel_partner_reviews;
CREATE POLICY "admin_panel_partner_reviews_all" ON panel_partner_reviews
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_panel_partner_cpr_partner ON panel_partner_cpr(partner_id);
CREATE INDEX IF NOT EXISTS idx_panel_partner_reviews_partner ON panel_partner_reviews(partner_id);


-- 4. schedule_steps_defaults table
CREATE TABLE IF NOT EXISTS schedule_steps_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE schedule_steps_defaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_schedule_defaults_all" ON schedule_steps_defaults;
CREATE POLICY "admin_schedule_defaults_all" ON schedule_steps_defaults
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "gerente_schedule_defaults_read" ON schedule_steps_defaults;
CREATE POLICY "gerente_schedule_defaults_read" ON schedule_steps_defaults
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','gerente')));

-- Insert default steps
INSERT INTO schedule_steps_defaults (nome, ordem) VALUES
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


-- 5. Add financial_password and alert settings to system_settings
INSERT INTO system_settings (key, value) VALUES
  ('financial_password', NULL),
  ('alertas_email_ativo', 'false'),
  ('alertas_email_frequencia', 'diario'),
  ('alertas_email_destino', 'clarifysestrategyresearch@gmail.com')
ON CONFLICT (key) DO NOTHING;
