-- Migration: Reset de Dados de Demonstração
-- Execute este script no Supabase SQL Editor para limpar todos os dados de teste
-- ATENÇÃO: Esta operação é irreversível. Mantém apenas o usuário administrador.

-- Limpar dados na ordem correta (respeitar foreign keys)
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
DELETE FROM profiles WHERE role != 'admin';

-- Nota: Para remover usuários não-admin do Supabase Auth,
-- utilize a Edge Function reset-demo-data (requer service role key).
-- Os registros de profiles foram removidos acima, mas os usuários
-- no Auth precisam ser removidos via API admin.
