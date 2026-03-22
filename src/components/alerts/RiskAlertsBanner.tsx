import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { RiskAlert } from '@/types/project';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays, differenceInBusinessDays, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

interface RiskAlertsBannerProps {
  className?: string;
}

export function RiskAlertsBanner({ className }: RiskAlertsBannerProps) {
  const { profile, user } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isGerente = profile?.role === 'gerente';

  const { data: alerts = [], isLoading } = useQuery<RiskAlert[]>({
    queryKey: ['risk-alerts', user?.id, isAdmin],
    queryFn: async () => {
      // Fetch projects with schedule and field data
      let query = supabase
        .from('projects')
        .select(`
          id,
          nome,
          status,
          data_entrega_prevista,
          gerente_id,
          updated_at,
          project_schedule (id, nome, status, conclusao_prevista, conclusao_real),
          field_config (meta_total, realizado_total),
          project_financials (valor_total, custo_painel, custo_sala, custo_plataforma, custo_recrutamento, custo_incentivos, custo_transcricao, custo_elaboracao, custo_analise, custo_analytics_avancado, custo_dashboard, custo_relatorio_adicional, custo_outros)
        `)
        .is('deleted_at', null)
        .not('status', 'in', '("Encerrado","Pausado")');

      // Gerente only sees their own projects
      if (isGerente && user?.id) {
        query = query.eq('gerente_id', user.id);
      }

      const { data: projects, error } = await query;
      if (error) throw error;

      const alertsList: RiskAlert[] = [];
      const now = new Date();

      (projects ?? []).forEach((project: any) => {
        const basePath = isAdmin ? '/admin/projetos' : '/gerente/projetos';

        // 1. Check for delayed schedule items (more than 3 days)
        const schedules = project.project_schedule ?? [];
        schedules.forEach((item: any) => {
          if (item.status === 'Atrasada' && item.conclusao_prevista && !item.conclusao_real) {
            try {
              const prevista = parseISO(item.conclusao_prevista);
              if (isValid(prevista)) {
                const daysLate = differenceInDays(now, prevista);
                if (daysLate > 3) {
                  alertsList.push({
                    project_id: project.id,
                    project_name: project.nome,
                    message: `${project.nome}: etapa "${item.nome}" esta atrasada ha ${daysLate} dias.`,
                    level: 'attention',
                    type: 'schedule_delayed',
                  });
                }
              }
            } catch {}
          }
        });

        // 2. Check delivery deadline approaching (5 business days or less)
        if (
          project.data_entrega_prevista &&
          !['Entrega Final', 'Encerrado'].includes(project.status)
        ) {
          try {
            const deadline = parseISO(project.data_entrega_prevista);
            if (isValid(deadline)) {
              const businessDaysLeft = differenceInBusinessDays(deadline, now);
              if (businessDaysLeft <= 5 && businessDaysLeft >= 0) {
                alertsList.push({
                  project_id: project.id,
                  project_name: project.nome,
                  message: `${project.nome}: entrega prevista em ${businessDaysLeft} dias uteis e ainda nao esta em fase de entrega.`,
                  level: 'critical',
                  type: 'deadline_approaching',
                });
              } else if (businessDaysLeft < 0) {
                alertsList.push({
                  project_id: project.id,
                  project_name: project.nome,
                  message: `${project.nome}: prazo de entrega ja passou (${Math.abs(businessDaysLeft)} dias uteis de atraso).`,
                  level: 'critical',
                  type: 'deadline_passed',
                });
              }
            }
          } catch {}
        }

        // 3. Check field progress
        const fieldConfig = project.field_config?.[0];
        if (fieldConfig?.meta_total > 0 && project.status === 'Campo') {
          const progressPercent = (fieldConfig.realizado_total / fieldConfig.meta_total) * 100;
          
          // Calculate field deadline progress (using data_entrega_prevista as proxy)
          if (project.data_entrega_prevista) {
            try {
              const deadline = parseISO(project.data_entrega_prevista);
              if (isValid(deadline)) {
                const totalDays = differenceInDays(deadline, parseISO(project.updated_at || new Date().toISOString()));
                const daysLeft = differenceInDays(deadline, now);
                const timeRemainingPercent = totalDays > 0 ? (daysLeft / totalDays) * 100 : 0;

                if (progressPercent < 30 && timeRemainingPercent <= 15) {
                  alertsList.push({
                    project_id: project.id,
                    project_name: project.nome,
                    message: `${project.nome}: campo em ritmo critico - apenas ${progressPercent.toFixed(0)}% da meta atingida.`,
                    level: 'critical',
                    type: 'field_critical',
                  });
                } else if (progressPercent < 50 && timeRemainingPercent <= 30) {
                  alertsList.push({
                    project_id: project.id,
                    project_name: project.nome,
                    message: `${project.nome}: campo em ${progressPercent.toFixed(0)}% da meta com pouco prazo restante.`,
                    level: 'attention',
                    type: 'field_attention',
                  });
                }
              }
            } catch {}
          }
        }

        // 4. Check for no updates in 7 days
        if (project.updated_at) {
          try {
            const lastUpdate = parseISO(project.updated_at);
            if (isValid(lastUpdate)) {
              const daysSinceUpdate = differenceInDays(now, lastUpdate);
              if (daysSinceUpdate >= 7) {
                alertsList.push({
                  project_id: project.id,
                  project_name: project.nome,
                  message: `${project.nome}: nenhuma atualizacao nos ultimos ${daysSinceUpdate} dias.`,
                  level: 'informative',
                  type: 'no_updates',
                });
              }
            }
          } catch {}
        }

        // 5. Check financial margin (< 40%)
        const fin = project.project_financials?.[0];
        if (fin?.valor_total > 0) {
          const totalCost =
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

          const margin = ((fin.valor_total - totalCost) / fin.valor_total) * 100;
          if (margin < 40 && margin >= 0) {
            alertsList.push({
              project_id: project.id,
              project_name: project.nome,
              message: `${project.nome}: margem bruta em ${margin.toFixed(0)}% - abaixo do minimo de 40%.`,
              level: 'critical',
              type: 'low_margin',
            });
          }
        }
      });

      // Sort by level: critical first, then attention, then informative
      return alertsList.sort((a, b) => {
        const order = { critical: 0, attention: 1, informative: 2 };
        return order[a.level] - order[b.level];
      });
    },
    enabled: isAdmin || isGerente,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading || alerts.length === 0) {
    return null;
  }

  const criticalCount = alerts.filter((a) => a.level === 'critical').length;
  const attentionCount = alerts.filter((a) => a.level === 'attention').length;
  const hasСritical = criticalCount > 0;

  const displayAlerts = expanded ? alerts : alerts.slice(0, 3);
  const basePath = isAdmin ? '/admin/projetos' : '/gerente/projetos';

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        hasСritical
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {hasСritical ? (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          )}
          <div>
            <p
              className={cn(
                'font-medium',
                hasСritical ? 'text-red-800' : 'text-amber-800'
              )}
            >
              {alerts.length} projeto{alerts.length !== 1 ? 's' : ''} em alerta
            </p>
            <p
              className={cn(
                'text-sm',
                hasСritical ? 'text-red-600' : 'text-amber-600'
              )}
            >
              {criticalCount > 0 && `${criticalCount} critico${criticalCount !== 1 ? 's' : ''}`}
              {criticalCount > 0 && attentionCount > 0 && ' | '}
              {attentionCount > 0 && `${attentionCount} em atencao`}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            hasСritical
              ? 'text-red-700 hover:text-red-800 hover:bg-red-100'
              : 'text-amber-700 hover:text-amber-800 hover:bg-amber-100'
          )}
        >
          {expanded ? 'Ocultar' : 'Ver Alertas'}
          {expanded ? (
            <ChevronUp className="h-4 w-4 ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-1" />
          )}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-2">
          {displayAlerts.map((alert, index) => (
            <div
              key={`${alert.project_id}-${alert.type}-${index}`}
              className={cn(
                'flex items-center justify-between gap-3 p-3 rounded-md',
                alert.level === 'critical' && 'bg-red-100/60',
                alert.level === 'attention' && 'bg-amber-100/60',
                alert.level === 'informative' && 'bg-gray-100/60'
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {alert.level === 'critical' && (
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                {alert.level === 'attention' && (
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                )}
                {alert.level === 'informative' && (
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm truncate',
                    alert.level === 'critical' && 'text-red-700',
                    alert.level === 'attention' && 'text-amber-700',
                    alert.level === 'informative' && 'text-gray-700'
                  )}
                >
                  {alert.message}
                </span>
              </div>
              <Link
                to={`${basePath}/${alert.project_id}`}
                className={cn(
                  'flex-shrink-0 text-sm font-medium flex items-center gap-1',
                  alert.level === 'critical' && 'text-red-600 hover:text-red-800',
                  alert.level === 'attention' && 'text-amber-600 hover:text-amber-800',
                  alert.level === 'informative' && 'text-gray-600 hover:text-gray-800'
                )}
              >
                Ver <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          ))}

          {!expanded && alerts.length > 3 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{alerts.length - 3} alerta{alerts.length - 3 !== 1 ? 's' : ''} adiciona
              {alerts.length - 3 !== 1 ? 'is' : 'l'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
