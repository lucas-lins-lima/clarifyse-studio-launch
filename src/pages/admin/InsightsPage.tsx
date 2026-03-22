import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProjectById } from '@/lib/surveyForgeDB';
import { generateInsights } from '@/lib/analyticsEngine';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import {
  ArrowLeft,
  BarChart3,
  Activity,
  Zap,
  CheckCircle2,
  Download,
  PieChart,
  TrendingUp,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as PieChartComponent,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#2D1E6B', '#1D9E75', '#7F77DD', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

export default function InsightsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('json');

  useEffect(() => {
    if (id) {
      const timer = setTimeout(() => {
        const p = getProjectById(id);
        if (p) {
          setProject(p);
        } else {
          toast.error('Projeto não encontrado.');
          navigate('/admin/projetos');
        }
        setLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [id, navigate]);

  const analysis = useMemo(() => {
    if (!project?.responses || project.responses.length === 0) return null;
    const mappedResponses = project.responses.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      answers: r.answers || {},
      quotaProfile: r.quotaProfile || {},
      timeSpent: r.timeSpent || r.timeSpentSeconds || 0,
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
      let content: string;
      let filename: string;
      let mimeType: string;
      if (exportFormat === 'json') {
        content = JSON.stringify({ project: { id: project.id, name: project.name }, analysis }, null, 2);
        filename = `insights_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        content = generateCSV(analysis, project);
        filename = `insights_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      }
      const blob = new Blob([content], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Insights exportados em ${exportFormat.toUpperCase()}!`);
    } catch {
      toast.error('Erro ao exportar insights.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-white border border-gray-100" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl bg-white border border-gray-100" />
        <Skeleton className="h-64 rounded-xl bg-white border border-gray-100" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/projetos/${project.id}`)}
            className="rounded-full hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#1D9E75] uppercase mb-1">
              CLARIFYSE INSIGHTS
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-[#2D1E6B]">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-sm text-[#64748B] mt-1">{project.objective}</p>
          </div>
        </div>
        {analysis && (
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium bg-white text-[#2D1E6B] focus:outline-none focus:ring-2 focus:ring-[#2D1E6B]"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl font-bold gap-2 shadow-lg shadow-purple-900/20"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        )}
      </div>

      {/* No analysis available */}
      {!analysis ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm">
          <EmptyState
            icon={BarChart3}
            title="Análise não disponível"
            description="A análise automática será liberada quando a coleta de respostas for concluída (amostra total atingida)."
            action={
              <Button
                onClick={() => navigate(`/admin/projetos/${project.id}?tab=monitoring`)}
                className="bg-[#2D1E6B] text-white rounded-xl"
              >
                Ver Monitoramento
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total de Respostas', value: analysis.summary.totalResponses, icon: CheckCircle2, color: 'teal' },
              { label: 'Tempo Médio', value: analysis.summary.averageTimeSpent, icon: Activity, color: 'purple' },
              { label: 'Taxa de Qualidade', value: `${analysis.summary.qualityRate}%`, icon: Zap, color: 'teal' },
              { label: 'Cotas Completas', value: `${analysis.summary.quotasCompletePercentage}%`, icon: TrendingUp, color: 'purple' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em]">{stat.label}</p>
                    <p className="text-3xl font-bold font-display text-[#2D1E6B]">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gray-50 ${stat.color === 'teal' ? 'text-[#1D9E75]' : 'text-[#2D1E6B]'}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quality Score */}
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
            <p className="text-xs text-[#64748B] mt-3">
              {analysis.qualityScore >= 80 ? '✅ Qualidade excelente — dados confiáveis para análise.' :
               analysis.qualityScore >= 60 ? '⚠️ Qualidade moderada — revise respostas suspeitas.' :
               '❌ Qualidade baixa — verifique a integridade dos dados.'}
            </p>
          </motion.div>

          {/* Key Insights */}
          {analysis.keyInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#1D9E75]" />
                <h3 className="text-lg font-bold text-[#2D1E6B]">Insights Automáticos</h3>
              </div>
              <div className="space-y-3">
                {analysis.keyInsights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex gap-3 p-3 bg-[#F1EFE8] rounded-lg border border-[#1D9E75]/10">
                    <div className="h-2 w-2 rounded-full bg-[#1D9E75] mt-2 flex-shrink-0" />
                    <p className="text-sm text-[#2D1E6B]">{insight}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Question Analysis */}
          {analysis.questionAnalysis.length > 0 && (
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
              {analysis.questionAnalysis.map((qa: any, idx: number) => (
                <div key={qa.questionId} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                  <h4 className="font-bold text-[#2D1E6B] mb-4">{qa.question}</h4>
                  {qa.distribution.length > 0 ? (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={qa.distribution.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value: any, name: any) => [`${value} (${Math.round(Number(value) / analysis.summary.totalResponses * 100)}%)`, 'Respostas']}
                          />
                          <Bar dataKey="count" fill="#2D1E6B" radius={[4, 4, 0, 0]}>
                            {qa.distribution.slice(0, 10).map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {qa.distribution.slice(0, 8).map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm text-[#2D1E6B] flex-1 truncate">{item.label}</span>
                            <span className="text-sm font-bold text-[#2D1E6B]">{item.count}</span>
                            <span className="text-xs text-[#64748B] w-12 text-right">{Math.round(item.percentage)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#64748B]">Sem dados suficientes para análise.</p>
                  )}
                  {qa.stats && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                      {qa.stats.mean !== undefined && (
                        <div className="p-3 bg-[#F1EFE8] rounded-lg text-center">
                          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Média</p>
                          <p className="text-xl font-bold text-[#2D1E6B]">{qa.stats.mean.toFixed(1)}</p>
                        </div>
                      )}
                      {qa.stats.median !== undefined && (
                        <div className="p-3 bg-[#F1EFE8] rounded-lg text-center">
                          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Mediana</p>
                          <p className="text-xl font-bold text-[#2D1E6B]">{qa.stats.median}</p>
                        </div>
                      )}
                      {qa.stats.classification && (
                        <div className="p-3 bg-[#F1EFE8] rounded-lg text-center">
                          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Classificação</p>
                          <p className="text-sm font-bold text-[#2D1E6B]">{qa.stats.classification}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* Cross Analysis */}
          {analysis.quotaComparison.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#1D9E75]" />
                <h3 className="text-lg font-bold text-[#2D1E6B]">Comparação entre Grupos</h3>
              </div>
              {analysis.quotaComparison.map((qc: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                  <h4 className="font-bold text-[#2D1E6B] mb-2">{qc.quotaName}</h4>
                  <p className="text-sm text-[#64748B] mb-4">{qc.mainInsight}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {qc.groups.map((group: any, gIdx: number) => (
                      <div key={gIdx} className="p-4 bg-[#F1EFE8] rounded-lg">
                        <p className="font-bold text-[#2D1E6B] mb-2">{group.groupName}</p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#64748B]">{group.targetMet} / {group.targetTotal}</span>
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
        </>
      )}
    </div>
  );
}

function generateCSV(analysis: any, project: any): string {
  const lines: string[] = [];
  lines.push('CLARIFYSE INSIGHTS — ANÁLISE DE DADOS');
  lines.push(`Projeto: ${project.name}`);
  lines.push(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
  lines.push('');
  lines.push('RESUMO EXECUTIVO');
  lines.push(`Total de Respostas,${analysis.summary.totalResponses}`);
  lines.push(`Tempo Médio,${analysis.summary.averageTimeSpent}`);
  lines.push(`Taxa de Qualidade,${analysis.summary.qualityRate}%`);
  lines.push(`Cotas Completas,${analysis.summary.quotasCompletePercentage}%`);
  lines.push(`Score de Qualidade,${analysis.qualityScore}/100`);
  lines.push('');
  lines.push('ANÁLISE POR PERGUNTA');
  analysis.questionAnalysis.forEach((qa: any) => {
    lines.push(`"${qa.question}"`);
    lines.push('Opção,Contagem,Percentual');
    qa.distribution.forEach((item: any) => {
      lines.push(`"${item.label}",${item.count},${Math.round(item.percentage)}%`);
    });
    lines.push('');
  });
  lines.push('INSIGHTS AUTOMÁTICOS');
  analysis.keyInsights.forEach((insight: string, idx: number) => {
    lines.push(`"${idx + 1}. ${insight}"`);
  });
  return lines.join('\n');
}
