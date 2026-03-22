import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  GripVertical, Plus, Trash2, Save, Download, AlertTriangle,
  RotateCcw, CalendarDays, Eye, EyeOff, Loader2,
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduleItemDraft, ScheduleStatus } from '@/types/project';

const HARDCODED_DEFAULT_STAGES: string[] = [
  'Briefing e Alinhamento',
  'Elaboração do Instrumento (Questionário / Roteiro)',
  'Aprovação do Instrumento pelo Cliente',
  'Início do Campo',
  'Encerramento do Campo',
  'Transcrição',
  'Análise dos Dados',
  'Produção do Entregável',
  'Revisão Interna',
  'Entrega ao Cliente',
  'Reunião de Apresentação dos Resultados',
];

const STATUS_OPTIONS: ScheduleStatus[] = ['Concluída', 'Em Andamento', 'Pendente', 'Atrasada'];

const STATUS_COLORS: Record<ScheduleStatus, string> = {
  'Concluída': 'text-green-700 bg-green-50 border-green-200',
  'Em Andamento': 'text-teal-700 bg-teal-50 border-teal-200',
  'Pendente': 'text-slate-600 bg-slate-50 border-slate-200',
  'Atrasada': 'text-red-700 bg-red-50 border-red-200',
};

function todayBrasilia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function calcAutoStatus(item: ScheduleItemDraft): ScheduleStatus {
  const today = todayBrasilia();
  if (item.conclusao_real) return 'Concluída';
  if (item.inicio_real && !item.conclusao_real) return 'Em Andamento';
  if (item.conclusao_prevista && item.conclusao_prevista < today && !item.conclusao_real) return 'Atrasada';
  if (item.inicio_previsto && item.inicio_previsto > today) return 'Pendente';
  return 'Pendente';
}

function genId(): string {
  return crypto.randomUUID();
}

function newDraft(nome: string, ordem: number, isTranscricao = false): ScheduleItemDraft {
  return {
    id: genId(),
    nome,
    ordem,
    inicio_previsto: null,
    conclusao_prevista: null,
    inicio_real: null,
    conclusao_real: null,
    status: null,
    status_manual: false,
    visivel: isTranscricao ? true : true,
  };
}

function formatDatePT(d: string | null): string {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return d; }
}

function formatDateTimeBrasilia(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ts; }
}

interface SortableRowProps {
  item: ScheduleItemDraft;
  onUpdate: (id: string, patch: Partial<ScheduleItemDraft>) => void;
  onRemove: (id: string) => void;
  isTranscricao: boolean;
}

