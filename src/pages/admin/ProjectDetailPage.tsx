import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, updateProject } from '@/lib/surveyForgeDB';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Play, Unlock, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import QuotasTab from '@/components/projects/surveyforge/QuotasTab';
import FormBuilderTab from '@/components/projects/surveyforge/FormBuilderTab';
import ProjectOverviewTab from '@/components/projects/surveyforge/ProjectOverviewTab';
import MonitoringTab from '@/components/projects/surveyforge/MonitoringTab';
import AnalysisTab from '@/components/projects/surveyforge/AnalysisTab';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (id) {
      const timer = setTimeout(() => {
        const p = getProjectById(id);
        if (p) {
          setProject(p);
          setIsLocked(p.status !== 'Rascunho');
        } else {
          toast.error('Projeto não encontrado.');
          navigate('/admin/projetos');
        }
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [id, navigate]);

  const handleSave = (updates: any) => {
    if (id && project) {
      const updated = updateProject(id, updates);
      setProject(updated);
      toast.success('Alterações salvas com sucesso!');
    }
  };

  const handlePublish = () => {
    if (id && project) {
      if (!project.formQuestions || project.formQuestions.length === 0) {
        toast.error('Adicione pelo menos uma pergunta antes de publicar.');
        return;
      }
      const updated = updateProject(id, { status: 'Formulário Pronto' });
      setProject(updated);
      setIsLocked(true);
      toast.success('Formulário publicado! Links gerados com sucesso.');
    }
  };

  const handleUnlock = () => {
    if (id && project) {
      const updated = updateProject(id, { status: 'Rascunho' });
      setProject(updated);
      setIsLocked(false);
      toast.success('Edição desbloqueada.');
    }
  };

  const isAnalysisReady =
    project?.status === 'Análise Disponível' ||
    ((project?.responses?.length || 0) >= project?.sampleSize && project?.sampleSize > 0);

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_: any, i: number) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/projetos')}
            className="rounded-full hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-display font-bold text-[#2D1E6B]">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-sm text-[#64748B] uppercase tracking-widest font-bold mt-1">
              {project.pilar && `${project.pilar} • `}{project.sampleSize} Respondentes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAnalysisReady && (
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/insights/${project.id}`)}
              className="rounded-xl border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/10 font-bold gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Ver Insights
            </Button>
          )}
          {isLocked ? (
            <Button
              variant="outline"
              onClick={handleUnlock}
              className="rounded-xl border-gray-200 text-[#2D1E6B] hover:bg-gray-50"
            >
              <Unlock className="h-4 w-4 mr-2" /> Desbloquear Edição
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl px-6 font-bold shadow-lg shadow-purple-900/20"
            >
              <Play className="h-4 w-4 mr-2" /> Publicar Formulário
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white p-1 rounded-xl border border-gray-100 h-14 w-full md:w-auto flex overflow-x-auto gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-lg px-5 font-bold data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white whitespace-nowrap"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="quotas"
            className="rounded-lg px-5 font-bold data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white whitespace-nowrap"
          >
            Cotas & Amostra
          </TabsTrigger>
          <TabsTrigger
            value="builder"
            className="rounded-lg px-5 font-bold data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white whitespace-nowrap"
          >
            Formulário
          </TabsTrigger>
          <TabsTrigger
            value="monitoring"
            className="rounded-lg px-5 font-bold data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white whitespace-nowrap"
          >
            Monitoramento
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="rounded-lg px-5 font-bold data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white whitespace-nowrap"
          >
            Análise
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <ProjectOverviewTab project={project} />
          </TabsContent>
          <TabsContent value="quotas">
            <QuotasTab project={project} onSave={(quotas) => handleSave({ quotas })} isLocked={isLocked} />
          </TabsContent>
          <TabsContent value="builder">
            <FormBuilderTab project={project} onSave={(formQuestions) => handleSave({ formQuestions })} isLocked={isLocked} />
          </TabsContent>
          <TabsContent value="monitoring">
            <MonitoringTab project={project} />
          </TabsContent>
          <TabsContent value="analysis">
            <AnalysisTab project={project} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
