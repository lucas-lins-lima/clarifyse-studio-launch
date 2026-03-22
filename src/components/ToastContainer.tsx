import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-in slide-in-from-right-full duration-300 ease-out"
          style={{ animationDuration: '300ms' }}
        >
          <div
            className="flex items-start gap-3 bg-white rounded-xl shadow-xl border-l-4 px-4 py-3 min-w-[300px] max-w-[400px]"
            style={{
              borderLeftColor:
                toast.type === 'success' ? '#1D9E75' : toast.type === 'error' ? '#e53e3e' : '#7F77DD',
            }}
          >
            <div className="mt-0.5 flex-shrink-0">
              {toast.type === 'success' && <CheckCircle size={18} className="text-[#1D9E75]" />}
              {toast.type === 'error' && <XCircle size={18} className="text-red-500" />}
              {toast.type === 'info' && <Info size={18} className="text-[#7F77DD]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2D1E6B] leading-tight">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
