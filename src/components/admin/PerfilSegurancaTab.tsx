import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function PerfilSegurancaTab() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Profile form
  const [name, setName] = useState(profile?.name || '');
  const [nameLoading, setNameLoading] = useState(false);

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Financial password
  const [finPwd, setFinPwd] = useState('');
  const [showFinPwd, setShowFinPwd] = useState(false);
  const [finPwdLoading, setFinPwdLoading] = useState(false);

  const { data: finPwdExists } = useQuery({
    queryKey: ['financial-password'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'financial_password')
        .single();
      return !!data?.value;
    },
  });

  async function saveName() {
    if (!name.trim()) return;
    setNameLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user!.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Nome atualizado com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setNameLoading(false); }
  }

  async function changePassword() {
    if (newPwd.length < 8) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter pelo menos 8 caracteres.', variant: 'destructive' });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: 'Senhas não coincidem', variant: 'destructive' });
      return;
    }
    setPwdLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'change-password', new_password: newPwd },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: 'Senha alterada com sucesso.' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setPwdLoading(false); }
  }

  async function saveFinancialPassword() {
    if (!finPwd.trim()) return;
    setFinPwdLoading(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key: 'financial_password', value: finPwd.trim() }, { onConflict: 'key' });
      if (error) throw error;
      toast({ title: 'Senha do módulo financeiro definida.' });
      setFinPwd('');
      qc.invalidateQueries({ queryKey: ['financial-password'] });
      qc.invalidateQueries({ queryKey: ['system-settings'] });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setFinPwdLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="clarifyse-section-label text-xs mb-1">CONTA</p>
        <h2 className="text-xl font-display font-bold text-foreground">Perfil e Segurança</h2>
      </motion.div>

      {/* Name */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Nome de Exibição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setName(profile?.name || '')} />
          </div>
          <Button size="sm" onClick={saveName} disabled={nameLoading || !name.trim()}>
            {nameLoading ? 'Salvando...' : 'Salvar Nome'}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nova senha</Label>
            <div className="relative">
              <Input
                type={showPwd ? 'text' : 'password'}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPwd((v) => !v)}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Confirmar nova senha</Label>
            <Input
              type={showPwd ? 'text' : 'password'}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={changePassword} disabled={pwdLoading || !newPwd || !confirmPwd}>
            {pwdLoading ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>

      {/* Financial password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-500" /> Senha do Módulo Financeiro
          </CardTitle>
          <CardDescription>
            {finPwdExists
              ? 'A senha do módulo financeiro está definida. Redefina abaixo para alterar.'
              : 'Nenhuma senha definida. Sem ela, o botão "Ver Distribuição de Lucro" não aparece.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{finPwdExists ? 'Nova senha do módulo financeiro' : 'Definir senha do módulo financeiro'}</Label>
            <div className="relative">
              <Input
                type={showFinPwd ? 'text' : 'password'}
                value={finPwd}
                onChange={(e) => setFinPwd(e.target.value)}
                placeholder="Senha para liberar Distribuição de Lucro"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowFinPwd((v) => !v)}
              >
                {showFinPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button size="sm" onClick={saveFinancialPassword} disabled={finPwdLoading || !finPwd.trim()}>
            {finPwdLoading ? 'Salvando...' : finPwdExists ? 'Redefinir Senha' : 'Definir Senha'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
