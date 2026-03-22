import React, { useMemo } from 'react';
import { Project, Response, FormQuestion } from '@/lib/surveyForgeDB';
import { AnalysisCardSkeleton } from '@/components/SkeletonLoaders';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Lock, Download, AlertTriangle } from 'lucide-react';

const CHART_COLORS = ['#2D1E6B', '#1D9E75', '#7F77DD', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

interface InsightResult {
  summary: {
    totalResponses: number;
    avgTimeSeconds: number;
    qualityRate: number;
    completionRate: number;
  };
  questionAnalysis: QuestionAnalysis[];
  keyInsights: string[];
  qualityScore: number;
}

interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  type: string;
  variableCode: string;
  distribution?: { label: string; count: number; pct: number }[];
  stats?: { mean: number; median: number; classification: string };
  wordFrequency?: { word: string; count: number }[];
}

function generateInsights(responses: Response[], questions: FormQuestion[]): InsightResult {
  const totalResponses = responses.length;
  const avgTimeSeconds = totalResponses > 0
    ? Math.round(responses.reduce((a, r) => a + r.timeSpentSeconds, 0) / totalResponses)
    : 0;
  const validResponses = responses.filter((r) => r.qualityFlag === 'OK').length;
  const qualityRate = totalResponses > 0 ? Math.round((validResponses / totalResponses) * 100) : 0;
  const completionRate = 100;

  const questionAnalysis: QuestionAnalysis[] = questions.map((q) => {
    const answers = responses.map((r) => r.answers[q.variableCode]).filter((a) => a !== undefined);

    if (q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'boolean') {
      const counts: Record<string, number> = {};
      answers.forEach((a) => {
        const key = String(a);
        counts[key] = (counts[key] || 0) + 1;
      });
      const distribution = Object.entries(counts).map(([code, count]) => {
        const opt = q.options?.find((o) => String(o.code) === code);
        return {
          label: opt?.label || code,
          count,
          pct: Math.round((count / answers.length) * 100),
        };
      }).sort((a, b) => b.count - a.count);

      return { questionId: q.id, questionText: q.text, type: q.type, variableCode: q.variableCode, distribution };
    }

    if (q.type === 'likert' || q.type === 'nps' || q.type === 'rating') {
      const numAnswers = answers.map(Number).filter((n) => !isNaN(n));
      if (numAnswers.length === 0) return { questionId: q.id, questionText: q.text, type: q.type, variableCode: q.variableCode };
      const mean = numAnswers.reduce((a, b) => a + b, 0) / numAnswers.length;
      const sorted = [...numAnswers].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const classification = mean >= 8 ? 'Forte' : mean >= 5 ? 'Regular' : 'Crítico';

      const counts: Record<number, number> = {};
      numAnswers.forEach((n) => { counts[n] = (counts[n] || 0) + 1; });
      const distribution = Object.entries(counts)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([val, count]) => ({
          label: val,
          count,
          pct: Math.round((count / numAnswers.length) * 100),
        }));

      return { questionId: q.id, questionText: q.text, type: q.type, variableCode: q.variableCode, stats: { mean: Math.round(mean * 10) / 10, median, classification }, distribution };
    }

    if (q.type === 'open_text') {
      const stopWords = new Set(['e', 'o', 'a', 'de', 'da', 'do', 'em', 'na', 'no', 'que', 'para', 'com', 'por', 'se', 'um', 'uma', 'os', 'as', 'é', 'são']);
      const wordCounts: Record<string, number> = {};
      answers.forEach((a) => {
        String(a).toLowerCase().split(/\s+/).forEach((w) => {
          const clean = w.replace(/[^a-záéíóúãõâêîôûç]/g, '');
          if (clean.length > 3 && !stopWords.has(clean)) {
            wordCounts[clean] = (wordCounts[clean] || 0) + 1;
          }
        });
      });
      const wordFrequency = Object.entries(wordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));

      return { questionId: q.id, questionText: q.text, type: q.type, variableCode: q.variableCode, wordFrequency };
    }

    return { questionId: q.id, questionText: q.text, type: q.type, variableCode: q.variableCode };
  });

  // Auto-generated insights
  const keyInsights: string[] = [];
  questionAnalysis.forEach((qa) => {
    if (qa.distribution && qa.distribution.length > 0) {
      const top = qa.distribution[0];
      keyInsights.push(`A resposta mais comum em "${qa.questionText.slice(0, 40)}..." foi "${top.label}" (${top.pct}%)`);
    }
    if (qa.stats) {
      keyInsights.push(`O nível médio de "${qa.questionText.slice(0, 40)}..." é ${qa.stats.mean} — classificado como ${qa.stats.classification}`);
    }
  });
  if (qualityRate >= 90) keyInsights.push(`Taxa de qualidade excelente: ${qualityRate}% das respostas são válidas`);
  if (avgTimeSeconds > 120) keyInsights.push(`Tempo médio de resposta adequado: ${Math.round(avgTimeSeconds / 60)}min — indica engajamento saudável`);

  const qualityScore = Math.round((qualityRate * 0.4) + (Math.min(100, (avgTimeSeconds / 180) * 100) * 0.3) + 30);

  return {
    summary: { totalResponses, avgTimeSeconds, qualityRate, completionRate },
    questionAnalysis,
    keyInsights: keyInsights.slice(0, 5),
    qualityScore: Math.min(100, qualityScore),
  };
}

