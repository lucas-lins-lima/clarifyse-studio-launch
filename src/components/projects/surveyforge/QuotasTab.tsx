import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, GripVertical, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const QUOTA_TYPES = [
  { id: 'num', label: 'Numérico / Código' },
  { id: 'age', label: 'Faixa Etária' },
  { id: 'text', label: 'Texto Livre' },
  { id: 'bool', label: 'Booleana (Sim/Não)' }
];

function generateGroupId() {
  return `g-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

export default function QuotasTab({ project, onSave, isLocked }: { project: any, onSave: (quotas: any[]) => void, isLocked: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newQuota, setNewQuota] = useState<any>({
    id: '',
    name: '',
    questionId: '',
    type: 'num',
    mappings: [],
    groups: []
  });

  const questions = (project.formQuestions || []).filter((q: any) =>
    ['single', 'multiple', 'boolean', 'number'].includes(q.type)
  );

  const handleAddQuota = () => {
    if (questions.length === 0) {
      toast.error("Crie perguntas de escolha no formulário antes de configurar cotas.");
      return;
    }
    setNewQuota({
      id: `quota-${Date.now()}`,
      name: '',
      questionId: '',
      type: 'num',
      mappings: [],
      groups: []
    });
    setStep(1);
    setIsModalOpen(true);
  };

  const handleQuestionSelect = (questionId: string) => {
    const question = questions.find((q: any) => q.id === questionId);
    if (!question) return;

    // Criar grupos iniciais a partir das opções da pergunta
    const initialGroups = (question.options || []).map((opt: any, idx: number) => ({
      id: generateGroupId(),
      name: opt.text || `Grupo ${idx + 1}`,
      target: 0
    }));

    // Criar mapeamentos: cada opção mapeia para um grupo
    const initialMappings = (question.options || []).map((opt: any, idx: number) => ({
      code: opt.code || String(idx + 1),
      label: opt.text || `Opção ${idx + 1}`,
      groupId: initialGroups[idx]?.id || ''
    }));

    setNewQuota({
      ...newQuota,
      questionId,
      name: question.question || 'Nova Cota',
      mappings: initialMappings,
      groups: initialGroups.length > 0 ? initialGroups : [{ id: generateGroupId(), name: 'Grupo 1', target: 0 }]
    });
    setStep(2);
  };

  const handleSaveQuota = () => {
    if (!newQuota.name.trim()) {
      toast.error("Informe um nome para a cota.");
      return;
    }
    if (newQuota.groups.length === 0) {
      toast.error("Adicione pelo menos um grupo.");
      return;
    }
    if (newQuota.groups.some((g: any) => !g.name.trim() || g.target <= 0)) {
      toast.error("Preencha o nome e a meta de todos os grupos.");
      return;
    }
    const updatedQuotas = [...(project.quotas || []), newQuota];
    onSave(updatedQuotas);
    setIsModalOpen(false);
    toast.success("Cota adicionada com sucesso!");
  };

  const handleDeleteQuota = (id: string) => {
    const updatedQuotas = (project.quotas || []).filter((q: any) => q.id !== id);
    onSave(updatedQuotas);
    toast.success("Cota removida.");
  };

  const totalQuotaTarget = useMemo(() => {
    return (project.quotas || []).reduce((acc: number, q: any) => {
      return acc + (q.groups || []).reduce((gAcc: number, g: any) => gAcc + (parseInt(g.target) || 0), 0);
    }, 0);
  }, [project.quotas]);

  const isOverSample = totalQuotaTarget > project.sampleSize && project.sampleSize > 0;

  // Calcular contagem de respostas por grupo de cota
  const getGroupCount = (groupName: string) => {
    return (project.responses || []).filter((r: any) => r.quotaGroup === groupName).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold text-[#2D1E6B]">Configuração de Cotas & Amostra</h3>
          <p className="text-sm text-[#64748B]">Defina as metas de coleta por perfil de respondente.</p>
        </div>
        <Button
          onClick={handleAddQuota}
          disabled={isLocked}
          className="bg-[#2D1E6B] text-white rounded-xl font-bold"
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Cota
        </Button>
      </div>

      {/* Validation Alert */}
      <AnimatePresence>
        {isOverSample && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Atenção: A soma das metas das cotas ({totalQuotaTarget}) ultrapassa a amostra total do projeto ({project.sampleSize}).
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Amostra Total */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">AMOSTRA TOTAL DO PROJETO</p>
            <p className="text-3xl font-bold text-[#2D1E6B]">{project.sampleSize} respondentes</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">COLETADOS</p>
            <p className="text-2xl font-bold text-[#1D9E75]">{project.responses?.length || 0}</p>
          </div>
        </div>
        <Progress
          value={project.sampleSize > 0 ? Math.min(100, Math.round(((project.responses?.length || 0) / project.sampleSize) * 100)) : 0}
          className="h-3 bg-gray-100"
          indicatorClassName="bg-gradient-to-r from-[#2D1E6B] to-[#1D9E75]"
        />
        <div className="flex justify-between text-xs text-[#64748B] font-medium mt-2">
          <span>0</span>
          <span>{project.sampleSize} (Meta)</span>
        </div>
      </div>

      {/* Quota List */}
      <div className="space-y-4">
        {(project.quotas || []).length > 0 ? (
          (project.quotas || []).map((quota: any) => (
            <motion.div
              key={quota.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F1EFE8] rounded-lg">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2D1E6B]">{quota.name}</h4>
                    <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">
                      {QUOTA_TYPES.find(t => t.id === quota.type)?.label || 'Numérico'} • {(quota.groups || []).length} Grupos
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteQuota(quota.id)}
                  disabled={isLocked}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(quota.groups || []).map((group: any) => {
                  const current = getGroupCount(group.name);
                  const percentage = group.target > 0 ? Math.min(100, Math.round((current / group.target) * 100)) : 0;
                  const isComplete = percentage >= 100;
                  return (
                    <div key={group.id} className="p-4 bg-[#F1EFE8] rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#2D1E6B] uppercase tracking-wider truncate flex-1 mr-2">{group.name}</span>
                        <span className={`text-xs font-bold flex-shrink-0 ${isComplete ? 'text-[#1D9E75]' : 'text-[#64748B]'}`}>
                          {isComplete ? '✓ ' : ''}{group.target} Meta
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-1.5 bg-white"
                        indicatorClassName={isComplete ? 'bg-[#1D9E75]' : 'bg-[#2D1E6B]'}
                      />
                      <p className="text-[10px] text-[#64748B] font-medium">
                        {current} coletados de {group.target} ({percentage}%)
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center space-y-4">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#2D1E6B]">Nenhuma cota configurada</h3>
              <p className="text-sm text-[#64748B]">As cotas ajudam a garantir que sua amostra seja representativa.</p>
            </div>
            {!isLocked && (
              <Button
                onClick={handleAddQuota}
                variant="outline"
                className="rounded-xl border-[#2D1E6B] text-[#2D1E6B] font-bold"
              >
                <Plus className="h-4 w-4 mr-2" /> Adicionar Primeira Cota
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Quota Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl p-0 overflow-hidden border-none">
          <div className="bg-[#2D1E6B] p-6 text-white">
            <DialogTitle className="text-2xl font-display font-bold">Configurar Cota</DialogTitle>
            <DialogDescription className="text-white/70">
              {step === 1 ? "Escolha a pergunta base para esta cota." : "Defina os grupos e metas para esta cota."}
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6 bg-white max-h-[70vh] overflow-y-auto">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">PERGUNTA DO FORMULÁRIO</Label>
                  <Select onValueChange={handleQuestionSelect}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Selecione uma pergunta..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {questions.map((q: any) => (
                        <SelectItem key={q.id} value={q.id}>{q.question}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {questions.length === 0 && (
                    <p className="text-xs text-amber-600 font-medium">
                      Nenhuma pergunta de escolha encontrada. Adicione perguntas do tipo "Escolha Única" ou "Múltipla Escolha" no formulário.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">TIPO DE COTA</Label>
                  <Select defaultValue="num" onValueChange={(v) => setNewQuota({ ...newQuota, type: v })}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {QUOTA_TYPES.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">NOME DA COTA</Label>
                  <Input
                    value={newQuota.name}
                    onChange={(e) => setNewQuota({ ...newQuota, name: e.target.value })}
                    className="h-12 rounded-xl border-gray-200"
                    placeholder="Ex: Região, Gênero, Faixa Etária..."
                  />
                </div>

                {/* Mapeamento de opções para grupos */}
                {newQuota.mappings && newQuota.mappings.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">MAPEAMENTO: OPÇÃO → GRUPO</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {newQuota.mappings.map((mapping: any, mIdx: number) => (
                        <div key={mIdx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <span className="text-xs font-bold text-[#2D1E6B] w-8 flex-shrink-0 text-center bg-white rounded-lg px-1 py-0.5 border border-gray-100">
                            {mapping.code}
                          </span>
                          <span className="text-sm text-[#64748B] flex-1 truncate">{mapping.label}</span>
                          <Select
                            value={mapping.groupId}
                            onValueChange={(v) => {
                              const updatedMappings = [...newQuota.mappings];
                              updatedMappings[mIdx].groupId = v;
                              setNewQuota({ ...newQuota, mappings: updatedMappings });
                            }}
                          >
                            <SelectTrigger className="w-36 h-8 rounded-lg border-gray-200 text-xs">
                              <SelectValue placeholder="Grupo..." />
                            </SelectTrigger>
                            <SelectContent>
                              {newQuota.groups.map((g: any) => (
                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">GRUPOS E METAS</Label>
                  {newQuota.groups.map((group: any, gIdx: number) => (
                    <div key={group.id} className="p-4 border border-gray-100 rounded-xl space-y-4 bg-gray-50/50">
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <Label className="text-[10px] font-bold text-[#64748B]">NOME DO GRUPO</Label>
                          <Input
                            value={group.name}
                            onChange={(e) => {
                              const updatedGroups = [...newQuota.groups];
                              updatedGroups[gIdx] = { ...updatedGroups[gIdx], name: e.target.value };
                              setNewQuota({ ...newQuota, groups: updatedGroups });
                            }}
                            className="h-10 rounded-lg bg-white"
                            placeholder="Ex: Sudeste, Masculino..."
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <Label className="text-[10px] font-bold text-[#64748B]">META</Label>
                          <Input
                            type="number"
                            min="1"
                            value={group.target || ''}
                            onChange={(e) => {
                              const updatedGroups = [...newQuota.groups];
                              updatedGroups[gIdx] = { ...updatedGroups[gIdx], target: parseInt(e.target.value) || 0 };
                              setNewQuota({ ...newQuota, groups: updatedGroups });
                            }}
                            className="h-10 rounded-lg bg-white"
                            placeholder="100"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-6 text-gray-400 hover:text-red-600"
                          onClick={() => {
                            const updatedGroups = newQuota.groups.filter((_: any, i: number) => i !== gIdx);
                            setNewQuota({ ...newQuota, groups: updatedGroups });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-2 rounded-xl text-[#2D1E6B] font-bold"
                    onClick={() => {
                      const newGroupId = generateGroupId();
                      setNewQuota({
                        ...newQuota,
                        groups: [...newQuota.groups, { id: newGroupId, name: `Grupo ${newQuota.groups.length + 1}`, target: 0 }]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Grupo
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-gray-50">
            {step === 2 && (
              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl font-bold">
                Voltar
              </Button>
            )}
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">
              Cancelar
            </Button>
            {step === 2 && (
              <Button onClick={handleSaveQuota} className="bg-[#2D1E6B] text-white rounded-xl px-8 font-bold">
                Salvar Cota
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
