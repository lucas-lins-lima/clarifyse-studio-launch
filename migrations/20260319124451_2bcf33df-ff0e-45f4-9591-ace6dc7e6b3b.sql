
-- Fix bug in clients RLS policy (project_access.id should be projects.id)
DROP POLICY IF EXISTS "Clients view projects they access" ON public.projects;
CREATE POLICY "Clients view projects they access" ON public.projects
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_access
      WHERE project_access.project_id = projects.id
        AND project_access.user_id = auth.uid()
    )
  );
