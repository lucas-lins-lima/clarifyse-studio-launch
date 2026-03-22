import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/assets/logo.png';
import { Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ForceChangePassword() {
  const { profile, changePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);

    try {
      const { error: changeErr } = await changePassword(newPassword);

      if (changeErr) {
        setError(changeErr);
        setSubmitting(false);
        return;
      }

      toast.success('Senha alterada com sucesso! Você será redirecionado para o painel.');

      // Redirecionar baseado no role
      const routes: Record<string, string> = {
        admin: '/admin',
        pesquisador: '/admin',
        gerente: '/gerente',
        cliente: '/cliente',
      };
      
      setTimeout(() => {
        navigate(routes[profile?.role || 'admin'] || '/admin', { replace: true });
      }, 1500);
    } catch (err) {
      setError('Erro ao alterar senha. Tente novamente.');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2D1E6B] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#FFFFFF 1px, transparent 1px), linear-gradient(90deg, #FFFFFF 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#2D1E6B] via-[#2D1E6B] to-[#7F77DD]/30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="flex justify-center mb-2">
            <img src={logo} alt="Clarifyse" className="h-16 object-contain" />
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-[#1D9E75]/10">
                <ShieldCheck className="h-6 w-6 text-[#1D9E75]" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#2D1E6B]">Troca de Senha Obrigatória</h2>
            <p className="text-sm text-[#64748B]">
              Por segurança, altere sua senha antes de acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">
                Nova Senha
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="h-11 rounded-xl border-gray-200 focus:ring-[#2D1E6B] focus:border-[#2D1E6B]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="h-11 rounded-xl border-gray-200 focus:ring-[#2D1E6B] focus:border-[#2D1E6B]"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 font-medium text-center bg-red-50 p-3 rounded-lg border border-red-100"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] hover:opacity-90 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </form>

          <button
            onClick={() => signOut()}
            className="w-full text-center text-sm text-[#64748B] hover:text-[#2D1E6B] transition-colors font-medium"
          >
            Sair
          </button>
        </div>
      </motion.div>
    </div>
  );
}
