import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { KeyRound, Copy, Check, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface TempPasswordModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

/**
 * Gera uma senha temporária segura no padrão Clarifyse@XXXX
 * onde XXXX é um número aleatório de 4 dígitos.
 */
function generateSecurePassword(): string {
  const adjectives = ['Alpha', 'Beta', 'Delta', 'Sigma', 'Omega', 'Prime', 'Nova', 'Apex'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Clarifyse${adj}@${num}`;
}

export function TempPasswordModal({
  open,
  onClose,
  userId,
  userName,
  onSuccess,
}: TempPasswordModalProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState(() => generateSecurePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setPassword(generateSecurePassword());
      setCopied(false);
      setConfirmed(false);
      setShowPassword(true);
    }
  }, [open]);

  const handleGenerateNew = useCallback(() => {
    setPassword(generateSecurePassword());
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = password;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [password]);

  const handleConfirm = useCallback(async () => {
    if (!password || password.length < 8) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'set-temp-password',
          user_id: userId,
          temp_password: password,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Erro ao definir senha temporária.');
      }

      setConfirmed(true);
      toast({
        title: 'Senha temporária definida!',
        description: `A senha foi configurada para ${userName}. Compartilhe com o usuário.`,
      });

      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Erro ao definir senha',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [password, userId, userName, toast, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-500" />
            Gerar Senha Temporária
          </DialogTitle>
          <DialogDescription>
            Defina uma senha temporária para <strong>{userName}</strong>. O usuário será obrigado
            a trocar a senha no próximo login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Password field */}
          <div className="space-y-1.5">
            <Label htmlFor="temp-password">Senha temporária</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="temp-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 font-mono"
                  placeholder="Mínimo 8 caracteres"
                  disabled={confirmed}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateNew}
                disabled={confirmed}
                title="Gerar nova senha aleatória"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Você pode usar a senha gerada automaticamente ou digitar uma de sua escolha.
            </p>
          </div>

          {/* Copy button */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleCopy}
            disabled={!password}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar senha
              </>
            )}
          </Button>

          {/* Info box */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-medium mb-1">Como funciona:</p>
            <ul className="space-y-0.5 text-xs list-disc list-inside">
              <li>Copie a senha e compartilhe com o usuário (WhatsApp, e-mail manual, etc.)</li>
              <li>Clique em "Confirmar e Salvar" para aplicar a senha no sistema</li>
              <li>No próximo login, o usuário será obrigado a criar uma nova senha</li>
            </ul>
          </div>

          {/* Success state */}
          {confirmed && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
              <p className="font-medium flex items-center gap-2">
                <Check className="h-4 w-4" />
                Senha temporária aplicada com sucesso!
              </p>
              <p className="text-xs mt-1">
                O badge "Senha temporária" aparecerá na listagem até o usuário fazer o primeiro login.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {confirmed ? 'Fechar' : 'Cancelar'}
          </Button>
          {!confirmed && (
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading || !password || password.length < 8}
              className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90"
            >
              {loading ? 'Salvando...' : 'Confirmar e Salvar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
