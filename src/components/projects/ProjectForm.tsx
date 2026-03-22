import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import {
  Project, ProjectStatus, ProjectPilar,
  PROJECT_STATUS_LIST, PROJECT_PILAR_LIST, METODOLOGIA_OPTIONS, GerenteProfile,
} from '@/types/project';

interface ProjectFormData {
  nome: string;
  cliente_empresa: string;
  objetivo: string;
  metodologia: string[];
  pilar: ProjectPilar | '';
  status: ProjectStatus;
  data_inicio: string;
  data_entrega_prevista: string;
  gerente_id: string;
  observacoes_internas: string;
}

const emptyForm = (): ProjectFormData => ({
  nome: '',
  cliente_empresa: '',
  objetivo: '',
  metodologia: [],
  pilar: '',
  status: 'Briefing',
  data_inicio: '',
  data_entrega_prevista: '',
  gerente_id: '',
  observacoes_internas: '',
});

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  gerentes: GerenteProfile[];
  onSuccess: (projectId: string) => void;
}

export function ProjectForm({ open, onClose, project, gerentes, onSuccess }: Props) {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProjectFormData>(emptyForm());
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isEditing = !!project;

  useEffect(() => {
    if (open) {
      if (project) {
        setForm({
          nome: project.nome,
          cliente_empresa: project.cliente_empresa ?? '',
          objetivo: project.objetivo ?? '',
          metodologia: project.metodologia ?? [],
          pilar: project.pilar ?? '',
          status: project.status,
          data_inicio: project.data_inicio ?? '',
          data_entrega_prevista: project.data_entrega_prevista ?? '',
          gerente_id: project.gerente_id ?? '',
          observacoes_internas: project.observacoes_internas ?? '',
        });
      } else {
        setForm(emptyForm());
      }
    }
  }, [open, project]);

  const toggleMetodologia = (value: string) => {
    setForm(prev => ({
      ...prev,
      metodologia: prev.metodologia.includes(value)
        ? prev.metodologia.filter(m => m !== value)
        : [...prev.metodologia, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast({ title: 'Atenção', description: 'O nome do projeto é obrigatório.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        cliente_empresa: form.cliente_empresa.trim() || null,
        objetivo: form.objetivo.trim() || null,
        metodologia: form.metodologia,
        pilar: form.pilar || null,
        status: form.status,
        data_inicio: form.data_inicio || null,
        data_entrega_prevista: form.data_entrega_prevista || null,
        gerente_id: isAdmin ? (form.gerente_id || null) : (user?.id ?? null),
        observacoes_internas: form.observacoes_internas.trim() || null,
      };

      if (isEditing) {
        const prevStatus = project!.status;
        const { data, error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', project!.id)
          .select('id')
          .single();

        if (error) throw error;

        // Manual history log for status change if trigger not available
        if (prevStatus !== form.status) {
          await supabase.from('project_history').insert({
            project_id: project!.id,
            descricao: `Status alterado de '${prevStatus}' para '${form.status}'`,
            user_id: user?.id ?? null,
          });
        }

        await queryClient.invalidateQueries({ queryKey: ['projects'] });
        await queryClient.invalidateQueries({ queryKey: ['project', project!.id] });
        toast({ title: 'Projeto atualizado com sucesso!' });
        onSuccess(data.id);
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw error;

        // Log creation
        await supabase.from('project_history').insert({
          project_id: data.id,
          descricao: `Projeto criado com status '${form.status}'`,
          user_id: user?.id ?? null,
        });

        await queryClient.invalidateQueries({ queryKey: ['projects'] });
        await queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
        await queryClient.invalidateQueries({ queryKey: ['gerente-dashboard-stats'] });
        toast({ title: 'Projeto criado com sucesso!' });
        onSuccess(data.id);
      }
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erro ao salvar projeto.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-xl">
            {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
          </SheetTitle>
          <SheetDescription>
            {isEditing ? 'Atualize as informações do projeto.' : 'Preencha as informações para criar um novo projeto.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pb-8">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-nome">Nome do Projeto <span className="text-destructive">*</span></Label>
            <Input
              id="pf-nome"
              value={form.nome}
              onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Pesquisa de Satisfação 2025"
              required
            />
          </div>

          {/* Cliente / Empresa */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-cliente">Nome do Cliente / Empresa</Label>
            <Input
              id="pf-cliente"
              value={form.cliente_empresa}
              onChange={e => setForm(p => ({ ...p, cliente_empresa: e.target.value }))}
              placeholder="Ex: Empresa ABC"
            />
          </div>

          {/* Objetivo */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-objetivo">Objetivo do Estudo</Label>
            <Textarea
              id="pf-objetivo"
              value={form.objetivo}
              onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))}
              placeholder="Descreva o objetivo principal da pesquisa..."
              rows={3}
            />
          </div>

          {/* Metodologia */}
          <div className="space-y-2">
            <Label>Metodologia Principal</Label>
            <div className="space-y-2">
              {METODOLOGIA_OPTIONS.map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`met-${opt}`}
                    checked={form.metodologia.includes(opt)}
                    onCheckedChange={() => toggleMetodologia(opt)}
                  />
                  <label htmlFor={`met-${opt}`} className="text-sm cursor-pointer select-none">
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Pilar */}
          <div className="space-y-1.5">
            <Label>Pilar da Clarifyse</Label>
            <Select
              value={form.pilar}
              onValueChange={v => setForm(p => ({ ...p, pilar: v as ProjectPilar }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o pilar" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_PILAR_LIST.map(pilar => (
                  <SelectItem key={pilar} value={pilar}>{pilar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status do Projeto</Label>
            <Select
              value={form.status}
              onValueChange={v => setForm(p => ({ ...p, status: v as ProjectStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS_LIST.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-inicio">Data de Início</Label>
              <Input
                id="pf-inicio"
                type="date"
                value={form.data_inicio}
                onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-entrega">Data Prevista de Entrega</Label>
              <Input
                id="pf-entrega"
                type="date"
                value={form.data_entrega_prevista}
                onChange={e => setForm(p => ({ ...p, data_entrega_prevista: e.target.value }))}
              />
            </div>
          </div>

          {/* Gerente (admin only) */}
          {isAdmin && (
            <div className="space-y-1.5">
              <Label>Gerente Responsável</Label>
              <Select
                value={form.gerente_id}
                onValueChange={v => setForm(p => ({ ...p, gerente_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gerente" />
                </SelectTrigger>
                <SelectContent>
                  {gerentes.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name} ({g.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Observações Internas */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-obs">Observações Internas</Label>
            <Textarea
              id="pf-obs"
              value={form.observacoes_internas}
              onChange={e => setForm(p => ({ ...p, observacoes_internas: e.target.value }))}
              placeholder="Notas internas (não visíveis ao cliente)..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
