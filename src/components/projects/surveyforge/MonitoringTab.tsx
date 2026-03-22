import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getProjectById } from '@/lib/surveyForgeDB';
import { StatCard } from '@/components/ui/StatCard';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, AlertTriangle, Eye, Copy, RefreshCw, Clock, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface QualityFlag {
  status: 'OK' | 'SUSPEITA' | 'INVÁLIDA';
  reason?: string;
}

interface ResponseWithQuality {
  id: string;
  timestamp: string;
  quotaGroup: string;
  timeSpentSeconds: number;
  answers: Record<string, any>;
  qualityFlag: QualityFlag;
}

interface QuotaGroupStatus {
  name: string;
  target: number;
  current: number;
  percentage: number;
  status: 'COMPLETA' | 'EM_ANDAMENTO' | 'CRÍTICA';
}

const calculateQualityFlag = (response: any, avgTimeSpent: number): QualityFlag => {
  const timeSpentSeconds = response.timeSpentSeconds || 0;
  const answers = response.answers || {};

  // Check for extremely low time
  if (timeSpentSeconds < 10) {
    return { status: 'INVÁLIDA', reason: 'Tempo extremamente baixo' };
  }

  // Check for time below 30% of average
  if (avgTimeSpent > 0 && timeSpentSeconds < avgTimeSpent * 0.3) {
    return { status: 'SUSPEITA', reason: 'Tempo muito abaixo da média' };
  }

  // Check for straightlining (all answers the same)
  const answerValues = Object.values(answers).filter(v => v !== undefined && v !== '');
  if (answerValues.length > 2) {
    const uniqueValues = new Set(answerValues.map(v => String(v)));
    if (uniqueValues.size === 1) {
      return { status: 'SUSPEITA', reason: 'Padrão de resposta repetitivo' };
    }
  }

  return { status: 'OK' };
};

const getQualityBadgeColor = (status: string) => {
  switch (status) {
    case 'OK':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'SUSPEITA':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'INVÁLIDA':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getQuotaStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETA':
      return { badge: 'bg-green-100 text-green-700', icon: '🟢' };
    case 'EM_ANDAMENTO':
      return { badge: 'bg-yellow-100 text-yellow-700', icon: '🟡' };
    case 'CRÍTICA':
      return { badge: 'bg-red-100 text-red-700', icon: '🔴' };
    default:
      return { badge: 'bg-gray-100 text-gray-700', icon: '⚪' };
  }
};

