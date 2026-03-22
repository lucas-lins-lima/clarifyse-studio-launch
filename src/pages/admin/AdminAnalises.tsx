import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadDB } from '@/lib/surveyForgeDB';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Globe,
  Zap,
  FolderOpen,
} from 'lucide-react';

export default function AdminAnalises() {
  const navigate = useNavigate();
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDb(loadDB());
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    if (!db) return { totalProjects: 0, withAnalysis: 0, totalResponses: 0, avgQuality: 0 };
    const totalProjects = db.projects.length;
    const withAnalysis = db.projects.filter((p: any) =>
      p.status === 'Análise Disponível' || (p.responses?.length || 0) >= p.sampleSize
    ).length;
    const totalResponses = db.projects.reduce((acc: number, p: any) => acc + (p.responses?.length || 0), 0);
    return { totalProjects, withAnalysis, totalResponses, avgQuality: withAnalysis > 0 ? Math.round((withAnalysis / totalProjects) * 100) : 0 };
  }, [db]);

  const projectsWithAnalysis = useMemo(() => {
    if (!db) return [];
    return db.projects.filter((p: any) =>
      p.status === 'Análise Disponível' || (p.responses?.length || 0) >= p.sampleSize
    );
  }, [db]);

  const projectsInField = useMemo(() => {
    if (!db) return [];
    return db.projects.filter((p: any) =>
      p.status === 'Em Campo' && (p.responses?.length || 0) < p.sampleSize
    );
  }, [db]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-[#1D9E75] uppercase mb-1">CLARIFYSE INSIGHTS</p>
          <h1 className="text-3xl font-display font-bold text-[#2D1E6B]">Análises Globais</h1>
          <p className="text-sm text-[#64748B] mt-1">Visão consolidada de todos os projetos com análise disponível.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-white border border-gray-100" />)
        ) : (
          <>
            <StatCard label="Total de Projetos" value={stats.totalProjects} icon={FolderOpen} accentColor="purple" />
            <StatCard label="Com Análise Disponível" value={stats.withAnalysis} icon={BarChart3} accentColor="teal" />
            <StatCard label="Total de Respostas" value={stats.totalResponses} icon={MessageSquare} accentColor="purple" />
            <StatCard label="Taxa de Conclusão" value={`${stats.avgQuality}%`} icon={CheckCircle2} accentColor="teal" />
          </>
        )}
      </div>

      {/* Projects with Analysis */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#1D9E75]" />
          <h2 className="text-xl font-display font-bold text-[#2D1E6B]">Análises Disponíveis</h2>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-white border border-gray-100" />)}
          </div>
        ) : projectsWithAnalysis.length > 0 ? (
          <div className="space-y-4">
            {projectsWithAnalysis.map((project: any, idx: number) => {
              const progress = project.sampleSize > 0
                ? Math.min(100, Math.round((project.responses?.length || 0) / project.sampleSize * 100))
                : 0;
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-[#2D1E6B] truncate group-hover:text-[#1D9E75] transition-colors">
                          {project.name}
                        </h3>
                        <ProjectStatusBadge status={project.status} size="sm" />
                      </div>
                      <p className="text-sm text-[#64748B] line-clamp-1">{project.objective}</p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">
                        <span>{project.pilar}</span>
                        <span className="text-gray-300">•</span>
                        <span>{project.responses?.length || 0} respostas coletadas</span>
                      </div>
                    </div>
                    <div className="w-full md:w-48 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#64748B] font-medium">Progresso</span>
                        <span className="text-[#2D1E6B] font-bold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-[#1D9E75]" />
                    </div>
                    <Button
                      onClick={() => navigate(`/admin/insights/${project.id}`)}
                      className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl font-bold gap-2 shadow-lg shadow-purple-900/20 flex-shrink-0"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Ver Insights
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="Nenhuma análise disponível"
            description="As análises são liberadas quando a coleta de respostas é concluída (amostra total atingida)."
            action={
              <Button onClick={() => navigate('/admin/projetos')} className="bg-[#2D1E6B] text-white rounded-xl">
                Ver Projetos
              </Button>
            }
          />
        )}
      </div>

      {/* Projects in Field */}
      {projectsInField.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#64748B]" />
            <h2 className="text-xl font-display font-bold text-[#2D1E6B]">Em Coleta</h2>
          </div>
          <div className="space-y-4">
            {projectsInField.map((project: any, idx: number) => {
              const progress = project.sampleSize > 0
                ? Math.min(100, Math.round((project.responses?.length || 0) / project.sampleSize * 100))
                : 0;
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-[#2D1E6B] truncate">{project.name}</h3>
                        <ProjectStatusBadge status={project.status} size="sm" />
                      </div>
                      <p className="text-sm text-[#64748B] line-clamp-1">{project.objective}</p>
                    </div>
                    <div className="w-full md:w-64 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#64748B] font-medium">Progresso</span>
                        <span className="text-[#2D1E6B] font-bold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-[#1D9E75]" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HealthThermometer project={project} />
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Saúde</span>
                        </div>
                        <span className="text-xs font-bold text-[#2D1E6B]">
                          {project.responses?.length || 0} / {project.sampleSize}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/admin/projetos/${project.id}`)}
                      className="rounded-xl border-gray-200 text-[#2D1E6B] flex-shrink-0"
                    >
                      Monitorar
                      <TrendingUp className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
