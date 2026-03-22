import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, Clock, Circle, AlertTriangle, List, GitBranch,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduleStatus } from '@/types/project';
import { motion } from 'framer-motion';

function todayBrasilia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function calcStatus(item: any): ScheduleStatus {
  if (item.status_manual && item.status) return item.status as ScheduleStatus;
  const today = todayBrasilia();
  if (item.conclusao_real) return 'Concluída';
  if (item.inicio_real && !item.conclusao_real) return 'Em Andamento';
  if (item.conclusao_prevista && item.conclusao_prevista < today && !item.conclusao_real) return 'Atrasada';
  return 'Pendente';
}

function formatDatePT(d: string | null): string {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return d; }
}

const STATUS_CONFIG: Record<ScheduleStatus, {
  label: string;
  dotClass: string;
  badgeClass: string;
  icon: React.ElementType;
  pulse?: boolean;
}> = {
  'Concluída': {
    label: 'Concluída',
    dotClass: 'bg-green-500',
    badgeClass: 'text-green-700 bg-green-50 border border-green-200',
    icon: CheckCircle2,
  },
  'Em Andamento': {
    label: 'Em Andamento',
    dotClass: 'bg-teal-500',
    badgeClass: 'text-teal-700 bg-teal-50 border border-teal-200',
    icon: Clock,
    pulse: true,
  },
  'Pendente': {
    label: 'Pendente',
    dotClass: 'bg-slate-400',
    badgeClass: 'text-slate-600 bg-slate-50 border border-slate-200',
    icon: Circle,
  },
  'Atrasada': {
    label: 'Atrasada',
    dotClass: 'bg-red-500',
    badgeClass: 'text-red-700 bg-red-50 border border-red-200',
    icon: AlertTriangle,
  },
};

interface ClienteCronogramaViewProps {
  projectId: string;
}

export function ClienteCronogramaView({ projectId }: ClienteCronogramaViewProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'tabela'>('timeline');

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['project-schedule-cliente', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_schedule')
        .select('*')
        .eq('project_id', projectId)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

  const items = rawItems.filter((it: any) => it.visivel !== false);
  const resolvedItems = items.map((it: any) => ({ ...it, resolvedStatus: calcStatus(it) as ScheduleStatus }));

  const totalEtapas = resolvedItems.length;
  const concluidas = resolvedItems.filter((it: any) => it.resolvedStatus === 'Concluída').length;
  const progressoPct = totalEtapas > 0 ? Math.round((concluidas / totalEtapas) * 100) : 0;

  const currentIdx = resolvedItems.findIndex((it: any) => it.resolvedStatus === 'Em Andamento');
  const youAreHereIdx = currentIdx >= 0
    ? currentIdx
    : resolvedItems.findIndex((it: any) => it.resolvedStatus === 'Pendente');

  const lastUpdated = rawItems.length > 0
    ? rawItems.reduce((latest: any, it: any) =>
        it.updated_at > latest.updated_at ? it : latest, rawItems[0])
    : null;

  const formatLastUpdated = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ts; }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <GitBranch className="h-8 w-8 mx-auto mb-3 opacity-30" />
        <p className="text-sm">O cronograma do seu projeto será disponibilizado em breve pela equipe Clarifyse.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="clarifyse-section-label text-xs">CRONOGRAMA DO PROJETO</p>
          <h3 className="font-display text-lg font-semibold text-foreground">Linha do Tempo</h3>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            className={viewMode === 'timeline' ? 'bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90' : ''}
          >
            <GitBranch className="h-3.5 w-3.5 mr-1.5" />
            Timeline
          </Button>
          <Button
            variant={viewMode === 'tabela' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tabela')}
            className={viewMode === 'tabela' ? 'bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90' : ''}
          >
            <List className="h-3.5 w-3.5 mr-1.5" />
            Tabela
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{concluidas} de {totalEtapas} etapas concluídas</span>
          <span className="font-semibold text-foreground">{progressoPct}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressoPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(to right, #0D9488, #7B2D8B)' }}
          />
        </div>
      </div>

      {/* Timeline view */}
      {viewMode === 'timeline' && (
        <div className="relative">
          <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-border" />
          <div className="space-y-3">
            {resolvedItems.map((item: any, i: number) => {
              const cfg = STATUS_CONFIG[item.resolvedStatus];
              const isYouHere = i === youAreHereIdx;
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative pl-12 pr-3 py-3 rounded-xl transition-all ${
                    isYouHere
                      ? 'border-l-4 border-teal-500 bg-teal-50/60 shadow-sm'
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  {/* Dot */}
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center z-10 bg-white border-2 ${
                    item.resolvedStatus === 'Concluída' ? 'border-green-500' :
                    item.resolvedStatus === 'Em Andamento' ? 'border-teal-500' :
                    item.resolvedStatus === 'Atrasada' ? 'border-red-500' :
                    'border-slate-300'
                  }`}>
                    <div className={`h-2.5 w-2.5 rounded-full ${cfg.dotClass} ${cfg.pulse ? 'animate-pulse' : ''}`} />
                  </div>

                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{item.nome}</p>
                        {isYouHere && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-teal-700 bg-teal-100 rounded-full border border-teal-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse inline-block" />
                            Você está aqui
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                        {(item.inicio_previsto || item.conclusao_prevista) && (
                          <span>
                            Previsto: {formatDatePT(item.inicio_previsto)} → {formatDatePT(item.conclusao_prevista)}
                          </span>
                        )}
                        {(item.inicio_real || item.conclusao_real) && (
                          <span className={item.conclusao_real && item.conclusao_prevista && item.conclusao_real > item.conclusao_prevista ? 'text-red-600' : 'text-green-600'}>
                            Realizado: {formatDatePT(item.inicio_real)} → {formatDatePT(item.conclusao_real)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${cfg.badgeClass} flex-shrink-0`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table view */}
      {viewMode === 'tabela' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">ETAPA</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">PREVISTO</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">REALIZADO</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {resolvedItems.map((item: any, i: number) => {
                const cfg = STATUS_CONFIG[item.resolvedStatus];
                const Icon = cfg.icon;
                const isYouHere = i === youAreHereIdx;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-border transition-colors ${
                      isYouHere ? 'bg-teal-50/60' : 'hover:bg-muted/20'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{item.nome}</span>
                        {isYouHere && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 bg-teal-100 rounded-full border border-teal-200">
                            <span className="h-1 w-1 rounded-full bg-teal-500 animate-pulse inline-block" />
                            Você está aqui
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {item.inicio_previsto || item.conclusao_prevista
                        ? `${formatDatePT(item.inicio_previsto)} → ${formatDatePT(item.conclusao_prevista)}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                      {item.inicio_real || item.conclusao_real ? (
                        <span className={item.conclusao_real && item.conclusao_prevista && item.conclusao_real > item.conclusao_prevista ? 'text-red-600' : 'text-green-600'}>
                          {formatDatePT(item.inicio_real)} → {formatDatePT(item.conclusao_real)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${cfg.badgeClass}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-xs text-muted-foreground text-right">
          Última atualização: {formatLastUpdated(lastUpdated.updated_at)} (horário de Brasília)
        </p>
      )}
    </div>
  );
}
