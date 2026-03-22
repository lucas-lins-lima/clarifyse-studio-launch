import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Eye, 
  Settings2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  CheckCircle2,
  LayoutDashboard,
  Type,
  List,
  CheckSquare,
  Star,
  Hash,
  Calendar,
  Image as ImageIcon,
  ArrowRightLeft,
  Grid3X3,
  Layers,
  MoreHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const QUESTION_TYPES = [
  { id: 'single', label: 'Escolha Única', icon: List },
  { id: 'multiple', label: 'Múltipla Escolha', icon: CheckSquare },
  { id: 'likert', label: 'Escala Likert', icon: Layers },
  { id: 'nps', label: 'NPS (0-10)', icon: Star },
  { id: 'rating', label: 'Rating / Slider', icon: Star },
  { id: 'ranking', label: 'Ranking', icon: GripVertical },
  { id: 'matrix', label: 'Matriz / Grid', icon: Grid3X3 },
  { id: 'text', label: 'Texto Aberto', icon: Type },
  { id: 'number', label: 'Número', icon: Hash },
  { id: 'date', label: 'Data / Mês', icon: Calendar },
  { id: 'boolean', label: 'Sim / Não', icon: CheckCircle2 },
  { id: 'upload', label: 'Upload de Arquivo', icon: ImageIcon },
  { id: 'cbc', label: 'Conjoint (CBC)', icon: LayoutDashboard },
  { id: 'maxdiff', label: 'MaxDiff', icon: ArrowRightLeft },
  { id: 'image_choice', label: 'Imagem Choice', icon: ImageIcon },
];

