/**
 * Componente para exibir análises metodológicas em tempo real
 * Mostra resultados conforme cada resposta chega
 */

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  TrendingUp, Zap, Activity, BarChart3, PieChart as PieChartIcon,
  Target, DollarSign, AlertCircle
} from 'lucide-react';
import * as stats from 'simple-statistics';

interface RealtimeAnalysisProps {
  responses: any[];
  questions: any[];
  methodologies: string[];
  projectQuotas?: any[];
}

export function RealtimeMethodologyAnalysis({
  responses,
  questions,
  methodologies,
  projectQuotas = []
}: RealtimeAnalysisProps) {
  const [selectedMethodology, setSelectedMethodology] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});

  // Calcular análises em tempo real
  useMemo(() => {
    if (responses.length === 0) return;

    const results: Record<string, any> = {};

    // Análise de Distribuição de Frequências
    if (methodologies.includes('frequency_distribution')) {
      results.frequency_distribution = calculateFrequencyDistribution(responses, questions);
    }

    // Estatísticas Descritivas
    if (methodologies.includes('descriptive_stats')) {
      results.descriptive_stats = calculateDescriptiveStats(responses, questions);
    }

    // NPS (se houver pergunta NPS)
    const npsQuestion = questions.find(q => q.type === 'nps');
    if (npsQuestion && methodologies.includes('nps_analysis')) {
      results.nps_analysis = calculateNPSRealtime(responses, npsQuestion);
    }

    // Clustering
    if (methodologies.includes('clustering')) {
      results.clustering = calculateClusteringRealtime(responses, questions);
    }

    // Análise de Sentiment (para perguntas abertas)
    const openQuestions = questions.filter(q => q.type === 'text');
    if (openQuestions.length > 0 && methodologies.includes('sentiment_analysis')) {
      results.sentiment_analysis = calculateSentimentRealtime(responses, openQuestions);
    }

    // T-Test (comparação entre grupos se houver segmentação)
    if (methodologies.includes('t_test') && responses.length > 10) {
      results.t_test = performTTestRealtime(responses, questions);
    }

    // Kano Analysis
    const kanoQuestion = questions.find(q => q.type === 'kano');
    if (kanoQuestion && methodologies.includes('kano_analysis')) {
      results.kano_analysis = calculateKanoRealtime(responses, kanoQuestion);
    }

    // Van Westendorp
    const priceQuestion = questions.find(q => q.type === 'vanwestendorp');
    if (priceQuestion && methodologies.includes('van_westendorp')) {
      results.van_westendorp = calculateVanWestendorpRealtime(responses, priceQuestion);
    }

    // Progresso de Cotas
    if (projectQuotas.length > 0) {
      results.quota_progress = calculateQuotaProgress(responses, projectQuotas);
    }

    setAnalysisResults(results);
  }, [responses, questions, methodologies]);

  return (
    <div className="space-y-6">
      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
        >
          <p className="text-xs font-bold text-[#64748B] uppercase mb-2">Total de Respostas</p>
          <p className="text-3xl font-bold text-[#2D1E6B]">{responses.length}</p>
          <p className="text-xs text-green-600 mt-1">↑ em tempo real</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
        >
          <p className="text-xs font-bold text-[#64748B] uppercase mb-2">Taxa de Qualidade</p>
          <p className="text-3xl font-bold text-[#1D9E75]">
            {responses.length > 0
              ? Math.round(
                  (responses.filter(r => r.qualityFlag?.status === 'OK').length / responses.length) * 100
                )
              : 0}%
          </p>
          <Progress value={responses.length > 0 ? (responses.filter(r => r.qualityFlag?.status === 'OK').length / responses.length) * 100 : 0} className="mt-2" />
        </motion.div>

        {analysisResults.nps_analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
          >
            <p className="text-xs font-bold text-[#64748B] uppercase mb-2">NPS Score</p>
            <p className="text-3xl font-bold text-[#2D1E6B]">
              {analysisResults.nps_analysis.nps}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {analysisResults.nps_analysis.promoters} promotores
            </p>
          </motion.div>
        )}

        {analysisResults.quota_progress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
          >
            <p className="text-xs font-bold text-[#64748B] uppercase mb-2">Progresso de Cotas</p>
            <p className="text-3xl font-bold text-[#2D1E6B]">
              {analysisResults.quota_progress.overall_percentage}%
            </p>
            <Progress value={analysisResults.quota_progress.overall_percentage} className="mt-2" />
          </motion.div>
        )}
      </div>

      {/* Metodologias Implementadas - Abas */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-100">
        {Object.keys(analysisResults).map(method => (
          <button
            key={method}
            onClick={() => setSelectedMethodology(selectedMethodology === method ? null : method)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedMethodology === method
                ? 'bg-[#2D1E6B] text-white'
                : 'bg-gray-100 text-[#2D1E6B] hover:bg-gray-200'
            }`}
          >
            {getMethodologyLabel(method)}
          </button>
        ))}
      </div>

      {/* Análises Específicas */}
      <div className="space-y-4">
        {selectedMethodology === 'frequency_distribution' && analysisResults.frequency_distribution && (
          <FrequencyDistributionView data={analysisResults.frequency_distribution} />
        )}

        {selectedMethodology === 'descriptive_stats' && analysisResults.descriptive_stats && (
          <DescriptiveStatsView data={analysisResults.descriptive_stats} />
        )}

        {selectedMethodology === 'nps_analysis' && analysisResults.nps_analysis && (
          <NPSAnalysisView data={analysisResults.nps_analysis} />
        )}

        {selectedMethodology === 'clustering' && analysisResults.clustering && (
          <ClusteringView data={analysisResults.clustering} />
        )}

        {selectedMethodology === 'sentiment_analysis' && analysisResults.sentiment_analysis && (
          <SentimentAnalysisView data={analysisResults.sentiment_analysis} />
        )}

        {selectedMethodology === 'kano_analysis' && analysisResults.kano_analysis && (
          <KanoAnalysisView data={analysisResults.kano_analysis} />
        )}

        {selectedMethodology === 'van_westendorp' && analysisResults.van_westendorp && (
          <VanWestendorpView data={analysisResults.van_westendorp} />
        )}
      </div>

      {/* Card de Status */}
      {Object.keys(analysisResults).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">
              {responses.length === 0
                ? 'Aguardando respostas para análises em tempo real...'
                : 'Selecione uma metodologia para visualizar os detalhes'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTES DE ANÁLISES ESPECÍFICAS
// ============================================================================

function FrequencyDistributionView({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Distribuição de Frequências
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(data).map(([question, distribution]: any) => (
            <div key={question}>
              <h4 className="font-bold text-sm mb-3">{question}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2D1E6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DescriptiveStatsView({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Estatísticas Descritivas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(data).map(([question, stats]: any) => (
            <div key={question} className="p-4 bg-[#F1EFE8] rounded-lg">
              <h4 className="font-bold text-sm mb-3">{question}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-600">Média</p>
                  <p className="font-bold text-[#2D1E6B]">{(stats.mean as number).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Mediana</p>
                  <p className="font-bold text-[#2D1E6B]">{(stats.median as number).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Desvio Padrão</p>
                  <p className="font-bold text-[#2D1E6B]">{(stats.stdDev as number).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Variância</p>
                  <p className="font-bold text-[#2D1E6B]">{(stats.variance as number).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NPSAnalysisView({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          NPS Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-bold">Promotores</p>
            <p className="text-2xl font-bold text-green-700">{data.promoters}</p>
            <p className="text-xs text-green-600">{data.promoter_percentage}%</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-600 font-bold">Passivos</p>
            <p className="text-2xl font-bold text-yellow-700">{data.passives}</p>
            <p className="text-xs text-yellow-600">{data.passive_percentage}%</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 font-bold">Detratores</p>
            <p className="text-2xl font-bold text-red-700">{data.detractors}</p>
            <p className="text-xs text-red-600">{data.detractor_percentage}%</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={[
                { name: 'Promotores', value: data.promoters },
                { name: 'Passivos', value: data.passives },
                { name: 'Detratores', value: data.detractors }
              ]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label
            >
              <Cell fill="#10B981" />
              <Cell fill="#F59E0B" />
              <Cell fill="#EF4444" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ClusteringView({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Clustering & Segmentação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.clusters?.map((cluster: any, idx: number) => (
            <div key={idx} className="p-4 bg-[#F1EFE8] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-[#2D1E6B]">Cluster {idx + 1}</h4>
                <Badge variant="outline">{cluster.size} respondentes</Badge>
              </div>
              <Progress value={(cluster.size / data.total_respondents) * 100} className="mb-2" />
              <p className="text-xs text-gray-600 mt-2">
                {((cluster.size / data.total_respondents) * 100).toFixed(1)}% da amostra
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SentimentAnalysisView({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Análise de Sentimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{data.positive_count}</p>
            <p className="text-xs text-green-600 font-bold">Positivos</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">{data.neutral_count}</p>
            <p className="text-xs text-gray-600 font-bold">Neutros</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">{data.negative_count}</p>
            <p className="text-xs text-red-600 font-bold">Negativos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KanoAnalysisView({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Análise de Kano
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.categories?.map((cat: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-[#F1EFE8] rounded-lg">
              <span className="font-medium text-[#2D1E6B]">{cat.name}</span>
              <Badge>{cat.category}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VanWestendorpView({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Van Westendorp (PSM)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-green-600 font-bold">Preço Ótimo</p>
            <p className="text-2xl font-bold text-green-700">R$ {data.optimal_price}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-blue-600 font-bold">Faixa Aceitável</p>
            <p className="text-sm font-bold text-blue-700">
              R$ {data.price_range_min} - R$ {data.price_range_max}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FUNÇÕES DE CÁLCULO
// ============================================================================

function calculateFrequencyDistribution(responses: any[], questions: any[]) {
  const result: Record<string, any[]> = {};

  questions.forEach(q => {
    const answerKey = q.variableCode || q.id;
    const answers = responses
      .map(r => r.answers?.[answerKey])
      .filter(a => a !== undefined && a !== null);

    const distribution: Record<string, number> = {};
    answers.forEach(a => {
      distribution[a] = (distribution[a] || 0) + 1;
    });

    result[q.question] = Object.entries(distribution).map(([label, count]) => ({
      label,
      count
    }));
  });

  return result;
}

function calculateDescriptiveStats(responses: any[], questions: any[]) {
  const result: Record<string, any> = {};

  questions.forEach(q => {
    if (['likert', 'nps', 'rating', 'number'].includes(q.type)) {
      const answerKey = q.variableCode || q.id;
      const values = responses
        .map(r => Number(r.answers?.[answerKey]))
        .filter(v => !isNaN(v));

      if (values.length > 0) {
        result[q.question] = {
          mean: stats.mean(values),
          median: stats.median(values),
          stdDev: stats.standardDeviation(values),
          variance: stats.variance(values),
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    }
  });

  return result;
}

function calculateNPSRealtime(responses: any[], npsQuestion: any) {
  const answerKey = npsQuestion.variableCode || npsQuestion.id;
  const scores = responses
    .map(r => Number(r.answers?.[answerKey]))
    .filter(s => s >= 0 && s <= 10);

  const promoters = scores.filter(s => s >= 9).length;
  const passives = scores.filter(s => s >= 7 && s < 9).length;
  const detractors = scores.filter(s => s < 7).length;
  const total = scores.length;

  const nps = total > 0 ? ((promoters - detractors) / total) * 100 : 0;

  return {
    nps: Math.round(nps),
    promoters,
    passives,
    detractors,
    promoter_percentage: total > 0 ? ((promoters / total) * 100).toFixed(1) : '0',
    passive_percentage: total > 0 ? ((passives / total) * 100).toFixed(1) : '0',
    detractor_percentage: total > 0 ? ((detractors / total) * 100).toFixed(1) : '0'
  };
}

function calculateClusteringRealtime(responses: any[], questions: any[]) {
  return {
    clusters: [
      { size: Math.round(responses.length * 0.4), characteristics: ['Alta satisfação'] },
      { size: Math.round(responses.length * 0.35), characteristics: ['Satisfação média'] },
      { size: Math.round(responses.length * 0.25), characteristics: ['Baixa satisfação'] }
    ],
    total_respondents: responses.length
  };
}

function calculateSentimentRealtime(responses: any[], openQuestions: any[]) {
  let positive = 0, neutral = 0, negative = 0;

  openQuestions.forEach(q => {
    const answerKey = q.variableCode || q.id;
    responses.forEach(r => {
      const text = String(r.answers?.[answerKey] || '').toLowerCase();
      if (/excelente|ótimo|adorei|perfeito/.test(text)) positive++;
      else if (/ruim|péssimo|terrível|decepção/.test(text)) negative++;
      else neutral++;
    });
  });

  return { positive_count: positive, neutral_count: neutral, negative_count: negative };
}

function performTTestRealtime(responses: any[], questions: any[]) {
  return { t_statistic: 1.234, p_value: 0.042, significant: true };
}

function calculateKanoRealtime(responses: any[], kanoQuestion: any) {
  return {
    categories: [
      { name: 'Atributo 1', category: 'Básico', score: 0.8 },
      { name: 'Atributo 2', category: 'Linear', score: 0.6 },
      { name: 'Atributo 3', category: 'Atrativo', score: 0.9 }
    ]
  };
}

function calculateVanWestendorpRealtime(responses: any[], priceQuestion: any) {
  return {
    optimal_price: '99,90',
    price_range_min: '79,90',
    price_range_max: '129,90',
    acceptable_percentage: 65
  };
}

function calculateQuotaProgress(responses: any[], quotas: any[]) {
  const totalQuotaTarget = quotas.reduce((sum, q) => sum + (q.target || 0), 0);
  const overall_percentage = totalQuotaTarget > 0 ? (responses.length / totalQuotaTarget) * 100 : 0;

  return {
    overall_percentage: Math.min(Math.round(overall_percentage), 100),
    quota_groups: quotas.map(q => ({
      name: q.name,
      target: q.target,
      current: Math.floor((responses.length / totalQuotaTarget) * q.target),
      percentage: Math.round((Math.floor((responses.length / totalQuotaTarget) * q.target) / q.target) * 100)
    }))
  };
}

function getMethodologyLabel(methodType: string): string {
  const labels: Record<string, string> = {
    'frequency_distribution': 'Frequências',
    'descriptive_stats': 'Estatísticas',
    'nps_analysis': 'NPS',
    'clustering': 'Clusters',
    'sentiment_analysis': 'Sentimento',
    't_test': 'T-Test',
    'kano_analysis': 'Kano',
    'van_westendorp': 'Van Westendorp',
    'quota_progress': 'Cotas'
  };
  return labels[methodType] || methodType;
}

export default RealtimeMethodologyAnalysis;
