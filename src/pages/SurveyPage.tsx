import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, addResponse, Project, FormQuestion, Response } from '@/lib/surveyForgeDB';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, X } from 'lucide-react';

const SURVEY_COOKIE_KEY = 'surveyForge_submitted';

function getSubmittedIds(): string[] {
  try {
    const raw = localStorage.getItem(SURVEY_COOKIE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function markSubmitted(projectId: string) {
  const ids = getSubmittedIds();
  if (!ids.includes(projectId)) {
    localStorage.setItem(SURVEY_COOKIE_KEY, JSON.stringify([...ids, projectId]));
  }
}

export default function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [status, setStatus] = useState<'survey' | 'quota_full' | 'sample_complete' | 'thanks' | 'already_submitted'>('survey');
  const startTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());

  useEffect(() => {
    if (!id) return;
    setTimeout(() => {
      const proj = getProjectById(id);
      setProject(proj || null);
      setLoading(false);

      // Check if already submitted
      const submitted = getSubmittedIds();
      if (submitted.includes(id)) {
        setStatus('already_submitted');
      }
    }, 600);
  }, [id]);

  const currentQuestion: FormQuestion | undefined = project?.formQuestions[currentIndex];
  const totalQuestions = project?.formQuestions.length || 0;
  const progress = totalQuestions > 0 ? Math.round(((currentIndex) / totalQuestions) * 100) : 0;

  const isAnswered = currentQuestion && answers[currentQuestion.variableCode] !== undefined;
  const canProceed = currentQuestion && (!currentQuestion.required || isAnswered);

  const handleAnswer = (value: string | number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.variableCode]: value }));
  };

  const handleNext = useCallback(() => {
    if (!project || !currentQuestion) return;

    // Check branching
    let nextIndex = currentIndex + 1;
    const answer = answers[currentQuestion.variableCode];
    if (currentQuestion.branchingRules && answer !== undefined) {
      const rule = currentQuestion.branchingRules.find((r) => String(r.answerCode) === String(answer));
      if (rule) {
        const jumpIdx = project.formQuestions.findIndex((q) => q.id === rule.jumpToQuestionId);
        if (jumpIdx !== -1) nextIndex = jumpIdx;
      }
    }

    if (nextIndex >= totalQuestions) {
      handleSubmit();
      return;
    }

    setCurrentIndex(nextIndex);
    questionStartTime.current = Date.now();
  }, [project, currentQuestion, currentIndex, answers, totalQuestions]);

  const handleSubmit = useCallback(() => {
    if (!project || !id) return;

    // Determine quota group
    let quotaGroup = 'Outros';
    for (const quota of project.quotas) {
      const answerValue = answers[quota.questionCode];
      if (answerValue === undefined) continue;
      for (const group of quota.groups) {
        if (group.codes.some((c) => String(c) === String(answerValue))) {
          quotaGroup = group.name;
          break;
        }
      }
      if (quotaGroup !== 'Outros') break;
    }

    // Check quota status
    const currentDB = getProjectById(id);
    if (!currentDB) return;

    // Check sample full
    if (currentDB.responses.length >= currentDB.sampleSize) {
      setStatus('sample_complete');
      return;
    }

    // Check specific quota
    for (const quota of currentDB.quotas) {
      const answerValue = answers[quota.questionCode];
      if (answerValue === undefined) continue;
      for (const group of quota.groups) {
        if (group.codes.some((c) => String(c) === String(answerValue))) {
          const groupCount = currentDB.responses.filter((r) => r.quotaGroup === group.name).length;
          if (groupCount >= group.target) {
            setStatus('quota_full');
            return;
          }
        }
      }
    }

    // Calculate time
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    const avgTime = currentDB.responses.length > 0
      ? currentDB.responses.reduce((a, r) => a + r.timeSpentSeconds, 0) / currentDB.responses.length
      : timeSpent;

    // Quality flag
    let qualityFlag: Response['qualityFlag'] = 'OK';
    if (timeSpent < 10) qualityFlag = 'INVÁLIDA';
    else if (timeSpent < avgTime * 0.3) qualityFlag = 'SUSPEITA';

    const response: Response = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      answers: answers as Record<string, number | string | number[] | string[]>,
      quotaGroup,
      timeSpentSeconds: timeSpent,
      projectId: id,
      qualityFlag,
    };

    addResponse(id, response);
    markSubmitted(id);
    setStatus('thanks');
  }, [project, id, answers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-[#2D1E6B]/20 border-t-[#2D1E6B] rounded-full animate-spin" style={{ borderWidth: 3 }} />
          <p className="text-sm text-[#64748B]">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex flex-col items-center justify-center text-center p-6">
        <XCircle size={48} className="text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-[#2D1E6B] mb-2">Formulário não encontrado</h1>
        <p className="text-sm text-[#64748B]">Verifique o link e tente novamente.</p>
      </div>
    );
  }

  if (status === 'already_submitted') {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#2D1E6B] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Já respondido!
        </h1>
        <p className="text-sm text-[#64748B] max-w-xs">Você já respondeu a este formulário anteriormente. Obrigado pela participação!</p>
      </div>
    );
  }

  if (status === 'quota_full') {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-[#1D9E75]" />
        </div>
        <h1 className="text-2xl font-bold text-[#2D1E6B] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Obrigado pela participação!
        </h1>
        <p className="text-sm text-[#64748B] max-w-xs mb-2">A cota para o seu perfil já foi completada.</p>
        <p className="text-sm text-[#64748B] max-w-xs">Sua opinião é muito importante para nós.</p>
        <button className="mt-8 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#2D1E6B] font-medium hover:bg-gray-50 transition-colors">
          Fechar
        </button>
      </div>
    );
  }

  if (status === 'sample_complete') {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-[#1D9E75]" />
        </div>
        <h1 className="text-2xl font-bold text-[#2D1E6B] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Pesquisa encerrada!
        </h1>
        <p className="text-sm text-[#64748B] max-w-xs">Atingimos o número exato de entrevistas necessárias. Muito obrigado por ajudar a Clarifyse!</p>
        <button className="mt-8 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#2D1E6B] font-medium hover:bg-gray-50 transition-colors">
          Fechar
        </button>
      </div>
    );
  }

  if (status === 'thanks') {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex flex-col items-center justify-center text-center p-6">
        <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
          <CheckCircle size={48} className="text-[#1D9E75]" />
        </div>
        <h1 className="text-3xl font-bold text-[#2D1E6B] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Obrigado!
        </h1>
        <p className="text-base text-[#2D1E6B] font-medium mb-2">Suas respostas foram registradas com sucesso.</p>
        <p className="text-sm text-[#64748B] max-w-sm">Sua participação ajuda a Clarifyse a entregar insights ainda mais precisos.</p>
        <button
          onClick={() => window.close()}
          className="mt-8 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' }}
        >
          Fechar janela
        </button>
        <p className="text-[10px] text-[#64748B] mt-6 uppercase tracking-widest">Where questions become clarity.</p>
      </div>
    );
  }

  if (!currentQuestion || project.formQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex flex-col items-center justify-center text-center p-6">
        <p className="text-xl font-bold text-[#2D1E6B] mb-2">Formulário sem perguntas</p>
        <p className="text-sm text-[#64748B]">Este formulário ainda não tem perguntas configuradas.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 rounded bg-[#2D1E6B] flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">SF</span>
            </div>
            <span className="text-[#2D1E6B] text-xs font-bold hidden sm:block">SurveyForge</span>
          </div>

          {/* Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#64748B]">
                Pergunta {currentIndex + 1} de {totalQuestions}
              </span>
              <span className="text-[10px] font-bold text-[#1D9E75]">{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Question */}
          <p className="text-[10px] uppercase tracking-[3px] text-[#1D9E75] font-semibold mb-3">
            PERGUNTA {currentIndex + 1}
          </p>
          <h2 className="text-2xl font-bold text-[#2D1E6B] mb-2 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {currentQuestion.text}
          </h2>
          {currentQuestion.helpText && (
            <p className="text-sm text-[#64748B] mb-6">{currentQuestion.helpText}</p>
          )}
          {!currentQuestion.helpText && <div className="mb-6" />}

          {/* Answer area */}
          <div className="space-y-3">
            {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'boolean') &&
              currentQuestion.options && (
                currentQuestion.options.map((opt) => {
                  const selected = String(answers[currentQuestion.variableCode]) === String(opt.code);
                  return (
                    <button
                      key={String(opt.code)}
                      onClick={() => handleAnswer(opt.code as string | number)}
                      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
                        selected
                          ? 'border-[#1D9E75] bg-teal-50'
                          : 'border-gray-200 bg-white hover:border-[#1D9E75]/40 hover:bg-teal-50/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selected ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-300'
                      }`}>
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm font-medium ${selected ? 'text-[#1D9E75]' : 'text-[#2D1E6B]'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })
              )}

            {currentQuestion.type === 'nps' && (
              <div>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => {
                    const selected = answers[currentQuestion.variableCode] === n;
                    return (
                      <button
                        key={n}
                        onClick={() => handleAnswer(n)}
                        className={`w-10 h-10 rounded-xl border-2 text-sm font-bold transition-all active:scale-90 ${
                          selected
                            ? 'border-[#2D1E6B] bg-[#2D1E6B] text-white'
                            : 'border-gray-200 text-[#2D1E6B] hover:border-[#2D1E6B]/50'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-[#64748B]">Muito improvável</span>
                  <span className="text-[10px] text-[#64748B]">Muito provável</span>
                </div>
              </div>
            )}

            {(currentQuestion.type === 'likert' || currentQuestion.type === 'rating') &&
              currentQuestion.options && (
                <div className="flex gap-2 flex-wrap">
                  {currentQuestion.options.map((opt) => {
                    const selected = String(answers[currentQuestion.variableCode]) === String(opt.code);
                    return (
                      <button
                        key={String(opt.code)}
                        onClick={() => handleAnswer(opt.code as string | number)}
                        className={`flex-1 min-w-[80px] py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          selected
                            ? 'border-[#2D1E6B] bg-[#2D1E6B] text-white'
                            : 'border-gray-200 text-[#2D1E6B] hover:border-[#2D1E6B]/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}

            {currentQuestion.type === 'open_text' && (
              <textarea
                value={String(answers[currentQuestion.variableCode] || '')}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                rows={4}
                maxLength={500}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm text-[#2D1E6B] outline-none focus:border-[#2D1E6B] transition-all resize-none"
              />
            )}

            {currentQuestion.type === 'number' && (
              <input
                type="number"
                value={String(answers[currentQuestion.variableCode] || '')}
                onChange={(e) => handleAnswer(Number(e.target.value))}
                placeholder="0"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm text-[#2D1E6B] outline-none focus:border-[#2D1E6B] transition-all"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-4 bg-white">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => { if (currentIndex > 0) setCurrentIndex((i) => i - 1); }}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-[#64748B] hover:text-[#2D1E6B] hover:border-[#2D1E6B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <ChevronLeft size={14} />
            Anterior
          </button>

          <p className="text-[10px] text-[#64748B] text-center hidden sm:block">
            Suas respostas são anônimas e confidenciais
          </p>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm text-white font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: canProceed ? 'linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%)' : '#d1d5db' }}
          >
            {currentIndex === totalQuestions - 1 ? 'Enviar' : 'Próxima'}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
