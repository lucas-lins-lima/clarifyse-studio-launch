import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, RefreshCw, Share2 } from 'lucide-react';
import { loadDB, deleteProject, resetProjectResponses, Project } from '@/lib/surveyForgeDB';
import { useNotifications } from '@/context/NotificationContext';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MonitoringTab } from '@/components/MonitoringTab';
import { AnalysisTab } from '@/components/AnalysisTab';
import { SharingTab } from '@/components/SharingTab';
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

const TABS = ['Monitoramento', 'Análise', 'Compartilhamento', 'Configurações'] as const;
type Tab = typeof TABS[number];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, addNotification } = useNotifications();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Monitoramento');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const prevResponseCount = useRef(0);

  const loadProject = useCallback(() => {
    if (!id) return;
    const db = loadDB();
    const proj = db.projects.find((p) => p.id === id);
    if (proj) {
      // Check for new responses for notifications
      if (prevResponseCount.current > 0 && proj.responses.length > prevResponseCount.current) {
        addNotification({
          type: 'new_response',
          title: 'Nova resposta recebida',
          message: `"${proj.name}" recebeu uma nova resposta.`,
          projectId: proj.id,
          projectName: proj.name,
        });
      }
      prevResponseCount.current = proj.responses.length;
      setProject(proj);
    }
  }, [id, addNotification]);

  useEffect(() => {
    setTimeout(() => {
      loadProject();
      setLoading(false);
    }, 600);
  }, [loadProject]);

  // Polling
  useEffect(() => {
    const interval = setInterval(loadProject, 5000);
    return () => clearInterval(interval);
  }, [loadProject]);

  const handleDelete = () => {
    if (!project) return;
    deleteProject(project.id);
    showToast({ type: 'success', title: 'Projeto excluído', message: `"${project.name}" foi removido.` });
    navigate('/projects');
  };

  const handleReset = () => {
    if (!project) return;
    resetProjectResponses(project.id);
    showToast({ type: 'info', title: 'Respostas resetadas', message: 'Todas as respostas foram removidas.' });
    loadProject();
    setShowResetModal(false);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded-lg mb-6" />
        <div className="h-10 w-72 bg-gray-200 rounded-xl mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded-lg mb-8" />
        <div className="flex gap-2 mb-6">
          {TABS.map((t) => <div key={t} className="h-9 w-28 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="bg-white rounded-2xl p-6 h-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-24 text-center">
        <p className="text-xl font-bold text-[#2D1E6B] mb-2">Projeto não encontrado</p>
        <button onClick={() => navigate('/projects')} className="text-sm text-[#7F77DD] hover:underline mt-4">
          ← Voltar para Projetos
        </button>
      </div>
    );
  }

  const progress = Math.min(100, Math.round((project.responses.length / project.sampleSize) * 100));
  const healthColor = progress >= 100 ? '#1D9E75' : progress >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="p-6 lg:p-8 min-h-full">
      {/* Back button */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2D1E6B] transition-colors mb-6 group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Projetos
      </button>

      {/* Project header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full ${statusColors[project.status]}`}>
                {project.status}
              </span>
              <span className={`text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full ${pilarColors[project.pilar] || 'bg-gray-100 text-gray-500'}`}>
                {project.pilar}
              </span>
              <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: healthColor }} />
                <span className="text-[10px] text-[#64748B]">{progress}% concluído</span>
              </div>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#2D1E6B] mb-2 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {project.name}
            </h1>
            <p className="text-sm text-[#64748B] leading-relaxed max-w-2xl">{project.objective}</p>

            <div className="flex items-center gap-6 mt-4 text-xs text-[#64748B]">
              <span>Criado em {format(new Date(project.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
              {project.lastResponseAt && (
                <span>Última resposta {format(new Date(project.lastResponseAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
              )}
              <span>{project.responses.length} / {project.sampleSize} respostas</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setActiveTab('Compartilhamento'); }}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs text-[#64748B] hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors font-medium"
            >
              <Share2 size={12} />
              Compartilhar
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: healthColor }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#2D1E6B] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#2D1E6B] hover:bg-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content with fade-in */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'Monitoramento' && <MonitoringTab project={project} />}
        {activeTab === 'Análise' && <AnalysisTab project={project} />}
        {activeTab === 'Compartilhamento' && <SharingTab project={project} />}
        {activeTab === 'Configurações' && (
          <div className="max-w-xl space-y-4">
            <div>
              <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-1">CONFIGURAÇÕES</p>
              <h2 className="text-2xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Gerenciar Projeto
              </h2>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div>
                <h3 className="font-semibold text-[#2D1E6B] mb-1">Informações do Projeto</h3>
                <p className="text-sm text-[#64748B]">Nome: {project.name}</p>
                <p className="text-sm text-[#64748B]">Amostra: {project.sampleSize} respondentes</p>
                <p className="text-sm text-[#64748B]">Pilar: {project.pilar}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-50 space-y-4">
              <div>
                <h3 className="font-semibold text-red-600 mb-1">Zona de Perigo</h3>
                <p className="text-xs text-[#64748B]">Essas ações são irreversíveis. Tenha cuidado.</p>
              </div>

              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-2 w-full px-4 py-3 border border-orange-200 rounded-xl text-sm text-orange-600 hover:bg-orange-50 transition-colors font-medium"
              >
                <RefreshCw size={14} />
                Resetar Respostas
                <span className="ml-auto text-xs text-orange-400">{project.responses.length} respostas serão removidas</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 w-full px-4 py-3 border border-red-200 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <Trash2 size={14} />
                Excluir Projeto
                <span className="ml-auto text-xs text-red-400">Esta ação não pode ser desfeita</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        open={showDeleteModal}
        title="Excluir Projeto"
        description={`Você está prestes a excluir "${project.name}" e todos os seus dados (${project.responses.length} respostas). Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir Projeto"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <ConfirmModal
        open={showResetModal}
        title="Resetar Respostas"
        description={`Você está prestes a remover todas as ${project.responses.length} respostas coletadas para "${project.name}". Esta ação não pode ser desfeita.`}
        confirmLabel="Resetar Respostas"
        confirmVariant="warning"
        onConfirm={handleReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
}
