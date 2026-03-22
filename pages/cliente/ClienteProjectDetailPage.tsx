import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { HealthThermometer, FieldProgress } from '@/components/projects/HealthThermometer';
import { ClienteCronogramaView } from '@/components/projects/ClienteCronogramaView';
import { FieldMonitoringView } from '@/components/projects/FieldMonitoringView';
import { DocumentosCliente } from '@/components/projects/DocumentosCliente';
import { HistoricoFeed } from '@/components/projects/HistoricoFeed';
import { SuporteSection } from '@/components/projects/SuporteSection';
import {
  ArrowLeft, Building2, Target, Layers, Calendar, User, Activity,
  FileText, History, Headphones, X, Star,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, ScheduleItem } from '@/types/project';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

function formatDate(d: string | null): string {
  if (!d) return '—';
  try { return format(parseISO(d), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); }
  catch { return '—'; }
}

const STATUS_FLOW = [
  'Briefing',
  'Elaboração do Instrumento',
  'Campo',
  'Análise dos Dados',
  'Produção do Entregável',
  'Entrega Final',
];

const STATUS_DESCRIPTIONS: Record<string, string> = {
  'Briefing': 'Seu projeto está em fase de alinhamento inicial com a equipe Clarifyse.',
  'Elaboração do Instrumento': 'A equipe Clarifyse está elaborando o instrumento de pesquisa.',
  'Campo': 'Seu projeto está em fase de coleta de dados. As entrevistas estão sendo realizadas e você pode acompanhar o progresso em tempo real abaixo.',
  'Análise dos Dados': 'Os dados coletados estão sendo analisados pela equipe Clarifyse. Em breve você receberá os resultados.',
  'Produção do Entregável': 'A equipe Clarifyse está produzindo o entregável final do seu projeto.',
  'Entrega Final': 'Seu projeto foi entregue. O relatório final está disponível na seção de Documentos.',
  'Encerrado': 'Este projeto foi concluído. O histórico completo está disponível abaixo.',
  'Pausado': 'Este projeto está temporariamente pausado. Entre em contato com o gerente para mais informações.',
};

const PILAR_COLORS: Record<string, string> = {
  DISCOVER: 'bg-blue-100 text-blue-700',
  BRAND: 'bg-purple-100 text-purple-700',
  INNOVATE: 'bg-amber-100 text-amber-700',
  DECIDE: 'bg-teal-100 text-teal-700',
  EXPERIENCE: 'bg-pink-100 text-pink-700',
  ANALYTICS: 'bg-indigo-100 text-indigo-700',
};

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium text-foreground">{children || '—'}</div>
    </div>
  );
}

