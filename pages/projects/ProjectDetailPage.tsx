import React, { useState, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';
import {
  ArrowLeft, Pencil, Copy, Trash2, RotateCcw, Calendar, Building2,
  Target, Layers, User, FileText, Clock, AlertTriangle, UserPlus, X, Mail,
  CalendarDays, Activity, History, DollarSign, Star, Download,
} from 'lucide-react';
import { CronogramaTab } from '@/components/projects/CronogramaTab';
import { CampoTab } from '@/components/projects/CampoTab';
import { DocumentosTab } from '@/components/projects/DocumentosTab';
import { HistoricoFeed } from '@/components/projects/HistoricoFeed';
import { FinanceiroTab } from '@/components/financeiro/FinanceiroTab';
import { AvaliacaoTab } from '@/components/projects/AvaliacaoTab';
import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, GerenteProfile } from '@/types/project';

function formatDate(d: string | null): string {
  if (!d) return '—';
  try { return format(parseISO(d), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); }
  catch { return '—'; }
}

function formatDateTime(d: string): string {
  try {
    return format(parseISO(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch { return d; }
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.FC<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{value || '—'}</div>
      </div>
    </div>
  );
}

interface AccessClient {
  access_id: string;
  user_id: string;
  name: string;
  email: string;
  empresa: string | null;
}

interface RemoveAccessDialogProps {
  open: boolean;
  onClose: () => void;
  client: AccessClient | null;
  onConfirm: () => Promise<void>;
}

const RemoveAccessDialog = memo(function RemoveAccessDialog({ open, onClose, client, onConfirm }: RemoveAccessDialogProps) {
  const [loading, setLoading] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Remover Acesso</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          Remover o acesso de <strong>{client?.name}</strong> a este projeto? O cliente não poderá mais visualizá-lo.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" disabled={loading} onClick={async () => {
            setLoading(true);
            try { await onConfirm(); onClose(); } finally { setLoading(false); }
          }}>
            {loading ? 'Removendo...' : 'Remover Acesso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

interface AcessosTabProps {
  projectId: string;
  isAdmin: boolean;
}

const AcessosTab = memo(function AcessosTab({ projectId, isAdmin }: AcessosTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailInput, setEmailInput] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AccessClient | null>(null);

  const { data: accessList = [], isLoading } = useQuery<AccessClient[]>({
    queryKey: ['project-access', projectId],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_access')
        .select('id, user_id, profiles(name, email, empresa)')
        .eq('project_id', projectId);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        access_id: r.id,
        user_id: r.user_id,
        name: r.profiles?.name ?? '—',
        email: r.profiles?.email ?? '—',
        empresa: r.profiles?.empresa ?? null,
      }));
    },
  });

  async function handleAdd() {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    setAddLoading(true);
    try {
      const alreadyLinked = accessList.some(c => c.email.toLowerCase() === email);
      if (alreadyLinked) {
        toast({ title: 'Cliente já tem acesso a este projeto.', variant: 'destructive' });
        return;
      }

      const { data: existing } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', email)
        .eq('role', 'cliente')
        .maybeSingle();

      let userId: string;

      if (existing) {
        userId = existing.id;
      } else {
        const { data: created, error: createErr } = await supabase.functions.invoke('manage-users', {
          body: { action: 'create-user', email, name: email.split('@')[0], role: 'cliente' },
        });
        if (createErr || created?.error) {
          const msg = created?.error || createErr?.message || '';
          if (msg.includes('already')) {
            const { data: retry } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', email)
              .maybeSingle();
            if (!retry) throw new Error('Erro ao localizar o usuário.');
            userId = retry.id;
          } else {
            throw new Error(msg || 'Erro ao criar cliente.');
          }
        } else {
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();
          if (!newProfile) throw new Error('Erro ao localizar o novo cliente.');
          userId = newProfile.id;
        }
      }

      const { error: linkErr } = await supabase
        .from('project_access')
        .insert({ project_id: projectId, user_id: userId });
      if (linkErr) {
        if (linkErr.code === '23505') {
          toast({ title: 'Cliente já tem acesso a este projeto.', variant: 'destructive' });
          return;
        }
        throw linkErr;
      }

      toast({ title: `Acesso concedido para ${email}.` });
      setEmailInput('');
      queryClient.invalidateQueries({ queryKey: ['project-access', projectId] });
    } catch (err: any) {
      toast({ title: 'Erro ao adicionar acesso', description: err.message, variant: 'destructive' });
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemove(client: AccessClient) {
    const { error } = await supabase
      .from('project_access')
      .delete()
      .eq('id', client.access_id);
    if (error) throw error;
    toast({ title: `Acesso de ${client.name} removido.` });
    queryClient.invalidateQueries({ queryKey: ['project-access', projectId] });
  }

  return (
    <div className="clarifyse-card p-5 space-y-5">
      <p className="clarifyse-section-label text-xs">CLIENTES COM ACESSO AO PROJETO</p>

      {/* Add by email */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-access-email"
            className="pl-9"
            type="email"
            placeholder="E-mail do cliente..."
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button
          data-testid="button-add-access"
          onClick={handleAdd}
          disabled={addLoading || !emailInput.trim()}
          className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90 gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {addLoading ? 'Adicionando...' : 'Adicionar'}
        </Button>
      </div>

      {/* Access list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : accessList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum cliente com acesso a este projeto.</p>
          <p className="text-xs mt-1">Digite o e-mail acima para conceder acesso.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accessList.map(client => (
            <div
              key={client.access_id}
              data-testid={`access-client-${client.user_id}`}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{client.email}{client.empresa ? ` · ${client.empresa}` : ''}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                data-testid={`button-remove-access-${client.user_id}`}
                onClick={() => setRemoveTarget(client)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            {accessList.length} cliente{accessList.length !== 1 ? 's' : ''} com acesso
          </p>
        </div>
      )}

      <RemoveAccessDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        client={removeTarget}
        onConfirm={() => handleRemove(removeTarget!)}
      />
    </div>
  );
});

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin';

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const basePath = isAdmin ? '/admin/projetos' : '/gerente/projetos';

  // Fetch project detail
  const { data: project, isLoading: loadingProject } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, nome, cliente_empresa, objetivo, metodologia, pilar, status, data_inicio, data_entrega_prevista, gerente_id, observacoes_internas, deleted_at, created_at, updated_at')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });

  // Fetch gerente profile
  const { data: gerenteProfile } = useQuery<{ name: string; email: string } | null>({
    queryKey: ['profile', project?.gerente_id],
    queryFn: async () => {
      if (!project?.gerente_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', project.gerente_id)
        .single();
      return data;
    },
    enabled: !!project?.gerente_id,
    staleTime: 1000 * 60 * 5,
  });


  // Fetch gerentes list (for form)
  const { data: gerentes = [] } = useQuery<GerenteProfile[]>({
    queryKey: ['gerentes-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'gerente')
        .eq('status', 'ativo')
        .order('name');
      return (data ?? []) as GerenteProfile[];
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 5,
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: null })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Projeto restaurado com sucesso!' });
    },
  });

  // Move to trash mutation
  const trashMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Projeto movido para a lixeira.' });
      navigate(basePath);
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error('Projeto não encontrado');
      const payload = {
        nome: `[Cópia] ${project.nome}`,
        cliente_empresa: null,
        objetivo: null,
        metodologia: project.metodologia ?? [],
        pilar: project.pilar ?? null,
        status: 'Briefing' as const,
        data_inicio: null,
        data_entrega_prevista: null,
        gerente_id: isAdmin ? null : (user?.id ?? null),
        observacoes_internas: null,
      };
      const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;

      await supabase.from('project_history').insert({
        project_id: data.id,
        descricao: `Projeto duplicado a partir de "${project.nome}"`,
        user_id: user?.id ?? null,
      });

      return data.id as string;
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Projeto duplicado com sucesso.',
        description: 'As configurações foram mantidas. Complete as informações do novo projeto.',
      });
      navigate(`${basePath}/${newId}`);
    },
    onError: () => toast({ title: 'Erro ao duplicar projeto.', variant: 'destructive' }),
  });

  if (loadingProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="clarifyse-card p-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(basePath)}>
          Voltar aos Projetos
        </Button>
      </div>
    );
  }

  const inTrash = !!project.deleted_at;

  async function exportPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 22;
    const lineH = 7;
    const labelColor: [number, number, number] = [90, 40, 120];
    const textColor: [number, number, number] = [30, 30, 30];
    const mutedColor: [number, number, number] = [100, 100, 100];

    doc.setFillColor(27, 43, 107);
    doc.rect(0, 0, pageW, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CLARIFYSE STRATEGY & RESEARCH', margin, 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageW - margin, 9.5, { align: 'right' });

    y = 26;
    doc.setTextColor(...labelColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DO PROJETO', margin, y);
    y += lineH;

    doc.setTextColor(...textColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const nomeSplit = doc.splitTextToSize(project.nome, pageW - margin * 2);
    doc.text(nomeSplit, margin, y);
    y += nomeSplit.length * 9;

    if (project.cliente_empresa) {
      doc.setFontSize(11);
      doc.setTextColor(...mutedColor);
      doc.setFont('helvetica', 'normal');
      doc.text(project.cliente_empresa, margin, y);
      y += lineH + 2;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += lineH;

    function row(label: string, value: string) {
      if (y > 270) { doc.addPage(); y = 22; }
      doc.setFontSize(8);
      doc.setTextColor(...labelColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label.toUpperCase()}:`, margin, y);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const valSplit = doc.splitTextToSize(value, pageW - margin * 2 - 60);
      doc.text(valSplit, margin + 62, y);
      y += Math.max(valSplit.length * 5, lineH);
    }

    row('Status', project.status);
    row('Pilar', project.pilar || '—');
    row('Metodologia', project.metodologia?.join(', ') || '—');
    row('Início', project.data_inicio ? format(parseISO(project.data_inicio), 'dd/MM/yyyy', { locale: ptBR }) : '—');
    row('Entrega Prevista', project.data_entrega_prevista ? format(parseISO(project.data_entrega_prevista), 'dd/MM/yyyy', { locale: ptBR }) : '—');
    row('Gerente', gerenteProfile ? gerenteProfile.name : '—');

    if (project.objetivo) {
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += lineH;
      doc.setFontSize(8);
      doc.setTextColor(...labelColor);
      doc.setFont('helvetica', 'bold');
      doc.text('OBJETIVO DO ESTUDO:', margin, y);
      y += lineH - 2;
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const objSplit = doc.splitTextToSize(project.objetivo, pageW - margin * 2);
      doc.text(objSplit, margin, y);
    }

    doc.save(`Projeto_${project.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(basePath)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Projetos
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="clarifyse-card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ProjectStatusBadge status={project.status} />
              <HealthThermometer project={project} showLabel />
              {inTrash && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  <AlertTriangle className="h-3 w-3" /> Na lixeira
                </span>
              )}
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
              {project.nome}
            </h1>
            {project.cliente_empresa && (
              <p className="text-muted-foreground">{project.cliente_empresa}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {inTrash ? (
              <>
                <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}>
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Restaurar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1.5" /> Excluir Definitivamente
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={exportPDF}>
                  <Download className="h-4 w-4 mr-1.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-1.5" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending}>
                  <Copy className="h-4 w-4 mr-1.5" /> Duplicar
                </Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1.5" /> Lixeira
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          {!inTrash && (
            <TabsTrigger value="cronograma" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Cronograma
            </TabsTrigger>
          )}
          {!inTrash && (
            <TabsTrigger value="campo" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Campo
            </TabsTrigger>
          )}
          {!inTrash && (
            <TabsTrigger value="documentos" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Documentos
            </TabsTrigger>
          )}
          {!inTrash && <TabsTrigger value="acessos" data-testid="tab-acessos">Acessos</TabsTrigger>}
          {!inTrash && (
            <TabsTrigger value="financeiro" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Financeiro
            </TabsTrigger>
          )}
          {!inTrash && (
            <TabsTrigger value="avaliacao" className="gap-1.5">
              <Star className="h-3.5 w-3.5" />
              Avaliação NPS
            </TabsTrigger>
          )}
          <TabsTrigger value="historico" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao-geral" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Basic info */}
            <div className="clarifyse-card p-5">
              <p className="clarifyse-section-label text-xs mb-4">INFORMAÇÕES BÁSICAS</p>
              <InfoRow label="Nome do Projeto" value={project.nome} icon={FileText} />
              <InfoRow label="Cliente / Empresa" value={project.cliente_empresa} icon={Building2} />
              <InfoRow label="Objetivo do Estudo" value={project.objetivo} icon={Target} />
              <InfoRow
                label="Metodologia"
                value={project.metodologia?.length
                  ? project.metodologia.join(', ')
                  : null}
                icon={Layers}
              />
              <InfoRow label="Pilar da Clarifyse" value={project.pilar} icon={Layers} />
            </div>

            {/* Dates & Gerente */}
            <div className="clarifyse-card p-5">
              <p className="clarifyse-section-label text-xs mb-4">DATAS E RESPONSÁVEL</p>
              <InfoRow label="Status" value={<ProjectStatusBadge status={project.status} size="sm" />} icon={Layers} />
              <InfoRow label="Data de Início" value={formatDate(project.data_inicio)} icon={Calendar} />
              <InfoRow label="Data Prevista de Entrega" value={formatDate(project.data_entrega_prevista)} icon={Calendar} />
              <InfoRow
                label="Gerente Responsável"
                value={gerenteProfile ? `${gerenteProfile.name} (${gerenteProfile.email})` : project.gerente_id ? 'Carregando...' : null}
                icon={User}
              />
              <InfoRow
                label="Criado em"
                value={formatDateTime(project.created_at)}
                icon={Clock}
              />
              <InfoRow
                label="Última Atualização"
                value={formatDateTime(project.updated_at)}
                icon={Clock}
              />
            </div>

            {/* Internal notes (admin and gerente only) */}
            {(isAdmin || profile?.role === 'gerente') && project.observacoes_internas && (
              <div className="clarifyse-card p-5 lg:col-span-2">
                <p className="clarifyse-section-label text-xs mb-3">OBSERVAÇÕES INTERNAS</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{project.observacoes_internas}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Cronograma */}
        {!inTrash && (
          <TabsContent value="cronograma" className="mt-4">
            <CronogramaTab projectId={project.id} projectName={project.nome} />
          </TabsContent>
        )}

        {/* Campo */}
        {!inTrash && (
          <TabsContent value="campo" className="mt-4">
            <CampoTab projectId={project.id} />
          </TabsContent>
        )}

        {/* Documentos */}
        {!inTrash && (
          <TabsContent value="documentos" className="mt-4">
            <DocumentosTab projectId={project.id} />
          </TabsContent>
        )}

        {/* Acessos */}
        {!inTrash && (
          <TabsContent value="acessos" className="mt-4">
            <AcessosTab projectId={project.id} isAdmin={isAdmin} />
          </TabsContent>
        )}

        {/* Financeiro */}
        {!inTrash && (
          <TabsContent value="financeiro" className="mt-4">
            <FinanceiroTab projectId={project.id} projectName={project.nome} />
          </TabsContent>
        )}

        {/* Avaliação NPS */}
        {!inTrash && (
          <TabsContent value="avaliacao" className="mt-4">
            <AvaliacaoTab projectId={project.id} projectName={project.nome} projectStatus={project.status} />
          </TabsContent>
        )}

        {/* Histórico */}
        <TabsContent value="historico" className="mt-4">
          <HistoricoFeed projectId={project.id} />
        </TabsContent>
      </Tabs>

      {/* Edit form */}
      <ProjectForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
        gerentes={gerentes}
        onSuccess={() => {}}
      />

      {/* Delete dialog */}
      <DeleteProjectDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        projectName={project.nome}
        mode={inTrash ? 'permanent' : 'trash'}
        onConfirm={async () => {
          if (inTrash) {
            const { error } = await supabase.from('projects').delete().eq('id', project.id);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast({ title: 'Projeto excluído permanentemente.' });
            navigate(basePath);
          } else {
            await trashMutation.mutateAsync();
          }
        }}
      />
    </div>
  );
}
