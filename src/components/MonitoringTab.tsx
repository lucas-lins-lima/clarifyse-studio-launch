import React, { useState, useMemo } from 'react';
import { Project, Response } from '@/lib/surveyForgeDB';
import { TableRowSkeleton } from '@/components/SkeletonLoaders';
import { Eye, MessageSquare, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAGE_SIZE = 10;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const qualityColors: Record<string, string> = {
  OK: 'bg-teal-50 text-[#1D9E75]',
  SUSPEITA: 'bg-amber-50 text-amber-700',
  INVÁLIDA: 'bg-red-50 text-red-600',
};

const qualityDotColors: Record<string, string> = {
  OK: '#1D9E75',
  SUSPEITA: '#f59e0b',
  INVÁLIDA: '#ef4444',
};

interface ResponseModalProps {
  response: Response | null;
  project: Project;
  onClose: () => void;
}

function ResponseModal({ response, project, onClose }: ResponseModalProps) {
  if (!response) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(45,30,107,0.5)' }}
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">RESPOSTA COMPLETA</p>
            <h3 className="font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
              ID: {response.id.slice(-8).toUpperCase()}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${qualityColors[response.qualityFlag]}`}>
              {response.qualityFlag}
            </div>
            <span className="text-xs text-[#64748B]">Grupo: {response.quotaGroup}</span>
            <span className="text-xs text-[#64748B]">Tempo: {formatTime(response.timeSpentSeconds)}</span>
          </div>

          <div className="space-y-4">
            {project.formQuestions.map((q) => {
              const answer = response.answers[q.variableCode];
              let displayAnswer = String(answer ?? '—');

              if (q.options && answer !== undefined) {
                const opt = q.options.find((o) => String(o.code) === String(answer));
                if (opt) displayAnswer = `${opt.label} (código: ${opt.code})`;
              }

              return (
                <div key={q.id} className="bg-[#F1EFE8] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#64748B] mb-1 uppercase tracking-wide">{q.variableCode}</p>
                  <p className="text-sm text-[#2D1E6B] font-medium mb-2">{q.text}</p>
                  <p className="text-sm text-[#1D9E75] font-semibold">{displayAnswer}</p>
                </div>
              );
            })}

            {Object.keys(response.answers).map((key) => {
              const isInQuestions = project.formQuestions.some((q) => q.variableCode === key);
              if (isInQuestions) return null;
              return (
                <div key={key} className="bg-[#F1EFE8] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#64748B] mb-1 uppercase tracking-wide">{key}</p>
                  <p className="text-sm text-[#1D9E75] font-semibold">{String(response.answers[key])}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  project: Project;
  loading?: boolean;
}

export function MonitoringTab({ project, loading = false }: Props) {
  const [page, setPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

  const responses = project.responses;

  const stats = useMemo(() => {
    if (!responses.length) return { progress: 0, avgTime: 0, responsesToday: 0, healthStatus: 'ATENÇÃO' };
    const progress = Math.min(100, Math.round((responses.length / project.sampleSize) * 100));
    const avgTime = Math.round(responses.reduce((a, r) => a + r.timeSpentSeconds, 0) / responses.length);
    const today = new Date().toDateString();
    const responsesToday = responses.filter((r) => new Date(r.timestamp).toDateString() === today).length;
    const healthStatus = progress >= 100 ? 'SAUDÁVEL' : progress >= 70 ? 'EM ANDAMENTO' : 'ATENÇÃO';
    return { progress, avgTime, responsesToday, healthStatus };
  }, [responses, project.sampleSize]);

  const quotaStats = useMemo(() => {
    return project.quotas.map((quota) => {
      const groupStats = quota.groups.map((group) => {
        const count = responses.filter((r) => r.quotaGroup === group.name).length;
        const pct = group.target > 0 ? Math.round((count / group.target) * 100) : 0;
        return { ...group, count, pct };
      });
      return { ...quota, groupStats };
    });
  }, [project.quotas, responses]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return responses.slice(start, start + PAGE_SIZE);
  }, [responses, page]);

  const totalPages = Math.ceil(responses.length / PAGE_SIZE);

  const healthColor = stats.healthStatus === 'SAUDÁVEL' ? '#1D9E75' : stats.healthStatus === 'EM ANDAMENTO' ? '#f59e0b' : '#ef4444';
  const healthBg = stats.healthStatus === 'SAUDÁVEL' ? 'bg-teal-50' : stats.healthStatus === 'EM ANDAMENTO' ? 'bg-amber-50' : 'bg-red-50';

  const criticalAlerts = quotaStats.flatMap((q) =>
    q.groupStats
      .filter((g) => g.pct < 20 && g.count < g.target)
      .map((g) => `Cota "${g.name}" está muito abaixo do esperado (${g.pct}%)`)
  );

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {criticalAlerts.map((alert) => (
        <div key={alert} className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700">{alert}</p>
        </div>
      ))}

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Progress */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 col-span-2 lg:col-span-1">
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-3">AMOSTRA COLETADA</p>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-2xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {responses.length}
            </p>
            <p className="text-sm text-[#64748B] mb-0.5">/ {project.sampleSize}</p>
            <p className="text-xl font-bold ml-auto" style={{ color: healthColor }}>{stats.progress}%</p>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${stats.progress}%`, backgroundColor: healthColor }} />
          </div>
        </div>

        {/* Card 2: Avg time */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-3">TEMPO MÉDIO</p>
          <p className="text-2xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {formatTime(stats.avgTime)}
          </p>
          <p className="text-xs text-[#64748B] mt-1">por respondente</p>
        </div>

        {/* Card 3: Today */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-3">RESPOSTAS HOJE</p>
          <p className="text-2xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
            +{stats.responsesToday}
          </p>
          <p className="text-xs text-[#64748B] mt-1">últimas 24h</p>
        </div>

        {/* Card 4: Health */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-3">STATUS GERAL</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${healthBg}`}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: healthColor }} />
            <span className="text-xs font-bold" style={{ color: healthColor }}>{stats.healthStatus}</span>
          </div>
        </div>
      </div>

      {/* Quota status */}
      {quotaStats.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-4">STATUS DE COTAS</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotaStats.flatMap((q) =>
              q.groupStats.map((group) => {
                const color = group.pct >= 100 ? '#1D9E75' : group.pct >= 30 ? '#f59e0b' : '#ef4444';
                const badge = group.pct >= 100 ? { label: 'COMPLETA', bg: 'bg-teal-50 text-[#1D9E75]' }
                  : group.pct >= 30 ? { label: 'EM ANDAMENTO', bg: 'bg-amber-50 text-amber-700' }
                  : { label: 'CRÍTICA', bg: 'bg-red-50 text-red-600' };
                return (
                  <div key={`${q.id}-${group.name}`} className="bg-[#F1EFE8] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[#64748B] font-semibold">{q.name}</p>
                        <p className="text-sm font-bold text-[#2D1E6B]">{group.name}</p>
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#64748B]">{group.count} / {group.target}</span>
                      <span className="text-xs font-bold" style={{ color }}>{group.pct}%</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, group.pct)}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Completion banner */}
      {stats.progress >= 100 && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1D9E75] flex items-center justify-center flex-shrink-0">
            <MessageSquare size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#1D9E75] mb-1">🟢 FORMULÁRIO COMPLETO!</p>
            <p className="text-sm text-teal-700">
              Todas as respostas foram coletadas com sucesso. A análise automática já está disponível.
            </p>
          </div>
        </div>
      )}

      {/* Respondents table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">RESPONDENTES</p>
          <h3 className="text-lg font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Lista de Respostas
          </h3>
        </div>

        {loading ? (
          <table className="w-full">
            <tbody>{[1,2,3,4,5].map((i) => <TableRowSkeleton key={i} />)}</tbody>
          </table>
        ) : responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-gray-300" />
            </div>
            <h4 className="font-bold text-[#2D1E6B] mb-2">Nenhuma resposta ainda</h4>
            <p className="text-sm text-[#64748B] max-w-xs">
              Compartilhe o link do formulário para começar a coleta.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#F1EFE8]">
                    {['DATA/HORA', 'ID', 'PERFIL DE COTA', 'TEMPO', 'QUALIDADE', 'AÇÃO'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] uppercase tracking-widest text-[#1D9E75] font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F1EFE8] transition-colors">
                      <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">
                        {format(new Date(r.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-[#2D1E6B]">
                        {r.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#2D1E6B] whitespace-nowrap">
                        {r.quotaGroup || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">
                        {formatTime(r.timeSpentSeconds)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: qualityDotColors[r.qualityFlag] || '#64748B' }} />
                          <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${qualityColors[r.qualityFlag] || 'bg-gray-100 text-gray-500'}`}>
                            {r.qualityFlag}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedResponse(r)}
                          className="flex items-center gap-1 text-xs text-[#7F77DD] hover:text-[#2D1E6B] font-medium transition-colors"
                        >
                          <Eye size={12} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-xs text-[#64748B]">
                  Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, responses.length)} de {responses.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#2D1E6B] hover:border-[#2D1E6B] disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-[#64748B] font-medium">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#2D1E6B] hover:border-[#2D1E6B] disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ResponseModal response={selectedResponse} project={project} onClose={() => setSelectedResponse(null)} />
    </div>
  );
}
