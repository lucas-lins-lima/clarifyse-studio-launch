import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FinanceiroOverviewProps {
  isAdmin?: boolean;
}

interface ProjectWithFinancials {
  id: string;
  nome: string;
  cliente_empresa: string | null;
  status: string;
  gerente_id: string | null;
  gerente?: { name: string } | null;
  project_financials: Array<{
    valor_total: number;
    custo_painel: number;
    custo_sala: number;
    custo_plataforma: number;
    custo_recrutamento: number;
    custo_incentivos: number;
    custo_transcricao: number;
    custo_elaboracao: number;
    custo_analise: number;
    custo_analytics_avancado: number;
    custo_dashboard: number;
    custo_relatorio_adicional: number;
    custo_outros: number;
  }>;
}

export function FinanceiroOverview({ isAdmin = false }: FinanceiroOverviewProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['financeiro-overview', profile?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          id,
          nome,
          cliente_empresa,
          status,
          gerente_id,
          gerente:profiles!projects_gerente_id_fkey(name),
          project_financials (
            valor_total,
            custo_painel,
            custo_sala,
            custo_plataforma,
            custo_recrutamento,
            custo_incentivos,
            custo_transcricao,
            custo_elaboracao,
            custo_analise,
            custo_analytics_avancado,
            custo_dashboard,
            custo_relatorio_adicional,
            custo_outros
          )
        `)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (!isAdmin && profile?.role === 'gerente') {
        query = query.eq('gerente_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ProjectWithFinancials[];
    },
    enabled: !!profile,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateProjectTotals = (project: ProjectWithFinancials) => {
    const fin = project.project_financials?.[0];
    if (!fin) return { receita: 0, custo: 0, lucro: 0, margem: 0 };

    const receita = Number(fin.valor_total) || 0;
    const custo =
      (Number(fin.custo_painel) || 0) +
      (Number(fin.custo_sala) || 0) +
      (Number(fin.custo_plataforma) || 0) +
      (Number(fin.custo_recrutamento) || 0) +
      (Number(fin.custo_incentivos) || 0) +
      (Number(fin.custo_transcricao) || 0) +
      (Number(fin.custo_elaboracao) || 0) +
      (Number(fin.custo_analise) || 0) +
      (Number(fin.custo_analytics_avancado) || 0) +
      (Number(fin.custo_dashboard) || 0) +
      (Number(fin.custo_relatorio_adicional) || 0) +
      (Number(fin.custo_outros) || 0);

    const lucro = receita - custo;
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;

    return { receita, custo, lucro, margem };
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="clarifyse-card p-4">
            <Skeleton className="h-5 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Nenhum projeto encontrado"
        description="Os dados financeiros dos projetos aparecerao aqui."
      />
    );
  }

  const projectsWithFinancials = projects.filter(p => p.project_financials?.length > 0);
  const projectsWithoutFinancials = projects.filter(p => !p.project_financials?.length);

  return (
    <div className="space-y-6">
      {/* Projects with financials */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Projetos com Dados Financeiros</h3>
        {projectsWithFinancials.length > 0 ? (
          <div className="space-y-3">
            {projectsWithFinancials.map((project) => {
              const totals = calculateProjectTotals(project);
              const isPositive = totals.lucro >= 0;

              return (
                <div
                  key={project.id}
                  className="clarifyse-card-hover p-4 cursor-pointer"
                  onClick={() => navigate(isAdmin ? `/admin/projetos/${project.id}` : `/gerente/projetos/${project.id}`)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">{project.nome}</h4>
                        <ProjectStatusBadge status={project.status as any} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.cliente_empresa || 'Sem cliente'}
                        {isAdmin && project.gerente && (
                          <span className="ml-2 text-xs">| Gerente: {project.gerente.name}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Receita</p>
                        <p className="font-medium text-foreground">{formatCurrency(totals.receita)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Custo</p>
                        <p className="font-medium text-muted-foreground">{formatCurrency(totals.custo)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Lucro</p>
                        <p className={cn(
                          'font-semibold flex items-center gap-1',
                          isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatCurrency(totals.lucro)}
                        </p>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <p className="text-xs text-muted-foreground">Margem</p>
                        <p className={cn(
                          'font-semibold',
                          totals.margem >= 30 ? 'text-green-600 dark:text-green-400' :
                          totals.margem >= 15 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        )}>
                          {totals.margem.toFixed(1)}%
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum projeto com dados financeiros.</p>
        )}
      </div>

      {/* Projects without financials */}
      {projectsWithoutFinancials.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Projetos sem Dados Financeiros</h3>
          <div className="space-y-2">
            {projectsWithoutFinancials.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="clarifyse-card p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(isAdmin ? `/admin/projetos/${project.id}` : `/gerente/projetos/${project.id}`)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{project.nome}</span>
                  <ProjectStatusBadge status={project.status as any} size="sm" />
                </div>
                <Button variant="ghost" size="sm">
                  Adicionar <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
            {projectsWithoutFinancials.length > 5 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                + {projectsWithoutFinancials.length - 5} outros projetos
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
