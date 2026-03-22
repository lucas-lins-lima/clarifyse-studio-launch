import React, { useState } from 'react';
import { Project } from '@/lib/surveyForgeDB';
import { useNotifications } from '@/context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ExternalLink, BarChart3, Link, ArrowRight } from 'lucide-react';

interface Props {
  project: Project;
}

export function SharingTab({ project }: Props) {
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [linkCopied, setLinkCopied] = useState(false);

  const surveyLink = `${window.location.origin}/survey/${project.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyLink);
      setLinkCopied(true);
      showToast({ type: 'success', title: 'Link copiado!', message: 'O link do formulário foi copiado para sua área de transferência.' });
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      showToast({ type: 'error', title: 'Erro ao copiar', message: 'Não foi possível copiar o link. Tente novamente.' });
    }
  };

  const handleSendToInsights = () => {
    // Persist data and navigate
    const insightKey = `surveyForgeInsights_${project.id}`;
    const insightData = {
      projectId: project.id,
      projectName: project.name,
      objective: project.objective,
      sampleSize: project.sampleSize,
      pilar: project.pilar,
      questions: project.formQuestions,
      responses: project.responses,
      quotas: project.quotas,
      exportedAt: new Date().toISOString(),
      metrics: {
        totalResponses: project.responses.length,
        completionRate: Math.round((project.responses.length / project.sampleSize) * 100),
        avgTimeSeconds: project.responses.length > 0
          ? Math.round(project.responses.reduce((a, r) => a + r.timeSpentSeconds, 0) / project.responses.length)
          : 0,
        qualityRate: project.responses.length > 0
          ? Math.round((project.responses.filter((r) => r.qualityFlag === 'OK').length / project.responses.length) * 100)
          : 0,
      },
    };
    localStorage.setItem(insightKey, JSON.stringify(insightData));
    showToast({ type: 'success', title: 'Dados enviados!', message: 'Navegando para o Clarifyse Insights...' });
    setTimeout(() => navigate(`/insights/${project.id}`), 1000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-1">COMPARTILHAMENTO</p>
        <h2 className="text-2xl font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Compartilhamento & Integrações
        </h2>
        <p className="text-sm text-[#64748B] mt-1">
          Compartilhe o link do formulário ou envie os dados para o Clarifyse Insights.
        </p>
      </div>

      {/* Public Link */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Link size={18} className="text-[#2D1E6B]" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">LINK PÚBLICO</p>
            <h3 className="font-bold text-[#2D1E6B] text-sm">Link para Respondentes</h3>
          </div>
        </div>

        <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
          Compartilhe este link com os participantes da pesquisa. Qualquer pessoa com acesso ao link pode responder.
        </p>

        <div className="flex gap-2 flex-col sm:flex-row">
          <div className="flex-1 flex items-center bg-[#F1EFE8] border border-gray-200 rounded-xl px-4 py-2.5 overflow-hidden">
            <span className="text-xs text-[#64748B] truncate font-mono">{surveyLink}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] flex-shrink-0 ${
              linkCopied
                ? 'bg-[#1D9E75] text-white'
                : 'border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white'
            }`}
          >
            {linkCopied ? (
              <><Check size={14} /> Copiado!</>
            ) : (
              <><Copy size={14} /> Copiar Link</>
            )}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <a
            href={`/survey/${project.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#7F77DD] hover:text-[#2D1E6B] transition-colors font-medium"
          >
            <ExternalLink size={12} />
            Abrir formulário em nova aba
          </a>
        </div>
      </div>

      {/* Send to Insights */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <BarChart3 size={18} className="text-[#7F77DD]" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[3px] text-[#1D9E75] font-semibold">INTEGRAÇÃO</p>
            <h3 className="font-bold text-[#2D1E6B] text-sm">Clarifyse Insights</h3>
          </div>
        </div>

        <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
          Envie os dados estruturados deste projeto — perguntas, respostas e métricas — diretamente para o módulo Clarifyse Insights para análises avançadas.
        </p>

        {/* Data summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Perguntas', value: project.formQuestions.length },
            { label: 'Respostas', value: project.responses.length },
            { label: 'Cotas', value: project.quotas.length },
          ].map((item) => (
            <div key={item.label} className="bg-[#F1EFE8] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#2D1E6B]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {item.value}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-[#64748B]">{item.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleSendToInsights}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.97] shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' }}
        >
          <BarChart3 size={16} />
          Enviar para Clarifyse Insights
          <ArrowRight size={16} />
        </button>

        <p className="text-[10px] text-[#64748B] text-center mt-3">
          Os dados serão persistidos e você será redirecionado para a página de Insights do projeto.
        </p>
      </div>
    </div>
  );
}
