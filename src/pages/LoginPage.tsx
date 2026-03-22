import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, Clock, BarChart3, ChevronRight } from 'lucide-react';

const USERS = [
  { email: 'admin@clarifyse.com', password: 'clarifyse123', role: 'admin', name: 'Admin Clarifyse' },
  { email: 'pesquisador@clarifyse.com', password: 'pesquisa123', role: 'pesquisador', name: 'Pesquisador Clarifyse' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    const user = USERS.find((u) => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('surveyForge_user', JSON.stringify(user));
      navigate('/dashboard');
    } else {
      setError('E-mail ou senha inválidos. Verifique suas credenciais.');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left side */}
      <div
        className="hidden md:flex flex-col w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2D1E6B 0%, #1a1142 60%, #0f0b2e 100%)' }}
      >
        {/* Decorative geometric elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white/5" />
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full border border-white/5" />
          <div className="absolute bottom-20 -left-20 w-96 h-96 rounded-full border border-white/5" />
          {/* Dot grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />
          {/* Teal accent line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#1D9E75] to-transparent opacity-60" />
        </div>

        <div className="relative z-10 flex flex-col h-full px-10 py-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 rounded-xl bg-[#1D9E75] flex items-center justify-center">
              <span className="text-white font-bold text-base">SF</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                SurveyForge
              </p>
              <p className="text-[#1D9E75] text-[10px] uppercase tracking-[3px]">Clarifyse</p>
            </div>
          </div>

          {/* Main content */}
          <div className="mb-auto mt-16">
            <p className="text-[#1D9E75] text-xs uppercase tracking-[4px] font-medium mb-4">
              PLATAFORMA DE PESQUISA DE MERCADO
            </p>
            <h1 className="text-5xl font-bold text-white mb-2 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              SurveyForge
            </h1>
            <h2 className="text-2xl text-white/80 mb-6 leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
              Crie, colete e analise<br />com clareza total
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm">
              Construa formulários profissionais, bloqueie cotas automaticamente, 
              acompanhe respostas em tempo real e gere análises completas com todas 
              as metodologias estatísticas da Clarifyse — tudo em um único ambiente.
            </p>

            {/* Bullet points */}
            <div className="space-y-3 mb-10">
              {[
                'Formulário tipo Typeform (uma pergunta por vez)',
                'Gestão automática de cotas e amostra',
                'Análise instantânea com Cluster, Regressão, Penalty, MaxDiff e mais',
                'Integração direta com o Clarifyse Insights',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <ChevronRight size={14} className="text-[#1D9E75] mt-0.5 flex-shrink-0" />
                  <span className="text-white/70 text-xs leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            {/* Stats cards */}
            <div className="flex gap-3">
              {[
                { icon: CheckCircle, value: '98%', label: 'COTAS ATINGIDAS' },
                { icon: Clock, value: '24/7', label: 'DISPONÍVEL' },
                { icon: BarChart3, value: 'Ao vivo', label: 'TEMPO REAL' },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 bg-white/8 backdrop-blur rounded-xl p-3 border border-white/10">
                  <stat.icon size={14} className="text-[#1D9E75] mb-1" />
                  <p className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>{stat.value}</p>
                  <p className="text-white/40 text-[9px] uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[#1D9E75] text-xs tracking-widest">
            Where questions become clarity.
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center bg-[#F1EFE8] px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#2D1E6B] flex items-center justify-center">
              <span className="text-white font-bold text-base">SF</span>
            </div>
            <p className="text-[#2D1E6B] font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              SurveyForge
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#2D1E6B] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              SurveyForge
            </h2>
            <p className="text-lg font-medium text-[#2D1E6B] mb-2">Acesse sua conta interna</p>
            <p className="text-sm text-[#64748B]">
              Acompanhe e gerencie todos os projetos de pesquisa da sua equipe com total visibilidade e em tempo real.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#1D9E75] mb-2">
                E-MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@clarifyse.com"
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#2D1E6B] placeholder-gray-400 outline-none focus:border-[#2D1E6B] focus:ring-2 focus:ring-[#2D1E6B]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#1D9E75] mb-2">
                SENHA
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-[#2D1E6B] placeholder-gray-400 outline-none focus:border-[#2D1E6B] focus:ring-2 focus:ring-[#2D1E6B]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D1E6B] transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <p className="text-xs text-center">
              <span className="text-[#1D9E75] hover:underline cursor-pointer">
                Esqueceu a senha? Fale com o administrador
              </span>
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar na plataforma'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs font-semibold text-[#2D1E6B] mb-2">Acesso Exclusivo para Equipe Clarifyse</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
              <p className="text-[10px] text-[#64748B]">Dashboards ao vivo — respostas atualizadas em tempo real</p>
            </div>
          </div>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-white rounded-xl border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 mb-1">Credenciais de demonstração:</p>
            <p className="text-[10px] text-[#2D1E6B]">admin@clarifyse.com / clarifyse123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
