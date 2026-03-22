import React, { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { StatCard } from '@/components/ui/StatCard';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star,
  Calendar,
  Target,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load chart components for better performance
const KPIsComerciais = React.lazy(() => import('@/components/kpis/KPIsComerciais'));
const KPIsPesquisaQualidade = React.lazy(() => import('@/components/kpis/KPIsPesquisaQualidade'));
const NPSHistorico = React.lazy(() => import('@/components/kpis/NPSHistorico'));

function ChartSkeleton() {
  return (
    <div className="clarifyse-card p-6 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function AdminKPIs() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('comercial');

  // Fetch KPIs summary using RPC function
  const { data: kpisSummary, isLoading: loadingKPIs } = useQuery({
    queryKey: ['kpis-summary', selectedYear, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_kpis_summary', {
        p_year: selectedYear,
        p_month: selectedMonth,
      });
      
      if (error) {
        console.error('Error fetching KPIs:', error);
        return null;
      }
      
      return data?.[0] ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch NPS score
  const { data: npsData, isLoading: loadingNPS } = useQuery({
    queryKey: ['nps-score'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_nps_score');
      
      if (error) {
        console.error('Error fetching NPS:', error);
        return null;
      }
      
      return data?.[0] ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const monthOptions = [
    { value: null, label: 'Ano completo' },
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Marco' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const profit = (kpisSummary?.total_revenue ?? 0) - (kpisSummary?.total_cost ?? 0);
  const margin = kpisSummary?.total_revenue && kpisSummary.total_revenue > 0 
    ? (profit / kpisSummary.total_revenue) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="clarifyse-section-label">INDICADORES DE DESEMPENHO</p>
          <h1 className="text-2xl font-display font-bold text-foreground mt-1">
            KPIs
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedMonth === null ? 'all' : String(selectedMonth)} 
            onValueChange={(v) => setSelectedMonth(v === 'all' ? null : Number(v))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value ?? 'all'} value={opt.value === null ? 'all' : String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="PROJETOS NO PERIODO"
          value={kpisSummary?.total_projects ?? 0}
          icon={BarChart3}
          loading={loadingKPIs}
          accentColor="purple"
        />
        <StatCard
          label="RECEITA TOTAL"
          value={formatCurrency(kpisSummary?.total_revenue)}
          icon={TrendingUp}
          loading={loadingKPIs}
          accentColor="teal"
        />
        <StatCard
          label="MARGEM DE LUCRO"
          value={`${margin.toFixed(1)}%`}
          icon={Target}
          loading={loadingKPIs}
        />
        <StatCard
          label="NPS SCORE"
          value={npsData?.nps_score !== undefined ? `${Number(npsData.nps_score).toFixed(0)}` : '—'}
          icon={Star}
          loading={loadingNPS}
          accentColor="teal"
        />
      </motion.div>

      {/* Secondary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="clarifyse-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs uppercase tracking-wider">Concluidos</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {loadingKPIs ? '...' : kpisSummary?.projects_completed ?? 0}
          </p>
        </div>
        
        <div className="clarifyse-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="text-xs uppercase tracking-wider">Em Andamento</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {loadingKPIs ? '...' : kpisSummary?.projects_in_progress ?? 0}
          </p>
        </div>
        
        <div className="clarifyse-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="h-4 w-4 text-teal-500" />
            <span className="text-xs uppercase tracking-wider">No Prazo</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {loadingKPIs ? '...' : kpisSummary?.projects_on_time ?? 0}
          </p>
        </div>
        
        <div className="clarifyse-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs uppercase tracking-wider">Atrasados</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {loadingKPIs ? '...' : kpisSummary?.projects_delayed ?? 0}
          </p>
        </div>
      </motion.div>

      {/* Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="comercial" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Comercial</span>
          </TabsTrigger>
          <TabsTrigger value="pesquisa" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Pesquisa & Qualidade</span>
          </TabsTrigger>
          <TabsTrigger value="nps" className="gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Historico NPS</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comercial">
          <Suspense fallback={<ChartSkeleton />}>
            <KPIsComerciais year={selectedYear} month={selectedMonth} />
          </Suspense>
        </TabsContent>

        <TabsContent value="pesquisa">
          <Suspense fallback={<ChartSkeleton />}>
            <KPIsPesquisaQualidade year={selectedYear} month={selectedMonth} />
          </Suspense>
        </TabsContent>

        <TabsContent value="nps">
          <Suspense fallback={<ChartSkeleton />}>
            <NPSHistorico />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
