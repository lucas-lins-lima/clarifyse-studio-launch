-- Phase 9: KPIs, Metas, Alertas e Notificações

-- 1. Adicionar coluna data_entrega_real em projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS data_entrega_real DATE;

-- 2. Tabela project_nps (avaliação NPS por projeto)
CREATE TABLE IF NOT EXISTS project_nps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 10),
  comentario TEXT,
  avaliador_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE project_nps ENABLE ROW LEVEL SECURITY;

-- RLS: Admin can do everything
CREATE POLICY "admin_nps_all" ON project_nps
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: Gerente can read NPS for their projects
CREATE POLICY "gerente_nps_read" ON project_nps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = project_nps.project_id
        AND p.gerente_id = auth.uid()
        AND pr.role = 'gerente'
    )
  );

-- RLS: Cliente can insert NPS for projects they have access to
CREATE POLICY "cliente_nps_insert" ON project_nps
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_access pa
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE pa.project_id = project_nps.project_id
        AND pa.user_id = auth.uid()
        AND pr.role = 'cliente'
    )
  );

-- RLS: Cliente can read their own NPS
CREATE POLICY "cliente_nps_read_own" ON project_nps
  FOR SELECT
  USING (
    avaliador_id = auth.uid()
  );

-- 3. Tabela goals (metas mensais/trimestrais)
CREATE TYPE goal_period AS ENUM ('monthly', 'quarterly');

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period goal_period NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
  metric TEXT NOT NULL,
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_period_fields CHECK (
    (period = 'monthly' AND month IS NOT NULL AND quarter IS NULL) OR
    (period = 'quarterly' AND quarter IS NOT NULL AND month IS NULL)
  )
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON goals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: Admin only
CREATE POLICY "admin_goals_all" ON goals
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Tabela notifications
CREATE TYPE notification_type AS ENUM (
  'status_changed',
  'nps_received',
  'field_complete',
  'deadline_risk',
  'goal_alert',
  'project_created',
  'general'
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own notifications
CREATE POLICY "user_notifications_select" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS: Users can update (mark as read) their own notifications
CREATE POLICY "user_notifications_update" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS: Admin can insert notifications for any user
CREATE POLICY "admin_notifications_insert" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: Service role can insert notifications (for triggers/functions)
-- This is handled by bypassing RLS with service role key

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_nps_project ON project_nps(project_id);
CREATE INDEX IF NOT EXISTS idx_project_nps_created ON project_nps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_period_year ON goals(period, year);
CREATE INDEX IF NOT EXISTS idx_goals_metric ON goals(metric);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_entrega_real ON projects(data_entrega_real);

-- 6. Function to calculate NPS score
CREATE OR REPLACE FUNCTION calculate_nps_score(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  total_responses BIGINT,
  promoters BIGINT,
  passives BIGINT,
  detractors BIGINT,
  nps_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH nps_data AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE nota >= 9) as promo,
      COUNT(*) FILTER (WHERE nota >= 7 AND nota <= 8) as pass,
      COUNT(*) FILTER (WHERE nota <= 6) as detrac
    FROM project_nps
    WHERE (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
  )
  SELECT 
    total as total_responses,
    promo as promoters,
    pass as passives,
    detrac as detractors,
    CASE 
      WHEN total > 0 THEN ROUND(((promo::DECIMAL - detrac::DECIMAL) / total * 100), 2)
      ELSE 0
    END as nps_score
  FROM nps_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to get KPIs summary
CREATE OR REPLACE FUNCTION get_kpis_summary(p_year INTEGER, p_month INTEGER DEFAULT NULL)
RETURNS TABLE (
  total_projects BIGINT,
  projects_completed BIGINT,
  projects_in_progress BIGINT,
  projects_on_time BIGINT,
  projects_delayed BIGINT,
  total_revenue DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  avg_nps DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH project_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'entregue') as completed,
      COUNT(*) FILTER (WHERE status NOT IN ('entregue', 'cancelado') AND deleted_at IS NULL) as in_progress,
      COUNT(*) FILTER (WHERE status = 'entregue' AND (data_entrega_real IS NULL OR data_entrega_real <= data_entrega_prevista)) as on_time,
      COUNT(*) FILTER (WHERE status = 'entregue' AND data_entrega_real > data_entrega_prevista) as delayed
    FROM projects
    WHERE deleted_at IS NULL
      AND EXTRACT(YEAR FROM created_at) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM created_at) = p_month)
  ),
  financial_stats AS (
    SELECT 
      COALESCE(SUM(pf.valor_total), 0) as revenue,
      COALESCE(SUM(
        pf.custo_painel + pf.custo_sala + pf.custo_plataforma + 
        pf.custo_recrutamento + pf.custo_incentivos + pf.custo_transcricao + 
        pf.custo_elaboracao + pf.custo_analise + pf.custo_analytics_avancado + 
        pf.custo_dashboard + pf.custo_relatorio_adicional + pf.custo_outros
      ), 0) as cost
    FROM project_financials pf
    JOIN projects p ON p.id = pf.project_id
    WHERE p.deleted_at IS NULL
      AND EXTRACT(YEAR FROM p.created_at) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM p.created_at) = p_month)
  ),
  nps_stats AS (
    SELECT COALESCE(AVG(nota), 0) as avg_nota
    FROM project_nps pn
    JOIN projects p ON p.id = pn.project_id
    WHERE p.deleted_at IS NULL
      AND EXTRACT(YEAR FROM pn.created_at) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM pn.created_at) = p_month)
  )
  SELECT 
    ps.total as total_projects,
    ps.completed as projects_completed,
    ps.in_progress as projects_in_progress,
    ps.on_time as projects_on_time,
    ps.delayed as projects_delayed,
    fs.revenue as total_revenue,
    fs.cost as total_cost,
    ROUND(ns.avg_nota::DECIMAL, 2) as avg_nps
  FROM project_stats ps, financial_stats fs, nps_stats ns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to check at-risk projects
