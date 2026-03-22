import React, { useState, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import {
  UserPlus, Search, MoreHorizontal, Pencil,
  UserX, UserCheck, Trash2, KeyRound, ChevronLeft, ChevronRight, Settings,
} from 'lucide-react';
import { PerfilSegurancaTab } from '@/components/admin/PerfilSegurancaTab';
import { DadosEmpresaTab } from '@/components/admin/DadosEmpresaTab';
import { EtapasPadraoTab } from '@/components/admin/EtapasPadraoTab';
import { LixeiraTab } from '@/components/admin/LixeiraTab';
import { AlertasTab } from '@/components/admin/AlertasTab';
import { ParceirosTab } from '@/components/admin/ParceirosTab';
import { ActivityLogTab } from '@/components/admin/ActivityLogTab';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface GerenteProfile {
  id: string;
  name: string;
  email: string;
  cargo: string | null;
  status: string;
  last_sign_in_at: string | null;
  project_count?: number;
}

function formatAccess(d: string | null): string {
  if (!d) return 'Nunca acessou';
  try { return format(parseISO(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); }
  catch { return '—'; }
}

const PAGE_SIZE = 20;

interface GerenteFormDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: GerenteProfile | null;
}

const GerenteFormDialog = memo(function GerenteFormDialog({
  open, onClose, initial,
}: GerenteFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [cargo, setCargo] = useState(initial?.cargo ?? '');
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial;

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setEmail(initial?.email ?? '');
      setCargo(initial?.cargo ?? '');
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || (!isEdit && !email.trim())) return;
    setLoading(true);
    try {
      if (isEdit) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: name.trim(), cargo: cargo.trim() || null })
          .eq('id', initial!.id);
        if (error) throw error;
        toast({ title: 'Gerente atualizado com sucesso.' });
        queryClient.invalidateQueries({ queryKey: ['gerentes'] });
        onClose();
      } else {
        const { data, error } = await supabase.functions.invoke('manage-users', {
          body: { action: 'create-user', email: email.trim().toLowerCase(), name: name.trim(), role: 'gerente', cargo: cargo.trim() || null },
        });
        if (error || data?.error) {
          const msg: string = data?.error || error?.message || '';
          if (msg.includes('already') || msg.includes('duplicate')) {
            toast({ title: 'E-mail já cadastrado', description: 'Este e-mail já está em uso.', variant: 'destructive' });
          } else {
            toast({ title: 'Erro ao criar gerente', description: msg || 'Verifique os dados e tente novamente.', variant: 'destructive' });
          }
          return;
        }
        toast({ title: 'Gerente criado com sucesso.', description: `Um e-mail foi enviado para ${email.trim()}.` });
        queryClient.invalidateQueries({ queryKey: ['gerentes'] });
        onClose();
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Editar Gerente' : 'Novo Gerente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ger-name">Nome completo *</Label>
            <Input id="ger-name" data-testid="input-gerente-name" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do gerente" required />
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="ger-email">E-mail *</Label>
              <Input id="ger-email" data-testid="input-gerente-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="gerente@clarifyse.com.br" required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ger-cargo">Cargo</Label>
            <Input id="ger-cargo" data-testid="input-gerente-cargo" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: Gerente Sênior" />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" data-testid="button-submit-gerente" disabled={loading} className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90">
              {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar e Enviar Convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

interface DeleteGerenteDialogProps {
  open: boolean;
  onClose: () => void;
  gerente: GerenteProfile | null;
  onConfirm: () => Promise<void>;
}

const DeleteGerenteDialog = memo(function DeleteGerenteDialog({
  open, onClose, gerente, onConfirm,
}: DeleteGerenteDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try { await onConfirm(); onClose(); }
    finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-destructive">Excluir Gerente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Tem certeza? Os projetos associados a <strong>{gerente?.name}</strong> permanecerão no sistema, mas ficarão sem gerente responsável. Você pode reatribuí-los depois.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" disabled={loading} onClick={handleDelete} data-testid="button-confirm-delete-gerente">
            {loading ? 'Excluindo...' : 'Excluir Gerente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

interface GerenteRowProps {
  gerente: GerenteProfile;
  onEdit: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}

const GerenteRow = memo(function GerenteRow({
  gerente, onEdit, onToggleStatus, onResetPassword, onDelete, actionLoading,
}: GerenteRowProps) {
  const isActive = gerente.status === 'ativo';
  const busy = actionLoading === gerente.id;

  return (
    <TableRow data-testid={`row-gerente-${gerente.id}`} className="hover:bg-muted/30">
      <TableCell>
        <div>
          <p className="font-medium text-sm">{gerente.name}</p>
          <p className="text-xs text-muted-foreground">{gerente.email}</p>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{gerente.cargo || '—'}</TableCell>
      <TableCell className="text-center text-sm">{gerente.project_count ?? 0}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatAccess(gerente.last_sign_in_at)}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={isActive
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'}
        >
          {isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`menu-gerente-${gerente.id}`} disabled={busy}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" /> Editar dados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onResetPassword}>
              <KeyRound className="h-4 w-4 mr-2" /> Redefinir senha
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleStatus}>
              {isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
              {isActive ? 'Desativar' : 'Reativar'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

function GerentesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GerenteProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GerenteProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['gerentes', search, statusFilter, page],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('id, name, email, cargo, status, last_sign_in_at', { count: 'exact' })
        .eq('role', 'gerente')
        .order('name');

      if (statusFilter !== 'todos') q = q.eq('status', statusFilter);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`name.ilike.${s},email.ilike.${s},cargo.ilike.${s}`);
      }

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data: gerentes, count, error } = await q;
      if (error) throw error;

      if (!gerentes?.length) return { gerentes: [], total: count ?? 0 };

      const ids = gerentes.map((g: any) => g.id);
      const { data: projectsData } = await supabase
        .from('projects')
        .select('gerente_id')
        .in('gerente_id', ids)
        .is('deleted_at', null)
        .not('status', 'eq', 'Encerrado');

      const countMap: Record<string, number> = {};
      (projectsData ?? []).forEach((r: any) => {
        if (r.gerente_id) countMap[r.gerente_id] = (countMap[r.gerente_id] ?? 0) + 1;
      });

      return {
        gerentes: gerentes.map((g: any) => ({ ...g, project_count: countMap[g.id] ?? 0 })) as GerenteProfile[],
        total: count ?? 0,
      };
    },
  });

  const gerentes = data?.gerentes ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const invokeAction = useCallback(async (action: string, userId: string, successMsg: string) => {
    setActionLoading(userId);
    try {
      const { data: res, error } = await supabase.functions.invoke('manage-users', {
        body: { action, user_id: userId },
      });
      if (error || res?.error) throw new Error(res?.error || error?.message);
      toast({ title: successMsg });
      queryClient.invalidateQueries({ queryKey: ['gerentes'] });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }, [toast, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (gerente: GerenteProfile) => {
      const { error: nullErr } = await supabase
        .from('projects')
        .update({ gerente_id: null })
        .eq('gerente_id', gerente.id);
      if (nullErr) throw nullErr;
      await invokeAction('delete-user', gerente.id, 'Gerente excluído. Projetos associados ficaram sem gerente responsável.');
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{total} gerente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        <Button
          onClick={() => { setEditTarget(null); setFormOpen(true); }}
          data-testid="button-new-gerente"
          className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90 gap-2"
        >
          <UserPlus className="h-4 w-4" /> Novo Gerente
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search-gerentes"
            className="pl-9"
            placeholder="Buscar por nome, e-mail ou cargo..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['todos', 'ativo', 'inativo'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              data-testid={`filter-gerente-status-${s}`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                statusFilter === s ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'todos' ? 'Todos' : s === 'ativo' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      <div className="clarifyse-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Nome / E-mail</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Cargo</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Projetos Ativos</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Último Acesso</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : gerentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  {search || statusFilter !== 'todos'
                    ? 'Nenhum gerente encontrado com esses filtros.'
                    : 'Nenhum gerente cadastrado ainda.'}
                </TableCell>
              </TableRow>
            ) : (
              gerentes.map(gerente => (
                <GerenteRow
                  key={gerente.id}
                  gerente={gerente}
                  actionLoading={actionLoading}
                  onEdit={() => { setEditTarget(gerente); setFormOpen(true); }}
                  onToggleStatus={() => invokeAction(
                    gerente.status === 'ativo' ? 'deactivate-user' : 'activate-user',
                    gerente.id,
                    gerente.status === 'ativo' ? 'Gerente desativado.' : 'Gerente reativado.',
                  )}
                  onResetPassword={() => invokeAction('reset-password', gerente.id, `Link enviado para ${gerente.email}.`)}
                  onDelete={() => setDeleteTarget(gerente)}
                />
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <GerenteFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        initial={editTarget}
      />
      <DeleteGerenteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        gerente={deleteTarget}
        onConfirm={() => deleteMutation.mutateAsync(deleteTarget!)}
      />
    </div>
  );
}

export default function AdminConfiguracoes() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
        </div>
        <p className="text-sm text-muted-foreground">Gerencie gerentes, parceiros e configurações do sistema</p>
      </motion.div>

      <Tabs defaultValue="gerentes">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="gerentes" data-testid="tab-gerentes">Gerentes</TabsTrigger>
          <TabsTrigger value="perfil">Perfil &amp; Segurança</TabsTrigger>
          <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="etapas">Etapas Padrão</TabsTrigger>
          <TabsTrigger value="lixeira">Lixeira</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="parceiros">Parceiros de Painel</TabsTrigger>
          <TabsTrigger value="log">Log de Atividades</TabsTrigger>
        </TabsList>
        <TabsContent value="gerentes" className="mt-6">
          <GerentesTab />
        </TabsContent>
        <TabsContent value="perfil" className="mt-6">
          <PerfilSegurancaTab />
        </TabsContent>
        <TabsContent value="empresa" className="mt-6">
          <DadosEmpresaTab />
        </TabsContent>
        <TabsContent value="etapas" className="mt-6">
          <EtapasPadraoTab />
        </TabsContent>
        <TabsContent value="lixeira" className="mt-6">
          <LixeiraTab />
        </TabsContent>
        <TabsContent value="alertas" className="mt-6">
          <AlertasTab />
        </TabsContent>
        <TabsContent value="parceiros" className="mt-6">
          <ParceirosTab />
        </TabsContent>
        <TabsContent value="log" className="mt-6">
          <ActivityLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
