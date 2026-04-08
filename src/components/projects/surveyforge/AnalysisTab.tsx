import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, TrendingUp, AlertCircle, CheckCircle2, BarChart3, 
  PieChart, Activity, Zap, FileJson, FileSpreadsheet, ArrowRight,
  DollarSign, Target, Gauge, Smile, BarChart3 as FunnelIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { generateInsights, AnalysisResult, AnalysisResponse, Question } from '@/lib/analyticsEngine';
import {
  analyzeNPS,
  analyzeImportanceSatisfactionMatrix,
  analyzePenaltyAttributes,
  analyzeExpectationGap,
  analyzeFunnel,
  analyzeSentiment,
  calculateCronbachAlpha,
  analyzeVanWestendorp,
  analyzeKano,
  analyzeCES,
  analyzeCSAT,
  analyzeGaborGranger,
  analyzeBrandFunnel,
  analyzeShapleyImportance,
} from '@/lib/methodologyAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as PieChartComponent, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const COLORS = ['#2D1E6B', '#1D9E75', '#7F77DD', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

interface AnalysisTabProps {
  project: any;
  isAdmin?: boolean;
}

export default function AnalysisTab({ project, isAdmin = false }: AnalysisTabProps) {
  const navigate = useNavigate();
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('xlsx');

  // Gerar análises
  const analysis = useMemo(() => {
    if (!project.responses || project.responses.length === 0) {
      return null;
    }

    // Mapear respostas para o formato esperado (suporte a campos do backend)
    const mappedResponses = project.responses.map((r: any) => ({
      id: r.id,
      timestamp: r.submittedAt || r.timestamp,
      answers: r.answers || {},
      quotaProfile: { [project.quotas?.[0]?.id || 'default']: r.quotaGroup }, // Mapeamento simplificado para o motor de análise
      timeSpent: r.timeSpentSeconds || r.timeSpent || 0,
      qualityFlag: r.qualityFlag || 'good',
    }));

    return generateInsights(
      mappedResponses,
      project.formQuestions || [],
      project.quotas || [],
      project.sampleSize
    );
  }, [project]);

  const handleExport = () => {
    if (!analysis) {
      toast.error('Nenhuma análise disponível para exportar.');
      return;
    }

    try {
      if (exportFormat === 'xlsx') {
        exportToExcel(analysis, project);
        toast.success('Análise exportada em Excel!');
        return;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        content = JSON.stringify(analysis, null, 2);
        filename = `analise_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        content = generateCSV(analysis, project);
        filename = `analise_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      }

      const blob = new Blob([content], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success(`Análise exportada em ${exportFormat.toUpperCase()}!`);
    } catch (err) {
      toast.error('Erro ao exportar análise.');
    }
  };

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-1">Análise não disponível</h3>
            <p className="text-sm text-blue-800">
              A análise automática será liberada quando a coleta de respostas for concluída (amostra total atingida). Atualmente: {project.responses?.length || 0} / {project.sampleSize} respostas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAnalysisReady =
    project.status === 'Análise Disponível' ||
    ((project.responses?.length || 0) >= project.sampleSize && project.sampleSize > 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header com botões de exportação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-[#2D1E6B]">Análise Automática de Dados</h2>
          <p className="text-sm text-[#64748B] mt-1">Insights inteligentes baseados em {analysis.summary.totalResponses} respostas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAnalysisReady && (
            <Button
              onClick={() => navigate(`/admin/insights/${project.id}`)}
              className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl font-bold gap-2 shadow-lg shadow-purple-900/20"
            >
              <BarChart3 className="h-4 w-4" />
              Ver Insights Completos
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'xlsx')}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium"
          >
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
          <Button
            onClick={handleExport}
            variant="outline"
            className="rounded-xl font-bold gap-2 border-gray-200 text-[#2D1E6B]"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumo Executivo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-[#1D9E75]" />
          <h3 className="text-lg font-bold text-[#2D1E6B]">Resumo Executivo</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#F1EFE8] rounded-lg">
            <p className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Total de Respostas</p>
            <p className="text-3xl font-bold text-[#2D1E6B]">{analysis.summary.totalResponses}</p>
          </div>
          <div className="p-4 bg-[#F1EFE8] rounded-lg">
            <p className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Tempo Médio</p>
            <p className="text-3xl font-bold text-[#2D1E6B]">{analysis.summary.averageTimeSpent}</p>
          </div>
          <div className="p-4 bg-[#F1EFE8] rounded-lg">
            <p className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Taxa de Qualidade</p>
            <p className="text-3xl font-bold text-[#1D9E75]">{analysis.summary.qualityRate}%</p>
          </div>
          <div className="p-4 bg-[#F1EFE8] rounded-lg">
            <p className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-2">Cotas Completas</p>
            <p className="text-3xl font-bold text-[#2D1E6B]">{analysis.summary.quotasCompletePercentage}%</p>
          </div>
        </div>
      </motion.div>

      {/* Score de Qualidade */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#1D9E75]" />
            <h3 className="text-lg font-bold text-[#2D1E6B]">Score de Qualidade</h3>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-[#2D1E6B]">{analysis.qualityScore}</p>
            <p className="text-xs text-[#64748B] font-bold uppercase tracking-wider">/ 100</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-[#2D1E6B] to-[#1D9E75] h-3 rounded-full transition-all"
            style={{ width: `${analysis.qualityScore}%` }}
          />
        </div>
      </motion.div>

      {/* Análise por Pergunta */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#1D9E75]" />
          <h3 className="text-lg font-bold text-[#2D1E6B]">Análise por Pergunta</h3>
        </div>

        {analysis.questionAnalysis.map((qa, idx) => (
          <div key={qa.questionId} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h4 className="font-bold text-[#2D1E6B] mb-4">{qa.question}</h4>

            {qa.distribution.length > 0 ? (
              <div className="space-y-4">
                {/* Gráfico de barras */}
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={qa.distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#2D1E6B" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Tabela de distribuição */}
                <div className="space-y-2">
                  {qa.distribution.map((item) => (
                    <div key={item.code} className="flex items-center justify-between p-3 bg-[#F1EFE8] rounded-lg">
                      <span className="font-medium text-[#2D1E6B]">{item.label}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-white rounded-full h-2">
                          <div
                            className="bg-[#1D9E75] h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#64748B] w-16 text-right">
                          {Math.round(item.percentage)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : qa.topWords && qa.topWords.length > 0 ? (
              // Análise de texto aberto
              <div className="space-y-3">
                <p className="text-sm text-[#64748B] mb-4">Palavras mais frequentes:</p>
                {qa.topWords.map((word) => (
                  <div key={word.word} className="flex items-center justify-between p-3 bg-[#F1EFE8] rounded-lg">
                    <span className="font-medium text-[#2D1E6B]">{word.word}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-white rounded-full h-2">
                        <div
                          className="bg-[#7F77DD] h-2 rounded-full"
                          style={{ width: `${word.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-[#64748B] w-16 text-right">
                        {word.count}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">Sem dados para esta pergunta.</p>
            )}

            {qa.stats && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-2">Estatísticas:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 text-xs font-bold uppercase">Média</p>
                    <p className="font-bold text-blue-900">{qa.stats.mean}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-bold uppercase">Mediana</p>
                    <p className="font-bold text-blue-900">{qa.stats.median}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-bold uppercase">Desvio Padrão</p>
                    <p className="font-bold text-blue-900">{qa.stats.stdDev}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-bold uppercase">Classificação</p>
                    <p className="font-bold text-blue-900">{qa.stats.classification}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Análise Cruzada */}
      {analysis.crossAnalysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#1D9E75]" />
            <h3 className="text-lg font-bold text-[#2D1E6B]">Análise Cruzada (Diferencial)</h3>
          </div>

          {analysis.crossAnalysis.map((ca, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="font-bold text-[#2D1E6B] mb-2">
                {ca.primaryQuestion} × {ca.secondaryQuestion}
              </h4>
              <p className="text-sm text-[#64748B] mb-4">{ca.insight}</p>

              {/* Tabela cruzada simplificada */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2 font-bold text-[#2D1E6B]">Combinação</th>
                      <th className="text-right p-2 font-bold text-[#2D1E6B]">Contagem</th>
                      <th className="text-right p-2 font-bold text-[#2D1E6B]">Percentual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ca.crossTab.slice(0, 5).map((item, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-[#F1EFE8]">
                        <td className="p-2 text-[#2D1E6B]">
                          {item.primaryValue} → {item.secondaryValue}
                        </td>
                        <td className="text-right p-2 text-[#64748B]">{item.count}</td>
                        <td className="text-right p-2 font-bold text-[#1D9E75]">
                          {Math.round(item.percentage)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Insights Automáticos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-[#2D1E6B]/5 to-[#1D9E75]/5 rounded-xl border border-[#1D9E75]/20 p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#1D9E75]" />
          <h3 className="text-lg font-bold text-[#2D1E6B]">Insights Automáticos</h3>
        </div>

        <div className="space-y-3">
          {analysis.keyInsights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-white rounded-lg border border-[#1D9E75]/10">
              <div className="h-2 w-2 rounded-full bg-[#1D9E75] mt-2 flex-shrink-0" />
              <p className="text-sm text-[#2D1E6B]">{insight}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Methodology-Specific Auto-Analyses */}
      {analysis.methodologyResults && Object.keys(analysis.methodologyResults).length > 0 && (
        <MethodologyAnalysisSection 
          methodologyResults={analysis.methodologyResults}
          project={project}
          responses={project.responses || []}
        />
      )}

      {/* Comparação entre Cotas */}
      {analysis.quotaComparison.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-[#1D9E75]" />
            <h3 className="text-lg font-bold text-[#2D1E6B]">Comparação entre Grupos</h3>
          </div>

          {analysis.quotaComparison.map((qc, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="font-bold text-[#2D1E6B] mb-4">{qc.quotaName}</h4>
              <p className="text-sm text-[#64748B] mb-4">{qc.mainInsight}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qc.groups.map((group, gIdx) => (
                  <div key={gIdx} className="p-4 bg-[#F1EFE8] rounded-lg">
                    <p className="font-bold text-[#2D1E6B] mb-2">{group.groupName}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#64748B]">
                        {group.targetMet} / {group.targetTotal}
                      </span>
                      <span className="text-sm font-bold text-[#1D9E75]">{group.percentage}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-2">
                      <div
                        className="bg-[#1D9E75] h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(group.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// METHODOLOGY ANALYSIS SECTION COMPONENT
// ============================================================================

function MethodologyAnalysisSection({ methodologyResults, project, responses }: { 
  methodologyResults: Record<string, any>;
  project: any;
  responses: any[];
}) {
  const mappedResponses: any[] = responses.map((r: any) => ({
    id: r.id,
    timestamp: r.submittedAt || r.timestamp,
    answers: r.answers || {},
    quotaProfile: {},
    timeSpent: r.timeSpentSeconds || r.timeSpent || 0,
    qualityFlag: r.qualityFlag || 'good',
  }));

  const sections: React.ReactNode[] = [];

  Object.entries(methodologyResults).forEach(([key, config]) => {
    const { type, variableCode } = config as any;

    if (type === 'nps') {
      const npsQ = (project.formQuestions || []).find((q: any) => (q.variableCode || q.id) === variableCode);
      if (npsQ) {
        const result = analyzeNPS(mappedResponses, npsQ);
        sections.push(
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-[#1D9E75]" />
              <h3 className="text-lg font-bold text-[#2D1E6B]">NPS Analytics — {npsQ.question}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600 font-bold">NPS</p>
                <p className="text-2xl font-bold text-green-700">{result.overall.nps}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600 font-bold">Promotores</p>
                <p className="text-2xl font-bold text-green-700">{result.overall.promotersCount}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-xs text-yellow-600 font-bold">Passivos</p>
                <p className="text-2xl font-bold text-yellow-700">{result.overall.passivesCount}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-red-600 font-bold">Detratores</p>
                <p className="text-2xl font-bold text-red-700">{result.overall.detractorsCount}</p>
              </div>
            </div>
            {result.keyInsights.map((insight, i) => (
              <p key={i} className="text-sm text-[#64748B]">💡 {insight}</p>
            ))}
          </motion.div>
        );
      }
    }

    if (type === 'vanwestendorp') {
      const result = analyzeVanWestendorp(mappedResponses, variableCode);
      if (result.pricePoints.length > 0) {
        const chartData = result.pricePoints.map((price, i) => ({
          price: `R$${price.toFixed(0)}`,
          'Muito Caro': result.tooExpensiveCurve[i],
          'Caro': result.expensiveCurve[i],
          'Barato': result.cheapCurve[i],
          'Muito Barato': result.tooCheapCurve[i],
        }));

        sections.push(
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-[#1D9E75]" />
              <h3 className="text-lg font-bold text-[#2D1E6B]">Van Westendorp (PSM) — Curvas de Preço</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="price" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Muito Caro" stroke="#EF4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Caro" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Barato" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Muito Barato" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600 font-bold">Preço Ótimo</p>
                <p className="text-lg font-bold text-green-700">R$ {result.optimalPricePoint.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-bold">Indiferença</p>
                <p className="text-lg font-bold text-blue-700">R$ {result.indifferencePricePoint.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-purple-600 font-bold">Faixa Aceitável</p>
                <p className="text-sm font-bold text-purple-700">R$ {result.acceptablePriceRange.min.toFixed(0)} - R$ {result.acceptablePriceRange.max.toFixed(0)}</p>
              </div>
            </div>
          </motion.div>
        );
      }
    }

    if (type === 'kano') {
      const question = (project.formQuestions || []).find((q: any) => (q.variableCode || q.id) === variableCode);
      if (question && question.kanoFeatures) {
        const result = analyzeKano(mappedResponses, question.kanoFeatures, variableCode);
        const kanoColors: Record<string, string> = {
          must_be: '#3B82F6',
          one_dimensional: '#10B981',
          attractive: '#F59E0B',
          indifferent: '#9CA3AF',
          reverse: '#EF4444',
          questionable: '#8B5CF6',
        };

        const chartData = result.features.map(f => ({
          name: f.feature,
          'Coef. Satisfação': f.satisfactionCoefficient,
          'Coef. Insatisfação': Math.abs(f.dissatisfactionCoefficient),
        }));

        sections.push(
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-[#1D9E75]" />
              <h3 className="text-lg font-bold text-[#2D1E6B]">Análise de Kano</h3>
            </div>
            <div className="space-y-2 mb-4">
              {result.features.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#F1EFE8] rounded-lg">
                  <span className="font-medium text-[#2D1E6B]">{f.feature}</span>
                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: kanoColors[f.category] + '20', color: kanoColors[f.category] }}>
                    {f.categoryLabel}
                  </span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Coef. Satisfação" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Coef. Insatisfação" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-[#64748B] mt-2">💡 {result.insight}</p>
          </motion.div>
        );
      }
    }

    if (type === 'ces') {
      const result = analyzeCES(mappedResponses, variableCode);
      if (result.distribution.length > 0) {
        const chartData = result.distribution.map(d => ({
          score: d.score.toString(),
          count: d.count,
          percentage: d.percentage,
        }));

        sections.push(
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="h-5 w-5 text-[#1D9E75]" />
              <h3 className="text-lg font-bold text-[#2D1E6B]">Customer Effort Score (CES)</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-bold">CES Médio</p>
                <p className="text-2xl font-bold text-blue-700">{result.averageCES}/7</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600 font-bold">Baixo Esforço</p>
                <p className="text-2xl font-bold text-green-700">{result.lowEffortPercentage}%</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-red-600 font-bold">Alto Esforço</p>
                <p className="text-2xl font-bold text-red-700">{result.highEffortPercentage}%</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="score" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2D1E6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-[#64748B] mt-2">💡 {result.insight}</p>
          </motion.div>
        );
      }
    }

    if (type === 'csat') {
      const result = analyzeCSAT(mappedResponses, variableCode);
      if (result.distribution.length > 0) {
        sections.push(
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Smile className="h-5 w-5 text-[#1D9E75]" />
              <h3 className="text-lg font-bold text-[#2D1E6B]">Customer Satisfaction (CSAT)</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600 font-bold">CSAT</p>
                <p className="text-2xl font-bold text-green-700">{result.satisfiedPercentage}%</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-bold">Média</p>
                <p className="text-2xl font-bold text-blue-700">{result.averageCSAT}/5</p>
              </div>
            </div>
            <div className="space-y-2">
              {result.distribution.map(d => (
                <div key={d.score} className="flex items-center gap-3">
                  <span className="text-xs w-32 text-[#64748B]">{d.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="bg-[#1D9E75] h-3 rounded-full" style={{ width: `${d.percentage}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[#2D1E6B] w-12 text-right">{Math.round(d.percentage)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      }
    }

    if (type === 'brand_funnel') {
      const result = analyzeBrandFunnel(mappedResponses, variableCode);
      if (result.stages.length > 0) {
        sections.push(
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-[#1D9E75]" />
              <h3 className="text-lg font-bold text-[#2D1E6B]">Brand Funnel</h3>
            </div>
            <div className="space-y-3 mb-4">
              {result.stages.map((stage, i) => (
                <div key={i} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#2D1E6B]">{stage.stage}</span>
                    <span className="text-sm font-bold text-[#1D9E75]">{stage.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-[#2D1E6B] to-[#1D9E75] h-4 rounded-full transition-all"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                  {i > 0 && (
                    <span className="text-[10px] text-[#64748B]">
                      Conversão: {stage.conversionFromPrevious}% da etapa anterior
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-xs text-orange-700">
                <b>Gargalo:</b> {result.bottleneck} · <b>Conversão total:</b> {result.overallConversion}%
              </p>
            </div>
          </motion.div>
        );
      }
    }

    if (type === 'gabor_granger') {
      const question = (project.formQuestions || []).find((q: any) => (q.variableCode || q.id) === variableCode);
      if (question?.gaborGranger?.pricePoints) {
        const result = analyzeGaborGranger(mappedResponses, variableCode, question.gaborGranger.pricePoints);
        if (result.demandCurve.length > 0) {
          const chartData = result.demandCurve.map(d => ({
            price: `R$${d.price.toFixed(0)}`,
            'Intenção (%)': d.intentionPercentage,
          }));

          sections.push(
            <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-[#1D9E75]" />
                <h3 className="text-lg font-bold text-[#2D1E6B]">Gabor-Granger — Curva de Demanda</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="price" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip />
                  <Area type="monotone" dataKey="Intenção (%)" stroke="#2D1E6B" fill="#2D1E6B" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-green-600 font-bold">Preço Ótimo</p>
                  <p className="text-lg font-bold text-green-700">R$ {result.optimalPrice.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-blue-600 font-bold">Receita Máx</p>
                  <p className="text-lg font-bold text-blue-700">R$ {result.maxRevenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <p className="text-xs text-purple-600 font-bold">Elasticidade</p>
                  <p className="text-lg font-bold text-purple-700">{result.priceElasticity}</p>
                </div>
              </div>
            </motion.div>
          );
        }
      }
    }
  });

  if (sections.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-[#1D9E75]" />
        <h3 className="text-lg font-bold text-[#2D1E6B]">Análises Metodológicas Automáticas</h3>
      </div>
      {sections}
    </motion.div>
  );
}

/**
 * Serializa valor complexo para string legível (corrige bug A8)
 * FIX: Melhor tratamento de tipos complexos (Matriz, Conjoint, MaxDiff)
 */
function serializeAnswer(value: any): string {
  if (value === null || value === undefined) return '';

  // Tipos primitivos
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // Arrays: múltiplas respostas (ex: multiple choice)
  if (Array.isArray(value)) {
    return value
      .map(v => {
        if (typeof v === 'object' && v !== null) {
          return formatComplexValue(v);
        }
        return String(v);
      })
      .join('; ');
  }

  // Objetos: tipos complexos
  if (typeof value === 'object' && value !== null) {
    return formatComplexValue(value);
  }

  return String(value);
}

/**
 * Formata valores complexos de forma legível para Excel
 */
function formatComplexValue(obj: any): string {
  if (typeof obj !== 'object' || obj === null) {
    return String(obj);
  }

  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return '';
  }

  // Tipo: Matrix (ex: { row1: 'value', row2: 'value' })
  const isMatrix = entries.every(([k, v]) => typeof v === 'string' || typeof v === 'number');
  if (isMatrix && entries.length > 0) {
    return entries.map(([k, v]) => `${k}: ${v}`).join(' | ');
  }

  // Tipo: Conjoint/MaxDiff ranking (ex: { items: [...], ranking: [...] })
  if (obj.ranking && Array.isArray(obj.ranking)) {
    return `Ranking: ${obj.ranking.join(', ')}${obj.items ? ` (de: ${obj.items.join(', ')})` : ''}`;
  }

  // Tipo: Resposta com profundidade aninhada
  return entries
    .map(([k, v]) => {
      const formattedValue = typeof v === 'object' && v !== null
        ? JSON.stringify(v)
        : String(v);
      return `${k}: ${formattedValue}`;
    })
    .join(' | ');
}

/**
 * Exporta respostas brutas para Excel com serialização correta de tipos complexos (bug A8)
 */
function exportToExcel(analysis: AnalysisResult, project: any) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumo
  const resumoData = [
    ['ANÁLISE AUTOMÁTICA DE DADOS'],
    ['Projeto', project.name],
    ['Data', new Date().toLocaleDateString('pt-BR')],
    [''],
    ['Total de Respostas', analysis.summary.totalResponses],
    ['Tempo Médio', analysis.summary.averageTimeSpent],
    ['Taxa de Qualidade', `${analysis.summary.qualityRate}%`],
    ['Cotas Completas', `${analysis.summary.quotasCompletePercentage}%`],
    ['Score de Qualidade', `${analysis.qualityScore}/100`],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // Sheet 2: Distribuições por pergunta
  const distRows: any[] = [];
  analysis.questionAnalysis.forEach((qa) => {
    distRows.push({ Pergunta: qa.question, Opção: '', Contagem: '', Percentual: '' });
    qa.distribution.forEach((item) => {
      distRows.push({
        Pergunta: '',
        Opção: item.label,
        Contagem: item.count,
        Percentual: `${Math.round(item.percentage)}%`,
      });
    });
  });
  const wsDist = XLSX.utils.json_to_sheet(distRows);
  XLSX.utils.book_append_sheet(wb, wsDist, 'Distribuições');

  // Sheet 3: Respostas brutas (com serialização correta)
  if (project.responses && project.responses.length > 0) {
    const questions = project.formQuestions || [];
    const headers = ['ID', 'Data', 'Tempo (s)', 'Grupo de Cota', ...questions.map((q: any) => q.question || q.variableCode || q.id)];
    const rawRows = project.responses.map((r: any) => {
      const row: any = {
        'ID': r.id || '',
        'Data': r.submittedAt || r.timestamp || '',
        'Tempo (s)': r.timeSpentSeconds || r.timeSpent || '',
        'Grupo de Cota': r.quotaGroup || '',
      };
      questions.forEach((q: any) => {
        const key = q.question || q.variableCode || q.id;
        const val = r.answers?.[q.id] ?? r.answers?.[q.variableCode] ?? '';
        row[key] = serializeAnswer(val);
      });
      return row;
    });
    const wsRaw = XLSX.utils.json_to_sheet(rawRows);
    XLSX.utils.book_append_sheet(wb, wsRaw, 'Respostas Brutas');
  }

  // Sheet 4: Insights
  const insightRows = analysis.keyInsights.map((insight, idx) => ({
    '#': idx + 1,
    'Insight': insight,
  }));
  if (insightRows.length > 0) {
    const wsInsights = XLSX.utils.json_to_sheet(insightRows);
    XLSX.utils.book_append_sheet(wb, wsInsights, 'Insights');
  }

  XLSX.writeFile(wb, `Analise_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Gera CSV a partir da análise
 */
function generateCSV(analysis: AnalysisResult, project: any): string {
  const lines: string[] = [];

  // Cabeçalho
  lines.push('ANÁLISE AUTOMÁTICA DE DADOS');
  lines.push(`Projeto: ${project.name}`);
  lines.push(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
  lines.push('');

  // Resumo
  lines.push('RESUMO EXECUTIVO');
  lines.push(`Total de Respostas,${analysis.summary.totalResponses}`);
  lines.push(`Tempo Médio,${analysis.summary.averageTimeSpent}`);
  lines.push(`Taxa de Qualidade,${analysis.summary.qualityRate}%`);
  lines.push(`Cotas Completas,${analysis.summary.quotasCompletePercentage}%`);
  lines.push(`Score de Qualidade,${analysis.qualityScore}/100`);
  lines.push('');

  // Análise por pergunta
  lines.push('ANÁLISE POR PERGUNTA');
  analysis.questionAnalysis.forEach((qa) => {
    lines.push(`"${qa.question}"`);
    lines.push('Opção,Contagem,Percentual');
    qa.distribution.forEach((item) => {
      lines.push(`"${item.label}",${item.count},${Math.round(item.percentage)}%`);
    });
    lines.push('');
  });

  // Insights
  lines.push('INSIGHTS AUTOMÁTICOS');
  analysis.keyInsights.forEach((insight, idx) => {
    lines.push(`"${idx + 1}. ${insight}"`);
  });

  return lines.join('\n');
}
