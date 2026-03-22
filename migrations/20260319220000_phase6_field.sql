
-- Phase 6: Field Monitoring (Monitoramento de Campo)

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

CREATE TRIGGER update_field_config_updated_at
  BEFORE UPDATE ON public.field_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admin full access on field_config"
  ON public.field_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerentes manage field_config of own projects"
  ON public.field_config FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = field_config.project_id
        AND gerente_id = auth.uid()
    )
  );

CREATE POLICY "Clients read field_config of their projects"
  ON public.field_config FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_access
      WHERE project_id = field_config.project_id
        AND user_id = auth.uid()
    )
  );

-- Quotas table
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

CREATE POLICY "Admin full access on field_quotas"
  ON public.field_quotas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerentes manage quotas of own projects"
  ON public.field_quotas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = field_quotas.project_id
        AND gerente_id = auth.uid()
    )
  );

CREATE POLICY "Clients read quotas of their projects"
  ON public.field_quotas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_access
      WHERE project_id = field_quotas.project_id
        AND user_id = auth.uid()
    )
  );

-- Quota results table
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

CREATE POLICY "Admin full access on field_quota_results"
  ON public.field_quota_results FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.field_quotas fq
      JOIN public.projects p ON p.id = fq.project_id
      WHERE fq.id = field_quota_results.quota_id
        AND public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Gerentes manage results of own projects"
  ON public.field_quota_results FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.field_quotas fq
      JOIN public.projects p ON p.id = fq.project_id
      WHERE fq.id = field_quota_results.quota_id
        AND p.gerente_id = auth.uid()
    )
  );

CREATE POLICY "Clients read results of their projects"
  ON public.field_quota_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.field_quotas fq
      JOIN public.project_access pa ON pa.project_id = fq.project_id
      WHERE fq.id = field_quota_results.quota_id
        AND pa.user_id = auth.uid()
    )
  );

-- Sync log table
CREATE TABLE IF NOT EXISTS public.field_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('success','error')) NOT NULL,
  rows_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.field_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on field_sync_log"
  ON public.field_sync_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerentes read sync log of own projects"
  ON public.field_sync_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = field_sync_log.project_id
        AND gerente_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_field_config_project ON public.field_config(project_id);
CREATE INDEX IF NOT EXISTS idx_field_quotas_project ON public.field_quotas(project_id);
CREATE INDEX IF NOT EXISTS idx_field_quotas_ordem ON public.field_quotas(project_id, ordem);
CREATE INDEX IF NOT EXISTS idx_field_quota_results_quota ON public.field_quota_results(quota_id);
CREATE INDEX IF NOT EXISTS idx_field_sync_log_project ON public.field_sync_log(project_id, created_at DESC);

-- pg_cron auto-sync every 5 minutes (requires pg_cron and pg_net extensions enabled in Supabase)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    PERFORM cron.unschedule('sync-all-active-fields') WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'sync-all-active-fields'
    );
    PERFORM cron.schedule(
      'sync-all-active-fields',
      '*/5 * * * *',
      $$
        SELECT net.http_post(
          url := (SELECT value FROM public.system_settings WHERE key = 'supabase_functions_url') || '/sync-field-data',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT value FROM public.system_settings WHERE key = 'service_role_key')
          ),
          body := '{"sync_all": true}'::jsonb
        );
      $$
    );
  END IF;
END;
$$;
