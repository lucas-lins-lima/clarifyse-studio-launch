import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CostConfig {
  key: string;
  label: string;
  description?: string;
  value: number | null;
}

const CPR_CONFIGS: CostConfig[] = [
  { key: 'cpr_publico_geral_15', label: 'Publico Geral - Ate 15 questoes', value: null },
  { key: 'cpr_publico_geral_30', label: 'Publico Geral - 16 a 30 questoes', value: null },
  { key: 'cpr_publico_geral_31plus', label: 'Publico Geral - 31+ questoes', value: null },
  { key: 'cpr_criterio_simples_15', label: 'Criterio Simples - Ate 15 questoes', value: null },
  { key: 'cpr_criterio_simples_30', label: 'Criterio Simples - 16 a 30 questoes', value: null },
  { key: 'cpr_criterio_simples_31plus', label: 'Criterio Simples - 31+ questoes', value: null },
  { key: 'cpr_segmentado_15', label: 'Segmentado - Ate 15 questoes', value: null },
  { key: 'cpr_segmentado_30', label: 'Segmentado - 16 a 30 questoes', value: null },
  { key: 'cpr_segmentado_31plus', label: 'Segmentado - 31+ questoes', value: null },
  { key: 'cpr_nicho_15', label: 'Nicho - Ate 15 questoes', value: null },
  { key: 'cpr_nicho_30', label: 'Nicho - 16 a 30 questoes', value: null },
  { key: 'cpr_nicho_31plus', label: 'Nicho - 31+ questoes', value: null },
];

const QUANTI_CONFIGS: CostConfig[] = [
  { key: 'custo_plataforma_survey', label: 'Plataforma de Survey', description: 'Custo fixo por projeto' },
  { key: 'custo_elaboracao_instrumento', label: 'Elaboracao do Instrumento', description: 'Custo fixo' },
  { key: 'custo_analise_entregavel', label: 'Analise e Entregavel', description: 'Custo fixo' },
  { key: 'custo_analytics_avancado', label: 'Analytics Avancado', description: 'Custo adicional' },
];

const QUALI_CONFIGS: CostConfig[] = [
  { key: 'custo_aluguel_sala', label: 'Aluguel de Sala', description: 'Por sessao' },
  { key: 'custo_moderacao_sessao', label: 'Moderacao', description: 'Por sessao' },
  { key: 'custo_recrutamento_participante', label: 'Recrutamento', description: 'Por participante' },
  { key: 'custo_incentivo_participante', label: 'Incentivo', description: 'Por participante' },
  { key: 'custo_transcricao_hora', label: 'Transcricao', description: 'Por hora' },
  { key: 'custo_elaboracao_roteiro', label: 'Elaboracao de Roteiro', description: 'Custo fixo' },
  { key: 'custo_analise_qualitativa', label: 'Analise Qualitativa', description: 'Custo fixo' },
];

export function ConfiguracoesCustos() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: defaults, isLoading } = useQuery({
    queryKey: ['calculator-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calculator_defaults')
        .select('key, value');

      if (error) throw error;

      const result: Record<string, number | null> = {};
      const initialValues: Record<string, string> = {};
      
      (data ?? []).forEach((item: any) => {
        const val = item.value ? Number(item.value) : null;
        result[item.key] = val;
        initialValues[item.key] = val !== null ? val.toString() : '';
      });
      
      setValues(initialValues);
      return result;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Array<{ key: string; value: number | null }>) => {
      for (const update of updates) {
        const { error } = await supabase
          .from('calculator_defaults')
          .update({ value: update.value })
          .eq('key', update.key);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calculator-defaults'] });
      toast.success('Custos atualizados com sucesso!');
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updates: Array<{ key: string; value: number | null }> = [];
    
    Object.entries(values).forEach(([key, value]) => {
      const numValue = value === '' ? null : parseFloat(value);
      if (defaults && defaults[key] !== numValue) {
        updates.push({ key, value: numValue });
      }
    });

    if (updates.length > 0) {
      updateMutation.mutate(updates);
    }
  };

  const renderCostSection = (title: string, configs: CostConfig[]) => (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {configs.map((config) => (
          <div key={config.key} className="space-y-1.5">
            <Label className="text-sm">{config.label}</Label>
            {config.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-9"
                value={values[config.key] ?? ''}
                onChange={(e) => handleChange(config.key, e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with save button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Configuracao de Custos Padrao</h3>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          variant="gradient"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alteracoes
        </Button>
      </div>

      {/* CPR Section */}
      <Card className="p-5">
        <h3 className="font-semibold text-foreground mb-2">Custo por Resposta (CPR)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Valores utilizados para calcular o custo de painel em pesquisas quantitativas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CPR_CONFIGS.map((config) => (
            <div key={config.key} className="space-y-1.5">
              <Label className="text-sm">{config.label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-9"
                  value={values[config.key] ?? ''}
                  onChange={(e) => handleChange(config.key, e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quantitativa costs */}
      {renderCostSection('Custos - Pesquisa Quantitativa', QUANTI_CONFIGS)}

      {/* Qualitativa costs */}
      {renderCostSection('Custos - Pesquisa Qualitativa', QUALI_CONFIGS)}
    </div>
  );
}
