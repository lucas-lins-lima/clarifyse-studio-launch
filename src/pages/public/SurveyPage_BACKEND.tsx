import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, X, Star, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import { toast } from 'sonner';
import { MatrixQuestion } from '@/components/questions/public/MatrixQuestion';
import { FileUploadQuestion } from '@/components/questions/public/FileUploadQuestion';
import { ConjointQuestion } from '@/components/questions/public/ConjointQuestion';
import { MaxDiffQuestion } from '@/components/questions/public/MaxDiffQuestion';
import { ImageChoiceQuestion } from '@/components/questions/public/ImageChoiceQuestion';

/**
 * SURVEY PAGE - VERSÃO COM BACKEND
 * 
 * Carrega formulários do backend (API Express) em vez de localStorage
 * Mantém formulários ativos 24/7 independente do notebook do admin
 * Implementa lógica de cotas centralizada no backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [verbatims, setVerbatims] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [quotaCheckResult, setQuotaCheckResult] = useState<any>(null);

  /**
   * FUNÇÃO AUXILIAR: Calcular o grupo de cota para um conjunto de respostas
   */
  const calculateQuotaGroupForAnswers = (proj: any, ans: Record<string, any>): string => {
    if (!proj.quotas || proj.quotas.length === 0) return "Geral";

    for (const quota of proj.quotas) {
      if (!quota.questionId) continue;

      const question = proj.formQuestions?.find((q: any) => q.id === quota.questionId);
      if (!question) continue;

      const answer = ans[question.variableCode];
      if (answer === undefined || answer === null) continue;

      if (quota.mappings && quota.mappings.length > 0) {
        const mapping = quota.mappings.find((m: any) => String(m.code) === String(answer));
        if (mapping && mapping.groupId) {
          const group = quota.groups?.find((g: any) => g.id === mapping.groupId);
          if (group) return group.name;
        }
      }
    }

    return "Geral";
  };

  /**
   * FUNÇÃO AUXILIAR: Verificar se a amostra total foi atingida
   */
  const isSampleFull = (proj: any): boolean => {
    if (!proj.sampleSize || proj.sampleSize <= 0) return false;
    const totalResponses = proj.totalResponses || 0;
    return totalResponses >= proj.sampleSize;
  };

  // ============================================================================
  // CARREGAMENTO INICIAL - BUSCAR DO BACKEND
  // ============================================================================

  useEffect(() => {
    if (id) {
      const alreadySubmitted = localStorage.getItem(`survey_submitted_${id}`);
      if (alreadySubmitted) {
        setBlocked('already_submitted');
        setLoading(false);
        return;
      }

      // Buscar formulário do backend
      const fetchForm = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/forms/${id}`);

          if (!response.ok) {
            if (response.status === 404) {
              setProject(null);
            } else {
              throw new Error('Erro ao carregar formulário');
            }
            setLoading(false);
            return;
          }

          const formData = await response.json();

          // Verificar se amostra total foi atingida
          if (isSampleFull(formData)) {
            setBlocked('sample');
          }

          setProject(formData);
        } catch (error) {
          console.error('Erro ao buscar formulário:', error);
          toast.error('Erro ao carregar formulário. Tente novamente.');
          setProject(null);
        } finally {
          setLoading(false);
        }
      };

      const timer = setTimeout(fetchForm, 300);
      return () => clearTimeout(timer);
    }
  }, [id]);

  // ============================================================================
  // NAVEGAÇÃO E LÓGICA DE COTAS DINÂMICA
  // ============================================================================

  const handleNext = () => {
    if (!project) return;

    // Validar resposta atual
    if (currentQuestionIndex >= 0) {
      const currentQuestion = project.formQuestions[currentQuestionIndex];
      const currentAnswer = answers[currentQuestion.variableCode];

      if (currentQuestion.required && (currentAnswer === undefined || currentAnswer === '' || (Array.isArray(currentAnswer) && currentAnswer.length === 0))) {
        toast.error("Por favor, responda esta pergunta antes de prosseguir.");
        return;
      }

      if (currentQuestion.type === 'nps' && currentQuestion.required && !verbatims[currentQuestion.variableCode]) {
        toast.error("Por favor, explique o motivo da sua nota.");
        return;
      }
    }

    // Determinar próxima pergunta (com suporte a lógica de salto)
    let nextIndex = currentQuestionIndex + 1;
    if (currentQuestionIndex >= 0) {
      const currentQuestion = project.formQuestions[currentQuestionIndex];
      const currentAnswer = answers[currentQuestion.variableCode];
      if (currentQuestion.logic && currentQuestion.logic.length > 0) {
        const rule = currentQuestion.logic.find((l: any) => String(l.condition) === String(currentAnswer));
        if (rule && rule.action === 'skip_to') {
          const targetIndex = project.formQuestions.findIndex((q: any) => q.id === rule.targetId);
          if (targetIndex !== -1) nextIndex = targetIndex;
        }
      }
    }

    if (nextIndex >= project.formQuestions.length) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(nextIndex);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > -1) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!project || submitting) return;
    setSubmitting(true);

    try {
      const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
      const quotaGroup = calculateQuotaGroupForAnswers(project, answers);

      const finalAnswers = { ...answers };
      Object.keys(verbatims).forEach(key => {
        finalAnswers[`${key}_verbatim`] = verbatims[key];
      });

      // Enviar resposta para o backend
      const response = await fetch(`${API_BASE_URL}/api/responses/${project.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: finalAnswers,
          quotaGroup,
          timeSpentSeconds
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Erro de validação (cota ou amostra atingida)
        if (response.status === 409) {
          if (result.error === 'Cota atingida') {
            setBlocked('quota');
            setQuotaCheckResult({ quotaGroup: result.quotaGroup });
          } else if (result.error === 'Amostra total atingida') {
            setBlocked('sample');
          }
          toast.error(result.message);
        } else {
          toast.error(result.error || 'Erro ao enviar resposta');
        }
        setSubmitting(false);
        return;
      }

      // Sucesso!
      localStorage.setItem(`survey_submitted_${project.id}`, 'true');
      setTimeout(() => {
        setSubmitting(false);
        setSubmitted(true);
      }, 800);
    } catch (error) {
      console.error('Erro ao submeter resposta:', error);
      toast.error('Erro ao enviar resposta. Tente novamente.');
      setSubmitting(false);
    }
  };

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1EFE8]">
      <Loader2 className="h-8 w-8 animate-spin text-[#2D1E6B]" />
    </div>
  );

  if (!project && !loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <X className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Projeto não encontrado</h1>
        <p className="text-[#64748B] mb-8">O link que você acessou parece estar incorreto ou a pesquisa não está mais disponível.</p>
        <Button onClick={() => navigate('/login')} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Voltar ao início</Button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
        </motion.div>
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-2">Obrigado!</h1>
        <p className="text-[#64748B] mb-8">Sua resposta foi registrada com sucesso. Agradecemos a sua participação!</p>
        <Button onClick={() => navigate('/')} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Voltar ao início</Button>
      </motion.div>
    </div>
  );

  if (blocked === 'already_submitted') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <X className="h-16 w-16 text-orange-500 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Você já respondeu</h1>
        <p className="text-[#64748B] mb-8">Você já enviou uma resposta para esta pesquisa. Obrigado pela participação!</p>
        <Button onClick={() => navigate('/')} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Voltar</Button>
      </div>
    </div>
  );

  if (blocked === 'sample') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Pesquisa Encerrada</h1>
        <p className="text-[#64748B] mb-8">Obrigado! A pesquisa já coletou todas as respostas necessárias. Agradecemos o seu interesse!</p>
        <Button onClick={() => navigate('/')} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Voltar</Button>
      </div>
    </div>
  );

  if (blocked === 'quota') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <X className="h-16 w-16 text-orange-500 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Cota Preenchida</h1>
        <p className="text-[#64748B] mb-2">
          A cota para o perfil <strong>{quotaCheckResult?.quotaGroup}</strong> já foi preenchida.
        </p>
        <p className="text-[#64748B] mb-8">Obrigado pela participação!</p>
        <Button onClick={() => navigate('/')} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Voltar</Button>
      </div>
    </div>
  );

  if (!project || !project.formQuestions || project.formQuestions.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <X className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Formulário vazio</h1>
        <p className="text-[#64748B] mb-8">Este formulário não possui perguntas configuradas.</p>
        <Button onClick={() => navigate('/')} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Voltar</Button>
      </div>
    </div>
  );

  // Renderizar pergunta atual
  const currentQuestion = currentQuestionIndex >= 0 ? project.formQuestions[currentQuestionIndex] : null;
  const progress = currentQuestionIndex >= 0 ? ((currentQuestionIndex + 1) / project.formQuestions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1EFE8] to-[#E8E4D8] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <img src={logo} alt="Clarifyse" className="h-8" />
          {currentQuestionIndex >= 0 && (
            <div className="text-sm font-bold text-[#2D1E6B]">
              Pergunta {currentQuestionIndex + 1} de {project.formQuestions.length}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {currentQuestionIndex >= 0 && (
          <div className="mb-6">
            <Progress value={progress} className="h-2 rounded-full bg-gray-200" />
          </div>
        )}

        {/* Intro Screen */}
        {currentQuestionIndex === -1 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center"
          >
            <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4">{project.name}</h1>
            <p className="text-[#64748B] mb-8 text-lg">{project.objective}</p>
            <div className="bg-[#F1EFE8] rounded-xl p-4 mb-8">
              <p className="text-sm text-[#2D1E6B]">
                <strong>{project.formQuestions.length} perguntas</strong> • Tempo estimado: ~5 minutos
              </p>
            </div>
            <Button
              onClick={() => setCurrentQuestionIndex(0)}
              className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl px-8 py-6 font-bold text-lg"
            >
              Começar Pesquisa
            </Button>
          </motion.div>
        ) : currentQuestion ? (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6"
          >
            {/* Pergunta */}
            <div>
              <Label className="text-lg font-bold text-[#2D1E6B]">
                {currentQuestion.question}
                {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {currentQuestion.helpText && (
                <p className="text-sm text-[#64748B] mt-2">{currentQuestion.helpText}</p>
              )}
            </div>

            {/* Renderizar tipo de pergunta */}
            <div>
              {currentQuestion.type === 'single' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option: any) => (
                    <label key={option.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-[#F1EFE8] transition">
                      <input
                        type="radio"
                        name={currentQuestion.variableCode}
                        value={option.code}
                        checked={answers[currentQuestion.variableCode] === option.code}
                        onChange={(e) => setAnswers({ ...answers, [currentQuestion.variableCode]: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-[#2D1E6B]">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'multiple' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option: any) => (
                    <label key={option.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-[#F1EFE8] transition">
                      <input
                        type="checkbox"
                        name={currentQuestion.variableCode}
                        value={option.code}
                        checked={(answers[currentQuestion.variableCode] || []).includes(option.code)}
                        onChange={(e) => {
                          const current = answers[currentQuestion.variableCode] || [];
                          if (e.target.checked) {
                            setAnswers({ ...answers, [currentQuestion.variableCode]: [...current, option.code] });
                          } else {
                            setAnswers({ ...answers, [currentQuestion.variableCode]: current.filter((v: any) => v !== option.code) });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-[#2D1E6B]">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'text' && (
                <Input
                  type="text"
                  value={answers[currentQuestion.variableCode] || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQuestion.variableCode]: e.target.value })}
                  placeholder="Digite sua resposta..."
                  className="rounded-lg border-gray-200 h-12"
                />
              )}

              {currentQuestion.type === 'nps' && (
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswers({ ...answers, [currentQuestion.variableCode]: i })}
                        className={`w-10 h-10 rounded-lg font-bold transition ${
                          answers[currentQuestion.variableCode] === i
                            ? 'bg-[#2D1E6B] text-white'
                            : 'bg-gray-100 text-[#2D1E6B] hover:bg-gray-200'
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  {answers[currentQuestion.variableCode] !== undefined && (
                    <div className="mt-4">
                      <Label className="text-sm font-bold text-[#2D1E6B]">Por que essa nota?</Label>
                      <Input
                        type="text"
                        value={verbatims[currentQuestion.variableCode] || ''}
                        onChange={(e) => setVerbatims({ ...verbatims, [currentQuestion.variableCode]: e.target.value })}
                        placeholder="Explique brevemente..."
                        className="rounded-lg border-gray-200 h-12 mt-2"
                      />
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'matrix' && (
                <MatrixQuestion
                  question={currentQuestion}
                  value={answers[currentQuestion.variableCode]}
                  onChange={(value) => setAnswers({ ...answers, [currentQuestion.variableCode]: value })}
                />
              )}

              {currentQuestion.type === 'file_upload' && (
                <FileUploadQuestion
                  question={currentQuestion}
                  value={answers[currentQuestion.variableCode]}
                  onChange={(value) => setAnswers({ ...answers, [currentQuestion.variableCode]: value })}
                />
              )}

              {currentQuestion.type === 'conjoint' && (
                <ConjointQuestion
                  question={currentQuestion}
                  value={answers[currentQuestion.variableCode]}
                  onChange={(value) => setAnswers({ ...answers, [currentQuestion.variableCode]: value })}
                />
              )}

              {currentQuestion.type === 'max_diff' && (
                <MaxDiffQuestion
                  question={currentQuestion}
                  value={answers[currentQuestion.variableCode]}
                  onChange={(value) => setAnswers({ ...answers, [currentQuestion.variableCode]: value })}
                />
              )}

              {currentQuestion.type === 'image_choice' && (
                <ImageChoiceQuestion
                  question={currentQuestion}
                  value={answers[currentQuestion.variableCode]}
                  onChange={(value) => setAnswers({ ...answers, [currentQuestion.variableCode]: value })}
                />
              )}
            </div>

            {/* Botões de Navegação */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                className="rounded-lg gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button
                onClick={handleNext}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-lg gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : currentQuestionIndex === project.formQuestions.length - 1 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Enviar
                  </>
                ) : (
                  <>
                    Próximo <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
