# Clarifyse — Client Portal

## Project Overview
A client portal for Clarifyse Strategy & Research. Built with React + Vite + TypeScript + TailwindCSS + shadcn/ui. Authentication and database are powered by an external Supabase project.

## Architecture
- **Frontend**: React 18 + Vite 5 (pure SPA, no server-side rendering)
- **Auth & Database**: Supabase (external project `rbjrpzmsrygvkpdvnzsh`)
- **Styling**: Tailwind CSS v3 + shadcn/ui components
- **State**: TanStack Query for server state, React Context for auth
- **Routing**: React Router v6

## User Roles
- **admin** — full access to all projects, users, and settings
- **gerente** — manages their own projects and clients assigned to those projects
- **cliente** — read-only access to projects they're granted access to

## Key Pages
- `/login` — authentication page
- `/admin` — admin dashboard
- `/gerente` — manager dashboard
- `/cliente` — client dashboard
- `/admin/projetos`, `/gerente/projetos` — project management
- `/admin/clientes`, `/gerente/clientes` — user management
- `/admin/configuracoes` — system settings (8 tabs)
- `/admin/kpis`, `/admin/metas`, `/admin/notificacoes`, `/admin/financeiro` — analytics
- `/cliente/sobre` — About Clarifyse page for clients
- `/avaliacao/:token` — Public NPS evaluation form (no auth required)
- `/trocar-senha` — forced password change on first login

## Environment Variables
Set in `.replit` under `[userenv.shared]`:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key (safe to expose in frontend)
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

## Database (Supabase)
Tables: `profiles`, `user_roles`, `projects`, `project_access`, `project_history`, `system_settings`, `project_schedule`, `field_config`, `field_quotas`, `field_quota_results`, `field_sync_log`, `project_documents`, `financial_transactions`, `project_kpis`, `project_nps_goals`, `notifications`, `nps_responses`, `activity_logs`, `panel_partners`, `panel_partner_cpr`, `panel_partner_reviews`, `schedule_steps_defaults`

Migrations are in `supabase/migrations/` and are applied to the hosted Supabase project.

## Phase 10 — Final Features
Migration: `supabase/migrations/20260319260000_phase10_final.sql`

### New Features
- **NPS Avaliação tab** in ProjectDetailPage — send/track NPS tokens for clients
- **Public NPS form** at `/avaliacao/:token` — clients rate project, stars, prazo
- **Página Sobre a Clarifyse** at `/cliente/sobre` — full branding/pillar page
- **PDF Export** on every ProjectDetailPage — branded A4 PDF report via jsPDF
- **Excel Exports** on ProjectsPage and ClientesPage — `.xlsx` download with filters applied
- **AdminConfiguracoes expanded** (8 tabs):
  - Gerentes (existing)
  - Perfil & Segurança (name change, password, financial module password)
  - Dados da Empresa (company name, email, WhatsApp, slogan)
  - Etapas Padrão (drag-and-drop schedule step defaults)
  - Lixeira (soft-deleted projects restore/permanent delete)
  - Alertas (email alert configuration)
  - Parceiros de Painel (CPR table, partner reviews)
  - Log de Atividades (audit log, 90-day retention, Excel export)

### New Tables
- `nps_responses` — NPS tokens with `email_sent_at`, `respondido`, `expires_at`
- `activity_logs` — Admin audit log with category, action, context (pg_cron 90d retention)
- `panel_partners` — Panel sample suppliers
- `panel_partner_cpr` — Cost per respondent table (perfil × faixa matrix)
- `panel_partner_reviews` — Star ratings per partner per project
- `schedule_steps_defaults` — Configurable default steps for new project schedules

### New Packages
- `jspdf` — PDF generation
- `html2canvas` — DOM-to-canvas (installed, available for future use)

## Supabase Edge Function
`supabase/functions/manage-users/index.ts` — deployed to Supabase, handles admin user management actions (create, reset-password, deactivate, activate, delete, change-password). Uses service role key server-side.

## Development
```
npm install
npm run dev        # starts on port 5000
npm run build      # production build
```

## Phase 6 — Field Monitoring (Monitoramento de Campo)

