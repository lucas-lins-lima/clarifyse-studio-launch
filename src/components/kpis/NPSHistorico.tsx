import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Star, ThumbsUp, Meh, ThumbsDown } from 'lucide-react';

const NPS_COLORS = {
  promoters: '#22c55e',
  passives: '#f59e0b',
  detractors: '#ef4444',
};

export default function NPSHistorico() {
  // Fetch NPS history (last 12 months)
  const { data: npsHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['nps-history'],
    queryFn: async () => {
      const months = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const startDate = startOfMonth(date);
        const endDate = endOfMonth(date);

        months.push({
          month: format(date, 'MMM/yy', { locale: ptBR }),
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        });
      }

      const results = await Promise.all(
        months.map(async (m) => {
          const { data } = await supabase
            .from('project_nps')
            .select('nota')
            .gte('created_at', m.startDate)
            .lte('created_at', m.endDate);

          const responses = data ?? [];
          if (responses.length === 0) {
            return {
              month: m.month,
              nps: null,
              promoters: 0,
              passives: 0,
              detractors: 0,
              total: 0,
            };
          }

          const promoters = responses.filter((r) => r.nota >= 9).length;
          const passives = responses.filter((r) => r.nota >= 7 && r.nota <= 8).length;
          const detractors = responses.filter((r) => r.nota <= 6).length;
          const total = responses.length;
          const nps = ((promoters - detractors) / total) * 100;

          return {
            month: m.month,
            nps: Math.round(nps),
            promoters,
            passives,
            detractors,
            total,
          };
        })
      );

      return results;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch current NPS breakdown
  const { data: npsBreakdown, isLoading: loadingBreakdown } = useQuery({
    queryKey: ['nps-breakdown'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_nps_score');
      
      if (error) {
        console.error('Error fetching NPS breakdown:', error);
        return null;
      }
      
      return data?.[0] ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch recent NPS responses
  const { data: recentNPS, isLoading: loadingRecent } = useQuery({
    queryKey: ['nps-recent'],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_nps')
        .select(`
          id,
          nota,
          comentario,
          created_at,
          project_id,
          projects (nome)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            NPS: <span className="font-semibold" style={{ color: data?.nps >= 50 ? '#22c55e' : data?.nps >= 0 ? '#f59e0b' : '#ef4444' }}>
              {data?.nps ?? '—'}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data?.total ?? 0} respostas
          </p>
        </div>
      );
    }
    return null;
  };

  const getNPSColor = (nps: number | null) => {
    if (nps === null) return 'hsl(var(--muted-foreground))';
    if (nps >= 50) return '#22c55e';
    if (nps >= 0) return '#f59e0b';
    return '#ef4444';
  };

  const getNPSCategory = (nota: number) => {
    if (nota >= 9) return { label: 'Promotor', color: NPS_COLORS.promoters, icon: ThumbsUp };
    if (nota >= 7) return { label: 'Neutro', color: NPS_COLORS.passives, icon: Meh };
    return { label: 'Detrator', color: NPS_COLORS.detractors, icon: ThumbsDown };
  };

  if (loadingHistory || loadingBreakdown || loadingRecent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-80 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const total = Number(npsBreakdown?.total_responses ?? 0);
  const promotersPercent = total > 0 ? (Number(npsBreakdown?.promoters ?? 0) / total) * 100 : 0;
  const passivesPercent = total > 0 ? (Number(npsBreakdown?.passives ?? 0) / total) * 100 : 0;
  const detractorsPercent = total > 0 ? (Number(npsBreakdown?.detractors ?? 0) / total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* NPS Score Card */}
      <div className="clarifyse-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: `${getNPSColor(Number(npsBreakdown?.nps_score ?? 0))}20`,
                color: getNPSColor(Number(npsBreakdown?.nps_score ?? 0)),
              }}
            >
              <span className="text-3xl font-bold">
                {npsBreakdown?.nps_score !== undefined ? Math.round(Number(npsBreakdown.nps_score)) : '—'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">NPS Score Geral</h3>
              <p className="text-sm text-muted-foreground">{total} avaliacoes totais</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-muted">
              {promotersPercent > 0 && (
                <div 
                  className="h-full transition-all"
                  style={{ width: `${promotersPercent}%`, backgroundColor: NPS_COLORS.promoters }}
                />
              )}
              {passivesPercent > 0 && (
                <div 
                  className="h-full transition-all"
                  style={{ width: `${passivesPercent}%`, backgroundColor: NPS_COLORS.passives }}
                />
              )}
              {detractorsPercent > 0 && (
                <div 
                  className="h-full transition-all"
                  style={{ width: `${detractorsPercent}%`, backgroundColor: NPS_COLORS.detractors }}
                />
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="flex items-center gap-1" style={{ color: NPS_COLORS.promoters }}>
                <ThumbsUp className="h-3 w-3" />
                Promotores: {Number(npsBreakdown?.promoters ?? 0)} ({promotersPercent.toFixed(0)}%)
              </span>
              <span className="flex items-center gap-1" style={{ color: NPS_COLORS.passives }}>
                <Meh className="h-3 w-3" />
                Neutros: {Number(npsBreakdown?.passives ?? 0)} ({passivesPercent.toFixed(0)}%)
              </span>
              <span className="flex items-center gap-1" style={{ color: NPS_COLORS.detractors }}>
                <ThumbsDown className="h-3 w-3" />
                Detratores: {Number(npsBreakdown?.detractors ?? 0)} ({detractorsPercent.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NPS Evolution Chart */}
      <div className="clarifyse-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Evolucao do NPS (Ultimos 12 meses)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={npsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                domain={[-100, 100]}
                ticks={[-100, -50, 0, 50, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="npsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="nps"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#npsGradient)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS by Month Breakdown */}
        <div className="clarifyse-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Distribuicao Mensal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={npsHistory?.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="promoters" name="Promotores" stackId="a" fill={NPS_COLORS.promoters} />
                <Bar dataKey="passives" name="Neutros" stackId="a" fill={NPS_COLORS.passives} />
                <Bar dataKey="detractors" name="Detratores" stackId="a" fill={NPS_COLORS.detractors} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Responses */}
        <div className="clarifyse-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Avaliacoes Recentes
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentNPS && recentNPS.length > 0 ? (
              recentNPS.map((nps: any) => {
                const category = getNPSCategory(nps.nota);
                const Icon = category.icon;
                return (
                  <div 
                    key={nps.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      <span className="font-bold">{nps.nota}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm truncate">
                          {(nps.projects as any)?.nome ?? 'Projeto'}
                        </p>
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {category.label}
                        </span>
                      </div>
                      {nps.comentario && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          "{nps.comentario}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(nps.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma avaliacao recebida ainda
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
