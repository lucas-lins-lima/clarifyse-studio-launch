import React, { useState, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
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
  UserPlus, Search, MoreHorizontal, Pencil, FolderOpen,
  UserX, UserCheck, Trash2, KeyRound, ChevronLeft, ChevronRight, Download,
  Mail, Lock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { TempPasswordModal } from '@/components/users/TempPasswordModal';

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  empresa: string | null;
  status: string;
  last_sign_in_at: string | null;
  must_change_password?: boolean | null;
  project_count?: number;
}

function formatAccess(d: string | null): string {
  if (!d) return 'Nunca acessou';
  try { return format(parseISO(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); }
  catch { return '—'; }
}

const PAGE_SIZE = 20;

// ─── Create/Edit Dialog ─────────────────────────────────────────────────────

interface ClientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (email: string, name: string) => void;
  onOpenTempPassword?: (userId: string, userName: string) => void;
  initial?: ClientProfile | null;
  isAdmin: boolean;
}

const ClientFormDialog = memo(function ClientFormDialog({
  open, onClose, onSuccess, onOpenTempPassword, initial, isAdmin,
}: ClientFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [empresa, setEmpresa] = useState(initial?.empresa ?? '');
  const [loading, setLoading] = useState(false);
  const [creationMode, setCreationMode] = useState<'invite' | 'temp-password'>('invite');

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setEmail(initial?.email ?? '');
      setEmpresa(initial?.empresa ?? '');
      setCreationMode('invite');
    }
  }, [open, initial]);

  const isEdit = !!initial;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: name.trim(), empresa: empresa.trim() || null })
          .eq('id', initial!.id);
        if (error) throw error;
        toast({ title: 'Cliente atualizado com sucesso.' });
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        onClose();
      } else if (creationMode === 'invite') {
        // Create via invite email (existing flow)
        const { data, error } = await supabase.functions.invoke('manage-users', {
          body: { action: 'create-user', email: email.trim().toLowerCase(), name: name.trim(), role: 'cliente', empresa: empresa.trim() || null },
        });
        if (error || data?.error) {
          const msg: string = data?.error || error?.message || '';
          if (msg.includes('already') || msg.includes('already registered') || msg.includes('duplicate')) {
            toast({ title: 'E-mail já cadastrado', description: 'Este e-mail já está em uso no sistema.', variant: 'destructive' });
          } else if (msg.includes('invalid') || msg.includes('Invalid')) {
            toast({ title: 'E-mail inválido', description: 'Informe um endereço de e-mail válido.', variant: 'destructive' });
          } else {
            toast({ title: 'Erro ao criar cliente', description: msg || 'Falha ao enviar e-mail de convite.', variant: 'destructive' });
          }
          return;
        }
        toast({ title: 'Cliente criado com sucesso.', description: `Um e-mail foi enviado para ${email.trim()}.` });
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        onSuccess(email.trim(), name.trim());
        onClose();
      } else {
        // Create with temp password — close this dialog and open temp password modal
        // First create the user record, then open temp password flow
        const { data, error } = await supabase.functions.invoke('manage-users', {
          body: { action: 'create-user', email: email.trim().toLowerCase(), name: name.trim(), role: 'cliente', empresa: empresa.trim() || null },
        });
        if (error || data?.error) {
          const msg: string = data?.error || error?.message || '';
          if (msg.includes('already') || msg.includes('already registered') || msg.includes('duplicate')) {
            toast({ title: 'E-mail já cadastrado', description: 'Este e-mail já está em uso no sistema.', variant: 'destructive' });
          } else {
            toast({ title: 'Erro ao criar cliente', description: msg || 'Erro desconhecido.', variant: 'destructive' });
          }
          return;
        }
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        onSuccess(email.trim(), name.trim());
        onClose();
        // Open temp password modal for the newly created user
        if (data?.user_id && onOpenTempPassword) {
          onOpenTempPassword(data.user_id, name.trim());
        }
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
          <DialogTitle className="font-display">{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cli-name">Nome completo *</Label>
            <Input id="cli-name" data-testid="input-client-name" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cliente" required />
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="cli-email">E-mail *</Label>
              <Input id="cli-email" data-testid="input-client-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@empresa.com" required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="cli-empresa">Empresa</Label>
            <Input id="cli-empresa" data-testid="input-client-empresa" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Nome da empresa" />
          </div>

          {/* Creation mode selector (only for new clients) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Método de acesso</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCreationMode('invite')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-colors ${
                    creationMode === 'invite'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span className="font-medium text-xs">Convite por e-mail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('temp-password')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-colors ${
                    creationMode === 'temp-password'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                      : 'border-border text-muted-foreground hover:border-amber-400/50'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  <span className="font-medium text-xs">Senha temporária</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {creationMode === 'invite'
                  ? 'O cliente receberá um e-mail com link para criar sua senha.'
                  : 'Você definirá uma senha temporária para compartilhar manualmente.'}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" data-testid="button-submit-client" disabled={loading} className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90">
              {loading
                ? 'Salvando...'
                : isEdit
                  ? 'Salvar'
                  : creationMode === 'invite'
                    ? 'Criar e Enviar Convite'
                    : 'Criar e Definir Senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

// ─── Projects Dialog ─────────────────────────────────────────────────────────

interface ClientProjectsDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientProfile | null;
}

const ClientProjectsDialog = memo(function ClientProjectsDialog({
  open, onClose, client,
}: ClientProjectsDialogProps) {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['client-projects', client?.id],
    enabled: open && !!client?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_access')
        .select('project_id, projects(id, nome, status, cliente_empresa)')
        .eq('user_id', client!.id);
      if (error) throw error;
      return data.map((r: any) => r.projects).filter(Boolean);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Projetos de {client?.name}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !projects?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto vinculado.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{p.nome}</p>
                    {p.cliente_empresa && <p className="text-xs text-muted-foreground">{p.cliente_empresa}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ─── Delete Dialog ────────────────────────────────────────────────────────────

interface DeleteClientDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientProfile | null;
  onConfirm: () => Promise<void>;
}

const DeleteClientDialog = memo(function DeleteClientDialog({
  open, onClose, client, onConfirm,
}: DeleteClientDialogProps) {
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);
  const matches = typed.trim().toLowerCase() === (client?.name ?? '').trim().toLowerCase();

  async function handleDelete() {
    if (!matches) return;
    setLoading(true);
    try { await onConfirm(); onClose(); setTyped(''); }
    finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (onClose(), setTyped(''))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-destructive">Excluir Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Esta ação é <strong>irreversível</strong>. O cliente será removido do sistema de autenticação e todos os seus dados serão perdidos.
          </p>
          <div className="space-y-1.5">
            <Label>Digite <span className="font-semibold text-foreground">{client?.name}</span> para confirmar:</Label>
            <Input data-testid="input-delete-confirm" value={typed} onChange={e => setTyped(e.target.value)} placeholder={client?.name ?? ''} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onClose(); setTyped(''); }}>Cancelar</Button>
          <Button variant="destructive" disabled={!matches || loading} onClick={handleDelete} data-testid="button-confirm-delete-client">
            {loading ? 'Excluindo...' : 'Excluir Definitivamente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ─── Client Row ───────────────────────────────────────────────────────────────

interface ClientRowProps {
  client: ClientProfile;
  isAdmin: boolean;
  onEdit: () => void;
  onViewProjects: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
  onSetTempPassword: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}

const ClientRow = memo(function ClientRow({
  client, isAdmin, onEdit, onViewProjects, onToggleStatus, onResetPassword, onSetTempPassword, onDelete, actionLoading,
}: ClientRowProps) {
  const isActive = client.status === 'ativo';
  const busy = actionLoading === client.id;
  const hasTempPassword = !!client.must_change_password;

  return (
    <TableRow data-testid={`row-client-${client.id}`} className="hover:bg-muted/30">
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{client.name}</p>
            {hasTempPassword && (
              <Badge
                variant="outline"
                className="text-xs bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
              >
                <KeyRound className="h-3 w-3 mr-1" />
                Senha temporária
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{client.email}</p>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{client.empresa || '—'}</TableCell>
      <TableCell className="text-center text-sm">{client.project_count ?? 0}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatAccess(client.last_sign_in_at)}</TableCell>
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
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`menu-client-${client.id}`} disabled={busy}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onEdit} data-testid={`action-edit-${client.id}`}>
              <Pencil className="h-4 w-4 mr-2" /> Editar dados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onViewProjects}>
              <FolderOpen className="h-4 w-4 mr-2" /> Ver projetos vinculados
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={onSetTempPassword}>
                  <KeyRound className="h-4 w-4 mr-2 text-amber-500" />
                  <span>Gerar senha temporária</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onResetPassword}>
                  <Mail className="h-4 w-4 mr-2" /> Enviar link de redefinição
                </DropdownMenuItem>
              </>
            )}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleStatus}>
                  {isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                  {isActive ? 'Desativar' : 'Reativar'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClientProfile | null>(null);
  const [projectsTarget, setProjectsTarget] = useState<ClientProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Temp password modal state
  const [tempPasswordTarget, setTempPasswordTarget] = useState<{ id: string; name: string } | null>(null);

  const filters = { search, statusFilter };
  const { data, isLoading } = useQuery({
    queryKey: ['clientes', filters, page],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('id, name, email, empresa, status, last_sign_in_at, must_change_password', { count: 'exact' })
        .eq('role', 'cliente')
        .order('name');

      if (statusFilter !== 'todos') q = q.eq('status', statusFilter);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`name.ilike.${s},email.ilike.${s},empresa.ilike.${s}`);
      }

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data: clients, count, error } = await q;
      if (error) throw error;

      if (!clients?.length) return { clients: [], total: count ?? 0 };

      const ids = clients.map(c => c.id);
      const { data: accessData } = await supabase
        .from('project_access')
        .select('user_id')
        .in('user_id', ids);

      const countMap: Record<string, number> = {};
      (accessData ?? []).forEach((r: any) => {
        countMap[r.user_id] = (countMap[r.user_id] ?? 0) + 1;
      });

      return {
        clients: clients.map(c => ({ ...c, project_count: countMap[c.id] ?? 0 })) as ClientProfile[],
        total: count ?? 0,
      };
    },
  });

  const clients = data?.clients ?? [];
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
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }, [toast, queryClient]);

  const toggleStatusMutation = useMutation({
    mutationFn: async (client: ClientProfile) => {
      const action = client.status === 'ativo' ? 'deactivate-user' : 'activate-user';
      const msg = client.status === 'ativo' ? 'Cliente desativado.' : 'Cliente reativado.';
      await invokeAction(action, client.id, msg);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (client: ClientProfile) => {
      await invokeAction('reset-password', client.id, `Link de redefinição de senha enviado para ${client.email}.`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (client: ClientProfile) => {
      await invokeAction('delete-user', client.id, 'Cliente excluído com sucesso.');
    },
  });

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleStatus(v: 'todos' | 'ativo' | 'inativo') { setStatusFilter(v); setPage(1); }

  const [exportLoading, setExportLoading] = useState(false);
  async function exportExcel() {
    setExportLoading(true);
    try {
      let q = supabase
        .from('profiles')
        .select('id, name, email, empresa, status, last_sign_in_at, must_change_password')
        .eq('role', 'cliente')
        .order('name');
      if (statusFilter !== 'todos') q = q.eq('status', statusFilter);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`name.ilike.${s},email.ilike.${s},empresa.ilike.${s}`);
      }
      const { data: allClients } = await q;
      const rows = (allClients || []).map((c: any) => ({
        'Nome': c.name,
        'E-mail': c.email,
        'Empresa': c.empresa || '',
        'Status': c.status === 'ativo' ? 'Ativo' : 'Inativo',
        'Senha Temporária': c.must_change_password ? 'Sim' : 'Não',
        'Último Acesso': c.last_sign_in_at ? format(new Date(c.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Nunca acessou',
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
      XLSX.writeFile(wb, `Clientes_Clarifyse_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    } catch (err: any) {
      toast({ title: 'Erro ao exportar', description: err.message, variant: 'destructive' });
    } finally { setExportLoading(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin ? 'Gerencie todos os clientes da Clarifyse' : 'Clientes vinculados aos seus projetos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={exportLoading}>
            <Download className="h-4 w-4 mr-1.5" />
            {exportLoading ? 'Exportando...' : 'Exportar'}
          </Button>
          <Button
            onClick={() => { setEditTarget(null); setFormOpen(true); }}
            data-testid="button-new-client"
            className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90 gap-2"
          >
            <UserPlus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="clarifyse-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search-clientes"
            className="pl-9"
            placeholder="Buscar por nome, e-mail ou empresa..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['todos', 'ativo', 'inativo'] as const).map(s => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              data-testid={`filter-status-${s}`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                statusFilter === s ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'todos' ? 'Todos' : s === 'ativo' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="clarifyse-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Nome / E-mail</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Empresa</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Projetos</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Último Acesso</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  {search || statusFilter !== 'todos'
                    ? 'Nenhum cliente encontrado com esses filtros.'
                    : 'Nenhum cliente cadastrado ainda.'}
                </TableCell>
              </TableRow>
            ) : (
              clients.map(client => (
                <ClientRow
                  key={client.id}
                  client={client}
                  isAdmin={isAdmin}
                  actionLoading={actionLoading}
                  onEdit={() => { setEditTarget(client); setFormOpen(true); }}
                  onViewProjects={() => setProjectsTarget(client)}
                  onToggleStatus={() => toggleStatusMutation.mutate(client)}
                  onResetPassword={() => resetPasswordMutation.mutate(client)}
                  onSetTempPassword={() => setTempPasswordTarget({ id: client.id, name: client.name })}
                  onDelete={() => setDeleteTarget(client)}
                />
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {total} cliente{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ClientFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSuccess={() => {}}
        onOpenTempPassword={(id, name) => setTempPasswordTarget({ id, name })}
        initial={editTarget}
        isAdmin={isAdmin}
      />
      <ClientProjectsDialog
        open={!!projectsTarget}
        onClose={() => setProjectsTarget(null)}
        client={projectsTarget}
      />
      <DeleteClientDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        client={deleteTarget}
        onConfirm={() => deleteMutation.mutateAsync(deleteTarget!)}
      />

      {/* Temp Password Modal */}
      {tempPasswordTarget && (
        <TempPasswordModal
          open={!!tempPasswordTarget}
          onClose={() => setTempPasswordTarget(null)}
          userId={tempPasswordTarget.id}
          userName={tempPasswordTarget.name}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['clientes'] })}
        />
      )}
    </div>
  );
}
