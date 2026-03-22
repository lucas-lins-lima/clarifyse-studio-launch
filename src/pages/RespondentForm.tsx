import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useProjectStore, Question } from "@/stores/projectStore";
import logo from "@/assets/clarifyse-logo.png";
import { cn } from "@/lib/utils";

interface RespondentFormState {
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  sessionId: string;
  startedAt: Date;
  respondentHash: string;
}

// Evaluate skip logic for a question given the current answers
const evaluateSkipLogic = (
  question: Question,
  answers: Record<string, string | string[]>,
  questions: Question[]
): { action: "next" | "skip" | "end"; targetIndex?: number } => {
  if (!question.config.skipLogic || question.config.skipLogic.length === 0) {
    return { action: "next" };
  }

  for (const rule of question.config.skipLogic) {
    const answer = answers[rule.questionId];
    const answerStr = Array.isArray(answer) ? answer.join(",") : String(answer || "");
    const ruleValue = rule.value;
    const matches =
      Array.isArray(answer)
        ? answer.includes(ruleValue)
        : answerStr === ruleValue;

    if (matches) {
      if (rule.action === "end") return { action: "end" };
      if (rule.action === "skip" && rule.targetQuestionId) {
        const targetIndex = questions.findIndex((q) => q.id === rule.targetQuestionId);
        if (targetIndex !== -1) return { action: "skip", targetIndex };
      }
    }
  }

  return { action: "next" };
};

