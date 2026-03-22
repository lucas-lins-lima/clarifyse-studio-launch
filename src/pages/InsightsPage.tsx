import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, Clock, CheckCircle, TrendingUp, FileText } from 'lucide-react';
import { getProjectById, Project } from '@/lib/surveyForgeDB';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const CHART_COLORS = ['#2D1E6B', '#1D9E75', '#7F77DD', '#f59e0b', '#ef4444'];

export default function InsightsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [insightData, setInsightData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!id) return;
    const proj = getProjectById(id);
    setProject(proj || null);

    const insightKey = `surveyForgeInsights_${id}`;
    const raw = localStorage.getItem(insightKey);
    if (raw) {
      try {
        setInsightData(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, [id]);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex flex-col items-center justify-center text-center p-6">
        <BarChart3 size={48} className="text-[#7F77DD] mb-4" />
        <h1 className="text-2xl font-bold text-[#2D1E6B] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Projeto não encontrado
        </h1>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-sm text-[#7F77DD] hover:underline"
        >
          ← Voltar para Projetos
        </button>
      </div>
    );
  }

  const metrics = (insightData?.metrics as Record<string, number>) || {
    totalResponses: project.responses.length,
    completionRate: Math.round((project.responses.length / project.sampleSize) * 100),
    avgTimeSeconds: project.responses.length > 0
      ? Math.round(project.responses.reduce((a, r) => a + r.timeSpentSeconds, 0) / project.responses.length)
      : 0,
    qualityRate: project.responses.length > 0
      ? Math.round((project.responses.filter((r) => r.qualityFlag === 'OK').length / project.responses.length) * 100)
      : 0,
  };

  // Prepare chart data for first choice question
  const choiceQuestion = project.formQuestions.find((q) => q.type === 'single_choice' && q.options && q.options.length > 0);
  const choiceChartData = choiceQuestion
    ? (choiceQuestion.options || []).map((opt) => {
        const count = project.responses.filter(
          (r) => String(r.answers[choiceQuestion.variableCode]) === String(opt.code)
        ).length;
        return {
          label: opt.label.length > 12 ? opt.label.slice(0, 12) + '...' : opt.label,
          fullLabel: opt.label,
          count,
          pct: metrics.totalResponses > 0 ? Math.round((count / metrics.totalResponses) * 100) : 0,
        };
      }).sort((a, b) => b.count - a.count)
    : [];

  const avgTime = `${Math.floor(metrics.avgTimeSeconds / 60)}m ${metrics.avgTimeSeconds % 60}s`;

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/20 px-6 py-4"
        style={{ background: 'linear-gradient(90deg, #2D1E6B 0%, #3d2a8a 100%)' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={14} />
            Voltar ao Projeto
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[#1D9E75] text-[10px] uppercase tracking-[3px] font-semibold">CLARIFYSE INSIGHTS</p>
            <h1 className="text-white font-bold text-lg truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
              {project.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
            <span className="text-white/60 text-xs">Dados sincronizados</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Project info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2D1E6B] flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full bg-purple-50 text-[#7F77DD]">
                  {project.pilar}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#2D1E6B] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                {project.name}
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">{project.objective}</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Users, label: 'RESPOSTAS', value: metrics.totalResponses, sub: `de ${project.sampleSize} planejadas` },
            { icon: CheckCircle, label: 'COLETA', value: `${metrics.completionRate}%`, sub: 'taxa de conclusão' },
            { icon: Clock, label: 'TEMPO MÉDIO', value: avgTime, sub: 'por respondente' },
            { icon: TrendingUp, label: 'QUALIDADE', value: `${metrics.qualityRate}%`, sub: 'respostas válidas' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-[#2D1E6B]/10 flex items-center justify-center mb-3">
                <stat.icon size={16} className="text-[#2D1E6B]" />
              </div>
              <p className="text-xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {stat.value}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-[#1D9E75] font-semibold mt-1">{stat.label}</p>
              <p className="text-[10px] text-[#64748B] mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {choiceQuestion && choiceChartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-1">ANÁLISE DE DISTRIBUIÇÃO</p>
            <h3 className="font-bold text-[#2D1E6B] mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {choiceQuestion.text}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={choiceChartData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value, _) => [value, 'Respostas']}
                    labelFormatter={(label) => {
                      const item = choiceChartData.find((d) => d.label === label);
                      return item?.fullLabel || label;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {choiceChartData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Questions & Quotas overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-4">PERGUNTAS DO FORMULÁRIO</p>
            <div className="space-y-2">
              {project.formQuestions.length === 0 ? (
                <p className="text-sm text-[#64748B]">Nenhuma pergunta configurada.</p>
              ) : (
                project.formQuestions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="w-5 h-5 rounded-full bg-[#2D1E6B]/10 flex items-center justify-center text-[10px] font-bold text-[#2D1E6B] flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#2D1E6B] truncate">{q.text}</p>
                      <p className="text-[10px] text-[#64748B] uppercase tracking-wide">{q.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-4">STATUS DE COTAS</p>
            <div className="space-y-3">
              {project.quotas.length === 0 ? (
                <p className="text-sm text-[#64748B]">Nenhuma cota configurada.</p>
              ) : (
                project.quotas.flatMap((quota) =>
                  quota.groups.map((group) => {
                    const count = project.responses.filter((r) => r.quotaGroup === group.name).length;
                    const pct = group.target > 0 ? Math.round((count / group.target) * 100) : 0;
                    const color = pct >= 100 ? '#1D9E75' : pct >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={`${quota.id}-${group.name}`}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-[#2D1E6B]">{group.name}</span>
                          <span className="text-xs font-bold" style={{ color }}>{count}/{group.target}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[#1D9E75] text-xs uppercase tracking-[4px]">Where questions become clarity.</p>
          <p className="text-[10px] text-[#64748B] mt-1">Clarifyse Strategy & Research</p>
        </div>
      </div>
    </div>
  );
}
