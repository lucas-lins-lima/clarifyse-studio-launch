import React, { useMemo } from 'react';
import { loadDB } from '@/lib/surveyForgeDB';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#2D1E6B', '#1D9E75', '#7F77DD', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AnalyticsPage() {
  const db = loadDB();
  const { projects } = db;

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const pilarData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.pilar] = (counts[p.pilar] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const responsesByProject = useMemo(() => {
    return projects.map((p) => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
      respostas: p.responses.length,
      meta: p.sampleSize,
    })).sort((a, b) => b.respostas - a.respostas);
  }, [projects]);

  const totalResponses = useMemo(() => projects.reduce((a, p) => a + p.responses.length, 0), [projects]);
  const totalSample = useMemo(() => projects.reduce((a, p) => a + p.sampleSize, 0), [projects]);
  const avgCompletion = totalSample > 0 ? Math.round((totalResponses / totalSample) * 100) : 0;
  const qualityOK = useMemo(() => {
    const all = projects.flatMap((p) => p.responses);
    const ok = all.filter((r) => r.qualityFlag === 'OK').length;
    return all.length > 0 ? Math.round((ok / all.length) * 100) : 0;
  }, [projects]);

  return (
    <div className="p-6 lg:p-8 min-h-full">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[4px] text-[#1D9E75] mb-1">ANÁLISES GLOBAIS</p>
        <h1 className="text-3xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Visão Consolidada
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Performance agregada de todos os projetos</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'TOTAL DE PROJETOS', value: projects.length },
          { label: 'TOTAL DE RESPOSTAS', value: totalResponses },
          { label: 'CONCLUSÃO MÉDIA', value: `${avgCompletion}%` },
          { label: 'TAXA DE QUALIDADE', value: `${qualityOK}%` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
            <p className="text-[9px] uppercase tracking-widest text-[#1D9E75] font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-4">DISTRIBUIÇÃO POR STATUS</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pilar distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-4">DISTRIBUIÇÃO POR PILAR</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pilarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" name="Projetos" radius={[4, 4, 0, 0]}>
                  {pilarData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Responses per project */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[#1D9E75]" />
          <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">RESPOSTAS POR PROJETO</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={responsesByProject} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="meta" name="Meta" fill="#E8E4DC" radius={[4, 4, 0, 0]} />
              <Bar dataKey="respostas" name="Coletadas" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
