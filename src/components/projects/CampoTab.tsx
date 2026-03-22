import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Save, GripVertical, Trash2, Pencil, RefreshCw, AlertTriangle,
  Sheet, ClipboardList, ChevronDown, ChevronUp, Check, Hash, Calendar,
  Type, ToggleLeft,
} from 'lucide-react';
import {
  FieldConfig, FieldQuota, FieldQuotaResult, QuotaType,
  QuotaConfigNumerico, QuotaConfigFaixaEtaria, QuotaConfigTexto,
  QuotaConfigBooleano, QuotaSubcategoria, QuotaFaixa, QuotaCategoria,
} from '@/types/project';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEFAULT_FAIXAS: QuotaFaixa[] = [
  { rotulo: '16-17', min: 16, max: 17, meta: 0 },
  { rotulo: '18-24', min: 18, max: 24, meta: 0 },
  { rotulo: '25-34', min: 25, max: 34, meta: 0 },
  { rotulo: '35-44', min: 35, max: 44, meta: 0 },
  { rotulo: '45-54', min: 45, max: 54, meta: 0 },
  { rotulo: '55-64', min: 55, max: 64, meta: 0 },
  { rotulo: '65+', min: 65, max: 999, meta: 0 },
];

const QUOTA_TYPE_INFO: Record<QuotaType, { label: string; description: string; Icon: React.FC<any> }> = {
  numerico: { label: 'Mapeamento Numérico', description: 'Ex: Gênero (1=Masc, 2=Fem)', Icon: Hash },
  faixa_etaria: { label: 'Faixas Etárias', description: 'Classifica por faixa de idade', Icon: Calendar },
  texto: { label: 'Texto / Categoria', description: 'Ex: Região (SP, RJ...)', Icon: Type },
  booleano: { label: 'Booleana', description: 'Ex: Usuário / Não Usuário', Icon: ToggleLeft },
};

function formatBrasilDatetime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch { return iso; }
}

// ---- Sortable Quota Card ----
interface QuotaCardProps {
  quota: FieldQuota;
  results: FieldQuotaResult[];
  columns: string[];
  columnMap: Record<string, string>;
  onColumnChange: (quotaId: string, col: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableQuotaCard({ quota, results, columns, columnMap, onColumnChange, onEdit, onDelete }: QuotaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: quota.id });
  const [expanded, setExpanded] = useState(false);
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const info = QUOTA_TYPE_INFO[quota.tipo];
  const Icon = info.Icon;

  const total = results.reduce((s, r) => s + (r.realizado ?? 0), 0);
  const metaTotal = results.reduce((s, r) => s + (r.meta ?? 0), 0);

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground flex-shrink-0">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-clarifyse-teal/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-clarifyse-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{quota.nome}</p>
          <p className="text-xs text-muted-foreground">{info.label}</p>
        </div>
        {results.length > 0 && (
          <span className="text-xs text-muted-foreground hidden sm:block">{total}/{metaTotal} resp.</span>
        )}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(e => !e)}>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-3">
          {columns.length > 0 && (
            <div className="flex items-center gap-3">
              <Label className="text-xs whitespace-nowrap">Coluna na planilha:</Label>
              <Select value={columnMap[quota.id] ?? ''} onValueChange={(v) => onColumnChange(quota.id, v)}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Selecionar coluna..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col} value={col} className="text-xs">{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <QuotaPreview quota={quota} results={results} />
        </div>
      )}
    </div>
  );
}

