import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Goal } from '@/types/project';
import { GoalCard } from './GoalCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function DashboardGoalsCards() {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get current month's goal
  const { data: currentGoal, isLoading } = useQuery<Goal | null>({
    queryKey: ['current-goal', currentPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('periodo_tipo', 'mensal')
        .eq('periodo_referencia', currentPeriod)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching current goal:', error);
      }
      return data as Goal | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch current progress if goal exists
  const { data: progress } = useQuery({
    queryKey: ['current-goal-progress', currentGoal?.id],
    queryFn: async () => {
      if (!currentGoal) return null;

      const [year, month] = currentGoal.periodo_referencia.split('-');
      const startDate = startOfMonth(new Date(Number(year), Number(month) - 1, 1));
      const endDate = endOfMonth(startDate);
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          status,
          project_financials (valor_total, custo_painel, custo_sala, custo_plataforma, custo_recrutamento, custo_incentivos, custo_transcricao, custo_elaboracao, custo_analise, custo_analytics_avancado, custo_dashboard, custo_relatorio_adicional, custo_outros)
        `)
        .is('deleted_at', null)
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      // Fetch NPS
      const { data: npsData } = await supabase
        .from('project_nps')
        .select('nota')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      let totalReceita = 0;
      let totalCusto = 0;
      let projetosEncerrados = 0;

      (projects ?? []).forEach((p: any) => {
        if (p.status === 'Encerrado') projetosEncerrados++;
        const fin = p.project_financials?.[0];
        if (fin) {
          totalReceita += Number(fin.valor_total) || 0;
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
          totalCusto += custo;
        }
      });

      const margem = totalReceita > 0 ? ((totalReceita - totalCusto) / totalReceita) * 100 : 0;

      const responses = npsData ?? [];
      let npsScore = 0;
      if (responses.length > 0) {
        const promoters = responses.filter((r) => r.nota >= 9).length;
        const detractors = responses.filter((r) => r.nota <= 6).length;
        npsScore = ((promoters - detractors) / responses.length) * 100;
      }

      return {
        receita: totalReceita,
        projetos_encerrados: projetosEncerrados,
        margem_media: margem,
        nps_medio: npsScore,
      };
    },
    enabled: !!currentGoal,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!currentGoal) {
    return null;
  }

  // Get the 3 most important goals (prioritize those that have targets)
  const goalsToShow: Array<{
    key: string;
    title: string;
    current: number;
    target: number;
    format: 'currency' | 'percent' | 'number';
  }> = [];

  if (currentGoal.meta_receita !== null && currentGoal.meta_receita > 0) {
    goalsToShow.push({
      key: 'receita',
      title: 'Receita',
      current: progress?.receita ?? 0,
      target: currentGoal.meta_receita,
      format: 'currency',
    });
  }

  if (currentGoal.meta_projetos_encerrados !== null && currentGoal.meta_projetos_encerrados > 0) {
    goalsToShow.push({
      key: 'projetos',
      title: 'Proj. Encerrados',
      current: progress?.projetos_encerrados ?? 0,
      target: currentGoal.meta_projetos_encerrados,
      format: 'number',
    });
  }

  if (currentGoal.meta_margem_media !== null && currentGoal.meta_margem_media > 0) {
    goalsToShow.push({
      key: 'margem',
      title: 'Margem',
      current: progress?.margem_media ?? 0,
      target: currentGoal.meta_margem_media,
      format: 'percent',
    });
  }

  if (currentGoal.meta_nps_medio !== null && currentGoal.meta_nps_medio > 0) {
    goalsToShow.push({
      key: 'nps',
      title: 'NPS',
      current: progress?.nps_medio ?? 0,
      target: currentGoal.meta_nps_medio,
      format: 'number',
    });
  }

  // Show only the first 3
  const displayGoals = goalsToShow.slice(0, 3);

  if (displayGoals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="clarifyse-section-label mb-0">METAS DO MES</p>
        <Link
          to="/admin/metas"
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {displayGoals.map((goal) => (
          <GoalCard
            key={goal.key}
            title={goal.title}
            current={goal.current}
            target={goal.target}
            format={goal.format}
            compact
          />
        ))}
      </div>
    </div>
  );
}
