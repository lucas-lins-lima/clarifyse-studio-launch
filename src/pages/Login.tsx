import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/assets/logo.png';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { session, profile, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2D1E6B]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Se o usuário está logado e precisa trocar senha, redirecionar para a tela de troca
  if (session && profile && profile.requiresPasswordChange) {
    return <Navigate to="/force-change-password" replace />;
  }

  // Se o usuário está logado normalmente, redirecionar para o dashboard correto
  if (session && profile) {
    const routes: Record<string, string> = {
      admin: '/admin',
      pesquisador: '/admin',
      gerente: '/gerente',
      cliente: '/cliente',
    };
    return <Navigate to={routes[profile.role] || '/admin'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError('E-mail ou senha inválidos. Verifique suas credenciais.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1EFE8] overflow-hidden">
      <div className="w-full h-screen flex flex-col lg:flex-row">
        {/* LADO ESQUERDO */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-1/2 bg-[#2D1E6B] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          
          <div className="relative z-10 space-y-10">
            {/* Logo */}
            <div>
              <img src={logo} alt="Clarifyse" className="h-10 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>

            {/* Conteúdo Principal */}
            <div className="space-y-6">
              <p className="text-[#1D9E75] text-xs font-bold tracking-[0.3em] uppercase">
                PLATAFORMA DE PESQUISA DE MERCADO
              </p>

              <div className="space-y-2">
                <h1 className="font-display text-6xl font-bold leading-tight">
                  SurveyForge
                </h1>
                <h2 className="font-display text-3xl font-medium text-white/90">
                  Crie, colete e analise com clareza total
                </h2>
              </div>

              <p className="text-white/80 text-lg leading-relaxed max-w-xl font-sans">
                Construa formulários profissionais, bloqueie cotas automaticamente, acompanhe respostas em tempo real e gere análises completas com todas as metodologias estatísticas da Clarifyse — tudo em um único ambiente.
              </p>
            </div>

            {/* Bullet points */}
            <div className="space-y-4">
              {[
                'Formulário tipo Typeform (uma pergunta por vez)',
                'Gestão automática de cotas e amostra',
                'Análise instantânea com Cluster, Regressão, Penalty, MaxDiff, Conjoint, SHAP e mais',
                'Exportação Excel + JSON para o Clarifyse Insights',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#1D9E75] mt-0.5 flex-shrink-0" />
                  <span className="text-base text-white/90">{feature}</span>
                </div>
              ))}
            </div>

            {/* Cards de métricas */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-[#1D9E75]">98%</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest mt-1 font-bold">COTAS ATINGIDAS</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-white">24/7</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest mt-1 font-bold">DISPONÍVEL</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center relative">
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#1D9E75] rounded-full animate-pulse" />
                <p className="text-xl font-bold text-white">Ao vivo</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest mt-1 font-bold">STATUS</p>
              </div>
            </div>
          </div>

          {/* Slogan no rodapé */}
          <div className="relative z-10 mt-12">
            <p className="text-[#1D9E75] text-sm font-medium tracking-wide">
              Where questions become clarity.
            </p>
          </div>
        </motion.div>

        {/* LADO DIREITO */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[#F1EFE8]"
        >
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="space-y-3">
              <h2 className="font-display text-4xl font-bold text-[#2D1E6B]">
                SurveyForge
              </h2>
              <h3 className="text-xl font-semibold text-[#2D1E6B]/80">
                Acesse sua conta interna
              </h3>
              <p className="text-[#64748B] text-base leading-relaxed">
                Acompanhe e gerencie todos os projetos de pesquisa da sua equipe com total visibilidade e em tempo real.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-[#1D9E75] uppercase tracking-[0.2em]">
                    E-MAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="h-14 bg-white border-gray-200 rounded-xl text-[#2D1E6B] placeholder-gray-400 focus:ring-[#2D1E6B] focus:border-[#2D1E6B]"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-bold text-[#1D9E75] uppercase tracking-[0.2em]">
                      SENHA
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-14 bg-white border-gray-200 rounded-xl text-[#2D1E6B] placeholder-gray-400 pr-12 focus:ring-[#2D1E6B] focus:border-[#2D1E6B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D1E6B] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 font-medium text-center bg-red-50 p-3 rounded-lg border border-red-100"
                >
                  {error}
                </motion.p>
              )}

              {/* Forgot Password Link */}
              <div className="text-right">
                <button type="button" className="text-sm text-[#1D9E75] font-semibold hover:underline">
                  Esqueceu a senha? Fale com o administrador
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-14 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] hover:opacity-90 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20"
              >
                {submitting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  'Entrar na plataforma'
                )}
              </Button>
            </form>

            {/* Footer Info */}
            <div className="pt-8 border-t border-gray-200 space-y-4">
              <p className="text-xs text-[#2D1E6B] uppercase tracking-widest font-bold">
                Acesso Exclusivo para Equipe Clarifyse
              </p>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#1D9E75] flex-shrink-0 animate-pulse" />
                <p className="text-sm text-[#64748B]">
                  Dashboards ao vivo — respostas atualizadas em tempo real
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
