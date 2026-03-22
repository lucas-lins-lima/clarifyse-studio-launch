import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Save, Loader2, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProjectFinancials, QuemFechou } from '@/types/project';

interface FinanceiroTabProps {
  projectId: string;
  projectName: string;
}

interface FormData {
  valor_total: string;
  custo_painel: string;
  custo_sala: string;
  custo_plataforma: string;
  custo_recrutamento: string;
  custo_incentivos: string;
  custo_transcricao: string;
  custo_elaboracao: string;
  custo_analise: string;
  custo_analytics_avancado: string;
  custo_dashboard: string;
  custo_relatorio_adicional: string;
  custo_outros: string;
  custo_outros_descricao: string;
  adicional_urgencia: boolean;
  quem_fechou: QuemFechou | '';
}

const initialFormData: FormData = {
  valor_total: '',
  custo_painel: '',
  custo_sala: '',
  custo_plataforma: '',
  custo_recrutamento: '',
  custo_incentivos: '',
  custo_transcricao: '',
  custo_elaboracao: '',
  custo_analise: '',
  custo_analytics_avancado: '',
  custo_dashboard: '',
  custo_relatorio_adicional: '',
  custo_outros: '',
  custo_outros_descricao: '',
  adicional_urgencia: false,
  quem_fechou: '',
};

