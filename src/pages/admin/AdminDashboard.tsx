import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loadDB } from '@/lib/surveyForgeDB';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { FolderOpen, FileText, MessageSquare, CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardCard = React.memo(({ project, onClick }: { project: any, onClick: () => void }) => {
  const progress = useMemo(() => {
    if (!project.sampleSize) return 0;
    return Math.min(100, Math.round((project.responses?.length || 0) / project.sampleSize * 100));
  }, [project.responses, project.sampleSize]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1 flex-1 min-w-0">
          <h3 className="font-bold text-[#2D1E6B] truncate group-hover:text-[#1D9E75] transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-[#64748B] truncate">{project.objective}</p>
        </div>
        <ProjectStatusBadge status={project.status} size="sm" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#64748B] font-medium">Progresso de Respostas</span>
          <span className="text-[#2D1E6B] font-bold">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-[#1D9E75]" />
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <HealthThermometer project={project} />
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Saúde do Campo</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#2D1E6B]">{project.responses?.length || 0} / {project.sampleSize}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-widest">Amostra</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDb(loadDB());
      setLoading(false);
    }, 800); // Skeleton loading simulation
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    if (!db) return { active: 0, published: 0, today: 0, complete: 0 };
    
    const active = db.projects.filter((p: any) => p.status === 'Em Campo').length;
    const published = db.projects.filter((p: any) => p.status === 'Formulário Pronto' || p.status === 'Em Campo').length;
    
    const today = db.projects.reduce((acc: number, p: any) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayResponses = p.responses?.filter((r: any) => r.timestamp.startsWith(todayStr)).length || 0;
      return acc + todayResponses;
    }, 0);

    const complete = db.projects.filter((p: any) => (p.responses?.length || 0) >= p.sampleSize).length;

    return { active, published, today, complete };
  }, [db]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-[#1D9E75] uppercase mb-1">PAINEL DO PESQUISADOR</p>
          <h1 className="text-3xl font-display font-bold text-[#2D1E6B]">
            Olá, {profile?.name?.split(' ')[0]}
          </h1>
        </div>
        <Button 
          onClick={() => navigate('/admin/projetos/novo')}
          className="bg-[#2D1E6B] hover:bg-[#1D9E75] text-white rounded-xl px-6 h-12 font-bold transition-all shadow-lg shadow-purple-900/10"
        >
          <Plus className="h-5 w-5 mr-2" /> Criar Novo Projeto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-white border border-gray-100" />)
        ) : (
          <>
            <StatCard label="Projetos Ativos" value={stats.active} icon={FolderOpen} accentColor="purple" />
            <StatCard label="Formulários Publicados" value={stats.published} icon={FileText} accentColor="teal" />
            <StatCard label="Respostas Hoje" value={stats.today} icon={MessageSquare} accentColor="purple" />
            <StatCard label="Amostras Completas" value={stats.complete} icon={CheckCircle2} accentColor="teal" />
          </>
        )}
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#1D9E75] uppercase mb-1">PROJETOS RECENTES</p>
            <h2 className="text-xl font-display font-bold text-[#2D1E6B]">Acompanhamento de Campo</h2>
          </div>
          <Button variant="ghost" className="text-[#1D9E75] font-bold hover:bg-[#1D9E75]/10" onClick={() => navigate('/admin/projetos')}>
            Ver todos <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-xl bg-white border border-gray-100" />
            <Skeleton className="h-48 rounded-xl bg-white border border-gray-100" />
          </div>
        ) : db?.projects?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.projects.slice(0, 4).map((project: any) => (
              <DashboardCard 
                key={project.id} 
                project={project} 
                onClick={() => navigate(`/admin/projetos/${project.id}`)} 
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="Nenhum projeto em andamento"
            description="Comece criando um novo projeto de pesquisa para coletar dados."
            action={
              <Button onClick={() => navigate('/admin/projetos/novo')} className="bg-[#2D1E6B] text-white">
                Criar Primeiro Projeto
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
