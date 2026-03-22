import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/ui/StatCard';
import { DollarSign, TrendingUp, Users, Calculator, PieChart, LineChart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinanceiroOverview } from '@/components/financeiro/FinanceiroOverview';
import { DistribuicaoLucro } from '@/components/financeiro/DistribuicaoLucro';
import { PrevisaoReceita } from '@/components/financeiro/PrevisaoReceita';
import { CalculadoraPrecificacao } from '@/components/financeiro/CalculadoraPrecificacao';
import { ConfiguracoesCustos } from '@/components/financeiro/ConfiguracoesCustos';

export default function AdminFinanceiro() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-financeiro-stats'],
    queryFn: async () => {
      // Get all projects with financials
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          nome,
          status,
          gerente_id,
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
        .is('deleted_at', null);

      let receitaTotal = 0;
      let custoTotal = 0;
      let projetosComFinanceiro = 0;

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
      };
    },
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
        <p className="clarifyse-section-label">GESTAO FINANCEIRA</p>
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
          label="RECEITA TOTAL"
          value={formatCurrency(stats?.receitaTotal ?? 0)}
          icon={DollarSign}
          loading={loadingStats}
          accentColor="teal"
        />
        <StatCard
          label="LUCRO TOTAL"
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
          label="PROJETOS C/ FINANCEIRO"
          value={stats?.projetosComFinanceiro ?? 0}
          icon={Users}
          loading={loadingStats}
        />
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Visao Geral</span>
          </TabsTrigger>
          <TabsTrigger value="distribuicao" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Distribuicao</span>
          </TabsTrigger>
          <TabsTrigger value="previsao" className="gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Previsao</span>
          </TabsTrigger>
          <TabsTrigger value="calculadora" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculadora</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Custos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <FinanceiroOverview isAdmin={true} />
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-4">
          <DistribuicaoLucro />
        </TabsContent>

        <TabsContent value="previsao" className="space-y-4">
          <PrevisaoReceita />
        </TabsContent>

        <TabsContent value="calculadora" className="space-y-4">
          <CalculadoraPrecificacao />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <ConfiguracoesCustos />
        </TabsContent>
      </Tabs>
    </div>
  );
}
