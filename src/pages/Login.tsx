import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/assets/logo.png';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { session, profile, loading } = useAuth();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clarifyse-deep-purple">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (session && profile) {
    // Force password change on first access
    if (profile.must_change_password) {
      return <Navigate to="/trocar-senha" replace />;
    }
    const routes: Record<string, string> = {
      admin: '/admin',
      gerente: '/gerente',
      cliente: '/cliente',
    };
    return <Navigate to={routes[profile.role] || '/cliente'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError('E-mail ou senha inválidos. Verifique suas credenciais.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-clarifyse-light-gray overflow-hidden">
      <div className="w-full h-screen flex">
        {/* Left Panel - Brand Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex w-1/2 bg-clarifyse-deep-purple text-white p-12 flex-col justify-between relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-clarifyse-accent-purple/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-clarifyse-teal/10 to-transparent rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10 space-y-8">
            {/* Logo */}
            <div>
              <img src={logo} alt="Clarifyse" className="h-12 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>

            {/* Brand Message */}
            <div className="space-y-6">
              <p className="text-clarifyse-teal text-xs font-semibold tracking-widest uppercase">
                Plataforma de Pesquisa de Mercado
              </p>

              <h1 className="font-display text-5xl font-bold leading-tight">
                Transparência <span className="text-clarifyse-accent-purple">total</span> no seu projeto
              </h1>

              <p className="text-gray-300 text-sm leading-relaxed">
                Acompanhe status de campo, cotas, cronograma e histórico de projetos em tempo real — em um único ambiente.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              {[
                'Status de campo em tempo real',
                'Gestão de cotas e metas por perfil',
                'Cronograma interativo com marcos',
                'Acesso 24/7 com portal exclusivo',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-clarifyse-teal flex-shrink-0" />
                  <span className="text-sm text-gray-200">{feature}</span>
                </div>
              ))}
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="border border-gray-600 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-clarifyse-teal">98%</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Cotas Atingidas</p>
              </div>
              <div className="border border-gray-600 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Disponível</p>
              </div>
              <div className="border border-gray-600 rounded-lg p-4 text-center relative">
                <div className="absolute top-2 right-2 w-2 h-2 bg-clarifyse-teal rounded-full animate-pulse" />
                <p className="text-2xl font-bold text-white">Ao</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Vivo</p>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="relative z-10">
            <p className="text-gray-400 text-xs italic">Where insight becomes clarity.</p>
          </div>
        </motion.div>

        {/* Right Panel - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-clarifyse-light-gray"
        >
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="space-y-2 mb-8">
              <p className="text-clarifyse-teal text-xs font-semibold tracking-widest uppercase">
                Portal do Cliente
              </p>
              <h2 className="font-display text-4xl font-bold text-clarifyse-deep-purple">
                Acesse sua conta
              </h2>
              <p className="text-gray-600 text-sm">
                Acompanhe seus projetos com total visibilidade e em tempo real.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-clarifyse-deep-purple uppercase tracking-wide">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-clarifyse-deep-purple uppercase tracking-wide">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-12 bg-white border-gray-300 text-gray-900 placeholder-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              {/* Forgot Password Link */}
              <div className="text-center">
                <p className="text-sm text-clarifyse-teal font-medium">
                  Esqueceu a senha? Fale com o gestor
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-clarifyse-teal hover:bg-clarifyse-teal-light text-black font-semibold text-base rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Entrar no portal'
                )}
              </Button>
            </form>

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-gray-300 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Acesso Exclusivo para Clientes
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-clarifyse-teal flex-shrink-0 animate-pulse" />
                <p className="text-xs text-gray-600">
                  Dashboards <span className="font-semibold">ao vivo</span> — dados atualizados em tempo real
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
