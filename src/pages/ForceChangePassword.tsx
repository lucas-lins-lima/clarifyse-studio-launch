import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/assets/logo.png';
import { Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function ForceChangePassword() {
  const { profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
      const { data, error: fnError } = await supabase.functions.invoke('manage-users', {
        body: { action: 'change-password', new_password: newPassword },
      });

      if (fnError || data?.error) {
        setError(data?.error || fnError?.message || 'Erro ao alterar senha.');
        setSubmitting(false);
        return;
      }

      toast({
        title: 'Senha alterada com sucesso!',
        description: 'Você será redirecionado para o painel.',
      });

      await refreshProfile();

      const routes: Record<string, string> = {
        admin: '/admin',
        gerente: '/gerente',
        cliente: '/cliente',
      };
      navigate(routes[profile?.role || 'admin'] || '/admin', { replace: true });
    } catch (err) {
      setError('Erro ao alterar senha. Tente novamente.');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-clarifyse-purple-start/30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="clarifyse-card p-8 space-y-6">
          <div className="flex justify-center mb-2">
            <img src={logo} alt="Clarifyse" className="h-20 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-accent/10">
                <ShieldCheck className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Troca de Senha Obrigatória</h2>
            <p className="text-sm text-muted-foreground">
              Por segurança, altere sua senha antes de acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Alterar Senha'}
            </Button>
          </form>

          <button
            onClick={signOut}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sair
          </button>
        </div>
      </motion.div>
    </div>
  );
}