export default function MonitoringTab({ project }: { project: any }) {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<ResponseWithQuality[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedResponse, setSelectedResponse] = useState<ResponseWithQuality | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Polling for real-time updates
  useEffect(() => {
    const updateData = () => {
      const updatedProject = getProjectById(project.id);
      if (updatedProject && updatedProject.responses) {
        const avgTime = updatedProject.responses.length > 0
          ? updatedProject.responses.reduce((sum: number, r: any) => sum + (r.timeSpentSeconds || 0), 0) / updatedProject.responses.length
          : 0;

        const responsesWithQuality = updatedProject.responses.map((r: any) => ({
          ...r,
          qualityFlag: calculateQualityFlag(r, avgTime)
        }));

        setResponses(responsesWithQuality);
      }
    };

    updateData();
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, [project.id]);

  // Listen to storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(k => k + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const stats = useMemo(() => {
    const totalResponses = responses.length;
    const progress = project.sampleSize > 0 ? Math.min(100, Math.round((totalResponses / project.sampleSize) * 100)) : 0;

    const avgTime = totalResponses > 0
      ? responses.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / totalResponses
      : 0;

    const responsesToday = responses.filter(r => {
      const respDate = new Date(r.timestamp).toDateString();
      const today = new Date().toDateString();
      return respDate === today;
    }).length;

    const qualityOk = responses.filter(r => r.qualityFlag.status === 'OK').length;
    const qualityRate = totalResponses > 0 ? Math.round((qualityOk / totalResponses) * 100) : 0;

    return {
      totalResponses,
      progress,
      avgTime,
      responsesToday,
      qualityRate,
      healthStatus: progress >= 100 ? 'SAUDÁVEL' : progress >= 70 ? 'EM_ANDAMENTO' : 'ATENÇÃO'
    };
  }, [responses, project.sampleSize]);

  const quotaStatus = useMemo(() => {
    const quotas: QuotaGroupStatus[] = [];

    if (project.quotas && project.quotas.length > 0) {
      for (const quota of project.quotas) {
        if (quota.groups && quota.groups.length > 0) {
          for (const group of quota.groups) {
            const current = responses.filter(r => r.quotaGroup === group.name).length;
            const percentage = group.target > 0 ? Math.round((current / group.target) * 100) : 0;
            let status: 'COMPLETA' | 'EM_ANDAMENTO' | 'CRÍTICA' = 'EM_ANDAMENTO';

            if (percentage >= 100) {
              status = 'COMPLETA';
            } else if (percentage < 30) {
              status = 'CRÍTICA';
            }

            quotas.push({
              name: group.name,
              target: group.target,
              current,
              percentage,
              status
            });
          }
        }
      }
    }

    return quotas;
  }, [project.quotas, responses]);

  const alerts = useMemo(() => {
    const alertList = [];

    // Check for critical quotas
    for (const quota of quotaStatus) {
      if (quota.status === 'CRÍTICA') {
        alertList.push({
          type: 'quota',
          severity: 'high',
          message: `Cota '${quota.name}' está muito abaixo do esperado (${quota.percentage}%)`
        });
      }
    }

    // Check for low quality
    if (stats.qualityRate < 80 && responses.length > 0) {
      alertList.push({
        type: 'quality',
        severity: 'medium',
        message: `Taxa de qualidade baixa (${stats.qualityRate}%). Revise respostas suspeitas.`
      });
    }

    return alertList;
  }, [quotaStatus, stats, responses.length]);

  const paginatedResponses = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return responses.slice(startIdx, startIdx + itemsPerPage);
  }, [responses, currentPage]);

  const totalPages = Math.ceil(responses.length / itemsPerPage);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const copyPublicLink = () => {
    const link = `${window.location.origin}/survey/${project.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    toast.success('Dados atualizados!');
  };

  return (
    <div className="space-y-8">
      {/* Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border-l-4 flex items-start gap-3 ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-yellow-50 border-yellow-400 text-yellow-700'
                }`}
              >
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Amostra Coletada"
          value={`${stats.totalResponses} / ${project.sampleSize}`}
          icon={CheckCircle2}
          accentColor="teal"
        />
        <StatCard
          label="Tempo Médio"
          value={formatTime(Math.round(stats.avgTime))}
          icon={Clock}
          accentColor="purple"
        />
        <StatCard
          label="Respostas Hoje"
          value={`+${stats.responsesToday}`}
          icon={TrendingUp}
          accentColor="teal"
        />
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em]">Status Geral</p>
              <p className="text-3xl font-bold font-display text-[#2D1E6B]">{stats.healthStatus}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 text-[#2D1E6B]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      {stats.progress >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1D9E75] to-[#2D1E6B] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">COLETA CONCLUÍDA</p>
            </div>
            <h3 className="text-xl font-display font-bold text-white">Amostra completa! Análise disponível.</h3>
            <p className="text-sm text-white/70">
              {responses.length} respostas coletadas — acesse os insights automáticos agora.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/admin/insights/${project.id}`)}
            className="bg-white text-[#2D1E6B] hover:bg-white/90 rounded-xl font-bold gap-2 flex-shrink-0 shadow-lg"
          >
            <BarChart3 className="h-4 w-4" />
            Ver Insights
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-[#2D1E6B]">Progresso Geral</h3>
          <span className="text-2xl font-bold text-[#2D1E6B]">{stats.progress}%</span>
        </div>
        <Progress value={stats.progress} className="h-4 bg-gray-100" indicatorClassName={stats.progress >= 100 ? 'bg-[#1D9E75]' : 'bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD]'} />
        <div className="flex justify-between text-xs font-bold text-[#64748B] uppercase tracking-widest">
          <span>0 Respostas</span>
          <span>{project.sampleSize} Respondentes (Meta)</span>
        </div>
      </div>

      {/* Quotas Status */}
      {quotaStatus.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-display font-bold text-[#2D1E6B]">Status de Cotas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotaStatus.map((quota, idx) => {
              const colors = getQuotaStatusColor(quota.status);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">Cota</p>
                      <h4 className="text-lg font-bold text-[#2D1E6B]">{quota.name}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${colors.badge}`}>
                      {colors.icon} {quota.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B] font-medium">Progresso</span>
                      <span className="text-[#2D1E6B] font-bold">{quota.current} / {quota.target}</span>
                    </div>
                    <Progress value={Math.min(100, quota.percentage)} className="h-2 bg-gray-100" />
                    <div className="text-right text-xs font-bold text-[#64748B] uppercase tracking-widest">
                      {quota.percentage}%
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Respondents Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-[#2D1E6B]">Respondentes</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-lg border-gray-200 text-[#2D1E6B]"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>

        {responses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-[#64748B] mb-4">Nenhuma resposta ainda.</p>
            <p className="text-sm text-[#64748B] mb-6">Compartilhe o link do formulário para começar a coleta.</p>
            <Button
              onClick={copyPublicLink}
              className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl font-bold"
            >
              <Copy className="h-4 w-4 mr-2" /> Copiar Link do Formulário
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-[#F1EFE8]">
                <TableRow className="border-gray-100">
                  <TableHead className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">Data/Hora</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">ID</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">Perfil de Cota</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">Tempo</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">Qualidade</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResponses.map((response) => (
                  <TableRow key={response.id} className="border-gray-50 hover:bg-[#F1EFE8]/50 transition-colors">
                    <TableCell className="text-sm text-[#2D1E6B] font-medium">{formatDate(response.timestamp)}</TableCell>
                    <TableCell className="text-sm text-[#64748B] font-mono">{response.id.substring(0, 8)}</TableCell>
                    <TableCell className="text-sm text-[#2D1E6B]">{response.quotaGroup}</TableCell>
                    <TableCell className="text-sm text-[#2D1E6B] font-medium">{formatTime(response.timeSpentSeconds)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getQualityBadgeColor(response.qualityFlag.status)}`}>
                        {response.qualityFlag.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedResponse(response)}
                        className="text-[#2D1E6B] hover:bg-[#2D1E6B]/10 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-[#F1EFE8]/30">
                <p className="text-sm text-[#64748B] font-medium">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border-gray-200"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border-gray-200"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedResponse(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-[#2D1E6B]">Resposta Completa</h2>
              <button
                onClick={() => setSelectedResponse(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Response Metadata */}
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">ID</p>
                  <p className="text-sm text-[#2D1E6B] font-mono">{selectedResponse.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">Data/Hora</p>
                  <p className="text-sm text-[#2D1E6B]">{formatDate(selectedResponse.timestamp)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">Cota</p>
                  <p className="text-sm text-[#2D1E6B]">{selectedResponse.quotaGroup}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">Tempo</p>
                  <p className="text-sm text-[#2D1E6B]">{formatTime(selectedResponse.timeSpentSeconds)}</p>
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-bold text-[#2D1E6B]">Respostas</h3>
                {Object.entries(selectedResponse.answers).map(([key, value]) => (
                  <div key={key} className="p-4 bg-[#F1EFE8] rounded-xl">
                    <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-2">{key}</p>
                    <p className="text-sm text-[#2D1E6B] break-words">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
