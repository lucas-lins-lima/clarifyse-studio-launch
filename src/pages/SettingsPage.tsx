import React, { useState } from 'react';
import { loadDB, saveDB } from '@/lib/surveyForgeDB';
import { useNotifications } from '@/context/NotificationContext';
import { Save, Building2, Users, FileText } from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useNotifications();
  const db = loadDB();
  const [company, setCompany] = useState(db.settings.nomeEmpresa);
  const [slogan, setSlogan] = useState(db.settings.slogan);

  const handleSave = () => {
    const d = loadDB();
    d.settings.nomeEmpresa = company.trim() || 'Clarifyse Strategy & Research';
    d.settings.slogan = slogan.trim() || 'Where questions become clarity.';
    saveDB(d);
    showToast({ type: 'success', title: 'Configurações salvas!', message: 'As configurações foram atualizadas com sucesso.' });
  };

  return (
    <div className="p-6 lg:p-8 min-h-full">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[4px] text-[#1D9E75] mb-1">CONFIGURAÇÕES</p>
        <h1 className="text-3xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Configurações da Plataforma
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Gerencie as configurações globais do SurveyForge</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Company settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Building2 size={18} className="text-[#2D1E6B]" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">EMPRESA</p>
              <h3 className="font-bold text-[#2D1E6B]">Dados da Empresa</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#1D9E75] font-semibold mb-1.5">
                NOME DA EMPRESA
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#2D1E6B] outline-none focus:border-[#2D1E6B] focus:ring-2 focus:ring-[#2D1E6B]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#1D9E75] font-semibold mb-1.5">
                SLOGAN
              </label>
              <input
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#2D1E6B] outline-none focus:border-[#2D1E6B] focus:ring-2 focus:ring-[#2D1E6B]/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-[#1D9E75]" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">EQUIPE</p>
              <h3 className="font-bold text-[#2D1E6B]">Usuários da Equipe</h3>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Admin Clarifyse', email: 'admin@clarifyse.com', role: 'Administrador' },
              { name: 'Pesquisador Clarifyse', email: 'pesquisador@clarifyse.com', role: 'Pesquisador' },
            ].map((user) => (
              <div key={user.email} className="flex items-center gap-3 p-3 bg-[#F1EFE8] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#2D1E6B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2D1E6B] truncate">{user.name}</p>
                  <p className="text-xs text-[#64748B] truncate">{user.email}</p>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-white text-[#7F77DD] border border-purple-100 flex-shrink-0">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form templates info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-amber-700" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">FORMULÁRIOS</p>
              <h3 className="font-bold text-[#2D1E6B]">Etapas Padrão</h3>
            </div>
          </div>
          <p className="text-sm text-[#64748B]">
            Configurações de etapas padrão para formulários estarão disponíveis em uma versão futura do SurveyForge.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.97] shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' }}
        >
          <Save size={16} />
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