### New Components
- `src/components/projects/CampoTab.tsx` — Admin/gerente config: quotas (4 types), Google Sheets integration, manual entry, drag-and-drop reorder
- `src/components/projects/FieldMonitoringView.tsx` — Client-facing monitoring: 4 metric cards, quota panels with progress bars and Recharts bar charts
- `src/components/projects/FieldBarChart.tsx` — Lazy-loaded horizontal bar chart (Recharts)

### New Edge Functions
- `supabase/functions/get-sheet-headers/index.ts` — Reads header row from Google Sheets CSV
- `supabase/functions/sync-field-data/index.ts` — Syncs field data (single project or all), processes all quota types

### New Migration
- `supabase/migrations/20260319220000_phase6_field.sql` — Tables: field_config, field_quotas, field_quota_results, field_sync_log with full RLS

### Quota Types
- **Numérico**: maps numeric values to labels (e.g., 1=Male, 2=Female)
- **Faixa Etária**: classifies by age range
- **Texto/Categoria**: exact text match (e.g., city names)
- **Booleano**: Sim/Não based on configured values

### Auto-Sync
- pg_cron calls sync-field-data Edge Function every 5 minutes (requires pg_cron + pg_net in Supabase)
- Manual "Atualizar Agora" button available for admin/gerente/cliente
- Frontend refreshes cached data every 5 minutes via React Query

## Phase 7 — Portal do Cliente + Documentos + Termômetro de Saúde

### New Components
- `src/components/projects/DocumentosTab.tsx` — Admin/gerente: upload, list, edit, replace, delete, toggle visibility. Supabase Storage with signed URLs (1hr expiry)
- `src/components/projects/DocumentosCliente.tsx` — Client-facing: only `visivel_cliente=true` docs, lazy-loaded (IntersectionObserver), signed download URLs
- `src/components/projects/HistoricoFeed.tsx` — Aggregated timeline from project_history + field_sync_log + project_documents with pagination
- `src/components/projects/SuporteSection.tsx` — Contact section reading `email_suporte` and `whatsapp` from system_settings

### Updated Components
- `src/components/projects/HealthThermometer.tsx` — Now accepts `scheduleItems` + `fieldProgress` props for richer health calculation including delayed steps and field progress vs deadline
- `src/pages/cliente/ClienteProjectDetailPage.tsx` — Full overhaul: 6-tab layout (Visão Geral, Cronograma, Campo, Documentos, Histórico, Suporte), welcome card on first access (first_access flag), last_seen_at update on visit, status descriptions, info card grid
- `src/pages/cliente/ClienteDashboard.tsx` — Added "Novo" badge (teal pulsing dot) when project.updated_at > last_seen_at
- `src/pages/projects/ProjectDetailPage.tsx` — Added Documentos tab + replaced inline Histórico with HistoricoFeed

### New DB Migration
- `supabase/migrations/20260319230000_phase7_documents.sql`:
  - `project_documents` table with full RLS (admin + gerente responsável write, client read visivel only)
  - `project_access.last_seen_at` + `project_access.first_access` columns
  - Supabase Storage bucket `project-documents` (private, 50MB limit, restricted MIME types)
  - Storage RLS for admin, gerente, client (signed URLs only)

### Key Behaviors
- `last_seen_at` updated on every project page visit (useEffect fires after access check)
- `first_access` set to false on first visit; welcome card shown until dismissed or second visit
- Documents lazy-load only when section scrolls into viewport (IntersectionObserver, 200px margin)
- All download links use signed URLs with 1-hour expiry — never public permanent URLs
- HistoricoFeed aggregates 3 sources: project_history, field_sync_log, project_documents (10-item pages)

## Pre-Publish Fixes (applied 20/03/2026)

### Bug Fixes
1. **`DadosEmpresaTab.tsx`** — upsert loop now checks `if (error) throw error` — silent failures are no longer swallowed.
2. **`CronogramaTab.tsx`** — "Usar etapas padrão Clarifyse" now fetches from `schedule_steps_defaults` table (respects admin customizations from Configurações). Falls back to hardcoded list if table is empty.

### New Files
- `migrations/reset_before_publish.sql` — SQL script to clear all test data before going live (run in Supabase SQL Editor)
- `RELATORIO_PRE_PUBLICACAO.md` — Full pre-launch checklist: bugs fixed, env vars needed, SQL to run, post-deploy checklist

## Deployment
Configured for Replit Autoscale deployment. Build: `npm run build`. Run: `node ./dist/index.cjs`.