export function FinanceiroTab({ projectId, projectName }: FinanceiroTabProps) {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: financials, isLoading } = useQuery({
    queryKey: ['project-financials', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_financials')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data as ProjectFinancials | null;
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (financials) {
      setFormData({
        valor_total: financials.valor_total?.toString() || '',
        custo_painel: financials.custo_painel?.toString() || '',
        custo_sala: financials.custo_sala?.toString() || '',
        custo_plataforma: financials.custo_plataforma?.toString() || '',
        custo_recrutamento: financials.custo_recrutamento?.toString() || '',
        custo_incentivos: financials.custo_incentivos?.toString() || '',
        custo_transcricao: financials.custo_transcricao?.toString() || '',
        custo_elaboracao: financials.custo_elaboracao?.toString() || '',
        custo_analise: financials.custo_analise?.toString() || '',
        custo_analytics_avancado: financials.custo_analytics_avancado?.toString() || '',
        custo_dashboard: financials.custo_dashboard?.toString() || '',
        custo_relatorio_adicional: financials.custo_relatorio_adicional?.toString() || '',
        custo_outros: financials.custo_outros?.toString() || '',
        custo_outros_descricao: financials.custo_outros_descricao || '',
        adicional_urgencia: financials.adicional_urgencia || false,
        quem_fechou: financials.quem_fechou || '',
      });
      setHasChanges(false);
    }
  }, [financials]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        project_id: projectId,
        valor_total: parseFloat(formData.valor_total) || 0,
        custo_painel: parseFloat(formData.custo_painel) || 0,
        custo_sala: parseFloat(formData.custo_sala) || 0,
        custo_plataforma: parseFloat(formData.custo_plataforma) || 0,
        custo_recrutamento: parseFloat(formData.custo_recrutamento) || 0,
        custo_incentivos: parseFloat(formData.custo_incentivos) || 0,
        custo_transcricao: parseFloat(formData.custo_transcricao) || 0,
        custo_elaboracao: parseFloat(formData.custo_elaboracao) || 0,
        custo_analise: parseFloat(formData.custo_analise) || 0,
        custo_analytics_avancado: parseFloat(formData.custo_analytics_avancado) || 0,
        custo_dashboard: parseFloat(formData.custo_dashboard) || 0,
        custo_relatorio_adicional: parseFloat(formData.custo_relatorio_adicional) || 0,
        custo_outros: parseFloat(formData.custo_outros) || 0,
        custo_outros_descricao: formData.custo_outros_descricao || null,
        adicional_urgencia: formData.adicional_urgencia,
        quem_fechou: formData.quem_fechou || null,
      };

      if (financials) {
        // Update existing
        const { error } = await supabase
          .from('project_financials')
          .update(payload)
          .eq('id', financials.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('project_financials')
          .insert(payload);
        if (error) throw error;
      }

      // Log history
      await supabase.from('project_history').insert({
        project_id: projectId,
        descricao: 'Dados financeiros atualizados',
        user_id: user?.id ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-financials', projectId] });
      toast.success('Dados financeiros salvos com sucesso!');
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  // Calculate totals
  const totals = useMemo(() => {
    const receita = parseFloat(formData.valor_total) || 0;
    const custo =
      (parseFloat(formData.custo_painel) || 0) +
      (parseFloat(formData.custo_sala) || 0) +
      (parseFloat(formData.custo_plataforma) || 0) +
      (parseFloat(formData.custo_recrutamento) || 0) +
      (parseFloat(formData.custo_incentivos) || 0) +
      (parseFloat(formData.custo_transcricao) || 0) +
      (parseFloat(formData.custo_elaboracao) || 0) +
      (parseFloat(formData.custo_analise) || 0) +
      (parseFloat(formData.custo_analytics_avancado) || 0) +
      (parseFloat(formData.custo_dashboard) || 0) +
      (parseFloat(formData.custo_relatorio_adicional) || 0) +
      (parseFloat(formData.custo_outros) || 0);

    const lucro = receita - custo;
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;

    return { receita, custo, lucro, margem };
  }, [formData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const CurrencyInput = ({ label, field, placeholder }: { label: string; field: keyof FormData; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <Input
          type="number"
          step="0.01"
          min="0"
          className="pl-9"
          value={formData[field] as string}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder || "0,00"}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita</p>
              <p className="font-semibold text-foreground">{formatCurrency(totals.receita)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo Total</p>
              <p className="font-semibold text-muted-foreground">{formatCurrency(totals.custo)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              totals.lucro >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
            )}>
              {totals.lucro >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lucro</p>
              <p className={cn(
                'font-semibold',
                totals.lucro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {formatCurrency(totals.lucro)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              totals.margem >= 30 ? 'bg-green-500/10 text-green-600' :
              totals.margem >= 15 ? 'bg-yellow-500/10 text-yellow-600' :
              'bg-red-500/10 text-red-600'
            )}>
              <PieChart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margem</p>
              <p className={cn(
                'font-semibold',
                totals.margem >= 30 ? 'text-green-600 dark:text-green-400' :
                totals.margem >= 15 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              )}>
                {totals.margem.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Receita do Projeto</h3>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
              size="sm"
              variant="gradient"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>

          <div className="space-y-4">
            <CurrencyInput label="Valor Total do Projeto" field="valor_total" />

            <div className="space-y-1.5">
              <Label className="text-sm">Quem Fechou</Label>
              <Select
                value={formData.quem_fechou}
                onValueChange={(v) => handleChange('quem_fechou', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="head">Head</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label className="text-sm">Projeto Urgente</Label>
                <p className="text-xs text-muted-foreground">Adicional de urgencia aplicado</p>
              </div>
              <Switch
                checked={formData.adicional_urgencia}
                onCheckedChange={(v) => handleChange('adicional_urgencia', v)}
              />
            </div>
          </div>
        </Card>

        {/* Costs */}
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4">Custos do Projeto</h3>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Quantitativa</p>
            <CurrencyInput label="Custo Painel" field="custo_painel" />
            <CurrencyInput label="Plataforma" field="custo_plataforma" />
            <CurrencyInput label="Elaboracao" field="custo_elaboracao" />
            <CurrencyInput label="Analise" field="custo_analise" />
            <CurrencyInput label="Analytics Avancado" field="custo_analytics_avancado" />

            <div className="border-t border-border my-4" />

            <p className="text-xs font-medium text-muted-foreground uppercase">Qualitativa</p>
            <CurrencyInput label="Aluguel Sala" field="custo_sala" />
            <CurrencyInput label="Recrutamento" field="custo_recrutamento" />
            <CurrencyInput label="Incentivos" field="custo_incentivos" />
            <CurrencyInput label="Transcricao" field="custo_transcricao" />

            <div className="border-t border-border my-4" />

            <p className="text-xs font-medium text-muted-foreground uppercase">Outros</p>
            <CurrencyInput label="Dashboard" field="custo_dashboard" />
            <CurrencyInput label="Relatorio Adicional" field="custo_relatorio_adicional" />
            <CurrencyInput label="Outros Custos" field="custo_outros" />

            {parseFloat(formData.custo_outros) > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm">Descricao (Outros)</Label>
                <Textarea
                  value={formData.custo_outros_descricao}
                  onChange={(e) => handleChange('custo_outros_descricao', e.target.value)}
                  placeholder="Descreva os outros custos..."
                  rows={2}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
