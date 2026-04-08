import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Download, TrendingUp, AlertCircle, CheckCircle2, BarChart3,
  Activity, Zap, RefreshCw, Clock, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { MethodologyValidator, type MethodologyType } from '@/lib/methodologyQuestionValidator';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#2D1E6B', '#1D9E75', '#7F77DD', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

interface EnhancedAnalysisTabProps {
  project: any;
  isAdmin?: boolean;
  enableRealtime?: boolean;
}

export function EnhancedAnalysisTab({
  project,
  isAdmin = false,
  enableRealtime = true
}: EnhancedAnalysisTabProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('xlsx');
  const [selectedMethodologies, setSelectedMethodologies] = useState<MethodologyType[]>(
    (project.metodologias_analise || []).map((m: any) => m.type as MethodologyType)
  );
  const [autoRefresh, setAutoRefresh] = useState(enableRealtime);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toISOString());

  // Preparar dados para análise
  const formattedResponses = (project.responses || []).map((r: any) => ({
    id: r.id,
    timestamp: r.submittedAt || r.timestamp || new Date().toISOString(),
    answers: r.answers || {},
    quotaProfile: { [project.quotas?.[0]?.id || 'default']: r.quotaGroup },
    timeSpent: r.timeSpentSeconds || r.timeSpent || 0,
    qualityFlag: r.qualityFlag || 'good',
  }));

  // Usar hook de análises em tempo real
  const {
    mainInsights,
    methodologyResults,
    qualityScore,
    responseCount,
    isPending,
    error
  } = useRealtimeAnalytics({
    responses: formattedResponses,
    questions: project.formQuestions || [],
    quotas: project.quotas || [],
    methodologies: selectedMethodologies,
    sampleSize: project.sampleSize,
    enabled: enableRealtime && autoRefresh
  });

  // Validação automática de metodologias
  useEffect(() => {
    if (project.formQuestions) {
      const validation = MethodologyValidator.validateProject(
        project.formQuestions,
        formattedResponses,
        selectedMethodologies
      );

      if (validation.errors.length > 0 && isAdmin) {
        console.warn('Validation errors:', validation.errors);
      }
    }
  }, [project.formQuestions, formattedResponses, selectedMethodologies, isAdmin]);

  // Sugerir metodologias automaticamente
  useEffect(() => {
    if (project.formQuestions && selectedMethodologies.length === 0) {
      const suggested = MethodologyValidator.suggestMethodologies(project.formQuestions);
      if (suggested.length > 0) {
        setSelectedMethodologies(suggested as MethodologyType[]);
      }
    }
  }, [project.formQuestions, selectedMethodologies.length]);

  const handleRefresh = useCallback(async () => {
    setLastRefreshTime(new Date().toISOString());
    toast.success('Análises atualizadas');
  }, []);

  const handleExport = useCallback(async () => {
    if (!mainInsights) {
      toast.error('Nenhuma análise disponível para exportar');
      return;
    }

    try {
      const exportData = {
        projectId: project.id,
        projectName: project.nome,
        exportedAt: new Date().toISOString(),
        responseCount,
        qualityScore,
        mainInsights,
        methodologyResults,
        methodologies: selectedMethodologies,
      };

      if (exportFormat === 'json') {
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        downloadFile(blob, `analise-${project.id}-${Date.now()}.json`);
      } else if (exportFormat === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet([exportData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Analysis');
        XLSX.writeFile(wb, `analise-${project.id}-${Date.now()}.xlsx`);
      } else if (exportFormat === 'csv') {
        const csv = convertToCSV(exportData);
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadFile(blob, `analise-${project.id}-${Date.now()}.csv`);
      }

      toast.success(`Análise exportada em ${exportFormat.toUpperCase()}`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Erro ao exportar análise');
    }
  }, [mainInsights, exportFormat, project.id, responseCount, qualityScore, methodologyResults, selectedMethodologies]);

  if (isPending && responseCount === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Análise não disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800">
              A análise automática será liberada quando a coleta de respostas for concluída.
              Atualmente: {responseCount} / {project.sampleSize} respostas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header com controles */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#2D1E6B]">Análise em Tempo Real</h2>
            <p className="text-sm text-[#64748B] mt-1">
              {responseCount} respostas | Atualizado em {new Date(lastRefreshTime).toLocaleTimeString('pt-BR')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>

            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              {autoRefresh ? 'Automático' : 'Manual'}
            </Button>

            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'xlsx')}
              className="px-3 py-1 rounded-lg border border-gray-300 text-sm"
            >
              <option value="xlsx">Excel</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>

            <Button
              onClick={handleExport}
              className="gap-2 bg-[#2D1E6B] hover:bg-[#1a1147]"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </motion.div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro na análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Indicadores principais */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Respostas</p>
                <p className="text-2xl font-bold text-[#2D1E6B] mt-1">{responseCount}</p>
              </div>
              <Users className="h-8 w-8 text-[#1D9E75]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Score Qualidade</p>
                <p className="text-2xl font-bold text-[#2D1E6B] mt-1">{qualityScore}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-[#1D9E75]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Metodologias</p>
                <p className="text-2xl font-bold text-[#2D1E6B] mt-1">{selectedMethodologies.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-[#7F77DD]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Progresso</p>
                <p className="text-2xl font-bold text-[#2D1E6B] mt-1">
                  {Math.round((responseCount / project.sampleSize) * 100)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#FF6B6B]" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resultados de Metodologias */}
      {selectedMethodologies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-[#2D1E6B] flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#1D9E75]" />
            Resultados por Metodologia
          </h3>

          <div className="grid gap-4">
            {selectedMethodologies.map((methodology) => {
              const result = methodologyResults[methodology];

              if (!result) {
                return (
                  <Card key={methodology}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600">
                        {methodology} - Dados insuficientes
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card key={methodology}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{methodology}</CardTitle>
                      <Badge variant="outline">{responseCount} resp.</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.insight && (
                        <p className="text-sm text-gray-700">{result.insight}</p>
                      )}
                      {result.preferences && (
                        <div className="space-y-2">
                          {result.preferences.slice(0, 3).map((pref: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span>{pref.option}</span>
                              <span className="font-bold text-[#2D1E6B]">{pref.score}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {result.variables && (
                        <div className="space-y-2">
                          {result.variables.slice(0, 3).map((v: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span>{v.name}</span>
                              <span className="font-bold text-[#2D1E6B]">{v.normalizedImportance}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Insights principais */}
      {mainInsights && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#FF6B6B]" />
                Insights Principais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mainInsights.keyInsights?.slice(0, 5).map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-[#1D9E75] font-bold mt-1">→</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Helper functions
 */
function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function convertToCSV(data: any): string {
  const headers = Object.keys(data);
  const rows = [headers];
  const values = headers.map(h => {
    const val = data[h];
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  });
  rows.push(values);
  return rows.map(row => row.join(',')).join('\n');
}
