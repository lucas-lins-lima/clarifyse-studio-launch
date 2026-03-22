import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea as TextareaField } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Save,
  Eye,
  Send,
  SlidersHorizontal,
  Type,
  Hash,
  CheckSquare,
  Circle,
  AlignLeft,
  Mail,
  BarChart3,
} from "lucide-react";
import { useProjectStore, Question, QuestionConfig } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";
import { useActivityStore } from "@/stores/activityStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const questionTypes = [
  { type: "likert", label: "Escala Likert", icon: SlidersHorizontal, group: "Escalas" },
  { type: "single_select", label: "Múltipla Escolha (Única)", icon: Circle, group: "Escalas" },
  { type: "multi_select", label: "Múltipla Escolha (Múltipla)", icon: CheckSquare, group: "Escalas" },
  { type: "integer", label: "Número Inteiro", icon: Hash, group: "Numéricas" },
  { type: "decimal", label: "Número Decimal", icon: Hash, group: "Numéricas" },
  { type: "short_text", label: "Texto Curto", icon: Type, group: "Texto" },
  { type: "long_text", label: "Texto Longo", icon: AlignLeft, group: "Texto" },
  { type: "email", label: "E-mail", icon: Mail, group: "Texto" },
] as const;

const getDefaultConfig = (type: string): QuestionConfig => {
  const base: QuestionConfig = { text: "", required: true };
  switch (type) {
    case "likert":
      return { ...base, scalePoints: 5, scaleMinLabel: "Discordo totalmente", scaleMaxLabel: "Concordo totalmente", scaleOrientation: "horizontal" };
    case "single_select":
      return { ...base, options: [""], hasOther: false };
    case "multi_select":
      return { ...base, options: [""], hasOther: false, min: 1, max: undefined };
    case "integer":
      return { ...base, min: undefined, max: undefined };
    case "decimal":
      return { ...base, min: undefined, max: undefined, decimalPlaces: 2 };
    case "short_text":
      return { ...base, maxLength: 255 };
    case "long_text":
      return { ...base, maxLength: undefined };
    case "email":
      return { ...base };
    default:
      return base;
  }
};

// Sortable question item
const SortableQuestion = ({
  question,
  index,
  isSelected,
  onClick,
}: {
  question: Question;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const typeInfo = questionTypes.find((t) => t.type === question.type);
  const Icon = typeInfo?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-colors",
        isSelected ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical size={16} />
      </button>
      <Icon size={16} className="text-secondary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {question.config.text || `Pergunta ${index + 1}`}
        </p>
        <p className="text-xs text-muted-foreground">{typeInfo?.label}</p>
      </div>
      {question.config.required && (
        <span className="text-xs text-destructive">*</span>
      )}
    </div>
  );
};