function exportCSV(responses: Response[]) {
  if (!responses.length) return;
  const keys = Object.keys(responses[0].answers);
  const header = ['id', 'timestamp', 'quotaGroup', 'timeSpentSeconds', 'qualityFlag', ...keys].join(',');
  const rows = responses.map((r) =>
    [r.id, r.timestamp, r.quotaGroup, r.timeSpentSeconds, r.qualityFlag, ...keys.map((k) => `"${r.answers[k] ?? ''}"`)]
      .join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `responses_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(responses: Response[]) {
  const blob = new Blob([JSON.stringify(responses, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `responses_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  project: Project;
  loading?: boolean;
}

export function AnalysisTab({ project, loading = false }: Props) {
  const { responses, formQuestions, sampleSize } = project;
  const isUnlocked = responses.length >= sampleSize;

  const insights = useMemo(() => {
    if (!isUnlocked || !responses.length) return null;
    return generateInsights(responses, formQuestions);
  }, [responses, formQuestions, isUnlocked]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((i) => <AnalysisCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!isUnlocked) {
    const progress = Math.round((responses.length / sampleSize) * 100);
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-[#2D1E6B]/5 flex items-center justify-center">
            <Lock size={36} className="text-[#7F77DD]" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-[#2D1E6B] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Análise Indisponível
        </h3>
        <p className="text-sm text-[#64748B] mb-6 max-w-sm">
          A análise será liberada quando a coleta for concluída. Você coletou {responses.length} de {sampleSize} respostas necessárias.
        </p>
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#64748B]">Progresso atual</span>
            <span className="text-xs font-bold text-[#2D1E6B]">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #2D1E6B, #7F77DD)' }}
            />
          </div>
          <p className="text-xs text-[#64748B] mt-2 text-center">
            Faltam {sampleSize - responses.length} respostas
          </p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">ANÁLISE COMPLETA</p>
          <h2 className="text-xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Insights do Projeto
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(responses)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 rounded-xl text-[#64748B] hover:border-[#2D1E6B] hover:text-[#2D1E6B] transition-colors font-medium"
          >
            <Download size={12} /> CSV
          </button>
          <button
            onClick={() => exportJSON(responses)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 rounded-xl text-[#64748B] hover:border-[#2D1E6B] hover:text-[#2D1E6B] transition-colors font-medium"
          >
            <Download size={12} /> JSON
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-4">RESUMO DO PROJETO</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total de Respostas', value: insights.summary.totalResponses },
            { label: 'Tempo Médio', value: `${Math.floor(insights.summary.avgTimeSeconds / 60)}m ${insights.summary.avgTimeSeconds % 60}s` },
            { label: 'Taxa de Qualidade', value: `${insights.summary.qualityRate}%` },
            { label: 'Score do Projeto', value: `${insights.qualityScore}/100` },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-2xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {item.value}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#64748B] mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      {insights.keyInsights.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#1D9E75]" />
            <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">INSIGHTS AUTOMÁTICOS</p>
          </div>
          <div className="space-y-3">
            {insights.keyInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#F1EFE8] rounded-xl p-3">
                <div className="w-6 h-6 rounded-full bg-[#1D9E75] flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-[#2D1E6B] leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Analysis */}
      <div className="space-y-5">
        {insights.questionAnalysis.map((qa) => (
          <div key={qa.questionId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-1">{qa.variableCode.toUpperCase()}</p>
            <h3 className="font-bold text-[#2D1E6B] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {qa.questionText}
            </h3>

            {qa.stats && (
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="bg-[#F1EFE8] rounded-xl px-4 py-2">
                  <p className="text-xs text-[#64748B]">Média</p>
                  <p className="text-xl font-bold text-[#2D1E6B]">{qa.stats.mean}</p>
                </div>
                <div className="bg-[#F1EFE8] rounded-xl px-4 py-2">
                  <p className="text-xs text-[#64748B]">Mediana</p>
                  <p className="text-xl font-bold text-[#2D1E6B]">{qa.stats.median}</p>
                </div>
                <div className={`rounded-xl px-4 py-2 ${qa.stats.classification === 'Forte' ? 'bg-teal-50' : qa.stats.classification === 'Regular' ? 'bg-amber-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-[#64748B]">Classificação</p>
                  <p className={`text-sm font-bold ${qa.stats.classification === 'Forte' ? 'text-[#1D9E75]' : qa.stats.classification === 'Regular' ? 'text-amber-700' : 'text-red-600'}`}>
                    {qa.stats.classification}
                  </p>
                </div>
              </div>
            )}

            {qa.distribution && qa.distribution.length > 0 && (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qa.distribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      formatter={(value: number, name: string) => [value, 'Respostas']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {qa.distribution.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {qa.wordFrequency && qa.wordFrequency.length > 0 && (
              <div>
                <p className="text-xs text-[#64748B] mb-3">Palavras mais frequentes</p>
                <div className="flex flex-wrap gap-2">
                  {qa.wordFrequency.map((wf, i) => (
                    <div
                      key={wf.word}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                      style={{
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        opacity: 0.7 + (wf.count / qa.wordFrequency![0].count) * 0.3,
                      }}
                    >
                      {wf.word}
                      <span className="bg-white/20 rounded-full px-1.5">{wf.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!qa.distribution && !qa.wordFrequency && !qa.stats && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-4">
                <AlertTriangle size={14} className="text-gray-400" />
                <p className="text-xs text-gray-500">Não há dados suficientes para analisar esta pergunta.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
