import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Goal, GoalPeriodType } from '@/types/project';
import { useToast } from '@/hooks/use-toast';
import { GoalCard } from './GoalCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalFormData {
  periodo_tipo: GoalPeriodType;
  periodo_referencia: string;
  meta_receita: string;
  meta_projetos_encerrados: string;
  meta_margem_media: string;
  meta_nps_medio: string;
}

function getPeriodLabel(tipo: GoalPeriodType, referencia: string): string {
  try {
    const [year, period] = referencia.split('-');
    if (tipo === 'mensal') {
      const date = new Date(Number(year), Number(period) - 1, 1);
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    } else {
      return `${period}º Trimestre de ${year}`;
    }
  } catch {
    return referencia;
  }
}

function generatePeriodOptions(tipo: GoalPeriodType): { value: string; label: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const options: { value: string; label: string }[] = [];

  if (tipo === 'mensal') {
    for (let y = currentYear; y >= currentYear - 1; y--) {
      for (let m = 12; m >= 1; m--) {
        const date = new Date(y, m - 1, 1);
        if (date <= now || y === currentYear) {
          options.push({
            value: `${y}-${String(m).padStart(2, '0')}`,
            label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
          });
        }
        if (options.length >= 12) break;
      }
      if (options.length >= 12) break;
    }
  } else {
    for (let y = currentYear; y >= currentYear - 1; y--) {
      for (let q = 4; q >= 1; q--) {
        options.push({
          value: `${y}-${q}`,
          label: `${q}º Trimestre de ${y}`,
        });
        if (options.length >= 8) break;
      }
      if (options.length >= 8) break;
    }
  }

  return options;
}

