import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PieChart, Users, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface GerenteFinancials {
  gerente_id: string;
  gerente_name: string;
  totalReceita: number;
  totalCusto: number;
  totalLucro: number;
  projectCount: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const MONTHS = [
  { value: '0', label: 'Todos' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Marco' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function DistribuicaoLucro() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR.toString());
  const [selectedMonth, setSelectedMonth] = useState('0');

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['distribuicao-lucro', selectedYear, selectedMonth],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          id,
          nome,
          gerente_id,
          data_inicio,
          gerente:profiles!projects_gerente_id_fkey(id, name),
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
            custo_outros,
            quem_fechou
          )
        `)
        .is('deleted_at', null)
        .not('gerente_id', 'is', null);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const gerenteStats = useMemo(() => {
    if (!projectsData) return [];

    const stats: Record<string, GerenteFinancials> = {};

    projectsData.forEach((project: any) => {
      // Filter by year/month based on data_inicio
      if (project.data_inicio) {
        const date = new Date(project.data_inicio);
        const projectYear = date.getFullYear();
        const projectMonth = date.getMonth() + 1;

        if (projectYear !== parseInt(selectedYear)) return;
        if (selectedMonth !== '0' && projectMonth !== parseInt(selectedMonth)) return;
      }

      const fin = project.project_financials?.[0];
      if (!fin || !project.gerente_id) return;

      const gerenteId = project.gerente_id;
      const gerenteName = project.gerente?.name || 'Desconhecido';

      if (!stats[gerenteId]) {
        stats[gerenteId] = {
          gerente_id: gerenteId,
          gerente_name: gerenteName,
          totalReceita: 0,
          totalCusto: 0,
          totalLucro: 0,
          projectCount: 0,
        };
      }

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

      stats[gerenteId].totalReceita += receita;
      stats[gerenteId].totalCusto += custo;
      stats[gerenteId].totalLucro += receita - custo;
      stats[gerenteId].projectCount += 1;
    });

    return Object.values(stats).sort((a, b) => b.totalLucro - a.totalLucro);
  }, [projectsData, selectedYear, selectedMonth]);

  const totalLucro = useMemo(() => {
    return gerenteStats.reduce((acc, g) => acc + g.totalLucro, 0);
  }, [gerenteStats]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ano</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Mes</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Total */}
      <div className="clarifyse-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">LUCRO TOTAL DO PERIODO</p>
              <p className="text-xl font-bold font-display text-foreground">{formatCurrency(totalLucro)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Gerentes</p>
            <p className="text-lg font-semibold text-foreground">{gerenteStats.length}</p>
          </div>
        </div>
      </div>

      {/* Gerente breakdown */}
      {gerenteStats.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum dado encontrado"
          description="Nao ha projetos com dados financeiros para o periodo selecionado."
        />
      ) : (
        <div className="space-y-3">
          {gerenteStats.map((gerente, index) => {
            const percentage = totalLucro > 0 ? (gerente.totalLucro / totalLucro) * 100 : 0;
            const isPositive = gerente.totalLucro >= 0;

            return (
              <div key={gerente.gerente_id} className="clarifyse-card p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{gerente.gerente_name}</p>
                      <p className="text-xs text-muted-foreground">{gerente.projectCount} projeto(s)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Receita</p>
                      <p className="font-medium text-foreground">{formatCurrency(gerente.totalReceita)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Custo</p>
                      <p className="font-medium text-muted-foreground">{formatCurrency(gerente.totalCusto)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Lucro</p>
                      <p className={cn(
                        'font-semibold',
                        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {formatCurrency(gerente.totalLucro)}
                      </p>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <p className="text-xs text-muted-foreground">% Total</p>
                      <p className="font-semibold text-primary">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isPositive ? 'bg-primary' : 'bg-red-500'
                      )}
                      style={{ width: `${Math.abs(percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
