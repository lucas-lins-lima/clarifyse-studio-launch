import React, { Suspense, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Users, Timer, Activity, AlertCircle } from 'lucide-react';
import {
  FieldConfig, FieldQuota, FieldQuotaResult,
  QuotaConfigNumerico, QuotaConfigFaixaEtaria, QuotaConfigTexto, QuotaConfigBooleano,
} from '@/types/project';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BarChartSection = React.lazy(() => import('./FieldBarChart'));

function formatBrDatetime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch { return iso; }
}

function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={`h-2 rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #0D9488, #A855F7)',
        }}
      />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, extra }: {
  icon: React.FC<any>; label: string; value: React.ReactNode; sub?: React.ReactNode; extra?: React.ReactNode;
}) {
  return (
    <div className="clarifyse-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-clarifyse-teal" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <div>
        <div className="text-3xl font-bold text-foreground font-display">{value}</div>
        {sub && <div className="text-sm text-muted-foreground mt-1">{sub}</div>}
      </div>
      {extra}
    </div>
  );
}

function StatusBadge({ config }: { config: FieldConfig | null }) {
  if (!config) return <Badge variant="secondary">Aguardando</Badge>;
  if (config.realizado_total >= (config.meta_total ?? Infinity)) {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Encerrado</Badge>;
  }
  if (config.realizado_total > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        Em Andamento
      </span>
    );
  }
  return <Badge variant="secondary">Aguardando</Badge>;
}

function QuotaPanel({ quota, results, isAdmin }: { quota: FieldQuota; results: FieldQuotaResult[]; isAdmin: boolean }) {
  const resultMap = Object.fromEntries(results.map(r => [r.subcategoria, r]));

  function getRows(): { label: string; realizado: number; meta: number }[] {
    if (quota.tipo === 'numerico') {
      const cfg = quota.config as QuotaConfigNumerico;
      return (cfg.subcategorias ?? []).map(s => ({
        label: s.rotulo,
        realizado: resultMap[s.rotulo]?.realizado ?? 0,
        meta: resultMap[s.rotulo]?.meta ?? s.meta,
      }));
    }
    if (quota.tipo === 'faixa_etaria') {
      const cfg = quota.config as QuotaConfigFaixaEtaria;
      return (cfg.faixas ?? []).map(f => ({
        label: f.rotulo,
        realizado: resultMap[f.rotulo]?.realizado ?? 0,
        meta: resultMap[f.rotulo]?.meta ?? f.meta,
      }));
    }
    if (quota.tipo === 'texto') {
      const cfg = quota.config as QuotaConfigTexto;
      return (cfg.categorias ?? []).map(c => ({
        label: c.valor,
        realizado: resultMap[c.valor]?.realizado ?? 0,
        meta: resultMap[c.valor]?.meta ?? c.meta,
      }));
    }
    if (quota.tipo === 'booleano') {
      const cfg = quota.config as QuotaConfigBooleano;
      return [
        { label: 'Sim', realizado: resultMap['Sim']?.realizado ?? 0, meta: cfg.meta_sim },
        { label: 'Não', realizado: resultMap['Não']?.realizado ?? 0, meta: cfg.meta_nao },
      ];
    }
    return [];
  }

  const rows = getRows();
  const isBool = quota.tipo === 'booleano';

  function statusBadge(realizado: number, meta: number) {
    if (meta === 0) return null;
    const pct = meta > 0 ? (realizado / meta) * 100 : 0;
    if (pct >= 100) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Meta atingida</span>;
    if (pct >= 50) return <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">Em andamento</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">Abaixo do esperado</span>;
  }

  return (
    <div className="clarifyse-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{quota.nome}</p>
        <span className="text-xs text-muted-foreground capitalize">{quota.tipo.replace('_', ' ')}</span>
      </div>

      {isBool ? (
        <div className="grid grid-cols-2 gap-3">
          {rows.map(row => (
            <div key={row.label} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-2xl font-bold font-display">
                {row.realizado} <span className="text-sm font-normal text-muted-foreground">/ {row.meta}</span>
              </p>
              <ProgressBar value={row.realizado} max={row.meta} />
              {statusBadge(row.realizado, row.meta)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <BarChartSection rows={rows} />
          </Suspense>
          <div className="space-y-3">
            {rows.map(row => {
              const pct = row.meta > 0 ? Math.min((row.realizado / row.meta) * 100, 100) : 0;
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium truncate">{row.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-muted-foreground">{row.realizado} / {row.meta}</span>
                      <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                      {statusBadge(row.realizado, row.meta)}
                    </div>
                  </div>
                  <ProgressBar value={row.realizado} max={row.meta} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldMonitoringViewProps {
  projectId: string;
  projectStatus: string;
  isAdmin?: boolean;
}

export function FieldMonitoringView({ projectId, projectStatus, isAdmin = false }: FieldMonitoringViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncLoading, setSyncLoading] = React.useState(false);

  const { data: fieldConfig, isLoading: configLoading } = useQuery<FieldConfig | null>({
    queryKey: ['field-config', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('field_config')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      return data as FieldConfig | null;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: quotas = [], isLoading: quotasLoading } = useQuery<FieldQuota[]>({
    queryKey: ['field-quotas', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('field_quotas')
        .select('*')
        .eq('project_id', projectId)
        .order('ordem');
      return (data ?? []) as FieldQuota[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allResults = [], isLoading: resultsLoading } = useQuery<FieldQuotaResult[]>({
    queryKey: ['field-quota-results', projectId],
    queryFn: async () => {
      if (quotas.length === 0) return [];
      const { data } = await supabase
        .from('field_quota_results')
        .select('*')
        .in('quota_id', quotas.map(q => q.id));
      return (data ?? []) as FieldQuotaResult[];
    },
    enabled: quotas.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const resultsByQuota = allResults.reduce<Record<string, FieldQuotaResult[]>>((acc, r) => {
    if (!acc[r.quota_id]) acc[r.quota_id] = [];
    acc[r.quota_id].push(r);
    return acc;
  }, {});

  const hasData = fieldConfig && (fieldConfig.realizado_total > 0 || quotas.length > 0);
  const showMonitoring = projectStatus === 'Campo' || hasData;

  async function handleSync() {
    setSyncLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-field-data', {
        body: { project_id: projectId },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Erro na sincronização');
      queryClient.invalidateQueries({ queryKey: ['field-config', projectId] });
      queryClient.invalidateQueries({ queryKey: ['field-quota-results', projectId] });
      toast({ title: 'Dados atualizados com sucesso.' });
    } catch (err: any) {
      const msg = isAdmin ? err.message : 'Não foi possível atualizar os dados agora.';
      toast({ title: 'Erro ao atualizar', description: msg, variant: 'destructive' });
    } finally {
      setSyncLoading(false);
    }
  }

  const isLoading = configLoading || quotasLoading || resultsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!showMonitoring) {
    return (
      <div className="clarifyse-card p-8 text-center">
        <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">
          O monitoramento de campo estará disponível quando as coletas iniciarem.
        </p>
      </div>
    );
  }

  const realizadoTotal = fieldConfig?.realizado_total ?? 0;
  const metaTotal = fieldConfig?.meta_total ?? 0;
  const pctTotal = metaTotal > 0 ? Math.min((realizadoTotal / metaTotal) * 100, 100) : 0;
  const tempoReal = fieldConfig?.tempo_medio_real ?? null;
  const tempoEsperado = fieldConfig?.tempo_medio_esperado ?? null;

  const syncError = fieldConfig?.last_sync_error;
  const isSheets = fieldConfig?.integration_mode === 'sheets';

  return (
    <div className="space-y-6">
      <div>
        <p className="clarifyse-section-label text-xs mb-1">MONITORAMENTO DE CAMPO</p>
        <h2 className="text-xl font-display font-bold text-foreground">Acompanhamento em Tempo Real</h2>
      </div>

      {/* Admin sees sync error in full; client sees generic message */}
      {isSheets && syncError && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">
              {isAdmin ? 'Erro na sincronização automática' : 'Dados sendo atualizados...'}
            </p>
            {isAdmin && <p className="text-xs text-red-600 mt-0.5">{syncError}</p>}
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Total de Entrevistados"
          value={realizadoTotal}
          sub={metaTotal > 0 ? `de ${metaTotal} entrevistados` : 'sem meta definida'}
          extra={
            metaTotal > 0 ? (
              <div className="space-y-1">
                <ProgressBar value={realizadoTotal} max={metaTotal} />
                <p className="text-xs text-muted-foreground text-right">{pctTotal.toFixed(0)}%</p>
              </div>
            ) : undefined
          }
        />

        <MetricCard
          icon={Timer}
          label="Tempo Médio"
          value={tempoReal !== null ? `${Number(tempoReal).toFixed(0)} min` : '—'}
          sub={tempoEsperado ? `Esperado: ${tempoEsperado} min` : undefined}
        />

        <MetricCard
          icon={Activity}
          label="Status do Campo"
          value={<StatusBadge config={fieldConfig} />}
        />

        <MetricCard
          icon={Clock}
          label="Última Atualização"
          value={<span className="text-base">{formatBrDatetime(fieldConfig?.last_sync_at)}</span>}
          extra={
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5 mt-1"
              onClick={handleSync}
              disabled={syncLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
              Atualizar agora
            </Button>
          }
        />
      </div>

      {/* Quota panels */}
      {quotas.length > 0 && (
        <div className="space-y-4">
          {quotas.map(quota => (
            <QuotaPanel
              key={quota.id}
              quota={quota}
              results={resultsByQuota[quota.id] ?? []}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center border-t border-border pt-4">
        Os dados desta seção são atualizados periodicamente a partir das coletas em andamento.
        Qualquer dúvida sobre o progresso do campo, entre em contato com o gerente do seu projeto.
      </p>
    </div>
  );
}
