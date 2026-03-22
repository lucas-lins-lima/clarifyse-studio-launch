
-- Phase 5: Project Schedule (Cronograma)

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

-- Updated_at trigger
CREATE TRIGGER update_schedule_updated_at
  BEFORE UPDATE ON public.project_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Admin full access
CREATE POLICY "Admin full access on schedule"
  ON public.project_schedule FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Gerente can read/write schedule for their own projects
CREATE POLICY "Gerentes manage schedule of own projects"
  ON public.project_schedule FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_schedule.project_id
        AND gerente_id = auth.uid()
    )
  );

-- RLS: Cliente can read schedule for projects they have access to
CREATE POLICY "Clients read schedule of their projects"
  ON public.project_schedule FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_access
      WHERE project_id = project_schedule.project_id
        AND user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_schedule_project ON public.project_schedule(project_id);
CREATE INDEX idx_schedule_ordem ON public.project_schedule(project_id, ordem);
