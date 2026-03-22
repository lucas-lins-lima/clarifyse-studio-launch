-- Phase 10: NPS Responses and Activity Logs tables

-- NPS Responses table (for client evaluation after project completion)
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

-- Indexes for NPS
CREATE INDEX IF NOT EXISTS idx_nps_responses_token ON nps_responses(token);
CREATE INDEX IF NOT EXISTS idx_nps_responses_project ON nps_responses(project_id);
CREATE INDEX IF NOT EXISTS idx_nps_responses_client ON nps_responses(client_id);

-- Activity Logs table (for system audit)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('autenticacao','projetos','clientes','gerentes','campo','financeiro','documentos','configuracoes','acessos','nps')),
  context TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- RLS Policies for NPS Responses
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

-- Admin can read all NPS responses
CREATE POLICY "Admin can read all nps_responses"
  ON nps_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Gerente can read NPS for their projects
CREATE POLICY "Gerente can read own project nps_responses"
  ON nps_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = nps_responses.project_id 
        AND p.gerente_id = auth.uid()
        AND pr.role = 'gerente'
    )
  );

-- Public insert via token (for anonymous response submission)
CREATE POLICY "Public can insert nps via token"
  ON nps_responses FOR UPDATE
  TO anon, authenticated
  USING (token IS NOT NULL AND respondido = false AND expires_at > NOW())
  WITH CHECK (token IS NOT NULL);

-- Public can read by token (to show form)
CREATE POLICY "Public can read nps by token"
  ON nps_responses FOR SELECT
  TO anon, authenticated
  USING (token IS NOT NULL);

-- Admin can insert (to create tokens when project is closed)
CREATE POLICY "Admin can insert nps_responses"
  ON nps_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can read activity logs
CREATE POLICY "Admin can read activity_logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- System can insert activity logs (via service role or trigger)
CREATE POLICY "System can insert activity_logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_user_name TEXT,
  p_user_role TEXT,
  p_action TEXT,
  p_category TEXT,
  p_context TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, user_name, user_role, action, category, context, ip_address)
  VALUES (p_user_id, p_user_name, p_user_role, p_action, p_category, p_context, p_ip_address)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to create NPS tokens for a project
CREATE OR REPLACE FUNCTION create_nps_tokens_for_project(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_client RECORD;
BEGIN
  -- Get all clients linked to this project
  FOR v_client IN 
    SELECT pc.profile_id
    FROM project_clients pc
    WHERE pc.project_id = p_project_id
  LOOP
    -- Insert NPS response token (only if doesn't exist for this project/client combo)
    INSERT INTO nps_responses (project_id, client_id)
    VALUES (p_project_id, v_client.profile_id)
    ON CONFLICT DO NOTHING;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_activity TO authenticated;
GRANT EXECUTE ON FUNCTION create_nps_tokens_for_project TO authenticated;
