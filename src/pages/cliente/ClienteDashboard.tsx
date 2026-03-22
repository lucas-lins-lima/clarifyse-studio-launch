import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { FolderOpen, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_FLOW = [
  'Briefing',
  'Elaboração do Instrumento',
  'Campo',
  'Análise dos Dados',
  'Produção do Entregável',
  'Entrega Final',
];

interface ProjectWithAccess {
  id: string;
  nome: string;
  cliente_empresa: string | null;
  status: string;
  pilar: string | null;
  metodologia: string[];
  data_entrega_prevista: string | null;
  data_inicio: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  gerente_id: string | null;
  objetivo: string | null;
  observacoes_internas: string | null;
  last_seen_at: string | null;
  first_access: boolean;
}

export default function ClienteDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery<ProjectWithAccess[]>({
    queryKey: ['cliente-projects', user?.id],
    queryFn: async () => {
      const { data: accessData } = await supabase
        .from('project_access')
        .select('project_id, last_seen_at, first_access')
        .eq('user_id', user!.id);

      if (!accessData || accessData.length === 0) return [];

      const projectIds = accessData.map((a: any) => a.project_id);
      const { data } = await supabase
        .from('projects')
        .select('id, nome, cliente_empresa, status, pilar, metodologia, data_entrega_prevista, data_inicio, deleted_at, created_at, updated_at, gerente_id, objetivo, observacoes_internas')
        .in('id', projectIds)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (!data) return [];

      const accessMap: Record<string, { last_seen_at: string | null; first_access: boolean }> = {};
      accessData.forEach((a: any) => {
        accessMap[a.project_id] = { last_seen_at: a.last_seen_at, first_access: a.first_access ?? true };
      });

      return data.map((p: any): ProjectWithAccess => ({
        ...p,
        last_seen_at: accessMap[p.id]?.last_seen_at ?? null,
        first_access: accessMap[p.id]?.first_access ?? true,
      }));
    },
    enabled: !!user?.id,
  });

  function isNovo(project: ProjectWithAccess): boolean {
    if (!project.last_seen_at) return false;
    return new Date(project.updated_at) > new Date(project.last_seen_at);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Olá, {profile?.name?.split(' ')[0]}.
        </h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao seu portal de acompanhamento.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="clarifyse-card p-6 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-28 mt-2" />
            </div>
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {projects.map((project, i) => {
            const statusIdx = STATUS_FLOW.indexOf(project.status);
            const pct = statusIdx >= 0 ? Math.round(((statusIdx + 1) / STATUS_FLOW.length) * 100) : 0;
            const novo = isNovo(project);

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="clarifyse-card-hover p-6 space-y-4 cursor-pointer relative"
                onClick={() => navigate(`/cliente/projetos/${project.id}`)}
              >
                {novo && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-clarifyse-teal animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-clarifyse-teal" />
                    Novo
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 pr-10">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-lg text-foreground leading-snug">{project.nome}</h3>
                    {project.cliente_empresa && (
                      <p className="text-sm text-muted-foreground">{project.cliente_empresa}</p>
                    )}
                  </div>
                  <HealthThermometer project={project as any} clientView />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <ProjectStatusBadge status={project.status as any} size="sm" />
                  {project.pilar && (
                    <span className="clarifyse-section-label text-xs">{project.pilar}</span>
                  )}
                </div>

                {statusIdx >= 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(to right, #0D9488, #7B2D8B)',
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  {project.data_entrega_prevista ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Entrega: {format(parseISO(project.data_entrega_prevista), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  ) : <span />}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-7"
                    onClick={e => { e.stopPropagation(); navigate(`/cliente/projetos/${project.id}`); }}
                  >
                    Ver Projeto
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="Nenhum projeto disponível"
          description="Quando houver projetos vinculados ao seu acesso, eles aparecerão aqui."
        />
      )}
    </div>
  );
}