const FormBuilder = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const updateProject = useProjectStore((s) => s.updateProject);
  const addLog = useActivityStore((s) => s.addLog);

  const [questions, setQuestions] = useState<Question[]>(project?.questions || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string | string[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedQuestion = useMemo(
    () => questions.find((q) => q.id === selectedId) || null,
    [questions, selectedId]
  );

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  const addQuestion = (type: string) => {
    const newQ: Question = {
      id: crypto.randomUUID(),
      type: type as Question["type"],
      orderIndex: questions.length,
      config: getDefaultConfig(type),
    };
    setQuestions([...questions, newQ]);
    setSelectedId(newQ.id);
  };

  const updateQuestion = (id: string, config: Partial<QuestionConfig>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, config: { ...q.config, ...config } } : q))
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const reordered = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({
        ...q,
        orderIndex: i,
      }));
      setQuestions(reordered);
    }
  };

  const handleSave = () => {
    updateProject(project.id, { questions });
    addLog({ userId: currentUser!.id, userName: currentUser!.name, userRole: currentUser!.role, action: "save_form", details: `Salvou formulário do projeto "${project.name}"` });
    toast.success("Formulário salvo!");
  };

  const handlePublish = () => {
    if (questions.length === 0) {
      toast.error("Adicione pelo menos uma pergunta.");
      return;
    }
    const invalid = questions.filter((q) => !q.config.text.trim());
    if (invalid.length > 0) {
      toast.error("Todas as perguntas devem ter um texto.");
      return;
    }
    if (project.sampleTarget <= 0) {
      toast.error("Meta de amostra deve estar definida.");
      return;
    }

    updateProject(project.id, {
      questions,
      status: "active",
      publishedAt: new Date().toISOString(),
    });
    addLog({ userId: currentUser!.id, userName: currentUser!.name, userRole: currentUser!.role, action: "publish_form", details: `Publicou formulário do projeto "${project.name}"` });
    toast.success("Formulário publicado! Links gerados.");
    navigate(`/projetos/${project.id}`);
  };

  const addOption = (qId: string) => {
    const q = questions.find((q) => q.id === qId);
    if (q?.config.options) {
      updateQuestion(qId, { options: [...q.config.options, ""] });
    }
  };

  const updateOption = (qId: string, index: number, value: string) => {
    const q = questions.find((q) => q.id === qId);
    if (q?.config.options) {
      const opts = [...q.config.options];
      opts[index] = value;
      updateQuestion(qId, { options: opts });
    }
  };

  const removeOption = (qId: string, index: number) => {
    const q = questions.find((q) => q.id === qId);
    if (q?.config.options && q.config.options.length > 1) {
      updateQuestion(qId, { options: q.config.options.filter((_, i) => i !== index) });
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projetos`)} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{project.name}</h2>
            <p className="text-xs text-muted-foreground">Construtor de Formulário</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus size={14} /> Adicionar Pergunta
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {["Escalas", "Numéricas", "Texto"].map((group) => (
                <div key={group}>
                  <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">{group}</p>
                  {questionTypes
                    .filter((t) => t.group === group)
                    .map((t) => (
                      <DropdownMenuItem key={t.type} onClick={() => addQuestion(t.type)}>
                        <t.icon size={14} className="mr-2" /> {t.label}
                      </DropdownMenuItem>
                    ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleSave} className="gap-1">
            <Save size={14} /> Salvar
          </Button>
          <Button size="sm" onClick={handlePublish} className="gap-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            <Send size={14} /> Publicar
          </Button>
        </div>
      </div>

      {/* Builder layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Question list */}
        <div className="w-72 shrink-0 border-r border-border bg-card overflow-y-auto p-3 space-y-2">
          <p className="label-caps mb-3">Perguntas ({questions.length})</p>
          {questions.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                {questions.map((q, i) => (
                  <SortableQuestion
                    key={q.id}
                    question={q}
                    index={i}
                    isSelected={selectedId === q.id}
                    onClick={() => setSelectedId(q.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="rounded-md border border-dashed border-border p-6 text-center">
              <BarChart3 size={24} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                Adicione perguntas usando o botão acima
              </p>
            </div>
          )}
        </div>

        {/* Center: Preview */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-8">
          <div className="mx-auto max-w-xl space-y-6">
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Eye size={40} className="text-muted-foreground/30 mb-3" />
                <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Pré-visualização do Formulário</h3>
                <p className="text-sm text-muted-foreground">
                  As perguntas aparecerão aqui conforme você as adicionar.
                </p>
              </div>
            ) : (
              questions.map((q, i) => {
                const typeInfo = questionTypes.find((t) => t.type === q.type);
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    className={cn(
                      "card-studio p-6 cursor-pointer transition-all",
                      selectedId === q.id && "ring-2 ring-secondary"
                    )}
                  >
                    <p className="text-xs text-muted-foreground mb-2">
                      {i + 1}. {typeInfo?.label}
                    </p>
                    <p className="text-lg font-medium text-foreground">
                      {q.config.text || "Pergunta sem texto"}
                      {q.config.required && <span className="text-destructive ml-1">*</span>}
                    </p>
                    {q.config.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{q.config.description}</p>
                    )}

                    {/* Preview of answer area */}
                    <div className="mt-4">
                      {(q.type === "single_select" || q.type === "multi_select") && (
                        <div className="space-y-2">
                          {q.config.options?.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <div className={cn("h-4 w-4 rounded border border-border", q.type === "single_select" ? "rounded-full" : "rounded")} />
                              <span className="text-sm text-muted-foreground">{opt || `Opção ${oi + 1}`}</span>
                            </div>
                          ))}
                          {q.config.hasOther && (
                            <div className="flex items-center gap-2">
                              <div className={cn("h-4 w-4 rounded border border-border", q.type === "single_select" ? "rounded-full" : "rounded")} />
                              <span className="text-sm text-muted-foreground italic">Outro...</span>
                            </div>
                          )}
                        </div>
                      )}
                      {q.type === "likert" && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">{q.config.scaleMinLabel}</span>
                          <div className="flex gap-2">
                            {Array.from({ length: q.config.scalePoints || 5 }, (_, i) => (
                              <div key={i} className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-xs text-muted-foreground">
                                {i + 1}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{q.config.scaleMaxLabel}</span>
                        </div>
                      )}
                      {(q.type === "short_text" || q.type === "email") && (
                        <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                          {q.type === "email" ? "nome@email.com" : "Resposta curta..."}
                        </div>
                      )}
                      {q.type === "long_text" && (
                        <div className="rounded-md border border-border bg-muted/50 px-3 py-6 text-sm text-muted-foreground">
                          Resposta longa...
                        </div>
                      )}
                      {(q.type === "integer" || q.type === "decimal") && (
                        <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground w-32">
                          {q.type === "decimal" ? "0.00" : "0"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Config panel */}
        <div className="w-80 shrink-0 border-l border-border bg-card overflow-y-auto p-4">
          {selectedQuestion ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="label-caps">Configuração</p>
                <button
                  onClick={() => removeQuestion(selectedQuestion.id)}
                  className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={16} className="text-destructive" />
                </button>
              </div>

              <div className="space-y-2">
                <Label>Texto da Pergunta *</Label>
                <Textarea
                  value={selectedQuestion.config.text}
                  onChange={(e) => updateQuestion(selectedQuestion.id, { text: e.target.value })}
                  placeholder="Digite o texto da pergunta..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição / Instrução</Label>
                <Input
                  value={selectedQuestion.config.description || ""}
                  onChange={(e) => updateQuestion(selectedQuestion.id, { description: e.target.value })}
                  placeholder="Instrução adicional..."
                  className="h-9"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Obrigatória</Label>
                <Switch
                  checked={selectedQuestion.config.required}
                  onCheckedChange={(v) => updateQuestion(selectedQuestion.id, { required: v })}
                />
              </div>

              {selectedQuestion.config.required && (
                <div className="space-y-2">
                  <Label>Mensagem de erro</Label>
                  <Input
                    value={selectedQuestion.config.errorMessage || ""}
                    onChange={(e) => updateQuestion(selectedQuestion.id, { errorMessage: e.target.value })}
                    placeholder="Campo obrigatório"
                    className="h-9"
                  />
                </div>
              )}

              {/* Type-specific config */}
              {selectedQuestion.type === "likert" && (
                <>
                  <div className="space-y-2">
                    <Label>Número de Pontos</Label>
                    <Select
                      value={String(selectedQuestion.config.scalePoints || 5)}
                      onValueChange={(v) => updateQuestion(selectedQuestion.id, { scalePoints: Number(v) })}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 pontos</SelectItem>
                        <SelectItem value="7">7 pontos</SelectItem>
                        <SelectItem value="10">10 pontos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rótulo Mínimo</Label>
                    <Input value={selectedQuestion.config.scaleMinLabel || ""} onChange={(e) => updateQuestion(selectedQuestion.id, { scaleMinLabel: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label>Rótulo Máximo</Label>
                    <Input value={selectedQuestion.config.scaleMaxLabel || ""} onChange={(e) => updateQuestion(selectedQuestion.id, { scaleMaxLabel: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label>Orientação</Label>
                    <Select
                      value={selectedQuestion.config.scaleOrientation || "horizontal"}
                      onValueChange={(v) => updateQuestion(selectedQuestion.id, { scaleOrientation: v as "horizontal" | "vertical" })}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {(selectedQuestion.type === "single_select" || selectedQuestion.type === "multi_select") && (
                <>
                  <div className="space-y-2">
                    <Label>Opções</Label>
                    {selectedQuestion.config.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(selectedQuestion.id, i, e.target.value)}
                          placeholder={`Opção ${i + 1}`}
                          className="h-9 flex-1"
                        />
                        {(selectedQuestion.config.options?.length || 0) > 1 && (
                          <button onClick={() => removeOption(selectedQuestion.id, i)} className="p-1 hover:bg-destructive/10 rounded transition-colors">
                            <Trash2 size={14} className="text-destructive" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(selectedQuestion.id)}
                      className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
                    >
                      <Plus size={12} /> Adicionar opção
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Opção "Outro"</Label>
                    <Switch
                      checked={selectedQuestion.config.hasOther || false}
                      onCheckedChange={(v) => updateQuestion(selectedQuestion.id, { hasOther: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Aleatorizar opções</Label>
                    <Switch
                      checked={selectedQuestion.config.randomizeOptions || false}
                      onCheckedChange={(v) => updateQuestion(selectedQuestion.id, { randomizeOptions: v })}
                    />
                  </div>
                  {selectedQuestion.type === "multi_select" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Mínimo seleções</Label>
                        <Input type="number" min="1" value={selectedQuestion.config.min || ""} onChange={(e) => updateQuestion(selectedQuestion.id, { min: Number(e.target.value) || undefined })} className="h-9" />
                      </div>
                      <div className="space-y-2">
                        <Label>Máximo seleções</Label>
                        <Input type="number" min="1" value={selectedQuestion.config.max || ""} onChange={(e) => updateQuestion(selectedQuestion.id, { max: Number(e.target.value) || undefined })} className="h-9" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {(selectedQuestion.type === "integer" || selectedQuestion.type === "decimal") && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Valor mínimo</Label>
                    <Input type="number" value={selectedQuestion.config.min ?? ""} onChange={(e) => updateQuestion(selectedQuestion.id, { min: e.target.value ? Number(e.target.value) : undefined })} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor máximo</Label>
                    <Input type="number" value={selectedQuestion.config.max ?? ""} onChange={(e) => updateQuestion(selectedQuestion.id, { max: e.target.value ? Number(e.target.value) : undefined })} className="h-9" />
                  </div>
                  {selectedQuestion.type === "decimal" && (
                    <div className="space-y-2 col-span-2">
                      <Label>Casas decimais</Label>
                      <Select value={String(selectedQuestion.config.decimalPlaces || 2)} onValueChange={(v) => updateQuestion(selectedQuestion.id, { decimalPlaces: Number(v) })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 casa</SelectItem>
                          <SelectItem value="2">2 casas</SelectItem>
                          <SelectItem value="3">3 casas</SelectItem>
                          <SelectItem value="4">4 casas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {(selectedQuestion.type === "short_text" || selectedQuestion.type === "long_text") && (
                <div className="space-y-2">
                  <Label>Máximo de caracteres</Label>
                  <Input type="number" min="1" value={selectedQuestion.config.maxLength || ""} onChange={(e) => updateQuestion(selectedQuestion.id, { maxLength: Number(e.target.value) || undefined })} className="h-9" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <SlidersHorizontal size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Selecione uma pergunta para configurar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
