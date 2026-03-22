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
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface KPIsComerciaisProps {
  year: number;
  month: number | null;
}

const COLORS = ['#0d9488', '#7c3aed', '#f59e0b', '#3b82f6', '#ef4444', '#22c55e'];

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function KPIsComerciais({ year, month }: KPIsComerciaisProps) {
  // Fetch monthly revenue data
  const { data: monthlyData, isLoading: loadingMonthly } = useQuery({
    queryKey: ['kpis-monthly-revenue', year],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          created_at,
          project_financials (valor_total)
        `)
        .is('deleted_at', null)
        .gte('created_at', `${year}-01-01`)
        .lt('created_at', `${year + 1}-01-01`);

      // Group by month
      const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
        month: MONTHS[i],
        receita: 0,
        projetos: 0,
      }));

      (projects ?? []).forEach((p: any) => {
        const monthIdx = new Date(p.created_at).getMonth();
        const fin = p.project_financials?.[0];
        monthlyRevenue[monthIdx].projetos += 1;
        monthlyRevenue[monthIdx].receita += Number(fin?.valor_total) || 0;
      });

      return monthlyRevenue;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch revenue by pilar
  const { data: pilarData, isLoading: loadingPilar } = useQuery({
    queryKey: ['kpis-pilar-revenue', year, month],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          pilar,
          project_financials (valor_total)
        `)
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

      const pilarRevenue: Record<string, number> = {};

      (projects ?? []).forEach((p: any) => {
        const pilar = p.pilar || 'Sem Pilar';
        const fin = p.project_financials?.[0];
        pilarRevenue[pilar] = (pilarRevenue[pilar] || 0) + (Number(fin?.valor_total) || 0);
      });

      return Object.entries(pilarRevenue).map(([name, value]) => ({
        name,
        value,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch revenue by gerente (who closed the deal)
  const { data: gerenteData, isLoading: loadingGerente } = useQuery({
    queryKey: ['kpis-gerente-revenue', year, month],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          gerente_id,
          profiles!projects_gerente_id_fkey (name),
          project_financials (valor_total, quem_fechou)
        `)
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

      const gerenteRevenue: Record<string, { name: string; receita: number; projetos: number }> = {};

      (projects ?? []).forEach((p: any) => {
        const gerente = (p.profiles as any)?.name || 'Sem Gerente';
        const fin = p.project_financials?.[0];
        
        if (!gerenteRevenue[gerente]) {
          gerenteRevenue[gerente] = { name: gerente, receita: 0, projetos: 0 };
        }
        
        gerenteRevenue[gerente].projetos += 1;
        gerenteRevenue[gerente].receita += Number(fin?.valor_total) || 0;
      });

      return Object.values(gerenteRevenue).sort((a, b) => b.receita - a.receita);
    },
    staleTime: 1000 * 60 * 5,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'receita' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loadingMonthly || loadingPilar || loadingGerente) {
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

  return (
    <div className="space-y-6">
      {/* Monthly Revenue Chart */}
      <div className="clarifyse-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Receita Mensal ({year})
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="receita" 
                name="Receita" 
                fill="hsl(var(--accent))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Pilar */}
        <div className="clarifyse-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Receita por Pilar
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pilarData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pilarData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Gerente */}
        <div className="clarifyse-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Performance por Gerente
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gerenteData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="receita" 
                  name="Receita" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
