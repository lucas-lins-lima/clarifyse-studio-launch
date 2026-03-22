-- Phase 8: Financeiro Module

-- 1. project_financials table
CREATE TABLE IF NOT EXISTS project_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
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

ALTER TABLE project_financials ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_project_financials_updated_at 
  BEFORE UPDATE ON project_financials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin: full access to all financials
CREATE POLICY "admin_financials_all" ON project_financials
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Gerente: access only to their own projects' financials
CREATE POLICY "gerente_financials_own" ON project_financials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = project_financials.project_id
        AND p.gerente_id = auth.uid()
        AND pr.role = 'gerente'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = project_financials.project_id
        AND p.gerente_id = auth.uid()
        AND pr.role = 'gerente'
    )
  );

-- 2. calculator_defaults table (admin only)
CREATE TABLE IF NOT EXISTS calculator_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value DECIMAL(12,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calculator_defaults ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_calculator_defaults_updated_at 
  BEFORE UPDATE ON calculator_defaults 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin only can read and write calculator_defaults
CREATE POLICY "admin_calculator_defaults_all" ON calculator_defaults
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Gerentes can read calculator_defaults (for using the calculator)
CREATE POLICY "gerente_calculator_defaults_read" ON calculator_defaults
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gerente')
  );

-- 3. Insert default keys for calculator_defaults (all start as NULL)
INSERT INTO calculator_defaults (key, value) VALUES
  -- CPR by profile and question range
  ('cpr_publico_geral_15', NULL),
  ('cpr_publico_geral_30', NULL),
  ('cpr_publico_geral_31plus', NULL),
  ('cpr_criterio_simples_15', NULL),
  ('cpr_criterio_simples_30', NULL),
  ('cpr_criterio_simples_31plus', NULL),
  ('cpr_segmentado_15', NULL),
  ('cpr_segmentado_30', NULL),
  ('cpr_segmentado_31plus', NULL),
  ('cpr_nicho_15', NULL),
  ('cpr_nicho_30', NULL),
  ('cpr_nicho_31plus', NULL),
  -- Default costs
  ('custo_plataforma_survey', NULL),
  ('custo_elaboracao_instrumento', NULL),
  ('custo_analise_entregavel', NULL),
  ('custo_analytics_avancado', NULL),
  ('custo_aluguel_sala', NULL),
  ('custo_moderacao_sessao', NULL),
  ('custo_recrutamento_participante', NULL),
  ('custo_incentivo_participante', NULL),
  ('custo_transcricao_hora', NULL),
  ('custo_elaboracao_roteiro', NULL),
  ('custo_analise_qualitativa', NULL)
ON CONFLICT (key) DO NOTHING;

-- 4. Financial security password in system_settings
INSERT INTO system_settings (key, value) VALUES
  ('financial_password', NULL)
ON CONFLICT (key) DO NOTHING;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_financials_project ON project_financials(project_id);
CREATE INDEX IF NOT EXISTS idx_calculator_defaults_key ON calculator_defaults(key);
