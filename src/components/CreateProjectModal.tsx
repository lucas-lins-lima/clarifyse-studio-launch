import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Project } from '@/lib/surveyForgeDB';

const PILARES: Project['pilar'][] = ['DISCOVER', 'BRAND', 'INNOVATE', 'DECIDE', 'EXPERIENCE', 'ANALYTICS'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    objective: string;
    sampleSize: number;
    pilar: Project['pilar'];
  }) => void;
}

export function CreateProjectModal({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [sampleSize, setSampleSize] = useState('');
  const [pilar, setPilar] = useState<Project['pilar']>('DISCOVER');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nome é obrigatório';
    if (!objective.trim()) errs.objective = 'Objetivo é obrigatório';
    const n = parseInt(sampleSize);
    if (!sampleSize || isNaN(n) || n <= 0) errs.sampleSize = 'Informe um número válido maior que 0';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({ name: name.trim(), objective: objective.trim(), sampleSize: parseInt(sampleSize), pilar });
    setName(''); setObjective(''); setSampleSize(''); setPilar('DISCOVER'); setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(45,30,107,0.5)' }}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-[10px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">NOVO PROJETO</p>
            <h2 className="text-xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Criar Pesquisa
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#1D9E75] font-semibold mb-1.5">
              NOME DO PROJETO *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pesquisa de Satisfação Avon Q4"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm text-[#2D1E6B] outline-none focus:ring-2 transition-all ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#2D1E6B] focus:ring-[#2D1E6B]/10'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#1D9E75] font-semibold mb-1.5">
              OBJETIVO DO ESTUDO *
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Descreva o objetivo principal desta pesquisa..."
              rows={3}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm text-[#2D1E6B] outline-none focus:ring-2 transition-all resize-none ${errors.objective ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#2D1E6B] focus:ring-[#2D1E6B]/10'}`}
            />
            {errors.objective && <p className="text-xs text-red-500 mt-1">{errors.objective}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#1D9E75] font-semibold mb-1.5">
                TAMANHO DA AMOSTRA *
              </label>
              <input
                type="number"
                value={sampleSize}
                onChange={(e) => setSampleSize(e.target.value)}
                placeholder="500"
                min="1"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-[#2D1E6B] outline-none focus:ring-2 transition-all ${errors.sampleSize ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#2D1E6B] focus:ring-[#2D1E6B]/10'}`}
              />
              {errors.sampleSize && <p className="text-xs text-red-500 mt-1">{errors.sampleSize}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#1D9E75] font-semibold mb-1.5">
                PILAR CLARIFYSE *
              </label>
              <select
                value={pilar}
                onChange={(e) => setPilar(e.target.value as Project['pilar'])}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#2D1E6B] outline-none focus:border-[#2D1E6B] focus:ring-2 focus:ring-[#2D1E6B]/10 transition-all bg-white"
              >
                {PILARES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-[#64748B] hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' }}
            >
              Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