CREATE OR REPLACE FUNCTION get_risk_projects()
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  risk_type TEXT,
  risk_level TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Projects with deadline approaching (7 days or less) and not in final status
  SELECT 
    p.id,
    p.nome,
    'deadline_approaching'::TEXT,
    CASE 
      WHEN p.data_entrega_prevista <= CURRENT_DATE THEN 'critical'
      WHEN p.data_entrega_prevista <= CURRENT_DATE + INTERVAL '3 days' THEN 'high'
      ELSE 'medium'
    END,
    'Prazo: ' || TO_CHAR(p.data_entrega_prevista, 'DD/MM/YYYY')
  FROM projects p
  WHERE p.deleted_at IS NULL
    AND p.status NOT IN ('entregue', 'cancelado')
    AND p.data_entrega_prevista IS NOT NULL
    AND p.data_entrega_prevista <= CURRENT_DATE + INTERVAL '7 days'
  
  UNION ALL
  
  -- Projects with low health score (assuming we'll calculate based on progress)
  SELECT 
    p.id,
    p.nome,
    'stalled'::TEXT,
    'medium'::TEXT,
    'Sem atualização há mais de 14 dias'
  FROM projects p
  WHERE p.deleted_at IS NULL
    AND p.status NOT IN ('entregue', 'cancelado', 'briefing')
    AND p.updated_at < CURRENT_DATE - INTERVAL '14 days'
  
  UNION ALL
  
  -- Projects already past deadline
  SELECT 
    p.id,
    p.nome,
    'overdue'::TEXT,
    'critical'::TEXT,
    'Atrasado em ' || (CURRENT_DATE - p.data_entrega_prevista) || ' dias'
  FROM projects p
  WHERE p.deleted_at IS NULL
    AND p.status NOT IN ('entregue', 'cancelado')
    AND p.data_entrega_prevista IS NOT NULL
    AND p.data_entrega_prevista < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
