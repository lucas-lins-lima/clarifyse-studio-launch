import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { FolderOpen, Users, UserCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '@/types/project';
import { DashboardGoalsCards } from '@/components/goals/DashboardGoalsCards';
import { RiskAlertsBanner } from '@/components/alerts/RiskAlertsBanner';

function formatDate(d: string | null): string {
  if (!d) return '';
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return ''; }
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [projectsRes, clientsRes, gerentesRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id, status', { count: 'exact' })
          .is('deleted_at', null),
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'cliente')
          .eq('status', 'ativo'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'gerente')
          .eq('status', 'ativo'),
      ]);

      const projects = projectsRes.data ?? [];
      const active = projects.filter(p => p.status !== 'Encerrado' && p.status !== 'Pausado');

      return {
        totalProjects: projectsRes.count ?? 0,
        activeProjects: active.length,
        totalClients: clientsRes.count ?? 0,
        totalGerentes: gerentesRes.count ?? 0,
      };
    },
    staleTime: 1000 * 60,
  });

  const { data: recentProjects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['admin-recent-projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, nome, cliente_empresa, status, data_entrega_prevista, deleted_at, created_at, updated_at, metodologia, pilar, gerente_id, objetivo, observacoes_internas, data_inicio')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(5);
      return (data ?? []) as Project[];
    },
    staleTime: 1000 * 60,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="clarifyse-section-label">PAINEL DO ADMINISTRADOR</p>
        <h1 className="text-2xl font-display font-bold text-foreground mt-1">
          Olá, {profile?.name?.split(' ')[0]}
        </h1>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard label="PROJETOS ATIVOS" value={stats?.activeProjects ?? 0} icon={FolderOpen} loading={loadingStats} accentColor="purple" />
        <StatCard label="TOTAL DE PROJETOS" value={stats?.totalProjects ?? 0} icon={FolderOpen} loading={loadingStats} />
        <StatCard label="CLIENTES" value={stats?.totalClients ?? 0} icon={Users} loading={loadingStats} accentColor="teal" />
        <StatCard label="GERENTES" value={stats?.totalGerentes ?? 0} icon={UserCheck} loading={loadingStats} />
      </motion.div>

      {/* Risk Alerts Banner */}
      <RiskAlertsBanner />

      {/* Goals Mini-Cards */}
      <DashboardGoalsCards />

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="clarifyse-section-label mb-0.5">PROJETOS RECENTES</p>
            <h2 className="text-lg font-display font-semibold text-foreground">Últimas Atualizações</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/projetos')}>
            Ver todos <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>

        {loadingProjects ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="clarifyse-card p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : recentProjects.length > 0 ? (
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="clarifyse-card-hover p-4 flex items-center justify-between cursor-pointer"
                onClick={() => navigate(`/admin/projetos/${project.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{project.nome}</h3>
                  <p className="text-sm text-muted-foreground truncate">{project.cliente_empresa || '—'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {project.data_entrega_prevista && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      Entrega: {formatDate(project.data_entrega_prevista)}
                    </span>
                  )}
                  <HealthThermometer project={project} />
                  <ProjectStatusBadge status={project.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="Nenhum projeto encontrado"
            description="Os projetos criados aparecerão aqui. Comece criando seu primeiro projeto."
            action={
              <Button variant="gradient" size="sm" onClick={() => navigate('/admin/projetos')}>
                <FolderOpen className="h-4 w-4 mr-1.5" /> Ir para Projetos
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