export default function ClienteProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const { data: accessRow, isLoading: loadingAccess } = useQuery({
    queryKey: ['project-access-row', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_access')
        .select('project_id, last_seen_at, first_access')
        .eq('project_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  const { data: project, isLoading: loadingProject } = useQuery<Project>({
    queryKey: ['cliente-project-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, nome, cliente_empresa, objetivo, metodologia, pilar, status, data_inicio, data_entrega_prevista, gerente_id, deleted_at, created_at, updated_at')
        .eq('id', id!)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return data as Project;
    },
    enabled: !!accessRow,
  });

  const { data: gerenteProfile } = useQuery<{ name: string } | null>({
    queryKey: ['profile', project?.gerente_id],
    queryFn: async () => {
      if (!project?.gerente_id) return null;
      const { data } = await supabase.from('profiles').select('name').eq('id', project.gerente_id).single();
      return data;
    },
    enabled: !!project?.gerente_id,
    staleTime: 1000 * 60 * 10,
  });

  const { data: scheduleItems = [] } = useQuery<ScheduleItem[]>({
    queryKey: ['schedule-items', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_schedule')
        .select('*')
        .eq('project_id', id!)
        .order('ordem');
      return (data || []) as ScheduleItem[];
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: fieldConfig } = useQuery({
    queryKey: ['field-config-summary', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('field_config')
        .select('meta_total, realizado_total')
        .eq('project_id', id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id && project?.status === 'Campo',
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!id || !user?.id || !accessRow) return;
    supabase
      .from('project_access')
      .update({ last_seen_at: new Date().toISOString(), first_access: false })
      .eq('project_id', id)
      .eq('user_id', user.id)
      .then(() => {
        qc.invalidateQueries({ queryKey: ['cliente-projects', user.id] });
      });
  }, [id, user?.id, accessRow]);

  const isLoading = loadingAccess || loadingProject;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="clarifyse-card p-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!accessRow || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Projeto não encontrado ou acesso negado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/cliente')}>
          Voltar aos Projetos
        </Button>
      </div>
    );
  }

  const currentStatusIdx = STATUS_FLOW.indexOf(project.status);
  const showWelcome = accessRow.first_access && !welcomeDismissed;

  let fieldProgress: FieldProgress | null = null;
  if (fieldConfig && fieldConfig.meta_total && fieldConfig.meta_total > 0) {
    const today = new Date();
    const dataFim = project?.data_entrega_prevista ? new Date(project.data_entrega_prevista + 'T00:00:00') : null;
    const dataInicio = project?.data_inicio ? new Date(project.data_inicio + 'T00:00:00') : null;
    let prazoRestantePct = 100;
    if (dataInicio && dataFim) {
      const total = dataFim.getTime() - dataInicio.getTime();
      const restante = dataFim.getTime() - today.getTime();
      prazoRestantePct = total > 0 ? Math.max(0, (restante / total) * 100) : 0;
    }
    fieldProgress = {
      realizado: fieldConfig.realizado_total ?? 0,
      meta: fieldConfig.meta_total,
      prazoRestantePct,
    };
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/cliente')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Meus Projetos
      </button>

      {/* Welcome card */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative rounded-xl border border-clarifyse-teal bg-teal-50 p-4"
          >
            <button
              onClick={() => setWelcomeDismissed(true)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-clarifyse-teal flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground">Bem-vindo ao seu portal!</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Aqui você acompanha o andamento de <strong>{project.nome}</strong> em tempo real.
                  {gerenteProfile?.name && ` Seu gerente responsável é ${gerenteProfile.name}.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="clarifyse-card p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <ProjectStatusBadge status={project.status} />
              <HealthThermometer
                project={project}
                showLabel
                clientView
                scheduleItems={scheduleItems}
                fieldProgress={fieldProgress}
              />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">{project.nome}</h1>
            {project.cliente_empresa && (
              <p className="text-muted-foreground">{project.cliente_empresa}</p>
            )}
          </div>
        </div>

        {/* Status description */}
        {STATUS_DESCRIPTIONS[project.status] && (
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3 leading-relaxed">
            {STATUS_DESCRIPTIONS[project.status]}
          </p>
        )}

        {/* Progress flow bar */}
        {currentStatusIdx >= 0 && (
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-2">Etapa atual</p>
            <div className="flex items-center gap-1 flex-wrap">
              {STATUS_FLOW.map((s, i) => {
                const done = i < currentStatusIdx;
                const active = i === currentStatusIdx;
                return (
                  <React.Fragment key={s}>
                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        done ? 'bg-green-100 text-green-700' :
                        active ? 'bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white shadow-sm' :
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {s}
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className={`h-0.5 w-3 flex-shrink-0 ${i < currentStatusIdx ? 'bg-green-400' : 'bg-muted'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="visao-geral">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
          <TabsTrigger value="campo" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Campo
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="suporte" className="gap-1.5">
            <Headphones className="h-3.5 w-3.5" />
            Suporte
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao-geral" className="mt-4">
          <div className="clarifyse-card p-5">
            <p className="clarifyse-section-label text-xs mb-4">INFORMAÇÕES DO PROJETO</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard label="Nome do Projeto">{project.nome}</InfoCard>
              {project.objetivo && (
                <InfoCard label="Objetivo do Estudo">
                  <span className="leading-relaxed">{project.objetivo}</span>
                </InfoCard>
              )}
              {project.metodologia?.length > 0 && (
                <InfoCard label="Metodologia">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.metodologia.map(m => (
                      <span key={m} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                </InfoCard>
              )}
              {project.pilar && (
                <InfoCard label="Pilar da Clarifyse">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PILAR_COLORS[project.pilar] ?? 'bg-muted text-foreground'}`}>
                    {project.pilar}
                  </span>
                </InfoCard>
              )}
              <InfoCard label="Data de Início">{formatDate(project.data_inicio)}</InfoCard>
              <InfoCard label="Data Prevista de Entrega">{formatDate(project.data_entrega_prevista)}</InfoCard>
              {gerenteProfile && (
                <InfoCard label="Gerente Responsável">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {gerenteProfile.name}
                  </div>
                </InfoCard>
              )}
              <InfoCard label="Status Atual">
                <div className="flex items-center gap-2">
                  <ProjectStatusBadge status={project.status} />
                </div>
              </InfoCard>
            </div>
          </div>
        </TabsContent>

        {/* Cronograma */}
        <TabsContent value="cronograma" className="mt-4">
          <div className="clarifyse-card p-5">
            <ClienteCronogramaView projectId={project.id} />
          </div>
        </TabsContent>

        {/* Campo */}
        <TabsContent value="campo" className="mt-4">
          <FieldMonitoringView projectId={project.id} projectStatus={project.status} isAdmin={false} />
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos" className="mt-4">
          <DocumentosCliente projectId={project.id} />
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="mt-4">
          <HistoricoFeed projectId={project.id} clientView />
        </TabsContent>

        {/* Suporte */}
        <TabsContent value="suporte" className="mt-4">
          <SuporteSection gerenteNome={gerenteProfile?.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
