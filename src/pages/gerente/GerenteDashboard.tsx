import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { FolderOpen, Clock, AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format, parseISO, isPast, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '@/types/project';
import { RiskAlertsBanner } from '@/components/alerts/RiskAlertsBanner';

function formatDate(d: string | null): string {
  if (!d) return '';
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return ''; }
}

export default function GerenteDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const { data: allProjects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['gerente-dashboard-projects', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, nome, cliente_empresa, status, data_entrega_prevista, deleted_at, created_at, updated_at, metodologia, pilar, gerente_id, objetivo, observacoes_internas, data_inicio')
        .eq('gerente_id', user!.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });
      return (data ?? []) as Project[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  const active = allProjects.filter(p => p.status !== 'Encerrado' && p.status !== 'Pausado');
  const inField = allProjects.filter(p => p.status === 'Campo');
  const overdue = allProjects.filter(p => {
    if (!p.data_entrega_prevista) return false;
    if (p.status === 'Encerrado' || p.status === 'Entrega Final') return false;
    try {
      const d = parseISO(p.data_entrega_prevista);
      return isValid(d) && isPast(d);
    } catch { return false; }
  });

  const recentProjects = allProjects.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <p className="clarifyse-section-label">PAINEL DO GERENTE</p>
        <h1 className="text-2xl font-display font-bold text-foreground mt-1">
          Olá, {profile?.name?.split(' ')[0]}
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard label="PROJETOS ATIVOS" value={active.length} icon={FolderOpen} loading={isLoading} accentColor="purple" />
        <StatCard label="EM CAMPO" value={inField.length} icon={Clock} loading={isLoading} accentColor="teal" />
        <StatCard label="EM ATRASO" value={overdue.length} icon={AlertTriangle} loading={isLoading} />
        <StatCard label="TOTAL" value={allProjects.length} icon={FolderOpen} loading={isLoading} />
      </motion.div>

      {/* Risk Alerts Banner */}
      <RiskAlertsBanner />

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="clarifyse-section-label mb-0.5">MEUS PROJETOS</p>
            <h2 className="text-lg font-display font-semibold text-foreground">Projetos Recentes</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={() => navigate('/gerente/projetos')}>
              <Plus className="h-4 w-4 mr-1.5" /> Novo Projeto
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/gerente/projetos')}>
              Ver todos <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>

        {isLoading ? (
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
                onClick={() => navigate(`/gerente/projetos/${project.id}`)}
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
            title="Nenhum projeto vinculado"
            description="Os projetos atribuídos a você aparecerão aqui."
            action={
              <Button variant="gradient" size="sm" onClick={() => navigate('/gerente/projetos')}>
                <Plus className="h-4 w-4 mr-1.5" /> Criar Primeiro Projeto
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
