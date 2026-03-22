import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Bell, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const ALERT_SETTINGS_KEYS = [
  'alertas_email_ativo',
  'alertas_email_frequencia',
  'alertas_email_destino',
];

export function AlertasTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [ativo, setAtivo] = useState(false);
  const [frequencia, setFrequencia] = useState('diario');
  const [destino, setDestino] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_settings').select('key, value');
      if (error) throw error;
      const map: Record<string, string> = {};
      data.forEach((s) => { map[s.key] = s.value || ''; });
      return map;
    },
  });

  useEffect(() => {
    if (settings) {
      setAtivo(settings['alertas_email_ativo'] === 'true');
      setFrequencia(settings['alertas_email_frequencia'] || 'diario');
      setDestino(settings['alertas_email_destino'] || 'clarifysestrategyresearch@gmail.com');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { key: 'alertas_email_ativo', value: String(ativo) },
        { key: 'alertas_email_frequencia', value: frequencia },
        { key: 'alertas_email_destino', value: destino },
      ];
      for (const u of updates) {
        await supabase.from('system_settings').upsert(u, { onConflict: 'key' });
      }
    },
    onSuccess: () => {
      toast({ title: 'Configurações de alertas salvas.' });
      qc.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const ALERT_TYPES = [
    { label: 'Projeto com etapa em atraso', desc: 'Alertar quando alguma etapa do cronograma estiver atrasada.' },
    { label: 'Proposta pendente de aprovação há mais de 3 dias', desc: 'Lembrete para acompanhar propostas em aberto.' },
    { label: 'Projeto sem gerente responsável', desc: 'Notificar quando um projeto ativo não tiver gerente designado.' },
    { label: 'Quota de campo abaixo de 50% próxima da data de entrega', desc: 'Alerta de risco de atraso no campo.' },
    { label: 'Nota NPS abaixo de 7 recebida', desc: 'Alertar imediatamente ao receber uma avaliação detratora.' },
  ];

  return (
    <div className="space-y-6 max-w-lg">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="clarifyse-section-label text-xs mb-1">MONITORAMENTO</p>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold text-foreground">Alertas Automáticos</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os alertas que serão disparados automaticamente por e-mail.
        </p>
      </motion.div>

      <div className="clarifyse-card p-6 space-y-5">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Alertas por e-mail</p>
                <p className="text-xs text-muted-foreground">Ativar envio automático de alertas</p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>

            <div>
              <Label>E-mail de destino</Label>
              <Input
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
                disabled={!ativo}
              />
            </div>

            <div>
              <Label>Frequência de resumo</Label>
              <Select value={frequencia} onValueChange={setFrequencia} disabled={!ativo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imediato">Imediato (a cada evento)</SelectItem>
                  <SelectItem value="diario">Resumo diário</SelectItem>
                  <SelectItem value="semanal">Resumo semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-[#7B2D8B] to-[#A855F7] text-white border-0"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações de Alertas'}
            </Button>
          </>
        )}
      </div>

      <div className="clarifyse-card p-6 space-y-4">
        <p className="text-sm font-semibold">Tipos de alerta disponíveis</p>
        <div className="space-y-3">
          {ALERT_TYPES.map((a) => (
            <div key={a.label} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Bell className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