const RespondentForm = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { projects, responses, addResponse, updateProject } = useProjectStore();
  const project = useMemo(() => projects.find((p) => p.slug === slug), [projects, slug]);

  const [formState, setFormState] = useState<RespondentFormState>({
    currentQuestionIndex: -1,
    answers: {},
    sessionId: crypto.randomUUID(),
    startedAt: new Date(),
    respondentHash: "",
  });

  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [formEnded, setFormEnded] = useState(false);

  useEffect(() => {
    const hash = btoa(`${navigator.userAgent}-${Date.now()}`).substring(0, 16);
    setFormState((prev) => ({ ...prev, respondentHash: hash }));
  }, []);

  // ── Projecto não encontrado ──
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md text-center">
          <XCircle size={48} className="text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Formulário não encontrado</h1>
          <p className="text-muted-foreground">O formulário que você está procurando não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  // ── Formulário não está ativo ──
  if (project.status !== "active") {
    const isSampleComplete = project.sampleCurrent >= project.sampleTarget && project.sampleTarget > 0;
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-secondary text-center">
            <div className="mb-6">
              <img src={logo} alt="Clarifyse" className="h-12 mx-auto" />
            </div>
            <CheckCircle2 size={48} className="text-secondary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-3">Pesquisa Encerrada</h1>
            <p className="text-muted-foreground mb-6">
              {isSampleComplete
                ? project.settings.sampleCompleteMessage
                : "Esta pesquisa não está mais disponível para respostas."}
            </p>
            <Button variant="outline" onClick={() => window.close()} className="w-full">
              Fechar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Pesquisa realizada por Clarifyse Strategy & Research
          </p>
        </div>
      </div>
    );
  }

  // ── Amostra total atingida ──
  if (project.sampleCurrent >= project.sampleTarget && project.sampleTarget > 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-secondary text-center">
            <div className="mb-6">
              <img src={logo} alt="Clarifyse" className="h-12 mx-auto" />
            </div>
            <CheckCircle2 size={48} className="text-secondary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-3">Pesquisa Encerrada</h1>
            <p className="text-muted-foreground mb-6">{project.settings.sampleCompleteMessage}</p>
            <Button variant="outline" onClick={() => window.close()} className="w-full">
              Fechar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Pesquisa realizada por Clarifyse Strategy & Research
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = project.questions[formState.currentQuestionIndex] || null;
  const progressPercentage =
    formState.currentQuestionIndex >= 0
      ? ((formState.currentQuestionIndex + 1) / Math.max(project.questions.length, 1)) * 100
      : 0;

  const handleStartForm = () => {
    if (project.settings.requirePassword) {
      if (!passwordInput) {
        setValidationError("Senha obrigatória");
        return;
      }
      if (passwordInput !== project.settings.password) {
        setValidationError("Senha incorreta");
        return;
      }
    }
    setValidationError(null);
    setFormState((prev) => ({ ...prev, currentQuestionIndex: 0 }));
  };

  const handleAnswerChange = (value: string | string[]) => {
    if (!currentQuestion) return;
    setFormState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: value },
    }));
    setValidationError(null);
  };

  const validateCurrentQuestion = (): boolean => {
    if (!currentQuestion) return true;
    const answer = formState.answers[currentQuestion.id];
    const config = currentQuestion.config;

    if (config.required && (!answer || (Array.isArray(answer) && answer.length === 0) || answer === "")) {
      setValidationError(config.errorMessage || "Este campo é obrigatório");
      return false;
    }

    if (currentQuestion.type === "email" && answer) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(answer))) {
        setValidationError("E-mail inválido");
        return false;
      }
    }

    if ((currentQuestion.type === "integer" || currentQuestion.type === "decimal") && answer) {
      const num = Number(answer);
      if (isNaN(num)) {
        setValidationError("Deve ser um número válido");
        return false;
      }
      if (config.min !== undefined && num < config.min) {
        setValidationError(`Valor mínimo: ${config.min}`);
        return false;
      }
      if (config.max !== undefined && num > config.max) {
        setValidationError(`Valor máximo: ${config.max}`);
        return false;
      }
      if (currentQuestion.type === "integer" && !Number.isInteger(num)) {
        setValidationError("Deve ser um número inteiro");
        return false;
      }
    }

    if (currentQuestion.type === "short_text" && answer && config.maxLength) {
      if (String(answer).length > config.maxLength) {
        setValidationError(`Máximo ${config.maxLength} caracteres`);
        return false;
      }
    }

    if (currentQuestion.type === "multi_select" && Array.isArray(answer)) {
      if (config.min && answer.length < config.min) {
        setValidationError(`Selecione pelo menos ${config.min} opção(ões)`);
        return false;
      }
      if (config.max && answer.length > config.max) {
        setValidationError(`Selecione no máximo ${config.max} opção(ões)`);
        return false;
      }
    }

    if (config.regexPattern && answer) {
      try {
        const regex = new RegExp(config.regexPattern);
        if (!regex.test(String(answer))) {
          setValidationError("Formato inválido");
          return false;
        }
      } catch {
        // ignore bad regex
      }
    }

    return true;
  };

  const handleNextQuestion = () => {
    if (!validateCurrentQuestion()) return;

    if (!currentQuestion) return;

    // Evaluate skip logic
    const skipResult = evaluateSkipLogic(currentQuestion, formState.answers, project.questions);

    if (skipResult.action === "end") {
      // End form early
      setFormEnded(true);
      setShowCompletionDialog(true);
      return;
    }

    if (skipResult.action === "skip" && skipResult.targetIndex !== undefined) {
      setFormState((prev) => ({ ...prev, currentQuestionIndex: skipResult.targetIndex! }));
      return;
    }

    // Normal next
    if (formState.currentQuestionIndex < project.questions.length - 1) {
      setFormState((prev) => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    } else {
      setShowCompletionDialog(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (formState.currentQuestionIndex > 0) {
      setFormState((prev) => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 }));
      setValidationError(null);
    }
  };

  const handleSubmitForm = () => {
    const totalTimeSeconds = Math.round(
      (new Date().getTime() - formState.startedAt.getTime()) / 1000
    );

    const response = {
      projectId: project.id,
      respondentHash: formState.respondentHash,
      status: "completed" as const,
      answers: formState.answers,
      startedAt: formState.startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      totalTimeSeconds,
      ipHash: btoa(navigator.userAgent).substring(0, 16),
      deviceInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform || "web",
      },
    };

    addResponse(response);
    updateProject(project.id, { sampleCurrent: project.sampleCurrent + 1 });

    setShowCompletionDialog(false);
    navigate(`/thank-you/${project.slug}`);
  };

  // ── Tela de boas-vindas ──
  if (formState.currentQuestionIndex === -1) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-secondary">
            <div className="mb-6">
              <img src={logo} alt="Clarifyse" className="h-12 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2 text-center font-serif">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-muted-foreground text-center mb-4">{project.description}</p>
            )}
            <p className="text-muted-foreground mb-6 text-center text-sm">
              {project.settings.welcomeMessage}
            </p>
            {project.settings.estimatedTime && (
              <p className="text-xs text-muted-foreground text-center mb-6">
                ⏱️ Tempo estimado: {project.settings.estimatedTime} minutos
              </p>
            )}

            {project.settings.requirePassword && (
              <div className="mb-6 space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha de Acesso
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite a senha"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setValidationError(null);
                  }}
                  className={cn(validationError && "border-destructive")}
                />
                {validationError && (
                  <p className="text-xs text-destructive">{validationError}</p>
                )}
              </div>
            )}

            <Button
              onClick={handleStartForm}
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
            >
              Iniciar Pesquisa
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Seus dados serão armazenados de forma anônima e segura (LGPD).
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Pesquisa realizada por Clarifyse Strategy & Research
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="Clarifyse" className="h-8" />
            <h1 className="text-base font-semibold text-foreground">{project.name}</h1>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Pergunta {formState.currentQuestionIndex + 1} de {project.questions.length}
          </p>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 border-l-4 border-secondary">
          {currentQuestion && (
            <div className="space-y-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  {formState.currentQuestionIndex + 1}.
                </p>
                <h2 className="text-xl font-bold text-foreground mb-1 font-serif">
                  {currentQuestion.config.text}
                  {currentQuestion.config.required && (
                    <span className="text-destructive ml-1 text-base">*</span>
                  )}
                </h2>
                {currentQuestion.config.description && (
                  <p className="text-sm text-muted-foreground">{currentQuestion.config.description}</p>
                )}
              </div>

              {/* Likert Scale */}
              {currentQuestion.type === "likert" && (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>{currentQuestion.config.scaleMinLabel}</span>
                    <span>{currentQuestion.config.scaleMaxLabel}</span>
                  </div>
                  <RadioGroup
                    value={String(formState.answers[currentQuestion.id] || "")}
                    onValueChange={(v) => handleAnswerChange(v)}
                  >
                    <div
                      className={cn(
                        "flex gap-3 flex-wrap",
                        currentQuestion.config.scaleOrientation === "vertical" && "flex-col"
                      )}
                    >
                      {Array.from({ length: currentQuestion.config.scalePoints || 5 }).map(
                        (_, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <RadioGroupItem value={String(i + 1)} id={`likert-${i}`} />
                            <Label
                              htmlFor={`likert-${i}`}
                              className="cursor-pointer text-sm font-medium"
                            >
                              {i + 1}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Single Select */}
              {currentQuestion.type === "single_select" && (
                <RadioGroup
                  value={String(formState.answers[currentQuestion.id] || "")}
                  onValueChange={(v) => handleAnswerChange(v)}
                >
                  <div className="space-y-3">
                    {currentQuestion.config.options?.map((opt, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-3 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleAnswerChange(opt)}
                      >
                        <RadioGroupItem value={opt} id={`single-${i}`} />
                        <Label htmlFor={`single-${i}`} className="cursor-pointer flex-1">
                          {opt}
                        </Label>
                      </div>
                    ))}
                    {currentQuestion.config.hasOther && (
                      <div
                        className="flex items-center space-x-3 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleAnswerChange("__other__")}
                      >
                        <RadioGroupItem value="__other__" id="single-other" />
                        <Label htmlFor="single-other" className="cursor-pointer flex-1 text-muted-foreground">
                          Outro
                        </Label>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              )}

              {/* Multi Select */}
              {currentQuestion.type === "multi_select" && (
                <div className="space-y-3">
                  {currentQuestion.config.options?.map((opt, i) => {
                    const checked =
                      (formState.answers[currentQuestion.id] as string[])?.includes(opt) || false;
                    return (
                      <div
                        key={i}
                        className="flex items-center space-x-3 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          const current =
                            (formState.answers[currentQuestion.id] as string[]) || [];
                          handleAnswerChange(
                            checked ? current.filter((v) => v !== opt) : [...current, opt]
                          );
                        }}
                      >
                        <Checkbox id={`multi-${i}`} checked={checked} onCheckedChange={() => {}} />
                        <Label htmlFor={`multi-${i}`} className="cursor-pointer flex-1">
                          {opt}
                        </Label>
                      </div>
                    );
                  })}
                  {currentQuestion.config.hasOther && (
                    <div
                      className="flex items-center space-x-3 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        const current =
                          (formState.answers[currentQuestion.id] as string[]) || [];
                        const checked = current.includes("__other__");
                        handleAnswerChange(
                          checked
                            ? current.filter((v) => v !== "__other__")
                            : [...current, "__other__"]
                        );
                      }}
                    >
                      <Checkbox
                        id="multi-other"
                        checked={
                          (formState.answers[currentQuestion.id] as string[])?.includes(
                            "__other__"
                          ) || false
                        }
                        onCheckedChange={() => {}}
                      />
                      <Label htmlFor="multi-other" className="cursor-pointer flex-1 text-muted-foreground">
                        Outro
                      </Label>
                    </div>
                  )}
                  {(currentQuestion.config.min || currentQuestion.config.max) && (
                    <p className="text-xs text-muted-foreground">
                      {currentQuestion.config.min && currentQuestion.config.max
                        ? `Selecione entre ${currentQuestion.config.min} e ${currentQuestion.config.max} opções`
                        : currentQuestion.config.min
                        ? `Selecione pelo menos ${currentQuestion.config.min} opção(ões)`
                        : `Selecione no máximo ${currentQuestion.config.max} opção(ões)`}
                    </p>
                  )}
                </div>
              )}

              {/* Integer / Decimal */}
              {(currentQuestion.type === "integer" || currentQuestion.type === "decimal") && (
                <Input
                  type="number"
                  step={currentQuestion.type === "decimal" ? `${"0." + "0".repeat(currentQuestion.config.decimalPlaces || 2)}` : "1"}
                  placeholder="Digite o número"
                  value={String(formState.answers[currentQuestion.id] || "")}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  min={currentQuestion.config.min}
                  max={currentQuestion.config.max}
                  className={cn("h-12 text-lg", validationError && "border-destructive")}
                />
              )}

              {/* Short Text */}
              {currentQuestion.type === "short_text" && (
                <div>
                  <Input
                    type="text"
                    placeholder="Digite sua resposta"
                    value={String(formState.answers[currentQuestion.id] || "")}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    maxLength={currentQuestion.config.maxLength}
                    className={cn("h-12 text-lg", validationError && "border-destructive")}
                  />
                  {currentQuestion.config.maxLength && (
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {String(formState.answers[currentQuestion.id] || "").length}/
                      {currentQuestion.config.maxLength}
                    </p>
                  )}
                </div>
              )}

              {/* Long Text */}
              {currentQuestion.type === "long_text" && (
                <Textarea
                  placeholder="Digite sua resposta"
                  value={String(formState.answers[currentQuestion.id] || "")}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  maxLength={currentQuestion.config.maxLength}
                  className={cn(validationError && "border-destructive")}
                  rows={5}
                />
              )}

              {/* Email */}
              {currentQuestion.type === "email" && (
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={String(formState.answers[currentQuestion.id] || "")}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className={cn("h-12 text-lg", validationError && "border-destructive")}
                />
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle size={16} className="text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{validationError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={formState.currentQuestionIndex === 0}
            className="flex-1"
          >
            <ArrowLeft size={16} className="mr-2" /> Anterior
          </Button>
          <Button
            onClick={handleNextQuestion}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
          >
            {formState.currentQuestionIndex === project.questions.length - 1 ? (
              <>
                Enviar <ArrowRight size={16} className="ml-2" />
              </>
            ) : (
              <>
                Próxima <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Pesquisa realizada por Clarifyse Strategy & Research
        </p>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem certeza que deseja enviar suas respostas? Não será possível editá-las após o envio.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Voltar e revisar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitForm}
              className="bg-secondary hover:bg-secondary/90"
            >
              Confirmar Envio
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RespondentForm;