const SortableQuestionItem = ({ question, onEdit, onDelete, isActive, isLocked }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = QUESTION_TYPES.find(t => t.id === question.type)?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-xl border transition-all cursor-pointer group ${
        isActive ? 'bg-[#2D1E6B] text-white border-[#2D1E6B]' : 'bg-white text-[#2D1E6B] border-gray-100 hover:border-[#2D1E6B]/30'
      }`}
      onClick={() => onEdit(question)}
    >
      <div className="flex items-center gap-3">
        {!isLocked && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className={`h-4 w-4 ${isActive ? 'text-white/40' : 'text-gray-300'}`} />
          </div>
        )}
        <div className={`p-2 rounded-lg ${isActive ? 'bg-white/10' : 'bg-[#F1EFE8]'}`}>
          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#2D1E6B]'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{question.question || 'Pergunta sem título'}</p>
          <p className={`text-[10px] uppercase tracking-widest font-bold ${isActive ? 'text-white/60' : 'text-[#1D9E75]'}`}>
            {question.variableCode || 'SEM_CODIGO'}
          </p>
        </div>
        {!isLocked && (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white hover:bg-white/10' : 'text-gray-400 hover:text-red-600'}`}
            onClick={(e) => { e.stopPropagation(); onDelete(question.id); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default function FormBuilderTab({ project, onSave, isLocked }: { project: any, onSave: (questions: any[]) => void, isLocked: boolean }) {
  const [questions, setQuestions] = useState<any[]>(project.formQuestions || []);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddQuestion = () => {
    const newQ = {
      id: Date.now().toString(),
      type: 'single',
      question: 'Nova Pergunta',
      variableCode: `q_${questions.length + 1}`,
      options: [{ id: 'o1', text: 'Opção 1', code: '1' }, { id: 'o2', text: 'Opção 2', code: '2' }],
      required: true,
      helpText: '',
      logic: []
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    setActiveQuestion(newQ);
    onSave(updated);
  };

  const handleUpdateQuestion = (updates: any) => {
    const updated = questions.map(q => q.id === activeQuestion.id ? { ...q, ...updates } : q);
    setQuestions(updated);
    setActiveQuestion({ ...activeQuestion, ...updates });
    onSave(updated);
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    if (activeQuestion?.id === id) setActiveQuestion(null);
    onSave(updated);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      const updated = arrayMove(questions, oldIndex, newIndex);
      setQuestions(updated);
      onSave(updated);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)]">
      {/* Left Panel: Question List */}
      <div className="w-full lg:w-80 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#2D1E6B] uppercase tracking-widest">PERGUNTAS</h3>
          <span className="text-xs font-bold text-[#1D9E75]">{questions.length} total</span>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {questions.map((q) => (
                <SortableQuestionItem 
                  key={q.id} 
                  question={q} 
                  isActive={activeQuestion?.id === q.id}
                  onEdit={setActiveQuestion}
                  onDelete={handleDeleteQuestion}
                  isLocked={isLocked}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <Button 
          onClick={handleAddQuestion} 
          disabled={isLocked}
          className="w-full bg-[#2D1E6B] text-white rounded-xl font-bold h-12 shadow-lg shadow-purple-900/10"
        >
          <Plus className="h-4 w-4 mr-2" /> Nova Pergunta
        </Button>
      </div>

      {/* Center/Right Panel: Editor & Preview */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {activeQuestion ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Editor */}
            <div className="w-full lg:w-1/2 p-8 overflow-y-auto border-r border-gray-50 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">CONFIGURAÇÃO</h4>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold text-[#64748B]">OBRIGATÓRIA</Label>
                    <Switch 
                      checked={activeQuestion.required} 
                      onCheckedChange={(v) => handleUpdateQuestion({ required: v })}
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-[#64748B]">TIPO DE PERGUNTA</Label>
                    <Select 
                      value={activeQuestion.type} 
                      onValueChange={(v) => handleUpdateQuestion({ type: v })}
                      disabled={isLocked}
                    >
                      <SelectTrigger className="h-10 rounded-lg border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {QUESTION_TYPES.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-[#64748B]">CÓDIGO DA VARIÁVEL</Label>
                    <Input 
                      value={activeQuestion.variableCode} 
                      onChange={(e) => handleUpdateQuestion({ variableCode: e.target.value })}
                      className="h-10 rounded-lg border-gray-200 font-mono text-xs"
                      disabled={isLocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-[#64748B]">TEXTO DA PERGUNTA</Label>
                    <Textarea 
                      value={activeQuestion.question} 
                      onChange={(e) => handleUpdateQuestion({ question: e.target.value })}
                      className="min-h-[80px] rounded-lg border-gray-200 font-display font-bold text-lg"
                      disabled={isLocked}
                    />
                  </div>

                  {['single', 'multiple', 'ranking', 'matrix'].includes(activeQuestion.type) && (
                    <div className="space-y-4 pt-4">
                      <Label className="text-[10px] font-bold text-[#64748B]">OPÇÕES DE RESPOSTA</Label>
                      <div className="space-y-2">
                        {activeQuestion.options.map((opt: any, idx: number) => (
                          <div key={opt.id} className="flex gap-2">
                            <Input 
                              value={opt.text} 
                              onChange={(e) => {
                                const updatedOpts = [...activeQuestion.options];
                                updatedOpts[idx].text = e.target.value;
                                handleUpdateQuestion({ options: updatedOpts });
                              }}
                              className="h-10 rounded-lg border-gray-200 text-sm"
                              disabled={isLocked}
                            />
                            <Input 
                              value={opt.code} 
                              onChange={(e) => {
                                const updatedOpts = [...activeQuestion.options];
                                updatedOpts[idx].code = e.target.value;
                                handleUpdateQuestion({ options: updatedOpts });
                              }}
                              className="h-10 w-16 rounded-lg border-gray-200 text-xs text-center"
                              placeholder="Cód"
                              disabled={isLocked}
                            />
                            {!isLocked && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-gray-300 hover:text-red-600"
                                onClick={() => {
                                  const updatedOpts = activeQuestion.options.filter((_: any, i: number) => i !== idx);
                                  handleUpdateQuestion({ options: updatedOpts });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {!isLocked && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-dashed rounded-lg text-xs font-bold"
                            onClick={() => {
                              const newOpt = { id: Date.now().toString(), text: `Opção ${activeQuestion.options.length + 1}`, code: (activeQuestion.options.length + 1).toString() };
                              handleUpdateQuestion({ options: [...activeQuestion.options, newOpt] });
                            }}
                          >
                            <Plus className="h-3 w-3 mr-2" /> Adicionar Opção
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview (60% on desktop) */}
            <div className="hidden lg:flex flex-1 bg-[#F1EFE8] p-12 items-center justify-center overflow-y-auto">
              <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-12 space-y-8 min-h-[400px] flex flex-col justify-center">
                <div className="space-y-2">
                  <p className="text-[#1D9E75] text-[10px] font-bold tracking-[0.3em] uppercase">PERGUNTA {questions.findIndex(q => q.id === activeQuestion.id) + 1}</p>
                  <h2 className="text-3xl font-display font-bold text-[#2D1E6B] leading-tight">
                    {activeQuestion.question}
                    {activeQuestion.required && <span className="text-red-500 ml-1">*</span>}
                  </h2>
                  {activeQuestion.helpText && <p className="text-sm text-[#64748B]">{activeQuestion.helpText}</p>}
                </div>

                <div className="space-y-3">
                  {['single', 'multiple'].includes(activeQuestion.type) ? (
                    activeQuestion.options.map((opt: any) => (
                      <div key={opt.id} className="p-4 border-2 border-gray-100 rounded-2xl hover:border-[#2D1E6B] transition-all cursor-pointer flex items-center gap-4 group">
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${activeQuestion.type === 'single' ? 'rounded-full' : 'rounded-md'} border-gray-200 group-hover:border-[#2D1E6B]`}>
                          <div className="h-2.5 w-2.5 bg-[#2D1E6B] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="font-medium text-[#2D1E6B]">{opt.text}</span>
                      </div>
                    ))
                  ) : activeQuestion.type === 'text' ? (
                    <Textarea placeholder="Digite sua resposta aqui..." className="min-h-[120px] rounded-2xl border-2 border-gray-100 focus:border-[#2D1E6B] p-4" />
                  ) : (
                    <div className="p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                      <p className="text-sm text-gray-400 font-medium">Preview para o tipo "{activeQuestion.type}" em desenvolvimento.</p>
                    </div>
                  )}
                </div>

                <div className="pt-8 flex justify-end">
                  <Button className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-purple-900/20">
                    Próxima Pergunta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="bg-[#F1EFE8] w-20 h-20 rounded-full flex items-center justify-center">
              <Settings2 className="h-10 w-10 text-[#2D1E6B]/20" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#2D1E6B]">Selecione uma pergunta</h3>
              <p className="text-sm text-[#64748B]">Escolha uma pergunta na lista ao lado para editar suas configurações.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
