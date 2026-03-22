import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/ui/StatCard';
import { DollarSign, TrendingUp, PieChart, Calculator, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinanceiroOverview } from '@/components/financeiro/FinanceiroOverview';
import { CalculadoraPrecificacao } from '@/components/financeiro/CalculadoraPrecificacao';

export default function GerenteFinanceiro() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['gerente-financeiro-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      // Get projects managed by this gerente with financials
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          nome,
          status,
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
        .eq('gerente_id', profile.id)
        .is('deleted_at', null);

      let receitaTotal = 0;
      let custoTotal = 0;
      let projetosComFinanceiro = 0;
      let totalProjetos = (projects ?? []).length;

      (projects ?? []).forEach((p: any) => {
        const fin = p.project_financials?.[0];
        if (fin) {
          projetosComFinanceiro++;
          receitaTotal += Number(fin.valor_total) || 0;
          custoTotal +=
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
        }
      });

      const lucroTotal = receitaTotal - custoTotal;
      const margemMedia = receitaTotal > 0 ? ((lucroTotal / receitaTotal) * 100) : 0;

      return {
        receitaTotal,
        custoTotal,
        lucroTotal,
        margemMedia,
        projetosComFinanceiro,
        totalProjetos,
      };
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="clarifyse-section-label">MEUS PROJETOS</p>
        <h1 className="text-2xl font-display font-bold text-foreground mt-1">
          Financeiro
        </h1>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="MINHA RECEITA"
          value={formatCurrency(stats?.receitaTotal ?? 0)}
          icon={DollarSign}
          loading={loadingStats}
          accentColor="teal"
        />
        <StatCard
          label="MEU LUCRO"
          value={formatCurrency(stats?.lucroTotal ?? 0)}
          icon={TrendingUp}
          loading={loadingStats}
          accentColor="purple"
        />
        <StatCard
          label="MARGEM MEDIA"
          value={`${(stats?.margemMedia ?? 0).toFixed(1)}%`}
          icon={PieChart}
          loading={loadingStats}
        />
        <StatCard
          label="MEUS PROJETOS"
          value={stats?.totalProjetos ?? 0}
          icon={FolderOpen}
          loading={loadingStats}
        />
      </motion.div>

      {/* Tabs - Gerente only has Overview and Calculator */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Visao Geral</span>
          </TabsTrigger>
          <TabsTrigger value="calculadora" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculadora</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <FinanceiroOverview isAdmin={false} />
        </TabsContent>

        <TabsContent value="calculadora" className="space-y-4">
          <CalculadoraPrecificacao />
        </TabsContent>
      </Tabs>
    </div>
  );
}
