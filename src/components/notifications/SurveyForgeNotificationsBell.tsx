import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, MessageSquare, FolderOpen, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  loadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
} from '@/lib/surveyForgeDB';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  projectId?: string;
  timestamp: string;
  read: boolean;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'new_response':
      return <MessageSquare className="h-4 w-4 text-[#1D9E75]" />;
    case 'sample_complete':
      return <CheckCircle2 className="h-4 w-4 text-[#1D9E75]" />;
    case 'project_created':
      return <FolderOpen className="h-4 w-4 text-[#7F77DD]" />;
    case 'quota_complete':
      return <CheckCircle2 className="h-4 w-4 text-[#2D1E6B]" />;
    default:
      return <Info className="h-4 w-4 text-[#64748B]" />;
  }
}

export const SurveyForgeNotificationsBell = React.memo(function SurveyForgeNotificationsBell() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userId = profile?.id || null;
  const isAdmin = profile?.role === 'admin';
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(() => {
    // Admin vê todas; pesquisador vê apenas as suas
    const notifs = loadNotifications(isAdmin ? null : userId);
    setNotifications(notifs);
    setUnreadCount(getUnreadNotificationsCount(isAdmin ? null : userId));
  }, [userId, isAdmin]);

  useEffect(() => {
    refreshNotifications();
    // Poll for new notifications every 5 seconds
    const interval = setInterval(refreshNotifications, 5000);
    // Also listen to storage changes
    const handleStorage = () => refreshNotifications();
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshNotifications]);

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(isAdmin ? null : userId);
    refreshNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
      refreshNotifications();
    }
    if (notification.projectId) {
      navigate(`/admin/projetos/${notification.projectId}`);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-white/10">
          <Bell className="h-5 w-5 text-[#2D1E6B]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-[#1D9E75] text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 rounded-2xl shadow-xl border-gray-100" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#F1EFE8] rounded-t-2xl">
          <div>
            <h4 className="font-display font-bold text-[#2D1E6B] text-sm">Notificações</h4>
            {unreadCount > 0 && (
              <p className="text-[10px] text-[#1D9E75] font-bold uppercase tracking-widest mt-0.5">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-[#1D9E75] hover:bg-[#1D9E75]/10 font-bold"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[360px]">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="h-10 w-10 mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-bold text-[#2D1E6B]">Nenhuma notificação</p>
              <p className="text-xs text-[#64748B] mt-1">As atividades da plataforma aparecerão aqui.</p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => {
                const timeAgo = (() => {
                  try {
                    return formatDistanceToNow(new Date(notification.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    });
                  } catch {
                    return 'recentemente';
                  }
                })();

                return (
                  <button
                    key={notification.id}
                    className={cn(
                      'w-full text-left px-5 py-4 flex gap-3 hover:bg-[#F1EFE8] transition-colors border-b border-gray-50 last:border-0',
                      !notification.read && 'bg-[#F1EFE8]/60'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mt-0.5 p-2 rounded-xl bg-white shadow-sm border border-gray-100">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm leading-tight',
                          notification.read ? 'font-medium text-[#64748B]' : 'font-bold text-[#2D1E6B]'
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-[#1D9E75] mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-[#64748B]/60 font-medium uppercase tracking-wider mt-1.5">
                        {timeAgo}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
});