function SortableRow({ item, onUpdate, onRemove, isTranscricao }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const autoStatus = calcAutoStatus(item);
  const displayStatus: ScheduleStatus = item.status ?? autoStatus;

  function handleStatusChange(val: string) {
    if (val === '__auto__') {
      onUpdate(item.id, { status: null, status_manual: false });
    } else {
      onUpdate(item.id, { status: val as ScheduleStatus, status_manual: true });
    }
  }

  return (
    <tr ref={setNodeRef} style={style} className={`border-b border-border transition-colors ${isDragging ? 'bg-accent/10' : 'hover:bg-muted/30'} ${!item.visivel ? 'opacity-50' : ''}`}>
      {/* Drag handle */}
      <td className="w-8 px-1 py-2 text-center">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded"
          title="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {/* Nome */}
      <td className="px-2 py-1.5 min-w-[180px]">
        <Input
          value={item.nome}
          onChange={e => onUpdate(item.id, { nome: e.target.value })}
          className="h-8 text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-white px-1"
          placeholder="Nome da etapa..."
        />
      </td>

      {/* Início Previsto */}
      <td className="px-2 py-1.5 min-w-[140px]">
        <input
          type="date"
          value={item.inicio_previsto ?? ''}
          onChange={e => onUpdate(item.id, { inicio_previsto: e.target.value || null })}
          className="w-full h-8 text-sm border border-input rounded-md px-2 bg-transparent hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </td>

      {/* Conclusão Prevista */}
      <td className="px-2 py-1.5 min-w-[140px]">
        <input
          type="date"
          value={item.conclusao_prevista ?? ''}
          onChange={e => onUpdate(item.id, { conclusao_prevista: e.target.value || null })}
          className="w-full h-8 text-sm border border-input rounded-md px-2 bg-transparent hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </td>

      {/* Início Real */}
      <td className="px-2 py-1.5 min-w-[140px]">
        <input
          type="date"
          value={item.inicio_real ?? ''}
          onChange={e => onUpdate(item.id, { inicio_real: e.target.value || null })}
          className="w-full h-8 text-sm border border-input rounded-md px-2 bg-transparent hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </td>

      {/* Conclusão Real */}
      <td className="px-2 py-1.5 min-w-[140px]">
        <input
          type="date"
          value={item.conclusao_real ?? ''}
          onChange={e => onUpdate(item.id, { conclusao_real: e.target.value || null })}
          className="w-full h-8 text-sm border border-input rounded-md px-2 bg-transparent hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </td>

      {/* Status */}
      <td className="px-2 py-1.5 min-w-[160px]">
        <div className="flex items-center gap-1.5">
          <Select
            value={item.status_manual ? (item.status ?? displayStatus) : '__auto__'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className={`h-8 text-xs border ${STATUS_COLORS[displayStatus] ?? ''}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__auto__">
                <span className="text-muted-foreground">Automático ({autoStatus})</span>
              </SelectItem>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {item.status_manual && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUpdate(item.id, { status: null, status_manual: false })}
                  className="text-amber-500 hover:text-amber-700 flex-shrink-0"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">Status definido manualmente.</p>
                <p className="text-xs text-muted-foreground">Clique para reverter para automático.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-2 py-1.5 text-center">
        <div className="flex items-center gap-1 justify-center">
          {isTranscricao && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUpdate(item.id, { visivel: !item.visivel })}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {item.visivel ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{item.visivel ? 'Ocultar etapa' : 'Mostrar etapa'}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface CronogramaTabProps {
  projectId: string;
  projectName: string;
}

export function CronogramaTab({ projectId, projectName }: CronogramaTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ScheduleItemDraft[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { isLoading, data: scheduleData } = useQuery({
    queryKey: ['project-schedule', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_schedule')
        .select('*')
        .eq('project_id', projectId)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (scheduleData && !hasLoaded) {
      setItems((scheduleData as any[]).map(d => ({
        id: d.id,
        nome: d.nome,
        ordem: d.ordem,
        inicio_previsto: d.inicio_previsto,
        conclusao_prevista: d.conclusao_prevista,
        inicio_real: d.inicio_real,
        conclusao_real: d.conclusao_real,
        status: d.status,
        status_manual: d.status_manual ?? false,
        visivel: d.visivel ?? true,
      })));
      setHasLoaded(true);
      setIsDirty(false);
    }
  }, [scheduleData, hasLoaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error: delError } = await supabase
        .from('project_schedule')
        .delete()
        .eq('project_id', projectId);
      if (delError) throw delError;

      if (items.length > 0) {
        const rows = items.map((item, idx) => ({
          id: item.id,
          project_id: projectId,
          nome: item.nome,
          ordem: idx + 1,
          inicio_previsto: item.inicio_previsto,
          conclusao_prevista: item.conclusao_prevista,
          inicio_real: item.inicio_real,
          conclusao_real: item.conclusao_real,
          status: item.status_manual ? item.status : null,
          status_manual: item.status_manual,
          visivel: item.visivel,
        }));
        const { error: insError } = await supabase
          .from('project_schedule')
          .insert(rows);
        if (insError) throw insError;
      }

      const nowBrasilia = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      await supabase.from('project_history').insert({
        project_id: projectId,
        descricao: `Cronograma atualizado em ${nowBrasilia} (horário de Brasília).`,
        user_id: user?.id ?? null,
      });
    },
    onSuccess: () => {
      toast({ title: 'Cronograma salvo com sucesso!' });
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['project-schedule', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-history', projectId] });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao salvar cronograma.', description: err.message, variant: 'destructive' });
    },
  });

  async function loadDefaults() {
    setIsLoadingDefaults(true);
    try {
      const { data, error } = await supabase
        .from('schedule_steps_defaults')
        .select('nome, ordem')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      const stages: string[] = (data && !error && data.length > 0)
        ? data.map((row: { nome: string }) => row.nome)
        : HARDCODED_DEFAULT_STAGES;

      const drafts = stages.map((nome, i) =>
        newDraft(nome, i + 1, nome === 'Transcrição')
      );
      setItems(drafts);
      setHasLoaded(true);
      setIsDirty(true);
    } catch {
      const drafts = HARDCODED_DEFAULT_STAGES.map((nome, i) =>
        newDraft(nome, i + 1, nome === 'Transcrição')
      );
      setItems(drafts);
      setHasLoaded(true);
      setIsDirty(true);
    } finally {
      setIsLoadingDefaults(false);
    }
  }

  function startEmpty() {
    setItems([]);
    setHasLoaded(true);
    setIsDirty(true);
  }

  function updateItem(id: string, patch: Partial<ScheduleItemDraft>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
    setIsDirty(true);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id));
    setIsDirty(true);
  }

  function addItem() {
    const newItem = newDraft('Nova Etapa', items.length + 1);
    setItems(prev => [...prev, newItem]);
    setIsDirty(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIdx = prev.findIndex(it => it.id === active.id);
        const newIdx = prev.findIndex(it => it.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
      setIsDirty(true);
    }
  }

  function exportExcel() {
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const wb = XLSX.utils.book_new();
    const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1B2B6B' } } };

    const aoaData: any[][] = [
      ['Clarifyse Strategy & Research'],
      [`Cronograma do Projeto: ${projectName}`],
      [`Exportado em: ${today} — Confidencial`],
      [],
      ['Etapa', 'Início Previsto', 'Conclusão Prevista', 'Início Real', 'Conclusão Real', 'Status'],
    ];

    items.filter(it => it.visivel).forEach(item => {
      const auto = calcAutoStatus(item);
      const status = item.status_manual ? (item.status ?? auto) : auto;
      aoaData.push([
        item.nome,
        formatDatePT(item.inicio_previsto),
        formatDatePT(item.conclusao_prevista),
        formatDatePT(item.inicio_real),
        formatDatePT(item.conclusao_real),
        status,
      ]);
    });

    aoaData.push([]);
    aoaData.push(['Clarifyse Strategy & Research | Where insight becomes clarity.']);

    const ws = XLSX.utils.aoa_to_sheet(aoaData);

    ws['!cols'] = [
      { wch: 40 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
    ];

    ws['!freeze'] = { xSplit: 0, ySplit: 5 };

    const statusCol = 5;
    const dataStartRow = 5;
    items.filter(it => it.visivel).forEach((item, i) => {
      const auto = calcAutoStatus(item);
      const status = item.status_manual ? (item.status ?? auto) : auto;
      const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + i, c: statusCol });
      if (!ws[cellRef]) return;
      const colorMap: Record<string, string> = {
        'Concluída': 'C6EFCE',
        'Em Andamento': 'CCFBF1',
        'Pendente': 'F1F5F9',
        'Atrasada': 'FECACA',
      };
      const color = colorMap[status] ?? 'FFFFFF';
      ws[cellRef].s = { fill: { fgColor: { rgb: color } } };
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma');
    XLSX.writeFile(wb, `Cronograma_${projectName}_Clarifyse.xlsx`);
  }

  if (isLoading) {
    return (
      <div className="clarifyse-card p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!hasLoaded) {
    return (
      <div className="clarifyse-card p-8 text-center space-y-6">
        <div>
          <CalendarDays className="h-10 w-10 mx-auto text-accent mb-3" />
          <p className="clarifyse-section-label text-xs mb-1">CRONOGRAMA</p>
          <h3 className="font-display text-xl font-semibold text-foreground">Como deseja iniciar?</h3>
          <p className="text-sm text-muted-foreground mt-2">Escolha entre as 11 etapas padrão da Clarifyse ou comece do zero.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={loadDefaults}
            disabled={isLoadingDefaults}
            className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90 gap-2"
          >
            {isLoadingDefaults
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <CalendarDays className="h-4 w-4" />}
            Usar etapas padrão Clarifyse
          </Button>
          <Button variant="outline" onClick={startEmpty} className="gap-2">
            <Plus className="h-4 w-4" />
            Começar do zero
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="clarifyse-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="clarifyse-section-label text-xs">ETAPAS DO CRONOGRAMA</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportExcel}
              disabled={items.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !isDirty}
              className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white hover:opacity-90 gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Salvando...' : isDirty ? 'Salvar Cronograma' : 'Salvo'}
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-lg">
            <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma etapa adicionada.</p>
            <p className="text-xs mt-1">Clique em "Adicionar Etapa" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-8 px-1 py-2" />
                  <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">ETAPA</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">INÍCIO PREVISTO</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">CONCLUSÃO PREVISTA</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">INÍCIO REAL</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">CONCLUSÃO REAL</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">STATUS</th>
                  <th className="w-16 px-2 py-2" />
                </tr>
              </thead>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={items.map(it => it.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {items.map(item => (
                      <SortableRow
                        key={item.id}
                        item={item}
                        onUpdate={updateItem}
                        onRemove={removeItem}
                        isTranscricao={item.nome === 'Transcrição'}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </DndContext>
            </table>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            className="gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Adicionar Etapa
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground px-1">
        <p className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          O status é calculado automaticamente com base nas datas. O ícone <span className="text-amber-500">⚠</span> indica status definido manualmente — clique para reverter.
        </p>
      </div>
    </div>
  );
}