function QuotaPreview({ quota, results }: { quota: FieldQuota; results: FieldQuotaResult[] }) {
  const resultMap = Object.fromEntries(results.map(r => [r.subcategoria, r.realizado ?? 0]));
  const metaMap = Object.fromEntries(results.map(r => [r.subcategoria, r.meta ?? 0]));

  if (quota.tipo === 'numerico') {
    const cfg = quota.config as QuotaConfigNumerico;
    return (
      <div className="space-y-1.5">
        {(cfg.subcategorias ?? []).map(sub => (
          <div key={sub.rotulo} className="flex items-center gap-2 text-xs">
            <span className="w-24 truncate text-muted-foreground">{sub.rotulo}</span>
            <span className="font-medium">{resultMap[sub.rotulo] ?? 0}/{metaMap[sub.rotulo] ?? sub.meta}</span>
          </div>
        ))}
      </div>
    );
  }
  if (quota.tipo === 'faixa_etaria') {
    const cfg = quota.config as QuotaConfigFaixaEtaria;
    return (
      <div className="space-y-1.5">
        {(cfg.faixas ?? []).map(f => (
          <div key={f.rotulo} className="flex items-center gap-2 text-xs">
            <span className="w-20 truncate text-muted-foreground">{f.rotulo}</span>
            <span className="font-medium">{resultMap[f.rotulo] ?? 0}/{metaMap[f.rotulo] ?? f.meta}</span>
          </div>
        ))}
      </div>
    );
  }
  if (quota.tipo === 'texto') {
    const cfg = quota.config as QuotaConfigTexto;
    return (
      <div className="space-y-1.5">
        {(cfg.categorias ?? []).map(c => (
          <div key={c.valor} className="flex items-center gap-2 text-xs">
            <span className="w-24 truncate text-muted-foreground">{c.valor}</span>
            <span className="font-medium">{resultMap[c.valor] ?? 0}/{metaMap[c.valor] ?? c.meta}</span>
          </div>
        ))}
      </div>
    );
  }
  if (quota.tipo === 'booleano') {
    const cfg = quota.config as QuotaConfigBooleano;
    return (
      <div className="flex gap-4 text-xs">
        <div><span className="text-muted-foreground">Sim: </span><span className="font-medium">{resultMap['Sim'] ?? 0}/{cfg.meta_sim}</span></div>
        <div><span className="text-muted-foreground">Não: </span><span className="font-medium">{resultMap['Não'] ?? 0}/{cfg.meta_nao}</span></div>
      </div>
    );
  }
  return null;
}

// ---- Quota Modal ----
interface QuotaModalProps {
  open: boolean;
  onClose: () => void;
  initial: FieldQuota | null;
  onSave: (nome: string, tipo: QuotaType, config: any) => void;
}

