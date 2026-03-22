import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, MessageSquare, Target, Trophy, FolderPlus, CheckCheck } from 'lucide-react';
import { useNotifications, Notification } from '@/context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconMap = {
  new_response: MessageSquare,
  quota_reached: Target,
  sample_complete: Trophy,
  project_created: FolderPlus,
};

const colorMap = {
  new_response: 'text-[#7F77DD] bg-purple-50',
  quota_reached: 'text-[#1D9E75] bg-teal-50',
  sample_complete: 'text-[#1D9E75] bg-teal-50',
  project_created: 'text-[#2D1E6B] bg-indigo-50',
};

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead, clearNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (n: Notification) => {
    markRead(n.id);
    if (n.projectId) {
      navigate(`/projects/${n.projectId}`);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell size={20} className="text-white/80" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#1D9E75] text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-[#2D1E6B] text-sm">Notificações</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#1D9E75] hover:underline flex items-center gap-1"
                  >
                    <CheckCheck size={12} /> Marcar todas
                  </button>
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Nenhuma notificação ainda</p>
                <p className="text-xs text-gray-300 mt-1">
                  Novas respostas e eventos aparecerão aqui
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = iconMap[n.type];
                const colorClass = colorMap[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-[#F1EFE8] transition-colors text-left border-b border-gray-50 last:border-0 ${
                      !n.read ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2D1E6B] leading-tight">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed truncate">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-[#1D9E75] flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
