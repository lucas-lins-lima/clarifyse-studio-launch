import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface KPIsPesquisaQualidadeProps {
  year: number;
  month: number | null;
}

const COLORS = ['#0d9488', '#7c3aed', '#f59e0b', '#3b82f6', '#ef4444', '#22c55e'];
const STATUS_COLORS: Record<string, string> = {
  'Briefing': '#94a3b8',
  'Elaboracao do Instrumento': '#3b82f6',
  'Campo': '#f59e0b',
  'Analise dos Dados': '#8b5cf6',
  'Producao do Entregavel': '#0d9488',
  'Entrega Final': '#22c55e',
  'Encerrado': '#6b7280',
  'Pausado': '#ef4444',
};

export default function KPIsPesquisaQualidade({ year, month }: KPIsPesquisaQualidadeProps) {
  // Fetch projects by methodology
  const { data: metodologiaData, isLoading: loadingMetodologia } = useQuery({
    queryKey: ['kpis-metodologia', year, month],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('metodologia')
        .is('deleted_at', null)
        .gte('created_at', `${year}-01-01`)
        .lt('created_at', `${year + 1}-01-01`);

      if (month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = month === 12 
          ? `${year + 1}-01-01` 
          : `${year}-${String(month + 1).padStart(2, '0')}-01`;
        query = query.gte('created_at', startDate).lt('created_at', endDate);
      }

      const { data: projects } = await query;

      const metodologiaCount: Record<string, number> = {};

      (projects ?? []).forEach((p: any) => {
        const metodologias = p.metodologia || [];
        metodologias.forEach((m: string) => {
          metodologiaCount[m] = (metodologiaCount[m] || 0) + 1;
        });
      });

      return Object.entries(metodologiaCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch projects by status
  const { data: statusData, isLoading: loadingStatus } = useQuery({
    queryKey: ['kpis-status', year, month],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('status')
        .is('deleted_at', null)
        .gte('created_at', `${year}-01-01`)
        .lt('created_at', `${year + 1}-01-01`);

      if (month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = month === 12 
          ? `${year + 1}-01-01` 
          : `${year}-${String(month + 1).padStart(2, '0')}-01`;
        query = query.gte('created_at', startDate).lt('created_at', endDate);
      }

      const { data: projects } = await query;

      const statusCount: Record<string, number> = {};

      (projects ?? []).forEach((p: any) => {
        const status = p.status || 'Desconhecido';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      return Object.entries(statusCount).map(([name, value]) => ({
        name,
        value,
        fill: STATUS_COLORS[name] || '#6b7280',
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch delivery performance (on time vs delayed)
  const { data: deliveryData, isLoading: loadingDelivery } = useQuery({
    queryKey: ['kpis-delivery', year, month],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('data_entrega_prevista, data_entrega_real, status')
        .is('deleted_at', null)
        .gte('created_at', `${year}-01-01`)
        .lt('created_at', `${year + 1}-01-01`)
        .in('status', ['Entrega Final', 'Encerrado']);

      if (month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = month === 12 
          ? `${year + 1}-01-01` 
          : `${year}-${String(month + 1).padStart(2, '0')}-01`;
        query = query.gte('created_at', startDate).lt('created_at', endDate);
      }

      const { data: projects } = await query;

      let onTime = 0;
      let delayed = 0;
      let noData = 0;

      (projects ?? []).forEach((p: any) => {
        if (!p.data_entrega_prevista) {
          noData++;
          return;
        }
        
        if (!p.data_entrega_real) {
          // If delivered but no real date, assume on time
          onTime++;
          return;
        }

        const prevista = new Date(p.data_entrega_prevista);
        const real = new Date(p.data_entrega_real);
        
        if (real <= prevista) {
          onTime++;
        } else {
          delayed++;
        }
      });

      const total = onTime + delayed;
      const onTimePercent = total > 0 ? (onTime / total) * 100 : 100;

      return [
        { name: 'No Prazo', value: onTime, fill: '#22c55e' },
        { name: 'Atrasados', value: delayed, fill: '#ef4444' },
      ];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Calculate average field completion rate
  const { data: fieldData, isLoading: loadingField } = useQuery({
    queryKey: ['kpis-field-completion', year, month],
    queryFn: async () => {
      const { data: configs } = await supabase
        .from('field_config')
        .select(`
          meta_total,
          realizado_total,
          project_id,
          projects!inner (created_at, deleted_at)
        `)
        .is('projects.deleted_at', null);

      const filtered = (configs ?? []).filter((c: any) => {
        const createdAt = new Date(c.projects?.created_at);
        const matchesYear = createdAt.getFullYear() === year;
        const matchesMonth = month ? createdAt.getMonth() + 1 === month : true;
        return matchesYear && matchesMonth && c.meta_total && c.meta_total > 0;
      });

      if (filtered.length === 0) {
        return { avgCompletion: 0, projectsWithField: 0 };
      }

      const totalCompletion = filtered.reduce((sum: number, c: any) => {
        const percent = Math.min((c.realizado_total / c.meta_total) * 100, 100);
        return sum + percent;
      }, 0);

      return {
        avgCompletion: totalCompletion / filtered.length,
        projectsWithField: filtered.length,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.payload?.fill }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loadingMetodologia || loadingStatus || loadingDelivery || loadingField) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const onTimePercent = deliveryData 
    ? deliveryData.reduce((sum, d) => d.name === 'No Prazo' ? d.value : sum, 0) /
      Math.max(deliveryData.reduce((sum, d) => sum + d.value, 0), 1) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Methodology */}
        <div className="clarifyse-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Projetos por Metodologia
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metodologiaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  width={120}
                  tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + '...' : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  name="Projetos" 
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects by Status */}
        <div className="clarifyse-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Projetos por Status
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                >
                  {statusData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Performance */}
        <div className="clarifyse-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Taxa de Entrega no Prazo
          </h3>
          <div className="h-64 flex items-center justify-center">
            {deliveryData && deliveryData.reduce((sum, d) => sum + d.value, 0) > 0 ? (
              <div className="text-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={deliveryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {deliveryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="-mt-28">
                  <p className="text-3xl font-bold text-foreground">{onTimePercent.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">no prazo</p>
                </div>
                <div className="mt-20 flex justify-center gap-6">
                  {deliveryData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-sm text-muted-foreground">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum projeto entregue no periodo</p>
            )}
          </div>
        </div>

        {/* Field Completion Average */}
        <div className="clarifyse-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Taxa Media de Conclusao de Campo
          </h3>
          <div className="h-64 flex items-center justify-center">
            {fieldData && fieldData.projectsWithField > 0 ? (
              <div className="text-center">
                <div className="relative w-40 h-40 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="hsl(var(--border))"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="hsl(var(--accent))"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(fieldData.avgCompletion / 100) * 440} 440`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-3xl font-bold text-foreground">
                      {fieldData.avgCompletion.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  {fieldData.projectsWithField} projetos com campo configurado
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum projeto com campo no periodo</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
