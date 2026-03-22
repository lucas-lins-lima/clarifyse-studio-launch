import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LineChart, CalendarDays, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyForecast {
  month: string;
  monthLabel: string;
  receita: number;
  custoEstimado: number;
  lucroEstimado: number;
  projectCount: number;
  projects: Array<{ id: string; nome: string; valor: number }>;
}

export function PrevisaoReceita() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['previsao-receita'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          nome,
          status,
          data_entrega_prevista,
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
        .neq('status', 'Encerrado')
        .not('data_entrega_prevista', 'is', null);

      if (error) throw error;
      return data ?? [];
    },
  });

  const forecast = useMemo(() => {
    if (!projectsData) return [];

    const today = new Date();
    const months: MonthlyForecast[] = [];

    // Generate next 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = addMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ptBR });

      const monthData: MonthlyForecast = {
        month: monthKey,
        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        receita: 0,
        custoEstimado: 0,
        lucroEstimado: 0,
        projectCount: 0,
        projects: [],
      };

      projectsData.forEach((project: any) => {
        if (!project.data_entrega_prevista) return;

        const deliveryDate = parseISO(project.data_entrega_prevista);
        if (isWithinInterval(deliveryDate, { start: monthStart, end: monthEnd })) {
          const fin = project.project_financials?.[0];
          const receita = fin ? Number(fin.valor_total) || 0 : 0;
          const custo = fin ? (
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
            (Number(fin.custo_outros) || 0)
          ) : 0;

          monthData.receita += receita;
          monthData.custoEstimado += custo;
          monthData.projectCount += 1;
          monthData.projects.push({
            id: project.id,
            nome: project.nome,
            valor: receita,
          });
        }
      });

      monthData.lucroEstimado = monthData.receita - monthData.custoEstimado;
      months.push(monthData);
    }

    return months;
  }, [projectsData]);

  const totals = useMemo(() => {
    return forecast.reduce(
      (acc, month) => ({
        receita: acc.receita + month.receita,
        custo: acc.custo + month.custoEstimado,
        lucro: acc.lucro + month.lucroEstimado,
        projects: acc.projects + month.projectCount,
      }),
      { receita: 0, custo: 0, lucro: 0, projects: 0 }
    );
  }, [forecast]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const maxReceita = Math.max(...forecast.map((m) => m.receita), 1);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="clarifyse-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">PREVISAO PROXIMOS 6 MESES</p>
            <p className="text-xl font-bold font-display text-foreground">{formatCurrency(totals.receita)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Receita Prevista</p>
            <p className="font-semibold text-foreground">{formatCurrency(totals.receita)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Custo Estimado</p>
            <p className="font-semibold text-muted-foreground">{formatCurrency(totals.custo)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lucro Estimado</p>
            <p className={cn(
              'font-semibold',
              totals.lucro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {formatCurrency(totals.lucro)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly breakdown */}
      {forecast.every((m) => m.projectCount === 0) ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhuma entrega prevista"
          description="Nao ha projetos com data de entrega prevista nos proximos 6 meses."
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Previsao Mensal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecast.map((month) => (
              <div key={month.month} className="clarifyse-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{month.monthLabel}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{month.projectCount} projeto(s)</span>
                </div>

                {/* Visual bar */}
                <div className="mb-3">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(month.receita / maxReceita) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Receita</span>
                    <span className="font-medium text-foreground">{formatCurrency(month.receita)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lucro Est.</span>
                    <span className={cn(
                      'font-medium',
                      month.lucroEstimado >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      {formatCurrency(month.lucroEstimado)}
                    </span>
                  </div>
                </div>

                {/* Project list */}
                {month.projects.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Projetos:</p>
                    <div className="space-y-1">
                      {month.projects.slice(0, 3).map((project) => (
                        <div key={project.id} className="flex justify-between text-xs">
                          <span className="text-foreground truncate max-w-[150px]">{project.nome}</span>
                          <span className="text-muted-foreground">{formatCurrency(project.valor)}</span>
                        </div>
                      ))}
                      {month.projects.length > 3 && (
                        <p className="text-xs text-muted-foreground">+ {month.projects.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
