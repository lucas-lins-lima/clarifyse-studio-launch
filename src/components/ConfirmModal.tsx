import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmColor = confirmVariant === 'danger'
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-orange-500 hover:bg-orange-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(45,30,107,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in slide-in-from-bottom-4 duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${confirmVariant === 'danger' ? 'bg-red-50' : 'bg-orange-50'}`}>
            <AlertTriangle size={18} className={confirmVariant === 'danger' ? 'text-red-500' : 'text-orange-500'} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#2D1E6B] text-base mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {title}
            </h3>
            <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-[#64748B] hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97] ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
