import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';
import {
  FolderOpen, Plus, Search, MoreHorizontal, Eye, Pencil,
  Copy, Trash2, RotateCcw, AlertTriangle, X, Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Project, ProjectStatus, GerenteProfile, PROJECT_STATUS_LIST,
} from '@/types/project';

const PAGE_SIZE = 12;

function formatDate(d: string | null): string {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return '—'; }
}

function TrashWarningBadge({ deletedAt }: { deletedAt: string }) {
  const daysLeft = 15 - differenceInDays(new Date(), parseISO(deletedAt));
  if (daysLeft > 3) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-medium border border-red-200">
      <AlertTriangle className="h-3 w-3" />
      Excluído em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}
    </span>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="clarifyse-card p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex justify-between pt-1">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-7 rounded" />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [showTrash, setShowTrash] = useState(false);
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deletePermanentTarget, setDeletePermanentTarget] = useState<Project | null>(null);

  // Fetch gerentes (for form dropdown - admin only)
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

  // Fetch projects count (for pagination)
  const { data: totalCount = 0 } = useQuery<number>({
    queryKey: ['projects', 'count', isAdmin, user?.id, showTrash, statusFilter, search],
    queryFn: async () => {
      let q = supabase
        .from('projects')
        .select('id', { count: 'exact', head: true });

      if (showTrash) {
        q = q.not('deleted_at', 'is', null);
      } else {
        q = q.is('deleted_at', null);
      }

      if (!isAdmin) q = q.eq('gerente_id', user!.id);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (search.trim()) {
        q = q.or(`nome.ilike.%${search.trim()}%,cliente_empresa.ilike.%${search.trim()}%`);
      }

      const { count } = await q;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  // Fetch projects page
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', 'list', isAdmin, user?.id, showTrash, statusFilter, search, page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let q = supabase
        .from('projects')
        .select('id, nome, cliente_empresa, metodologia, pilar, status, data_inicio, data_entrega_prevista, gerente_id, deleted_at, created_at, updated_at')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (showTrash) {
        q = q.not('deleted_at', 'is', null);
      } else {
        q = q.is('deleted_at', null);
      }

      if (!isAdmin) q = q.eq('gerente_id', user!.id);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (search.trim()) {
        q = q.or(`nome.ilike.%${search.trim()}%,cliente_empresa.ilike.%${search.trim()}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Project[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
  });

  // Fetch gerente names for admin view
  const { data: gerenteMap = {} } = useQuery<Record<string, string>>({
    queryKey: ['gerente-names', projects.map(p => p.gerente_id).filter(Boolean)],
    queryFn: async () => {
      const ids = [...new Set(projects.map(p => p.gerente_id).filter(Boolean))] as string[];
      if (!ids.length) return {};
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', ids);
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: { id: string; name: string }) => { map[p.id] = p.name; });
      return map;
    },
    enabled: isAdmin && projects.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Move to trash mutation
  const trashMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['gerente-dashboard-stats'] });
      toast({ title: 'Projeto movido para a lixeira.' });
    },
    onError: () => toast({ title: 'Erro ao mover projeto para lixeira.', variant: 'destructive' }),
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: null })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Projeto restaurado com sucesso!' });
    },
    onError: () => toast({ title: 'Erro ao restaurar projeto.', variant: 'destructive' }),
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Projeto excluído permanentemente.' });
    },
    onError: () => toast({ title: 'Erro ao excluir projeto.', variant: 'destructive' }),
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (source: Project) => {
      const { data: detail } = await supabase
        .from('projects')
        .select('metodologia, pilar')
        .eq('id', source.id)
        .single();

      const payload = {
        nome: `[Cópia] ${source.nome}`,
        cliente_empresa: null,
        objetivo: null,
        metodologia: detail?.metodologia ?? [],
        pilar: detail?.pilar ?? null,
        status: 'Briefing' as ProjectStatus,
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
        descricao: `Projeto duplicado a partir de "${source.nome}"`,
        user_id: user?.id ?? null,
      });

      return data.id as string;
    },
    onSuccess: (newId: string) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Projeto duplicado com sucesso.',
        description: 'As configurações foram mantidas. Complete as informações do novo projeto.',
      });
      navigate(isAdmin ? `/admin/projetos/${newId}` : `/gerente/projetos/${newId}`);
    },
    onError: () => toast({ title: 'Erro ao duplicar projeto.', variant: 'destructive' }),
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  }, []);

  const handleStatusFilter = useCallback((v: string) => {
    setStatusFilter(v as 'all' | ProjectStatus);
    setPage(0);
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditingProject(p);
    setFormOpen(true);
  };

  const [exportLoading, setExportLoading] = useState(false);
  async function exportExcel() {
    setExportLoading(true);
    try {
      let q = supabase
        .from('projects')
        .select('id, nome, cliente_empresa, pilar, status, data_inicio, data_entrega_prevista, gerente_id, created_at');
      if (showTrash) { q = q.not('deleted_at', 'is', null); }
      else { q = q.is('deleted_at', null); }
      if (!isAdmin) q = q.eq('gerente_id', user!.id);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (search.trim()) q = q.or(`nome.ilike.%${search.trim()}%,cliente_empresa.ilike.%${search.trim()}%`);
      const { data: allProjects } = await q.order('created_at', { ascending: false });
      const rows = (allProjects || []).map((p: any) => ({
        'Nome do Projeto': p.nome,
        'Cliente / Empresa': p.cliente_empresa || '',
        'Pilar': p.pilar || '',
        'Status': p.status,
        'Início': p.data_inicio ? format(parseISO(p.data_inicio), 'dd/MM/yyyy', { locale: ptBR }) : '',
        'Entrega Prevista': p.data_entrega_prevista ? format(parseISO(p.data_entrega_prevista), 'dd/MM/yyyy', { locale: ptBR }) : '',
        'Gerente': gerenteMap[p.gerente_id] || '',
        'Criado em': format(parseISO(p.created_at), 'dd/MM/yyyy', { locale: ptBR }),
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Projetos');
      XLSX.writeFile(wb, `Projetos_Clarifyse_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    } catch (err: any) {
      toast({ title: 'Erro ao exportar', description: err.message, variant: 'destructive' });
    } finally { setExportLoading(false); }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const basePath = isAdmin ? '/admin/projetos' : '/gerente/projetos';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="clarifyse-section-label">
            {showTrash ? 'LIXEIRA DE PROJETOS' : 'GESTÃO DE PROJETOS'}
          </p>
          <h1 className="text-2xl font-display font-bold text-foreground mt-1">
            {showTrash ? 'Lixeira' : 'Projetos'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showTrash ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => { setShowTrash(v => !v); setPage(0); }}
            className={showTrash ? 'border-destructive text-destructive hover:bg-destructive/10' : 'text-muted-foreground'}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {showTrash ? 'Sair da Lixeira' : 'Lixeira'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={exportLoading}>
            <Download className="h-4 w-4 mr-1.5" />
            {exportLoading ? 'Exportando...' : 'Exportar'}
          </Button>
          {!showTrash && (
            <Button variant="gradient" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Projeto
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou cliente..."
            value={search}
            onChange={handleSearch}
            className="pl-9"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {!showTrash && (
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {PROJECT_STATUS_LIST.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Trash info banner */}
      {showTrash && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Projetos na lixeira são excluídos automaticamente após <strong>15 dias</strong>.</span>
        </div>
      )}

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={showTrash ? 'Lixeira vazia' : 'Nenhum projeto encontrado'}
          description={showTrash
            ? 'Não há projetos na lixeira.'
            : search || statusFilter !== 'all'
              ? 'Nenhum projeto corresponde aos filtros aplicados.'
              : 'Crie seu primeiro projeto para começar.'}
          action={!showTrash && !search && statusFilter === 'all' ? (
            <Button variant="gradient" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" /> Novo Projeto
            </Button>
          ) : undefined}
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${statusFilter}-${search}-${showTrash}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {projects.map(project => (
              <div
                key={project.id}
                className="clarifyse-card-hover p-5 flex flex-col gap-3 cursor-pointer"
                onClick={() => navigate(`${basePath}/${project.id}`)}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 flex-1">
                    {project.nome}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <HealthThermometer project={project} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                        {showTrash ? (
                          <>
                            <DropdownMenuItem onClick={() => restoreMutation.mutate(project.id)}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Restaurar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletePermanentTarget(project)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir Permanentemente
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`${basePath}/${project.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { openEdit(project); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateMutation.mutate(project)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(project)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Mover para Lixeira
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Client */}
                {project.cliente_empresa && (
                  <p className="text-xs text-muted-foreground">{project.cliente_empresa}</p>
                )}

                {/* Status badge */}
                <div className="flex flex-wrap gap-2 items-center">
                  <ProjectStatusBadge status={project.status} size="sm" />
                  {project.pilar && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                      {project.pilar}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>
                    {project.data_entrega_prevista
                      ? `Entrega: ${formatDate(project.data_entrega_prevista)}`
                      : 'Sem data de entrega'}
                  </span>
                  {isAdmin && project.gerente_id && (
                    <span className="truncate ml-2">{gerenteMap[project.gerente_id] ?? '—'}</span>
                  )}
                </div>

                {/* Trash warning */}
                {showTrash && project.deleted_at && (
                  <TrashWarningBadge deletedAt={project.deleted_at} />
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {totalCount} projeto{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Project Form */}
      <ProjectForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingProject(null); }}
        project={editingProject}
        gerentes={gerentes}
        onSuccess={(id) => {
          if (!editingProject) navigate(`${basePath}/${id}`);
        }}
      />

      {/* Delete (trash) dialog */}
      {deleteTarget && (
        <DeleteProjectDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          projectName={deleteTarget.nome}
          mode="trash"
          onConfirm={async () => { await trashMutation.mutateAsync(deleteTarget.id); }}
        />
      )}

      {/* Permanent delete dialog */}
      {deletePermanentTarget && (
        <DeleteProjectDialog
          open={!!deletePermanentTarget}
          onClose={() => setDeletePermanentTarget(null)}
          projectName={deletePermanentTarget.nome}
          mode="permanent"
          onConfirm={async () => { await permanentDeleteMutation.mutateAsync(deletePermanentTarget.id); }}
        />
      )}
    </div>
  );
}
