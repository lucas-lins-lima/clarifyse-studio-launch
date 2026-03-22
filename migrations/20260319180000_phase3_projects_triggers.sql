
-- Trigger: log status changes to project_history automatically
CREATE OR REPLACE FUNCTION public.log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.project_history (project_id, descricao, user_id)
    VALUES (
      NEW.id,
      'Status alterado de ''' || OLD.status || ''' para ''' || NEW.status || '''',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_project_status ON public.projects;
CREATE TRIGGER trg_log_project_status
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_project_status_change();

-- Allow gerentes and admin to insert history for their own projects
CREATE POLICY "Gerentes insert history for own projects"
  ON public.project_history FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND gerente_id = auth.uid()
    )
  );

-- Allow admin to insert history via trigger (service role covers trigger, but also direct inserts)
-- The trigger runs as SECURITY DEFINER so it bypasses RLS

-- pg_cron: auto-delete projects from trash after 15 days
-- NOTE: pg_cron extension must be enabled in your Supabase project (Dashboard > Database > Extensions)
-- If not enabled, this will fail gracefully and you can run it manually later.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'delete-trashed-projects',
      '0 3 * * *',
      $$DELETE FROM public.projects WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '15 days'$$
    );
  END IF;
END;
$$;