function QuotaModal({ open, onClose, initial, onSave }: QuotaModalProps) {
  const [step, setStep] = useState<'type' | 'config'>(initial ? 'config' : 'type');
  const [selectedType, setSelectedType] = useState<QuotaType | null>(initial?.tipo ?? null);
  const [nome, setNome] = useState(initial?.nome ?? '');

  // Numerico state
  const [subcategorias, setSubcategorias] = useState<QuotaSubcategoria[]>(
    initial?.tipo === 'numerico' ? (initial.config as QuotaConfigNumerico).subcategorias : []
  );

  // Faixa etaria state
  const [faixas, setFaixas] = useState<QuotaFaixa[]>(
    initial?.tipo === 'faixa_etaria' ? (initial.config as QuotaConfigFaixaEtaria).faixas : DEFAULT_FAIXAS.map(f => ({ ...f }))
  );

  // Texto state
  const [categorias, setCategorias] = useState<QuotaCategoria[]>(
    initial?.tipo === 'texto' ? (initial.config as QuotaConfigTexto).categorias : []
  );

  // Booleano state
  const [valorSim, setValorSim] = useState(initial?.tipo === 'booleano' ? (initial.config as QuotaConfigBooleano).valor_sim : '1');
  const [valorNao, setValorNao] = useState(initial?.tipo === 'booleano' ? (initial.config as QuotaConfigBooleano).valor_nao : '0');
  const [metaSim, setMetaSim] = useState(initial?.tipo === 'booleano' ? (initial.config as QuotaConfigBooleano).meta_sim : 0);
  const [metaNao, setMetaNao] = useState(initial?.tipo === 'booleano' ? (initial.config as QuotaConfigBooleano).meta_nao : 0);

  useEffect(() => {
    if (open) {
      setStep(initial ? 'config' : 'type');
      setSelectedType(initial?.tipo ?? null);
      setNome(initial?.nome ?? '');
      setSubcategorias(initial?.tipo === 'numerico' ? (initial.config as QuotaConfigNumerico).subcategorias : []);
      setFaixas(initial?.tipo === 'faixa_etaria' ? (initial.config as QuotaConfigFaixaEtaria).faixas : DEFAULT_FAIXAS.map(f => ({ ...f })));
      setCategorias(initial?.tipo === 'texto' ? (initial.config as QuotaConfigTexto).categorias : []);
      setValorSim(initial?.tipo === 'booleano' ? (initial.config as QuotaConfigBooleano).valor_sim : '1');
      setValorNao(initial?.tipo === 'booleano' ? (initial.config as QuotaConfigBooleano).valor_nao : '0');
      setMetaSim(initial?.tipo === 'booleano' ? (initial.config as QuotaConfigBooleano).meta_sim : 0);
      setMetaNao(initial?.tipo === 'booleano' ? (initial.config as QuotaConfigBooleano).meta_nao : 0);
    }
  }, [open, initial]);

  function handleSave() {
    if (!selectedType || !nome.trim()) return;
    let config: any;
    if (selectedType === 'numerico') config = { subcategorias };
    else if (selectedType === 'faixa_etaria') config = { faixas };
    else if (selectedType === 'texto') config = { categorias };
    else config = { valor_sim: valorSim, valor_nao: valorNao, meta_sim: metaSim, meta_nao: metaNao };
    onSave(nome.trim(), selectedType, config);
    onClose();
  }

  const types: QuotaType[] = ['numerico', 'faixa_etaria', 'texto', 'booleano'];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {initial ? 'Editar Cota' : step === 'type' ? 'Escolher Tipo de Cota' : 'Configurar Cota'}
          </DialogTitle>
        </DialogHeader>

        {step === 'type' && (
          <div className="grid grid-cols-1 gap-3 py-2">
            {types.map(t => {
              const info = QUOTA_TYPE_INFO[t];
              const Icon = info.Icon;
              return (
                <button
                  key={t}
                  onClick={() => { setSelectedType(t); setStep('config'); }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-clarifyse-teal hover:bg-clarifyse-teal/5 transition-all text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-clarifyse-teal/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-clarifyse-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 'config' && selectedType && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Nome da Cota</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Gênero" />
            </div>

            {selectedType === 'numerico' && (
              <NumeralConfig subcategorias={subcategorias} onChange={setSubcategorias} />
            )}
            {selectedType === 'faixa_etaria' && (
              <FaixaEtariaConfig faixas={faixas} onChange={setFaixas} />
            )}
            {selectedType === 'texto' && (
              <TextoConfig categorias={categorias} onChange={setCategorias} />
            )}
            {selectedType === 'booleano' && (
              <BooleanoConfig
                valorSim={valorSim} valorNao={valorNao}
                metaSim={metaSim} metaNao={metaNao}
                onChangeSim={setValorSim} onChangeNao={setValorNao}
                onChangeMetaSim={setMetaSim} onChangeMetaNao={setMetaNao}
              />
            )}

            <DialogFooter className="gap-2 pt-2">
              {!initial && <Button variant="outline" onClick={() => setStep('type')}>Voltar</Button>}
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button
                className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white"
                onClick={handleSave}
                disabled={!nome.trim()}
              >
                <Check className="h-4 w-4 mr-1.5" />
                Salvar Cota
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NumeralConfig({ subcategorias, onChange }: { subcategorias: QuotaSubcategoria[]; onChange: (v: QuotaSubcategoria[]) => void }) {
  function add() { onChange([...subcategorias, { rotulo: '', valor: '', meta: 0 }]); }
  function remove(i: number) { onChange(subcategorias.filter((_, idx) => idx !== i)); }
  function update(i: number, field: keyof QuotaSubcategoria, value: any) {
    onChange(subcategorias.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Subcategorias</Label>
      <div className="space-y-2">
        {subcategorias.map((sub, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input placeholder="Rótulo" value={sub.rotulo} onChange={e => update(i, 'rotulo', e.target.value)} className="flex-1 h-8 text-sm" />
            <Input placeholder="Valor" value={sub.valor} onChange={e => update(i, 'valor', e.target.value)} className="w-20 h-8 text-sm" />
            <Input type="number" placeholder="Meta" value={sub.meta} onChange={e => update(i, 'meta', parseInt(e.target.value) || 0)} className="w-20 h-8 text-sm" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={add} className="w-full h-8 text-xs gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Adicionar Subcategoria
      </Button>
    </div>
  );
}

function FaixaEtariaConfig({ faixas, onChange }: { faixas: QuotaFaixa[]; onChange: (v: QuotaFaixa[]) => void }) {
  function add() { onChange([...faixas, { rotulo: '', min: 0, max: 0, meta: 0 }]); }
  function remove(i: number) { onChange(faixas.filter((_, idx) => idx !== i)); }
  function update(i: number, field: keyof QuotaFaixa, value: any) {
    onChange(faixas.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Faixas Etárias</Label>
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-1 text-xs text-muted-foreground px-1">
          <span>Rótulo</span><span>Mín</span><span>Máx</span><span>Meta</span>
        </div>
        {faixas.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input placeholder="Rótulo" value={f.rotulo} onChange={e => update(i, 'rotulo', e.target.value)} className="flex-1 h-8 text-sm" />
            <Input type="number" placeholder="Mín" value={f.min} onChange={e => update(i, 'min', parseInt(e.target.value) || 0)} className="w-16 h-8 text-sm" />
            <Input type="number" placeholder="Máx" value={f.max} onChange={e => update(i, 'max', parseInt(e.target.value) || 0)} className="w-16 h-8 text-sm" />
            <Input type="number" placeholder="Meta" value={f.meta} onChange={e => update(i, 'meta', parseInt(e.target.value) || 0)} className="w-16 h-8 text-sm" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={add} className="w-full h-8 text-xs gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Adicionar Faixa
      </Button>
    </div>
  );
}

function TextoConfig({ categorias, onChange }: { categorias: QuotaCategoria[]; onChange: (v: QuotaCategoria[]) => void }) {
  function add() { onChange([...categorias, { valor: '', meta: 0 }]); }
  function remove(i: number) { onChange(categorias.filter((_, idx) => idx !== i)); }
  function update(i: number, field: keyof QuotaCategoria, value: any) {
    onChange(categorias.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Categorias</Label>
      <div className="space-y-2">
        {categorias.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input placeholder="Valor (ex: São Paulo)" value={c.valor} onChange={e => update(i, 'valor', e.target.value)} className="flex-1 h-8 text-sm" />
            <Input type="number" placeholder="Meta" value={c.meta} onChange={e => update(i, 'meta', parseInt(e.target.value) || 0)} className="w-20 h-8 text-sm" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={add} className="w-full h-8 text-xs gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Adicionar Categoria
      </Button>
    </div>
  );
}

function BooleanoConfig({ valorSim, valorNao, metaSim, metaNao, onChangeSim, onChangeNao, onChangeMetaSim, onChangeMetaNao }: {
  valorSim: string; valorNao: string; metaSim: number; metaNao: number;
  onChangeSim: (v: string) => void; onChangeNao: (v: string) => void;
  onChangeMetaSim: (v: number) => void; onChangeMetaNao: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 p-3 rounded-lg border border-green-200 bg-green-50">
          <Label className="text-xs font-medium text-green-700">Valor = Sim</Label>
          <Input value={valorSim} onChange={e => onChangeSim(e.target.value)} className="h-8 text-sm" placeholder="ex: 1" />
          <Input type="number" value={metaSim} onChange={e => onChangeMetaSim(parseInt(e.target.value) || 0)} className="h-8 text-sm" placeholder="Meta" />
        </div>
        <div className="space-y-1.5 p-3 rounded-lg border border-red-200 bg-red-50">
          <Label className="text-xs font-medium text-red-700">Valor = Não</Label>
          <Input value={valorNao} onChange={e => onChangeNao(e.target.value)} className="h-8 text-sm" placeholder="ex: 0" />
          <Input type="number" value={metaNao} onChange={e => onChangeMetaNao(parseInt(e.target.value) || 0)} className="h-8 text-sm" placeholder="Meta" />
        </div>
      </div>
    </div>
  );
}

// ---- Manual Entry Dialog ----
interface ManualEntryDialogProps {
  open: boolean;
  onClose: () => void;
  fieldConfig: FieldConfig | null;
  quotas: FieldQuota[];
  results: Record<string, FieldQuotaResult[]>;
  onSave: (data: { total: number; tempo: number; quotaResults: { quotaId: string; subcategoria: string; realizado: number }[] }) => Promise<void>;
}

function ManualEntryDialog({ open, onClose, fieldConfig, quotas, results, onSave }: ManualEntryDialogProps) {
  const [total, setTotal] = useState(fieldConfig?.realizado_total ?? 0);
  const [tempo, setTempo] = useState<number>(fieldConfig?.tempo_medio_real ?? 0);
  const [quotaVals, setQuotaVals] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTotal(fieldConfig?.realizado_total ?? 0);
      setTempo(fieldConfig?.tempo_medio_real ?? 0);
      const init: Record<string, Record<string, number>> = {};
      quotas.forEach(q => {
        init[q.id] = {};
        (results[q.id] ?? []).forEach(r => { init[q.id][r.subcategoria] = r.realizado ?? 0; });
      });
      setQuotaVals(init);
    }
  }, [open, fieldConfig, quotas, results]);

  function getSubcategories(quota: FieldQuota): string[] {
    if (quota.tipo === 'numerico') return ((quota.config as QuotaConfigNumerico).subcategorias ?? []).map(s => s.rotulo);
    if (quota.tipo === 'faixa_etaria') return ((quota.config as QuotaConfigFaixaEtaria).faixas ?? []).map(f => f.rotulo);
    if (quota.tipo === 'texto') return ((quota.config as QuotaConfigTexto).categorias ?? []).map(c => c.valor);
    if (quota.tipo === 'booleano') return ['Sim', 'Não'];
    return [];
  }

  async function handleSave() {
    setLoading(true);
    try {
      const quotaResults: { quotaId: string; subcategoria: string; realizado: number }[] = [];
      quotas.forEach(q => {
        getSubcategories(q).forEach(sub => {
          quotaResults.push({ quotaId: q.id, subcategoria: sub, realizado: quotaVals[q.id]?.[sub] ?? 0 });
        });
      });
      await onSave({ total, tempo, quotaResults });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Atualizar Dados de Campo</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Total de Entrevistados</Label>
              <Input type="number" min={0} value={total} onChange={e => setTotal(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Tempo Médio (min)</Label>
              <Input type="number" min={0} step={0.1} value={tempo} onChange={e => setTempo(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {quotas.map(quota => {
            const subs = getSubcategories(quota);
            if (subs.length === 0) return null;
            return (
              <div key={quota.id} className="space-y-2">
                <p className="text-sm font-medium">{quota.nome}</p>
                <div className="space-y-2 pl-2">
                  {subs.map(sub => (
                    <div key={sub} className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-28 truncate">{sub}</Label>
                      <Input
                        type="number" min={0}
                        value={quotaVals[quota.id]?.[sub] ?? 0}
                        onChange={e => setQuotaVals(prev => ({
                          ...prev,
                          [quota.id]: { ...prev[quota.id], [sub]: parseInt(e.target.value) || 0 },
                        }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white"
            onClick={handleSave} disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main CampoTab ----
interface CampoTabProps {
  projectId: string;
}

export function CampoTab({ projectId }: CampoTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local form state
  const [metaTotal, setMetaTotal] = useState<number | ''>('');
  const [tempoMedioEsperado, setTempoMedioEsperado] = useState<number | ''>('');
  const [integrationMode, setIntegrationMode] = useState<'sheets' | 'manual'>('manual');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetsColumns, setSheetsColumns] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [referenceColumn, setReferenceColumn] = useState('');
  const [timeColumn, setTimeColumn] = useState('');
  const [sheetsLoading, setSheetsLoading] = useState(false);

  const [localQuotas, setLocalQuotas] = useState<FieldQuota[]>([]);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [editingQuota, setEditingQuota] = useState<FieldQuota | null>(null);
  const [deletingQuotaId, setDeletingQuotaId] = useState<string | null>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch field config
  const { data: fieldConfig, isLoading: configLoading } = useQuery<FieldConfig | null>({
    queryKey: ['field-config', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('field_config')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      return data as FieldConfig | null;
    },
    staleTime: 30_000,
  });

  // Fetch quotas
  const { data: quotas = [], isLoading: quotasLoading } = useQuery<FieldQuota[]>({
    queryKey: ['field-quotas', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_quotas')
        .select('*')
        .eq('project_id', projectId)
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as FieldQuota[];
    },
    staleTime: 30_000,
  });

  // Fetch quota results
  const { data: allResults = [] } = useQuery<FieldQuotaResult[]>({
    queryKey: ['field-quota-results', projectId],
    queryFn: async () => {
      if (quotas.length === 0) return [];
      const { data } = await supabase
        .from('field_quota_results')
        .select('*')
        .in('quota_id', quotas.map(q => q.id));
      return (data ?? []) as FieldQuotaResult[];
    },
    enabled: quotas.length > 0,
    staleTime: 30_000,
  });

  const resultsByQuota = allResults.reduce<Record<string, FieldQuotaResult[]>>((acc, r) => {
    if (!acc[r.quota_id]) acc[r.quota_id] = [];
    acc[r.quota_id].push(r);
    return acc;
  }, {});

  // Sync local state with fetched config
  useEffect(() => {
    if (fieldConfig) {
      setMetaTotal(fieldConfig.meta_total ?? '');
      setTempoMedioEsperado(fieldConfig.tempo_medio_esperado ?? '');
      setIntegrationMode(fieldConfig.integration_mode ?? 'manual');
      setSheetsUrl(fieldConfig.sheets_url ?? '');
      setReferenceColumn(fieldConfig.reference_column ?? '');
      setTimeColumn(fieldConfig.time_column ?? '');
    }
  }, [fieldConfig]);

  useEffect(() => {
    setLocalQuotas(quotas);
    const map: Record<string, string> = {};
    quotas.forEach(q => { if (q.coluna_planilha) map[q.id] = q.coluna_planilha; });
    setColumnMap(map);
  }, [quotas]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalQuotas(prev => {
      const oldIdx = prev.findIndex(q => q.id === active.id);
      const newIdx = prev.findIndex(q => q.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  async function handleLoadSheets() {
    if (!sheetsUrl.trim()) return;
    setSheetsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-sheet-headers', {
        body: { sheets_url: sheetsUrl.trim() },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setSheetsColumns(data.columns ?? []);
      // Save the CSV URL back
      setSheetsUrl(sheetsUrl.trim());
      toast({ title: `${data.columns.length} colunas encontradas na planilha.` });
    } catch (err: any) {
      toast({ title: 'Erro ao carregar planilha', description: err.message, variant: 'destructive' });
    } finally {
      setSheetsLoading(false);
    }
  }

  async function handleSaveConfig() {
    try {
      // Upsert field_config
      const configPayload = {
        project_id: projectId,
        meta_total: metaTotal === '' ? null : Number(metaTotal),
        tempo_medio_esperado: tempoMedioEsperado === '' ? null : Number(tempoMedioEsperado),
        integration_mode: integrationMode,
        sheets_url: integrationMode === 'sheets' ? sheetsUrl.trim() || null : null,
        reference_column: referenceColumn || null,
        time_column: timeColumn || null,
      };

      const { error: configErr } = await supabase
        .from('field_config')
        .upsert(configPayload, { onConflict: 'project_id' });
      if (configErr) throw configErr;

      // Save quotas with updated order and column mappings
      for (let i = 0; i < localQuotas.length; i++) {
        const q = localQuotas[i];
        await supabase
          .from('field_quotas')
          .update({ ordem: i, coluna_planilha: columnMap[q.id] ?? null })
          .eq('id', q.id);
      }

      queryClient.invalidateQueries({ queryKey: ['field-config', projectId] });
      queryClient.invalidateQueries({ queryKey: ['field-quotas', projectId] });
      toast({ title: 'Configuração de campo salva com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar configuração', description: err.message, variant: 'destructive' });
    }
  }

  async function handleAddOrEditQuota(nome: string, tipo: QuotaType, config: any) {
    try {
      if (editingQuota) {
        const { error } = await supabase
          .from('field_quotas')
          .update({ nome, tipo, config })
          .eq('id', editingQuota.id);
        if (error) throw error;

        // Rebuild results for the quota
        await supabase.from('field_quota_results').delete().eq('quota_id', editingQuota.id);
        await insertQuotaResults(editingQuota.id, tipo, config);
        toast({ title: 'Cota atualizada.' });
      } else {
        const ordem = localQuotas.length;
        const { data: newQuota, error } = await supabase
          .from('field_quotas')
          .insert({ project_id: projectId, nome, tipo, config, ordem })
          .select('*')
          .single();
        if (error) throw error;

        await insertQuotaResults(newQuota.id, tipo, config);
        toast({ title: 'Cota adicionada.' });
      }

      queryClient.invalidateQueries({ queryKey: ['field-quotas', projectId] });
      queryClient.invalidateQueries({ queryKey: ['field-quota-results', projectId] });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar cota', description: err.message, variant: 'destructive' });
    }
  }

  async function insertQuotaResults(quotaId: string, tipo: QuotaType, config: any) {
    const toInsert: { quota_id: string; subcategoria: string; meta: number; realizado: number }[] = [];
    if (tipo === 'numerico') {
      (config.subcategorias ?? []).forEach((s: QuotaSubcategoria) => {
        toInsert.push({ quota_id: quotaId, subcategoria: s.rotulo, meta: s.meta, realizado: 0 });
      });
    } else if (tipo === 'faixa_etaria') {
      (config.faixas ?? []).forEach((f: QuotaFaixa) => {
        toInsert.push({ quota_id: quotaId, subcategoria: f.rotulo, meta: f.meta, realizado: 0 });
      });
    } else if (tipo === 'texto') {
      (config.categorias ?? []).forEach((c: QuotaCategoria) => {
        toInsert.push({ quota_id: quotaId, subcategoria: c.valor, meta: c.meta, realizado: 0 });
      });
    } else if (tipo === 'booleano') {
      toInsert.push({ quota_id: quotaId, subcategoria: 'Sim', meta: config.meta_sim ?? 0, realizado: 0 });
      toInsert.push({ quota_id: quotaId, subcategoria: 'Não', meta: config.meta_nao ?? 0, realizado: 0 });
    }
    if (toInsert.length > 0) {
      await supabase.from('field_quota_results').insert(toInsert);
    }
  }

  async function handleDeleteQuota(quotaId: string) {
    try {
      await supabase.from('field_quotas').delete().eq('id', quotaId);
      queryClient.invalidateQueries({ queryKey: ['field-quotas', projectId] });
      queryClient.invalidateQueries({ queryKey: ['field-quota-results', projectId] });
      toast({ title: 'Cota removida.' });
    } catch (err: any) {
      toast({ title: 'Erro ao remover cota', description: err.message, variant: 'destructive' });
    }
    setDeletingQuotaId(null);
  }

  async function handleManualSave({ total, tempo, quotaResults }: { total: number; tempo: number; quotaResults: { quotaId: string; subcategoria: string; realizado: number }[] }) {
    try {
      await supabase
        .from('field_config')
        .upsert({
          project_id: projectId,
          realizado_total: total,
          tempo_medio_real: tempo || null,
          last_sync_at: new Date().toISOString(),
          last_sync_error: null,
        }, { onConflict: 'project_id' });

      for (const qr of quotaResults) {
        await supabase
          .from('field_quota_results')
          .upsert({ quota_id: qr.quotaId, subcategoria: qr.subcategoria, realizado: qr.realizado }, { onConflict: 'quota_id,subcategoria' });
      }

      queryClient.invalidateQueries({ queryKey: ['field-config', projectId] });
      queryClient.invalidateQueries({ queryKey: ['field-quota-results', projectId] });
      toast({ title: 'Dados de campo atualizados manualmente.' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar dados', description: err.message, variant: 'destructive' });
    }
  }

  async function handleSync() {
    setSyncLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-field-data', {
        body: { project_id: projectId },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      queryClient.invalidateQueries({ queryKey: ['field-config', projectId] });
      queryClient.invalidateQueries({ queryKey: ['field-quota-results', projectId] });
      toast({ title: `Sincronização concluída. ${data.rows_count} entrevistados processados.` });
    } catch (err: any) {
      toast({ title: 'Erro na sincronização', description: err.message, variant: 'destructive' });
    } finally {
      setSyncLoading(false);
    }
  }

  if (configLoading || quotasLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const hasSheetColumns = sheetsColumns.length > 0;

  return (
    <div className="space-y-5">
      {/* Sync status */}
      {fieldConfig?.last_sync_error && integrationMode === 'sheets' && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Erro na última sincronização</p>
            <p className="text-xs text-red-600 mt-0.5">{fieldConfig.last_sync_error}</p>
          </div>
        </div>
      )}

      {/* Métricas Gerais */}
      <div className="clarifyse-card p-5 space-y-4">
        <p className="clarifyse-section-label text-xs">MÉTRICAS GERAIS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Meta Total de Entrevistados</Label>
            <Input
              type="number" min={0}
              placeholder="Ex: 300"
              value={metaTotal}
              onChange={e => setMetaTotal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Tempo Médio Esperado (min)</Label>
            <Input
              type="number" min={0}
              placeholder="Ex: 15"
              value={tempoMedioEsperado}
              onChange={e => setTempoMedioEsperado(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Cotas */}
      <div className="clarifyse-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="clarifyse-section-label text-xs">COTAS</p>
          <Button
            size="sm"
            className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white h-8 text-xs gap-1.5"
            onClick={() => { setEditingQuota(null); setQuotaModalOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar Cota
          </Button>
        </div>

        {localQuotas.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma cota configurada.</p>
            <p className="text-xs mt-1">Clique em "Adicionar Cota" para começar.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localQuotas.map(q => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {localQuotas.map(quota => (
                  <SortableQuotaCard
                    key={quota.id}
                    quota={quota}
                    results={resultsByQuota[quota.id] ?? []}
                    columns={sheetsColumns}
                    columnMap={columnMap}
                    onColumnChange={(qId, col) => setColumnMap(prev => ({ ...prev, [qId]: col }))}
                    onEdit={() => { setEditingQuota(quota); setQuotaModalOpen(true); }}
                    onDelete={() => setDeletingQuotaId(quota.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Integration Mode */}
      <div className="clarifyse-card p-5 space-y-4">
        <p className="clarifyse-section-label text-xs">FONTE DE DADOS</p>

        <div className="flex gap-2">
          <Button
            variant={integrationMode === 'sheets' ? 'default' : 'outline'}
            size="sm"
            className={integrationMode === 'sheets' ? 'bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white' : ''}
            onClick={() => setIntegrationMode('sheets')}
          >
            <Sheet className="h-4 w-4 mr-1.5" /> Google Sheets
          </Button>
          <Button
            variant={integrationMode === 'manual' ? 'default' : 'outline'}
            size="sm"
            className={integrationMode === 'manual' ? 'bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white' : ''}
            onClick={() => setIntegrationMode('manual')}
          >
            <ClipboardList className="h-4 w-4 mr-1.5" /> Entrada Manual
          </Button>
        </div>

        {integrationMode === 'sheets' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Link da Planilha Google Sheets</Label>
              <p className="text-xs text-muted-foreground">
                Cole aqui o link de compartilhamento da sua planilha. Basta compartilhá-la com "Qualquer pessoa com o link pode visualizar".
              </p>
              <div className="flex gap-2">
                <Input
                  value={sheetsUrl}
                  onChange={e => setSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleLoadSheets}
                  disabled={sheetsLoading || !sheetsUrl.trim()}
                  className="gap-1.5 whitespace-nowrap"
                >
                  {sheetsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sheet className="h-4 w-4" />}
                  Carregar Planilha
                </Button>
              </div>
            </div>

            {hasSheetColumns && (
              <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="text-sm font-medium mb-1">Colunas detectadas ({sheetsColumns.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sheetsColumns.map(col => (
                      <Badge key={col} variant="secondary" className="text-xs">{col}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Coluna de referência (contar respondentes)</Label>
                    <Select value={referenceColumn} onValueChange={setReferenceColumn}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sheetsColumns.map(col => (
                          <SelectItem key={col} value={col} className="text-xs">{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Coluna de tempo de entrevista (min)</Label>
                    <Select value={timeColumn} onValueChange={setTimeColumn}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" className="text-xs">— Nenhuma —</SelectItem>
                        {sheetsColumns.map(col => (
                          <SelectItem key={col} value={col} className="text-xs">{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {localQuotas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Mapear cotas às colunas:</p>
                    {localQuotas.map(q => (
                      <div key={q.id} className="flex items-center gap-3">
                        <span className="text-xs text-foreground w-32 truncate">{q.nome}</span>
                        <Select value={columnMap[q.id] ?? ''} onValueChange={(v) => setColumnMap(prev => ({ ...prev, [q.id]: v }))}>
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue placeholder="Selecionar coluna..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="" className="text-xs">— Nenhuma —</SelectItem>
                            {sheetsColumns.map(col => (
                              <SelectItem key={col} value={col} className="text-xs">{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sync section */}
            {fieldConfig?.sheets_url && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <p className="text-xs font-medium">Última sincronização</p>
                  <p className="text-xs text-muted-foreground">{formatBrasilDatetime(fieldConfig.last_sync_at)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleSync} disabled={syncLoading} className="gap-1.5">
                  <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                  Atualizar Agora
                </Button>
              </div>
            )}
          </div>
        )}

        {integrationMode === 'manual' && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div>
              <p className="text-sm font-medium">Entrada Manual de Dados</p>
              <p className="text-xs text-muted-foreground">
                {fieldConfig?.last_sync_at
                  ? `Última atualização: ${formatBrasilDatetime(fieldConfig.last_sync_at)}`
                  : 'Nenhuma atualização registrada.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setManualEntryOpen(true)}
            >
              <ClipboardList className="h-4 w-4" />
              Atualizar Dados
            </Button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white gap-2"
          onClick={handleSaveConfig}
        >
          <Save className="h-4 w-4" />
          Salvar Configuração
        </Button>
      </div>

      {/* Quota Modal */}
      <QuotaModal
        open={quotaModalOpen}
        onClose={() => { setQuotaModalOpen(false); setEditingQuota(null); }}
        initial={editingQuota}
        onSave={handleAddOrEditQuota}
      />

      {/* Delete Quota Confirmation */}
      <Dialog open={!!deletingQuotaId} onOpenChange={v => !v && setDeletingQuotaId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Remover Cota</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem certeza que deseja remover esta cota? Os dados coletados também serão apagados.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingQuotaId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deletingQuotaId && handleDeleteQuota(deletingQuotaId)}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <ManualEntryDialog
        open={manualEntryOpen}
        onClose={() => setManualEntryOpen(false)}
        fieldConfig={fieldConfig}
        quotas={localQuotas}
        results={resultsByQuota}
        onSave={handleManualSave}
      />
    </div>
  );
}
