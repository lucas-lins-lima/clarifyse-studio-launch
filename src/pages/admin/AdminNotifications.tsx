import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { Notification, NotificationType } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  Calendar,
  Star,
  Target,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

const typeLabels: Record<string, string> = {
  status_changed: 'Status alterado',
  nps_received: 'NPS recebido',
  field_complete: 'Campo completo',
  deadline_risk: 'Risco de prazo',
  goal_alert: 'Alerta de meta',
  document_added: 'Documento adicionado',
  schedule_updated: 'Cronograma atualizado',
  sync_error: 'Erro de sincronizacao',
  project_created: 'Projeto criado',
  general: 'Geral',
  info: 'Informacao',
  warning: 'Alerta',
  success: 'Sucesso',
  error: 'Erro',
};

function getIcon(type: NotificationType) {
  switch (type) {
    case 'status_changed':
      return <FolderOpen className="h-5 w-5 text-blue-500" />;
    case 'nps_received':
      return <Star className="h-5 w-5 text-amber-500" />;
    case 'field_complete':
      return <Target className="h-5 w-5 text-green-500" />;
    case 'deadline_risk':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'goal_alert':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'document_added':
      return <FileText className="h-5 w-5 text-purple-500" />;
    case 'schedule_updated':
      return <Calendar className="h-5 w-5 text-teal-500" />;
    case 'sync_error':
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

export default function AdminNotifications() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  const basePath =
    profile?.role === 'admin'
      ? '/admin'
      : profile?.role === 'gerente'
      ? '/gerente'
      : '/cliente';

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page', user?.id, page, typeFilter, readFilter],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (readFilter === 'unread') {
        query = query.eq('read', false);
      } else if (readFilter === 'read') {
        query = query.eq('read', true);
      }

      const from = (page - 1) * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data: notifications, count, error } = await query;
      if (error) throw error;

      return {
        notifications: notifications as Notification[],
        total: count ?? 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
  });

  const notifications = data?.notifications ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user!.id)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const resolveLink = (link: string | null) => {
    if (!link) return null;
    if (link.startsWith('/')) {
      return link.replace('/projetos/', `${basePath}/projetos/`).replace('/admin/', basePath + '/');
    }
    return link;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="clarifyse-section-label">CENTRAL DE NOTIFICACOES</p>
        <div className="flex items-center gap-3 mt-1">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            Notificacoes
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Acompanhe todas as atualizacoes e alertas da plataforma.
        </p>
      </motion.div>

      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="status_changed">Status alterado</SelectItem>
              <SelectItem value="nps_received">NPS recebido</SelectItem>
              <SelectItem value="field_complete">Campo completo</SelectItem>
              <SelectItem value="deadline_risk">Risco de prazo</SelectItem>
              <SelectItem value="goal_alert">Alerta de meta</SelectItem>
              <SelectItem value="document_added">Documento adicionado</SelectItem>
              <SelectItem value="schedule_updated">Cronograma atualizado</SelectItem>
              <SelectItem value="sync_error">Erro de sincronizacao</SelectItem>
            </SelectContent>
          </Select>

          <Select value={readFilter} onValueChange={(v) => { setReadFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="unread">Nao lidas</SelectItem>
              <SelectItem value="read">Lidas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {total} notificaca{total !== 1 ? 'oes' : 'o'} encontrada{total !== 1 ? 's' : ''}
      </p>

      {/* Notifications list */}
      <div className="clarifyse-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma notificacao
            </h3>
            <p className="text-sm text-muted-foreground">
              {typeFilter !== 'all' || readFilter !== 'all'
                ? 'Nenhuma notificacao encontrada com esses filtros.'
                : 'Voce nao tem notificacoes ainda.'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const resolvedLink = resolveLink(notification.link);
              const content = (
                <div
                  key={notification.id}
                  className={cn(
                    'flex gap-4 p-4 transition-colors hover:bg-muted/30',
                    !notification.read && 'bg-primary/5'
                  )}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={cn(
                            'text-sm',
                            !notification.read ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), "dd 'de' MMMM 'de' yyyy 'as' HH:mm", { locale: ptBR })}
                          </span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              notification.type === 'error' || notification.type === 'deadline_risk' || notification.type === 'sync_error'
                                ? 'bg-red-100 text-red-700'
                                : notification.type === 'warning' || notification.type === 'goal_alert'
                                ? 'bg-amber-100 text-amber-700'
                                : notification.type === 'success' || notification.type === 'field_complete'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {typeLabels[notification.type] || notification.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            title="Marcar como lida"
                          >
                            <CheckCheck className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );

              if (resolvedLink) {
                return (
                  <Link
                    key={notification.id}
                    to={resolvedLink}
                    onClick={() => {
                      if (!notification.read) {
                        markAsReadMutation.mutate(notification.id);
                      }
                    }}
                  >
                    {content}
                  </Link>
                );
              }

              return content;
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Pagina {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