export function GoalsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedType, setSelectedType] = useState<GoalPeriodType>('mensal');
  const [form, setForm] = useState<GoalFormData>({
    periodo_tipo: 'mensal',
    periodo_referencia: '',
    meta_receita: '',
    meta_projetos_encerrados: '',
    meta_margem_media: '',
    meta_nps_medio: '',
  });

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals', selectedType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('periodo_tipo', selectedType)
        .order('periodo_referencia', { ascending: false });

      if (error) throw error;
      return data as Goal[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: currentProgress } = useQuery({
    queryKey: ['goals-progress', goals],
    queryFn: async () => {
      if (!goals.length) return {};

      const progressMap: Record<string, {
        receita: number;
        projetos_encerrados: number;
        margem_media: number;
        nps_medio: number;
      }> = {};

      for (const goal of goals) {
        const [year, period] = goal.periodo_referencia.split('-');
        let startDate: Date;
        let endDate: Date;

        if (goal.periodo_tipo === 'mensal') {
          startDate = startOfMonth(new Date(Number(year), Number(period) - 1, 1));
          endDate = endOfMonth(startDate);
        } else {
          const quarterMonth = (Number(period) - 1) * 3;
          startDate = startOfQuarter(new Date(Number(year), quarterMonth, 1));
          endDate = endOfQuarter(startDate);
        }

        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        // Fetch projects with financials for this period
        const { data: projects } = await supabase
          .from('projects')
          .select(`
            id,
            status,
            project_financials (valor_total, custo_painel, custo_sala, custo_plataforma, custo_recrutamento, custo_incentivos, custo_transcricao, custo_elaboracao, custo_analise, custo_analytics_avancado, custo_dashboard, custo_relatorio_adicional, custo_outros)
          `)
          .is('deleted_at', null)
          .gte('created_at', startStr)
          .lte('created_at', endStr);

        // Fetch NPS for this period
        const { data: npsData } = await supabase
          .from('project_nps')
          .select('nota')
          .gte('created_at', startStr)
          .lte('created_at', endStr);

        let totalReceita = 0;
        let totalCusto = 0;
        let projetosEncerrados = 0;

        (projects ?? []).forEach((p: any) => {
          if (p.status === 'Encerrado') {
            projetosEncerrados++;
          }
          const fin = p.project_financials?.[0];
          if (fin) {
            totalReceita += Number(fin.valor_total) || 0;
            const custo =
              (Number(fin.custo_painel) || 0) +
              (Number(fin.custo_sala) || 0) +
              (Number(fin.custo_plataforma) || 0) +
              (Number(fin.custo_recrutamento) || 0) +
              (Number(fin.custo_incentivos) || 0) +
              (Number(fin.custo_transcricao) || 0) +
              (Number(fin.custo_elaboracao) || 0) +
              (Number(fin.custo_analise) || 0) +
              (Number(fin.custo_analytics_avancado) || 0) +
              (Number(fin.custo_dashboard) || 0) +
              (Number(fin.custo_relatorio_adicional) || 0) +
              (Number(fin.custo_outros) || 0);
            totalCusto += custo;
          }
        });

        const margem = totalReceita > 0 ? ((totalReceita - totalCusto) / totalReceita) * 100 : 0;

        // NPS calculation
        const responses = npsData ?? [];
        let npsScore = 0;
        if (responses.length > 0) {
          const promoters = responses.filter((r) => r.nota >= 9).length;
          const detractors = responses.filter((r) => r.nota <= 6).length;
          npsScore = ((promoters - detractors) / responses.length) * 100;
        }

        progressMap[goal.id] = {
          receita: totalReceita,
          projetos_encerrados: projetosEncerrados,
          margem_media: margem,
          nps_medio: npsScore,
        };
      }

      return progressMap;
    },
    enabled: goals.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const payload = {
        periodo_tipo: data.periodo_tipo,
        periodo_referencia: data.periodo_referencia,
        meta_receita: data.meta_receita ? parseFloat(data.meta_receita.replace(/[^\d.,]/g, '').replace(',', '.')) : null,
        meta_projetos_encerrados: data.meta_projetos_encerrados ? parseInt(data.meta_projetos_encerrados) : null,
        meta_margem_media: data.meta_margem_media ? parseFloat(data.meta_margem_media) : null,
        meta_nps_medio: data.meta_nps_medio ? parseFloat(data.meta_nps_medio) : null,
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update(payload)
          .eq('id', editingGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('goals')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingGoal ? 'Meta atualizada com sucesso.' : 'Meta criada com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals-progress'] });
      closeDialog();
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao salvar meta',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Meta excluída com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao excluir',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const openDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setForm({
        periodo_tipo: goal.periodo_tipo,
        periodo_referencia: goal.periodo_referencia,
        meta_receita: goal.meta_receita?.toString() ?? '',
        meta_projetos_encerrados: goal.meta_projetos_encerrados?.toString() ?? '',
        meta_margem_media: goal.meta_margem_media?.toString() ?? '',
        meta_nps_medio: goal.meta_nps_medio?.toString() ?? '',
      });
    } else {
      setEditingGoal(null);
      const now = new Date();
      const defaultRef = selectedType === 'mensal'
        ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        : `${now.getFullYear()}-${Math.ceil((now.getMonth() + 1) / 3)}`;
      setForm({
        periodo_tipo: selectedType,
        periodo_referencia: defaultRef,
        meta_receita: '',
        meta_projetos_encerrados: '',
        meta_margem_media: '',
        meta_nps_medio: '',
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.periodo_referencia) {
      toast({ title: 'Selecione um período.', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(form);
  };

  const periodOptions = generatePeriodOptions(form.periodo_tipo);

  return (
    <div className="space-y-6">
      {/* Header with type toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setSelectedType('mensal')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedType === 'mensal'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensais
          </button>
          <button
            onClick={() => setSelectedType('trimestral')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedType === 'trimestral'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Trimestrais
          </button>
        </div>

        <Button
          onClick={() => openDialog()}
          className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Goals list */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="clarifyse-card p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma meta {selectedType === 'mensal' ? 'mensal' : 'trimestral'} cadastrada
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Defina metas para acompanhar o desempenho da equipe.
          </p>
          <Button onClick={() => openDialog()} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Criar primeira meta
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => {
            const progress = currentProgress?.[goal.id];
            return (
              <div key={goal.id} className="clarifyse-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {getPeriodLabel(goal.periodo_tipo, goal.periodo_referencia)}
                    </h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDialog(goal)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(goal.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {goal.meta_receita !== null && (
                    <GoalCard
                      title="Receita"
                      current={progress?.receita ?? 0}
                      target={goal.meta_receita}
                      format="currency"
                    />
                  )}
                  {goal.meta_projetos_encerrados !== null && (
                    <GoalCard
                      title="Projetos Encerrados"
                      current={progress?.projetos_encerrados ?? 0}
                      target={goal.meta_projetos_encerrados}
                    />
                  )}
                  {goal.meta_margem_media !== null && (
                    <GoalCard
                      title="Margem Media"
                      current={progress?.margem_media ?? 0}
                      target={goal.meta_margem_media}
                      format="percent"
                    />
                  )}
                  {goal.meta_nps_medio !== null && (
                    <GoalCard
                      title="NPS Medio"
                      current={progress?.nps_medio ?? 0}
                      target={goal.meta_nps_medio}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de Periodo</Label>
                <Select
                  value={form.periodo_tipo}
                  onValueChange={(v: GoalPeriodType) =>
                    setForm((f) => ({ ...f, periodo_tipo: v, periodo_referencia: '' }))
                  }
                  disabled={!!editingGoal}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Periodo</Label>
                <Select
                  value={form.periodo_referencia}
                  onValueChange={(v) => setForm((f) => ({ ...f, periodo_referencia: v }))}
                  disabled={!!editingGoal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="meta_receita">Meta de Receita (R$)</Label>
                <Input
                  id="meta_receita"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 80000"
                  value={form.meta_receita}
                  onChange={(e) => setForm((f) => ({ ...f, meta_receita: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meta_projetos">Meta de Projetos Encerrados</Label>
                <Input
                  id="meta_projetos"
                  type="number"
                  placeholder="Ex: 5"
                  value={form.meta_projetos_encerrados}
                  onChange={(e) => setForm((f) => ({ ...f, meta_projetos_encerrados: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="meta_margem">Meta de Margem Media (%)</Label>
                <Input
                  id="meta_margem"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 50"
                  value={form.meta_margem_media}
                  onChange={(e) => setForm((f) => ({ ...f, meta_margem_media: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meta_nps">Meta de NPS Medio</Label>
                <Input
                  id="meta_nps"
                  type="number"
                  step="1"
                  placeholder="Ex: 70"
                  value={form.meta_nps_medio}
                  onChange={(e) => setForm((f) => ({ ...f, meta_nps_medio: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
