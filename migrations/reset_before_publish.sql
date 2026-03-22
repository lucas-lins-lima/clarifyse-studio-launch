-- ============================================================
-- RESET COMPLETO DOS DADOS — Executar no Supabase SQL Editor
-- Limpa todos os dados de teste mantendo apenas o admin
-- ATENÇÃO: Esta operação é irreversível.
-- ============================================================

-- 1. Limpar dados na ordem correta (respeitando foreign keys)
DELETE FROM activity_logs;
DELETE FROM notifications;
DELETE FROM nps_responses;
DELETE FROM panel_partner_reviews;
DELETE FROM panel_partner_cpr;
DELETE FROM panel_partners;
DELETE FROM project_documents;
DELETE FROM field_sync_log;
DELETE FROM field_quota_results;
DELETE FROM field_quotas;
DELETE FROM field_config;
DELETE FROM project_schedule;
DELETE FROM project_financials;
DELETE FROM project_history;
DELETE FROM project_access;
DELETE FROM projects;
DELETE FROM goals;

-- 2. Manter apenas o perfil admin
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM profiles WHERE role != 'admin'
);
DELETE FROM profiles WHERE role != 'admin';

-- 3. Garantir etapas padrão do cronograma na tabela schedule_steps_defaults
-- (caso a migration Phase 10 não tenha inserido os dados)
INSERT INTO schedule_steps_defaults (nome, ordem, ativo) VALUES
  ('Briefing e Alinhamento', 1, true),
  ('Elaboração do Instrumento (Questionário / Roteiro)', 2, true),
  ('Aprovação do Instrumento pelo Cliente', 3, true),
  ('Início do Campo', 4, true),
  ('Encerramento do Campo', 5, true),
  ('Transcrição', 6, true),
  ('Análise dos Dados', 7, true),
  ('Produção do Entregável', 8, true),
  ('Revisão Interna', 9, true),
  ('Entrega ao Cliente', 10, true),
  ('Reunião de Apresentação dos Resultados', 11, true)
ON CONFLICT DO NOTHING;

-- 4. Garantir chaves obrigatórias em system_settings
INSERT INTO system_settings (key, value) VALUES
  ('empresa_nome', ''),
  ('empresa_cnpj', ''),
  ('empresa_email', ''),
  ('empresa_telefone', ''),
  ('empresa_endereco', ''),
  ('empresa_whatsapp', ''),
  ('empresa_site', ''),
  ('financial_password', NULL),
  ('alertas_email_ativo', 'false'),
  ('alertas_email_frequencia', 'diario')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- REMOÇÃO DE USUÁRIOS NÃO-ADMIN DO SUPABASE AUTH
-- Execute SEPARADAMENTE via Edge Function ou Dashboard:
-- No Supabase Dashboard > Authentication > Users:
-- Deletar manualmente todos os usuários de teste
-- exceto o usuário admin (manter o e-mail admin principal).
-- ============================================================
