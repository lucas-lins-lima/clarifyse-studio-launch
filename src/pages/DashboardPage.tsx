import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, BarChart3, MessageSquare, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { loadDB, createProject, Project } from '@/lib/surveyForgeDB';
import { ProjectCardSkeleton } from '@/components/SkeletonLoaders';
import { useNotifications } from '@/context/NotificationContext';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getHealthColor(project: Project): string {
  const progress = project.responses.length / project.sampleSize;
  if (progress >= 1) return '#1D9E75';
  if (progress >= 0.7) return '#f59e0b';
  return '#ef4444';
}

function getHealthLabel(project: Project): string {
  const progress = project.responses.length / project.sampleSize;
  if (progress >= 1) return 'Saudável';
  if (progress >= 0.7) return 'Em Andamento';
  if (progress < 0.5) return 'Atenção';
  return 'Em Andamento';
}

const statusColors: Record<string, string> = {
  'Rascunho': 'bg-gray-100 text-gray-600',
  'Formulário Pronto': 'bg-blue-50 text-blue-700',
  'Em Campo': 'bg-teal-50 text-[#1D9E75]',
  'Análise Disponível': 'bg-purple-50 text-[#7F77DD]',
  'Encerrado': 'bg-gray-100 text-gray-500',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { showToast, addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadProjects = useCallback(() => {
    const db = loadDB();
    setProjects(db.projects);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects();
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [loadProjects]);

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === 'Em Campo').length;
    const publishedForms = projects.filter((p) => p.status !== 'Rascunho').length;
    const today = new Date().toDateString();
    const responsesToday = projects.reduce((acc, p) => {
      return acc + p.responses.filter((r) => new Date(r.timestamp).toDateString() === today).length;
    }, 0);
    const completeSamples = projects.filter((p) => p.responses.length >= p.sampleSize).length;
    return { activeProjects, publishedForms, responsesToday, completeSamples };
  }, [projects]);

  const handleCreateProject = (data: {
    name: string;
    objective: string;
    sampleSize: number;
    pilar: Project['pilar'];
  }) => {
    const newProject = createProject({ ...data, status: 'Rascunho' });
    showToast({ type: 'success', title: 'Projeto criado!', message: `"${newProject.name}" foi criado com sucesso.` });
    addNotification({
      type: 'project_created',
      title: 'Novo projeto criado',
      message: `"${newProject.name}" foi criado e está como Rascunho.`,
      projectId: newProject.id,
      projectName: newProject.name,
    });
    loadProjects();
    setShowCreateModal(false);
  };

  return (
    <div className="p-6 lg:p-8 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[4px] text-[#1D9E75] mb-1">DASHBOARD</p>
          <h1 className="text-3xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Visão Geral
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.97] shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' }}
        >
          <Plus size={16} />
          Criar Projeto
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: FolderOpen, label: 'PROJETOS ATIVOS', value: stats.activeProjects, color: '#2D1E6B', bg: 'bg-indigo-50' },
          { icon: BarChart3, label: 'FORMULÁRIOS PUBLICADOS', value: stats.publishedForms, color: '#7F77DD', bg: 'bg-purple-50' },
          { icon: MessageSquare, label: 'RESPOSTAS HOJE', value: stats.responsesToday, color: '#1D9E75', bg: 'bg-teal-50' },
          { icon: CheckCircle, label: 'AMOSTRAS COMPLETAS', value: stats.completeSamples, color: '#1D9E75', bg: 'bg-green-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {stat.value}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-[#1D9E75] font-semibold mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[3px] text-[#1D9E75]">PROJETOS RECENTES</p>
            <h2 className="text-lg font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Seus Projetos
            </h2>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-xs text-[#7F77DD] hover:text-[#2D1E6B] transition-colors font-medium"
          >
            Ver todos <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <ProjectCardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-[#2D1E6B]/5 flex items-center justify-center">
                <FolderOpen size={36} className="text-[#1D9E75]" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-[#2D1E6B] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Nenhum projeto ainda
            </h3>
            <p className="text-sm text-[#64748B] mb-6 max-w-xs">
              Crie sua primeira pesquisa e comece a coletar insights valiosos.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' }}
            >
              <Plus size={16} />
              Criar Novo Projeto
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {projects.slice(0, 5).map((project) => {
              const progress = Math.min(100, Math.round((project.responses.length / project.sampleSize) * 100));
              const healthColor = getHealthColor(project);
              const healthLabel = getHealthLabel(project);
              return (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#F1EFE8] transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#2D1E6B] truncate group-hover:text-[#7F77DD] transition-colors">
                        {project.name}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate mb-2">{project.objective}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: healthColor }}
                        />
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        {project.responses.length}/{project.sampleSize}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusColors[project.status] || 'bg-gray-100 text-gray-500'}`}>
                      {project.status}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: healthColor }} />
                      <span className="text-[10px] text-[#64748B] hidden lg:inline">{healthLabel}</span>
                    </div>
                    <TrendingUp size={14} className="text-gray-300 group-hover:text-[#7F77DD] transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
