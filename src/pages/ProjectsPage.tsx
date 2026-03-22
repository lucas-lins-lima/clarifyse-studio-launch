import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderOpen, ArrowRight, Calendar, Users } from 'lucide-react';
import { loadDB, createProject, Project } from '@/lib/surveyForgeDB';
import { ProjectCardSkeleton } from '@/components/SkeletonLoaders';
import { useNotifications } from '@/context/NotificationContext';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  'Rascunho': 'bg-gray-100 text-gray-500',
  'Formulário Pronto': 'bg-blue-50 text-blue-700',
  'Em Campo': 'bg-teal-50 text-[#1D9E75]',
  'Análise Disponível': 'bg-purple-50 text-[#7F77DD]',
  'Encerrado': 'bg-gray-100 text-gray-400',
};

const pilarColors: Record<string, string> = {
  DISCOVER: 'bg-amber-50 text-amber-700',
  BRAND: 'bg-indigo-50 text-indigo-700',
  INNOVATE: 'bg-teal-50 text-teal-700',
  DECIDE: 'bg-purple-50 text-purple-700',
  EXPERIENCE: 'bg-pink-50 text-pink-700',
  ANALYTICS: 'bg-blue-50 text-blue-700',
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { showToast, addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadProjects = useCallback(() => {
    const db = loadDB();
    setProjects(db.projects);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadProjects();
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, [loadProjects]);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.objective.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data: { name: string; objective: string; sampleSize: number; pilar: Project['pilar'] }) => {
    const newProject = createProject({ ...data, status: 'Rascunho' });
    showToast({ type: 'success', title: 'Projeto criado!', message: `"${newProject.name}" criado com sucesso.` });
    addNotification({
      type: 'project_created',
      title: 'Novo projeto criado',
      message: `"${newProject.name}" está como Rascunho.`,
      projectId: newProject.id,
      projectName: newProject.name,
    });
    loadProjects();
    setShowCreateModal(false);
  };

  return (
    <div className="p-6 lg:p-8 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between mb-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[4px] text-[#1D9E75] mb-1">PROJETOS</p>
          <h1 className="text-3xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Todos os Projetos
          </h1>
          <p className="text-sm text-[#64748B] mt-1">{projects.length} projeto{projects.length !== 1 ? 's' : ''} encontrado{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.97] shadow-lg self-start flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' }}
        >
          <Plus size={16} />
          Novo Projeto
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar projetos..."
          className="w-full max-w-md bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2D1E6B] outline-none focus:border-[#2D1E6B] focus:ring-2 focus:ring-[#2D1E6B]/10 transition-all"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 rounded-full bg-[#2D1E6B]/5 flex items-center justify-center mb-6">
            <FolderOpen size={36} className="text-[#1D9E75]" />
          </div>
          <h3 className="text-xl font-bold text-[#2D1E6B] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          </h3>
          <p className="text-sm text-[#64748B] mb-6 max-w-xs">
            {search
              ? `Não encontramos projetos para "${search}". Tente outros termos.`
              : 'Crie sua primeira pesquisa e comece a coletar insights valiosos.'}
          </p>
          {!search && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' }}
            >
              <Plus size={16} />
              Criar Novo Projeto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project) => {
            const progress = Math.min(100, Math.round((project.responses.length / project.sampleSize) * 100));
            const healthColor = progress >= 100 ? '#1D9E75' : progress >= 70 ? '#f59e0b' : '#ef4444';
            return (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#7F77DD]/30 transition-all text-left group active:scale-[0.99]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-[#2D1E6B] text-sm leading-snug line-clamp-2 group-hover:text-[#7F77DD] transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {project.name}
                    </h3>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </div>

                <p className="text-xs text-[#64748B] line-clamp-2 mb-4 leading-relaxed">{project.objective}</p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#1D9E75] font-semibold">Amostra</span>
                    <span className="text-xs font-semibold text-[#2D1E6B]">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: healthColor }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-[#64748B]">
                      {project.responses.length} / {project.sampleSize} respostas
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: healthColor }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full ${pilarColors[project.pilar] || 'bg-gray-100 text-gray-500'}`}>
                      {project.pilar}
                    </span>
                    <div className="flex items-center gap-1 text-[#64748B]">
                      <Calendar size={11} />
                      <span className="text-[10px]">
                        {format(new Date(project.createdAt), 'dd/MM/yy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-[#7F77DD] transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
