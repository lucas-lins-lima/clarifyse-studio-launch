-- Phase 10: NPS Automation
-- When a project status changes to "Encerrado", automatically:
-- 1. Create NPS tokens for all clients
-- 2. Schedule emails to be sent after 1 hour

-- Function to create NPS tokens when project is marked as Encerrado
CREATE OR REPLACE FUNCTION public.create_nps_on_project_encerrado()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to "Encerrado"
  IF NEW.status = 'Encerrado' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Call the existing RPC function to create NPS tokens
    PERFORM create_nps_tokens_for_project(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS trg_create_nps_on_encerrado ON public.projects;

-- Create trigger that fires AFTER status update to Encerrado
CREATE TRIGGER trg_create_nps_on_encerrado
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_nps_on_project_encerrado();


-- Cron job to send NPS emails automatically
-- This runs every 5 minutes and sends emails for NPS responses where:
-- 1. email_sent_at is NULL (not sent yet)
-- 2. created_at was at least 1 hour ago
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'send-nps-emails-auto',
      '*/5 * * * *',  -- Every 5 minutes
      $$
      SELECT net.http_post(
        url := 'https://' || current_setting('app.supabase_url')::text || '/functions/v1/send-nps-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')::text
        ),
        body := jsonb_build_object(
          'auto_scheduled', true
        )::text
      ) AS request_id;
      $$
    );
  END IF;
END;
$$;
