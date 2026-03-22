import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const FIELDS = [
  { key: 'nome_empresa', label: 'Nome da Empresa', placeholder: 'Clarifyse Strategy & Research' },
  { key: 'email_suporte', label: 'E-mail de Suporte', placeholder: 'suporte@clarifyse.com' },
  { key: 'whatsapp', label: 'Número de WhatsApp', placeholder: '(11) 99310-6662' },
  { key: 'slogan', label: 'Slogan (tela de login)', placeholder: 'Where insight becomes clarity.' },
];

export function DadosEmpresaTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value');
      if (error) throw error;
      const map: Record<string, string> = {};
      data.forEach((s) => { map[s.key] = s.value || ''; });
      return map;
    },
  });

  useEffect(() => {
    if (settings) setValues(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const { key } of FIELDS) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({ key, value: values[key] || '' }, { onConflict: 'key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Dados da empresa salvos com sucesso.' });
      qc.invalidateQueries({ queryKey: ['system-settings'] });
      qc.invalidateQueries({ queryKey: ['system-settings-public'] });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6 max-w-lg">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="clarifyse-section-label text-xs mb-1">CONFIGURAÇÕES</p>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold text-foreground">Dados da Empresa</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Estas informações alimentam dinamicamente todas as telas da plataforma.
        </p>
      </motion.div>

      <div className="clarifyse-card p-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))
        ) : (
          FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                value={values[key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))
        )}
        <Button
          className="w-full bg-gradient-to-r from-[#7B2D8B] to-[#A855F7] text-white border-0 mt-2"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || isLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Dados da Empresa'}
        </Button>
      </div>
    </div>
  );
}
