import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, addResponse } from '@/lib/surveyForgeDB';
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
 * CORREÇÕES IMPLEMENTADAS (v2.0):
 * 
 * 1. Verificação de Amostra Total no Carregamento:
 *    - A amostra total é verificada assim que a página carrega
 *    - Se atingida, o formulário é bloqueado imediatamente
 * 
 * 2. Verificação de Cotas Dinâmica:
 *    - Após responder a uma pergunta que define uma cota, o sistema verifica
 *      se aquela cota específica foi atingida
 *    - Se a cota foi atingida, o usuário é bloqueado ANTES de prosseguir
 *    - As outras cotas continuam abertas
 * 
 * 3. Lógica de Bloqueio Refinada:
 *    - Bloqueio de amostra total: formulário inteiro fechado
 *    - Bloqueio de cota individual: apenas aquele perfil é bloqueado
 */

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
   * FUNÇÃO AUXILIAR: Verificar se uma cota específica foi atingida
   */
  const isQuotaFull = (proj: any, quotaGroupName: string): boolean => {
    if (!proj.quotas || proj.quotas.length === 0) return false;

    for (const quota of proj.quotas) {
      for (const group of quota.groups || []) {
        if (group.name === quotaGroupName) {
          const currentCount = (proj.responses || []).filter(
            (r: any) => r.quotaGroup === quotaGroupName
          ).length;
          return group.target > 0 && currentCount >= group.target;
        }
      }
    }

    return false;
  };

  /**
   * FUNÇÃO AUXILIAR: Verificar se a amostra total foi atingida
   */
  const isSampleFull = (proj: any): boolean => {
    if (!proj.sampleSize || proj.sampleSize <= 0) return false;
    const totalResponses = proj.responses?.length || 0;
    return totalResponses >= proj.sampleSize;
  };

  // ============================================================================
  // CARREGAMENTO INICIAL E VERIFICAÇÃO DE BLOQUEIOS
  // ============================================================================

  useEffect(() => {
    if (id) {
      const alreadySubmitted = localStorage.getItem(`survey_submitted_${id}`);
      if (alreadySubmitted) {
        setBlocked('already_submitted');
        setLoading(false);
        return;
      }

      const timer = setTimeout(() => {
        const p = getProjectById(id);

        if (p) {
          // Verificar status do projeto
          if (p.status === 'Rascunho') {
            setBlocked('not_published');
            setProject(p);
          } else if (p.status === 'Encerrado') {
            setBlocked('closed');
            setProject(p);
          } else {
            // ✅ CORREÇÃO 1: Verificar amostra total no carregamento
            if (isSampleFull(p)) {
              setBlocked('sample');
            }
            setProject(p);
          }
        } else {
          setProject(null);
        }
        setLoading(false);
      }, 300);

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

      // ✅ CORREÇÃO 2: Verificar se a resposta atual define uma cota
      // Se sim, verificar se aquela cota foi atingida ANTES de prosseguir
      const freshProject = getProjectById(project.id);
      if (freshProject && freshProject.quotas && freshProject.quotas.length > 0) {
        for (const quota of freshProject.quotas) {
          if (quota.questionId === currentQuestion.id) {
            // Esta pergunta define uma cota
            const potentialQuotaGroup = calculateQuotaGroupForAnswers(freshProject, answers);
            if (isQuotaFull(freshProject, potentialQuotaGroup)) {
              setBlocked('quota');
              setQuotaCheckResult({ quotaGroup: potentialQuotaGroup });
              toast.error(`A cota para o perfil "${potentialQuotaGroup}" já foi preenchida. Obrigado pela participação!`);
              return;
            }
          }
        }
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

  const handleSubmit = () => {
    if (!project || submitting) return;
    setSubmitting(true);

    // Recarregar projeto para ter dados atualizados
    const freshProject = getProjectById(project.id);
    if (!freshProject) {
      setSubmitting(false);
      return;
    }

    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
    let quotaGroup = "Geral";

    // ✅ CORREÇÃO 3: Verificações finais antes de aceitar a resposta
    
    // Verificar amostra total
    if (isSampleFull(freshProject)) {
      setBlocked('sample');
      setSubmitting(false);
      return;
    }

    // Calcular grupo de cota final
    quotaGroup = calculateQuotaGroupForAnswers(freshProject, answers);

    // Verificar se a cota específica foi atingida
    if (isQuotaFull(freshProject, quotaGroup)) {
      setBlocked('quota');
      setQuotaCheckResult({ quotaGroup });
      setSubmitting(false);
      return;
    }

    // Tudo OK, aceitar resposta
    const finalAnswers = { ...answers };
    Object.keys(verbatims).forEach(key => { finalAnswers[`${key}_verbatim`] = verbatims[key]; });
    addResponse(project.id, { answers: finalAnswers, quotaGroup, timeSpentSeconds });
    localStorage.setItem(`survey_submitted_${project.id}`, 'true');
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 800);
  };

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Carregando pesquisa">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="sr-only">Carregando pesquisa...</span>
    </div>
  );

  if (!project && !loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center" role="alert">
      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border max-w-md w-full">
        <X className="h-16 w-16 text-destructive mx-auto mb-6" aria-hidden="true" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Projeto não encontrado</h1>
        <p className="text-muted-foreground mb-8">O link que você acessou parece estar incorreto ou a pesquisa não está mais disponível.</p>
        <Button onClick={() => navigate('/login')} className="w-full bg-primary text-primary-foreground h-12 rounded-xl">Voltar ao início</Button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center" role="status">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
        <CheckCircle2 className="h-20 w-20 text-secondary mx-auto" aria-hidden="true" />
      </motion.div>
      <h1 className="font-display text-3xl font-bold text-foreground mb-4 mt-6">Obrigado!</h1>
      <p className="text-xl text-foreground/80 mb-2">Suas respostas foram registradas com sucesso.</p>
      <p className="text-muted-foreground max-w-md">Sua participação ajuda a Clarifyse a entregar insights ainda mais precisos.</p>
      <Button onClick={() => navigate('/')} className="mt-8 bg-primary text-primary-foreground px-8 h-12 rounded-xl">Voltar ao início</Button>
    </div>
  );

  if (blocked === 'quota') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4">Obrigado pela participação!</h1>
      <p className="text-xl text-[#2D1E6B]/80 mb-4">
        A cota para o perfil <strong>"{quotaCheckResult?.quotaGroup || 'seu perfil'}"</strong> já foi completada.
      </p>
      <p className="text-[#64748B] max-w-md">Sua opinião é muito importante para nós. Outras cotas ainda estão abertas para novos respondentes.</p>
      <Button onClick={() => navigate('/')} className="mt-8 bg-[#2D1E6B] text-white px-8 h-12 rounded-xl">Fechar</Button>
    </div>
  );

  if (blocked === 'sample') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4">Pesquisa encerrada!</h1>
      <p className="text-xl text-[#2D1E6B]/80 mb-4">Atingimos o número exato de entrevistas necessárias.</p>
      <p className="text-[#64748B] max-w-md">Muito obrigado por ajudar a Clarifyse!</p>
      <Button onClick={() => navigate('/')} className="mt-8 bg-[#2D1E6B] text-white px-8 h-12 rounded-xl">Fechar</Button>
    </div>
  );

  if (blocked === 'already_submitted') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <CheckCircle2 className="h-16 w-16 text-[#1D9E75] mb-6" />
      <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4">Participação registrada!</h1>
      <p className="text-xl text-[#2D1E6B]/80 mb-4">Você já respondeu a esta pesquisa.</p>
      <p className="text-[#64748B] max-w-md">Agradecemos o seu interesse e colaboração.</p>
      <Button onClick={() => navigate('/login')} className="mt-8 bg-[#2D1E6B] text-white px-8 h-12 rounded-xl">Fechar</Button>
    </div>
  );

  if (blocked === 'not_published') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <Loader2 className="h-16 w-16 text-[#7F77DD] mx-auto mb-6 animate-pulse" />
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Formulário em preparação</h1>
        <p className="text-[#64748B] mb-8">Este formulário ainda não foi publicado. Por favor, tente novamente em alguns instantes.</p>
        <Button onClick={() => window.location.reload()} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Recarregar</Button>
      </div>
    </div>
  );

  if (blocked === 'closed') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <X className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Pesquisa encerrada</h1>
        <p className="text-[#64748B] mb-8">Esta pesquisa já foi encerrada e não está mais aceitando respostas.</p>
        <Button onClick={() => navigate('/login')} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Voltar</Button>
      </div>
    </div>
  );

  // Renderização normal do formulário
  if (currentQuestionIndex === -1) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <div className="text-center space-y-4">
            <img src={logo} alt="Clarifyse" className="h-12 mx-auto" />
            <h1 className="font-display text-3xl font-bold text-[#2D1E6B]">{project.name}</h1>
            <p className="text-[#64748B]">{project.objective}</p>
          </div>

          <div className="bg-gradient-to-r from-[#2D1E6B]/5 to-[#1D9E75]/5 rounded-xl p-6 space-y-2">
            <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">Informações da Pesquisa</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#64748B]">Perguntas</p>
                <p className="text-lg font-bold text-[#2D1E6B]">{project.formQuestions?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748B]">Tempo estimado</p>
                <p className="text-lg font-bold text-[#2D1E6B]">~5 min</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setCurrentQuestionIndex(0)}
            className="w-full bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white h-12 rounded-xl font-bold text-lg"
          >
            Começar Pesquisa
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = project.formQuestions[currentQuestionIndex];
  const progress = Math.round(((currentQuestionIndex + 1) / project.formQuestions.length) * 100);

  return (
    <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#64748B]">Pergunta {currentQuestionIndex + 1} de {project.formQuestions.length}</span>
            <span className="text-sm font-bold text-[#1D9E75]">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-gradient-to-r from-[#2D1E6B] to-[#1D9E75]" />
        </div>

        {/* Pergunta */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1E6B]">{currentQuestion.question}</h2>
          {currentQuestion.helpText && <p className="text-sm text-[#64748B]">{currentQuestion.helpText}</p>}
        </div>

        {/* Renderizar componentes de pergunta conforme o tipo */}
        {/* (Aqui você manteria os componentes de renderização de perguntas existentes) */}

        {/* Botões de navegação */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={currentQuestionIndex === 0}
            className="flex-1 rounded-xl border-gray-200 text-[#64748B] font-bold"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <Button
            onClick={handleNext}
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl font-bold"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChevronRight className="h-4 w-4 mr-2" />}
            {currentQuestionIndex === project.formQuestions.length - 1 ? 'Enviar' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
