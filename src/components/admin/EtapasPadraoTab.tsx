import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, RotateCcw, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

const DEFAULT_STEPS = [
  'Briefing e Alinhamento',
  'Elaboração do Instrumento',
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

function SortableItem({
  step, onRename, onRemove,
}: { step: Step; onRename: (id: string, v: string) => void; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 group">
      <button {...attributes} {...listeners} className="text-muted-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-xs text-muted-foreground w-5 text-right">{step.ordem}.</span>
      <Input
        value={step.nome}
        onChange={(e) => onRename(step.id, e.target.value)}
        className="flex-1 h-7 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(step.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function EtapasPadraoTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [steps, setSteps] = useState<Step[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data: dbSteps, isLoading } = useQuery({
    queryKey: ['schedule-steps-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_steps_defaults')
        .select('*')
        .order('ordem');
      if (error) throw error;
      return data as Step[];
    },
  });

  useEffect(() => {
    if (dbSteps) { setSteps(dbSteps); setDirty(false); }
  }, [dbSteps]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = steps.findIndex((s) => s.id === active.id);
    const newIdx = steps.findIndex((s) => s.id === over.id);
    const newArr = arrayMove(steps, oldIdx, newIdx).map((s, i) => ({ ...s, ordem: i + 1 }));
    setSteps(newArr);
    setDirty(true);
  }

  function rename(id: string, value: string) {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, nome: value } : s));
    setDirty(true);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, ordem: i + 1 })));
    setDirty(true);
  }

  function addStep() {
    const tempId = `temp-${Date.now()}`;
    setSteps((prev) => [...prev, { id: tempId, nome: 'Nova Etapa', ordem: prev.length + 1, ativo: true }]);
    setDirty(true);
  }

  async function restore() {
    if (!confirm('Restaurar as 11 etapas padrão? As alterações atuais serão perdidas.')) return;
    try {
      await supabase.from('schedule_steps_defaults').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const toInsert = DEFAULT_STEPS.map((nome, i) => ({ nome, ordem: i + 1, ativo: true }));
      const { data, error } = await supabase.from('schedule_steps_defaults').insert(toInsert).select();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['schedule-steps-defaults'] });
      toast({ title: 'Etapas padrão restauradas.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existingIds = dbSteps?.map((s) => s.id) || [];
      const currentIds = steps.filter((s) => !s.id.startsWith('temp-')).map((s) => s.id);
      const toDelete = existingIds.filter((id) => !currentIds.includes(id));
      if (toDelete.length) await supabase.from('schedule_steps_defaults').delete().in('id', toDelete);
      for (const step of steps) {
        if (step.id.startsWith('temp-')) {
          await supabase.from('schedule_steps_defaults').insert({ nome: step.nome, ordem: step.ordem, ativo: step.ativo });
        } else {
          await supabase.from('schedule_steps_defaults').update({ nome: step.nome, ordem: step.ordem }).eq('id', step.id);
        }
      }
    },
    onSuccess: () => {
      toast({ title: 'Etapas salvas com sucesso.' });
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['schedule-steps-defaults'] });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6 max-w-lg">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="clarifyse-section-label text-xs mb-1">PERSONALIZAÇÃO</p>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold text-foreground">Etapas Padrão do Cronograma</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Renomeie, reordene e personalize as etapas usadas como base ao criar novos cronogramas.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {steps.map((step) => (
                <SortableItem key={step.id} step={step} onRename={rename} onRemove={removeStep} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={addStep}>
          <Plus className="h-4 w-4 mr-1.5" /> Adicionar Etapa
        </Button>
        <Button variant="outline" size="sm" onClick={restore} className="text-muted-foreground">
          <RotateCcw className="h-4 w-4 mr-1.5" /> Restaurar Padrões
        </Button>
        <Button
          size="sm"
          disabled={!dirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="bg-gradient-to-r from-[#7B2D8B] to-[#A855F7] text-white border-0"
        >
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Etapas'}
        </Button>
      </div>
    </div>
  );
}
