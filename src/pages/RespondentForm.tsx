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
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useProjectStore, Question } from "@/stores/projectStore";
import { toast } from "sonner";
import logo from "@/assets/clarifyse-logo.png";
import { cn } from "@/lib/utils";

interface RespondentFormState {
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  sessionId: string;
  startedAt: Date;
  respondentHash: string;
}

const RespondentForm = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { projects, responses, addResponse, updateProject } = useProjectStore();
  const project = useMemo(() => projects.find((p) => p.slug === slug), [projects, slug]);

  const [formState, setFormState] = useState<RespondentFormState>({
    currentQuestionIndex: -1, // -1 para tela de boas-vindas
    answers: {},
    sessionId: crypto.randomUUID(),
    startedAt: new Date(),
    respondentHash: "",
  });

  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Gerar hash do respondente (IP + User-Agent + timestamp)
  useEffect(() => {
    const hash = btoa(`${navigator.userAgent}-${Date.now()}`).substring(0, 16);
    setFormState((prev) => ({ ...prev, respondentHash: hash }));
  }, []);

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <AlertCircle size={48} className="text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Formulário não encontrado</h1>
          <p className="text-muted-foreground">O formulário que você está procurando não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  if (project.status !== "active") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <AlertCircle size={48} className="text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Formulário indisponível</h1>
          <p className="text-muted-foreground">Este formulário não está mais disponível para respostas.</p>
        </div>
      </div>
    );
  }

  // Verificar se a quota foi atingida
  const checkQuotaReached = () => {
    if (project.sampleCurrent >= project.sampleTarget) {
      return true;
    }
    for (const quota of project.quotas) {
      for (const target of quota.targets) {
        if (target.current >= target.target) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkQuotaReached() && formState.currentQuestionIndex === -1) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md text-center">
          <div className="mb-6">
            <img src={logo} alt="Clarifyse" className="h-12 mx-auto" />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-secondary">
            <h1 className="text-2xl font-bold text-foreground mb-4">Quota Atingida</h1>
            <p className="text-muted-foreground mb-6">{project.settings.quotaReachedMessage}</p>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = project.questions[formState.currentQuestionIndex] || null;
  const progressPercentage = ((formState.currentQuestionIndex + 1) / project.questions.length) * 100;

  const handleStartForm = () => {
    if (project.settings.requirePassword && !passwordInput) {
      setValidationError("Senha obrigatória");
      return;
    }
    if (project.settings.requirePassword && passwordInput !== project.settings.password) {
      setValidationError("Senha incorreta");
      return;
    }
    setShowPasswordDialog(false);
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

    if (config.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
      setValidationError("Este campo é obrigatório");
      return false;
    }

    if (currentQuestion.type === "email" && answer) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(answer))) {
        setValidationError("E-mail inválido");
        return false;
      }
    }

    if (currentQuestion.type === "integer" && answer) {
      if (!Number.isInteger(Number(answer))) {
        setValidationError("Deve ser um número inteiro");
        return false;
      }
      if (config.min !== undefined && Number(answer) < config.min) {
        setValidationError(`Valor mínimo: ${config.min}`);
        return false;
      }
      if (config.max !== undefined && Number(answer) > config.max) {
        setValidationError(`Valor máximo: ${config.max}`);
        return false;
      }
    }

    if (currentQuestion.type === "decimal" && answer) {
      if (isNaN(Number(answer))) {
        setValidationError("Deve ser um número válido");
        return false;
      }
      if (config.min !== undefined && Number(answer) < config.min) {
        setValidationError(`Valor mínimo: ${config.min}`);
        return false;
      }
      if (config.max !== undefined && Number(answer) > config.max) {
        setValidationError(`Valor máximo: ${config.max}`);
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

    return true;
  };

  const handleNextQuestion = () => {
    if (!validateCurrentQuestion()) {
      return;
    }

    if (formState.currentQuestionIndex < project.questions.length - 1) {
      setFormState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    } else {
      setShowCompletionDialog(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (formState.currentQuestionIndex > 0) {
      setFormState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  const handleSubmitForm = () => {
    const totalTimeSeconds = Math.round((new Date().getTime() - formState.startedAt.getTime()) / 1000);

    const response = {
      projectId: project.id,
      respondentHash: formState.respondentHash,
      status: "completed" as const,
      answers: formState.answers as Record<string, { value: string; label?: string; timeSpent: number }>,
      startedAt: formState.startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      totalTimeSeconds,
      ipHash: btoa(navigator.userAgent).substring(0, 16),
      deviceInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      },
    };

    addResponse(response);

    // Atualizar contador de respostas do projeto
    updateProject(project.id, {
      sampleCurrent: project.sampleCurrent + 1,
    });

    setShowCompletionDialog(false);
    navigate(`/thank-you/${project.slug}`);
  };

  // Tela de boas-vindas
  if (formState.currentQuestionIndex === -1) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-secondary">
            <div className="mb-6">
              <img src={logo} alt="Clarifyse" className="h-12 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
              {project.name}
            </h1>
            <p className="text-sm text-secondary text-center mb-6">
              Plataforma de Pesquisa & Análise
            </p>
            <p className="text-muted-foreground mb-6 text-center">
              {project.settings.welcomeMessage}
            </p>
            {project.settings.estimatedTime && (
              <p className="text-xs text-muted-foreground text-center mb-6">
                ⏱️ Tempo estimado: {project.settings.estimatedTime} minutos
              </p>
            )}

            {project.settings.requirePassword && (
              <div className="mb-6 space-y-3">
                <Label htmlFor="password" className="text-sm">
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
              Seus dados serão armazenados de forma anônima e segura.
            </p>
          </div>
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
            <h1 className="text-lg font-semibold text-foreground">{project.name}</h1>
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
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {currentQuestion.config.text}
                </h2>
                {currentQuestion.config.description && (
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.config.description}
                  </p>
                )}
              </div>

              {/* Question Types */}
              {currentQuestion.type === "likert" && (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-3">
                    <span>{currentQuestion.config.scaleMinLabel}</span>
                    <span>{currentQuestion.config.scaleMaxLabel}</span>
                  </div>
                  <RadioGroup
                    value={String(formState.answers[currentQuestion.id] || "")}
                    onValueChange={(v) => handleAnswerChange(v)}
                  >
                    <div className={cn(
                      "flex gap-2",
                      currentQuestion.config.scaleOrientation === "vertical" && "flex-col"
                    )}>
                      {Array.from({ length: currentQuestion.config.scalePoints || 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(i + 1)} id={`likert-${i}`} />
                          <Label htmlFor={`likert-${i}`} className="cursor-pointer">
                            {i + 1}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {currentQuestion.type === "single_select" && (
                <RadioGroup
                  value={String(formState.answers[currentQuestion.id] || "")}
                  onValueChange={(v) => handleAnswerChange(v)}
                >
                  <div className="space-y-3">
                    {currentQuestion.config.options?.map((opt, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt} id={`single-${i}`} />
                        <Label htmlFor={`single-${i}`} className="cursor-pointer">
                          {opt}
                        </Label>
                      </div>
                    ))}
                    {currentQuestion.config.hasOther && (
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <RadioGroupItem value="__other__" id="single-other" />
                        <Label htmlFor="single-other" className="cursor-pointer">
                          Outro
                        </Label>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.type === "multi_select" && (
                <div className="space-y-3">
                  {currentQuestion.config.options?.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox
                        id={`multi-${i}`}
                        checked={(formState.answers[currentQuestion.id] as string[])?.includes(opt) || false}
                        onCheckedChange={(checked) => {
                          const current = (formState.answers[currentQuestion.id] as string[]) || [];
                          if (checked) {
                            handleAnswerChange([...current, opt]);
                          } else {
                            handleAnswerChange(current.filter((v) => v !== opt));
                          }
                        }}
                      />
                      <Label htmlFor={`multi-${i}`} className="cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                  {currentQuestion.config.hasOther && (
                    <div className="flex items-center space-x-2 pt-2 border-t">
                      <Checkbox
                        id="multi-other"
                        checked={(formState.answers[currentQuestion.id] as string[])?.includes("__other__") || false}
                        onCheckedChange={(checked) => {
                          const current = (formState.answers[currentQuestion.id] as string[]) || [];
                          if (checked) {
                            handleAnswerChange([...current, "__other__"]);
                          } else {
                            handleAnswerChange(current.filter((v) => v !== "__other__"));
                          }
                        }}
                      />
                      <Label htmlFor="multi-other" className="cursor-pointer">
                        Outro
                      </Label>
                    </div>
                  )}
                </div>
              )}

              {(currentQuestion.type === "integer" || currentQuestion.type === "decimal") && (
                <Input
                  type="number"
                  step={currentQuestion.type === "decimal" ? "0.01" : "1"}
                  placeholder="Digite o número"
                  value={formState.answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  min={currentQuestion.config.min}
                  max={currentQuestion.config.max}
                  className={cn(validationError && "border-destructive")}
                />
              )}

              {currentQuestion.type === "short_text" && (
                <Input
                  type="text"
                  placeholder="Digite sua resposta"
                  value={formState.answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  maxLength={currentQuestion.config.maxLength}
                  className={cn(validationError && "border-destructive")}
                />
              )}

              {currentQuestion.type === "long_text" && (
                <Textarea
                  placeholder="Digite sua resposta"
                  value={formState.answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  maxLength={currentQuestion.config.maxLength}
                  className={cn(validationError && "border-destructive")}
                  rows={5}
                />
              )}

              {currentQuestion.type === "email" && (
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={formState.answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className={cn(validationError && "border-destructive")}
                />
              )}

              {validationError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle size={16} className="text-destructive" />
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

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Seus dados serão armazenados de forma anônima e segura.
        </p>
      </div>

      {/* Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem certeza que deseja enviar suas respostas? Não será possível editá-las após o envio.
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitForm} className="bg-secondary hover:bg-secondary/90">
              Enviar Respostas
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RespondentForm;
