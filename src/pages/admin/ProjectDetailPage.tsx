import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, updateProject } from '@/lib/surveyForgeDB';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Play, FileJson, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import QuotasTab from '@/components/projects/surveyforge/QuotasTab';
import FormBuilderTab from '@/components/projects/surveyforge/FormBuilderTab';
import ProjectOverviewTab from '@/components/projects/surveyforge/ProjectOverviewTab';
import MonitoringTab from '@/components/projects/surveyforge/MonitoringTab';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (id) {
      const p = getProjectById(id);
      if (p) {
        setProject(p);
        setIsLocked(p.status !== 'Rascunho');
      } else {
        toast.error("Projeto não encontrado.");
        navigate('/admin/projetos');
      }
      setLoading(false);
    }
  }, [id, navigate]);

  const handleSave = (updates: any) => {
    if (id && project) {
      const updated = updateProject(id, updates);
      setProject(updated);
      toast.success("Alterações salvas com sucesso!");
    }
  };

  const handlePublish = () => {
    if (id && project) {
      const updated = updateProject(id, { status: 'Formulário Pronto' });
      setProject(updated);
      setIsLocked(true);
      toast.success("Formulário publicado! Links gerados.");
    }
  };

  const handleUnlock = () => {
    if (id && project) {
      const updated = updateProject(id, { status: 'Rascunho' });
      setProject(updated);
      setIsLocked(false);
      toast.success("Edição desbloqueada.");
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando projeto...</div>;
  if (!project) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/projetos')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-[#2D1E6B]">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-sm text-[#64748B] uppercase tracking-widest font-bold mt-1">
              {project.pilar} • {project.sampleSize} Respondentes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <Button variant="outline" onClick={handleUnlock} className="rounded-xl border-gray-200 text-[#2D1E6B]">
              <Unlock className="h-4 w-4 mr-2" /> Desbloquear Edição
            </Button>
          ) : (
            <Button onClick={handlePublish} className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl px-6 font-bold shadow-lg shadow-purple-900/20">
              <Play className="h-4 w-4 mr-2" /> Publicar Formulário
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white p-1 rounded-xl border border-gray-100 h-14 w-full md:w-auto flex overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-lg px-6 font-bold data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="quotas" className="rounded-lg px-6 font-bold data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white">
            Cotas & Amostra
          </TabsTrigger>
          <TabsTrigger value="builder" className="rounded-lg px-6 font-bold data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white">
            Construir Formulário
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="rounded-lg px-6 font-bold data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white">
            Monitoramento em Tempo Real
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
        </div>
      </Tabs>
    </div>
  );
}
