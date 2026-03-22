import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, addResponse } from '@/lib/surveyForgeDB';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import { toast } from 'sonner';

export default function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 for welcome screen
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [verbatims, setVerbatims] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null); // 'quota', 'sample', or 'submitted'

  useEffect(() => {
    if (id) {
      // Check if already submitted (cookie/localStorage protection)
      const alreadySubmitted = localStorage.getItem(`survey_submitted_${id}`);
      if (alreadySubmitted) {
        setBlocked('already_submitted');
        setLoading(false);
        return;
      }

      const p = getProjectById(id);
      if (p) {
        setProject(p);
      }
      setLoading(false);
    }
  }, [id]);

  const handleNext = () => {
    if (!project) return;

    if (currentQuestionIndex >= 0) {
      const currentQuestion = project.formQuestions[currentQuestionIndex];
      const currentAnswer = answers[currentQuestion.variableCode];
      
      if (currentQuestion.required && (currentAnswer === undefined || currentAnswer === '' || (Array.isArray(currentAnswer) && currentAnswer.length === 0))) {
        toast.error("Por favor, responda esta pergunta antes de prosseguir.");
        return;
      }

      // Special check for NPS verbatim
      if (currentQuestion.type === 'nps' && currentQuestion.required && !verbatims[currentQuestion.variableCode]) {
        toast.error("Por favor, explique o motivo da sua nota.");
        return;
      }
    }

    // Logic for branching (Skip Logic)
    let nextIndex = currentQuestionIndex + 1;
    if (currentQuestionIndex >= 0) {
      const currentQuestion = project.formQuestions[currentQuestionIndex];
      const currentAnswer = answers[currentQuestion.variableCode];
      
      if (currentQuestion.logic && currentQuestion.logic.length > 0) {
        const rule = currentQuestion.logic.find((l: any) => String(l.condition) === String(currentAnswer));
        if (rule && rule.action === 'skip_to') {
          const targetIndex = project.formQuestions.findIndex((q: any) => q.id === rule.targetId);
          if (targetIndex !== -1) {
            nextIndex = targetIndex;
          }
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
    if (!project) return;

    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    // Identify Quota Group
    let quotaGroup = "Geral";
    if (project.quotas && project.quotas.length > 0) {
      for (const quota of project.quotas) {
        const answer = answers[quota.questionId];
        // mapping is code -> groupId
        const mapping = quota.mappings?.find((m: any) => String(m.code) === String(answer));
        if (mapping && mapping.groupId) {
          const group = quota.groups?.find((g: any) => g.id === mapping.groupId);
          if (group) {
            quotaGroup = group.name;
            // Check if group is full
            const currentCount = project.responses?.filter((r: any) => r.quotaGroup === group.name).length || 0;
            if (currentCount >= group.target && group.target > 0) {
              setBlocked('quota');
              return;
            }
          }
        }
      }
    }

    // Sample Check
    const totalResponses = project.responses?.length || 0;
    if (totalResponses >= project.sampleSize && project.sampleSize > 0) {
      setBlocked('sample');
      return;
    }

    // Prepare final answers including verbatims
    const finalAnswers = { ...answers };
    Object.keys(verbatims).forEach(key => {
      finalAnswers[`${key}_verbatim`] = verbatims[key];
    });

    // Save Response
    addResponse(project.id, {
      answers: finalAnswers,
      quotaGroup,
      timeSpentSeconds
    });

    // Protection against multiple submissions
    localStorage.setItem(`survey_submitted_${project.id}`, 'true');

    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1EFE8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2D1E6B]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-4 text-center">
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Projeto não encontrado</h1>
        <p className="text-[#64748B]">O link que você acessou parece estar incorreto ou a pesquisa não está mais disponível.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
          <CheckCircle2 className="h-20 w-20 text-[#1D9E75]" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4">Obrigado!</h1>
        <p className="text-xl text-[#2D1E6B]/80 mb-2">Suas respostas foram registradas com sucesso.</p>
        <p className="text-[#64748B] max-w-md">Sua participação ajuda a Clarifyse a entregar insights ainda mais precisos.</p>
        <Button 
          className="mt-8 bg-[#2D1E6B] text-white px-8 h-12 rounded-xl"
          onClick={() => navigate('/login')}
        >
          Fechar janela
        </Button>
      </div>
    );
  }

  if (blocked === 'quota') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
        <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4">Obrigado pela participação!</h1>
        <p className="text-xl text-[#2D1E6B]/80 mb-4">A cota para o seu perfil já foi completada.</p>
        <p className="text-[#64748B] max-w-md">Sua opinião é muito importante para nós.</p>
        <Button 
          className="mt-8 bg-[#2D1E6B] text-white px-8 h-12 rounded-xl"
          onClick={() => navigate('/login')}
        >
          Fechar
        </Button>
      </div>
    );
  }

  if (blocked === 'sample') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
        <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4">Pesquisa encerrada!</h1>
        <p className="text-xl text-[#2D1E6B]/80 mb-4">Atingimos o número exato de entrevistas necessárias.</p>
        <p className="text-[#64748B] max-w-md">Muito obrigado por ajudar a Clarifyse!</p>
        <Button 
          className="mt-8 bg-[#2D1E6B] text-white px-8 h-12 rounded-xl"
          onClick={() => navigate('/login')}
        >
          Fechar
        </Button>
      </div>
    );
  }

  if (blocked === 'already_submitted') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
        <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4">Participação registrada!</h1>
        <p className="text-xl text-[#2D1E6B]/80 mb-4">Você já respondeu a esta pesquisa.</p>
        <p className="text-[#64748B] max-w-md">Agradecemos o seu interesse e colaboração.</p>
        <Button 
          className="mt-8 bg-[#2D1E6B] text-white px-8 h-12 rounded-xl"
          onClick={() => navigate('/login')}
        >
          Fechar
        </Button>
      </div>
    );
  }

  const currentQuestion = currentQuestionIndex === -1 ? null : project.formQuestions[currentQuestionIndex];
  const progress = project.formQuestions.length > 0 
    ? Math.round(((currentQuestionIndex + 1) / project.formQuestions.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-[#1D9E75]/20">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-gray-100 fixed top-0 w-full bg-white z-50">
        <img src={logo} alt="Clarifyse" className="h-6 object-contain" />
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="flex justify-between text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">
            <span>Pergunta {currentQuestionIndex + 1} de {project.formQuestions.length}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1 bg-gray-100" />
        </div>
        <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => navigate('/login')}>
          <span className="text-xs font-bold uppercase tracking-widest mr-2">Sair</span>
          <X className="h-4 w-4 inline" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 mt-16 mb-20 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {currentQuestionIndex === -1 ? (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl text-center space-y-6"
            >
              <p className="text-[#1D9E75] text-xs font-bold tracking-[0.3em] uppercase">PESQUISA DE MERCADO</p>
              <h1 className="font-display text-5xl font-bold text-[#2D1E6B] leading-tight">
                {project.name}
              </h1>
              <p className="text-xl text-[#64748B] leading-relaxed">
                {project.objective}
              </p>
              <div className="pt-8">
                <Button 
                  onClick={handleNext}
                  className="h-14 px-10 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white font-bold text-lg rounded-xl shadow-lg hover:opacity-90 transition-all"
                >
                  Começar Pesquisa
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={currentQuestion?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-3xl space-y-10"
            >
              <div className="space-y-4 text-center">
                {currentQuestion?.required && (
                  <span className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">OBRIGATÓRIA</span>
                )}
                <h2 className="font-display text-3xl md:text-4xl font-bold text-[#2D1E6B] leading-snug">
                  {currentQuestion?.question}
                </h2>
                {currentQuestion?.helpText && (
                  <p className="text-[#64748B] text-sm">{currentQuestion.helpText}</p>
                )}
              </div>

              <div className="space-y-6">
                {renderQuestionInput(
                  currentQuestion, 
                  answers, 
                  (val) => setAnswers(prev => ({...prev, [currentQuestion!.variableCode]: val})),
                  verbatims,
                  (val) => setVerbatims(prev => ({...prev, [currentQuestion!.variableCode]: val}))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-20 px-6 flex items-center justify-between border-t border-gray-100 fixed bottom-0 w-full bg-white z-50">
        <div className="w-1/3">
          {currentQuestionIndex > -1 && (
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-[#64748B] font-semibold flex items-center gap-2 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
          )}
        </div>
        
        <div className="w-1/3 flex flex-col items-center text-center hidden md:flex">
          <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-medium">
            Suas respostas são anônimas e confidenciais
          </p>
        </div>

        <div className="w-1/3 flex justify-end">
          <Button 
            onClick={handleNext}
            className="h-12 px-8 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white font-bold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {currentQuestionIndex === project.formQuestions.length - 1 ? 'Finalizar' : 'Próxima'} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

function renderQuestionInput(question: any, answers: any, onChange: (val: any) => void, verbatims: any, onVerbatimChange: (val: string) => void) {
  if (!question) return null;

  const currentVal = answers[question.variableCode];

  switch (question.type) {
    case 'single':
    case 'radio':
      return (
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((opt: any) => (
            <button
              key={opt.id}
              onClick={() => onChange(opt.code || opt.text)}
              className={`p-5 rounded-xl border-2 text-left transition-all duration-200 group ${
                String(currentVal) === String(opt.code || opt.text)
                  ? 'border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75] font-bold'
                  : 'border-gray-100 hover:border-[#1D9E75]/30 text-[#2D1E6B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{opt.text}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  String(currentVal) === String(opt.code || opt.text) ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-200'
                }`}>
                  {String(currentVal) === String(opt.code || opt.text) && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    
    case 'multiple':
    case 'checkbox':
      const currentArray = Array.isArray(currentVal) ? currentVal : [];
      const toggle = (val: any) => {
        if (currentArray.includes(val)) {
          onChange(currentArray.filter(v => v !== val));
        } else {
          onChange([...currentArray, val]);
        }
      };
      return (
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((opt: any) => (
            <button
              key={opt.id}
              onClick={() => toggle(opt.code || opt.text)}
              className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                currentArray.includes(opt.code || opt.text)
                  ? 'border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75] font-bold'
                  : 'border-gray-100 hover:border-[#1D9E75]/30 text-[#2D1E6B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{opt.text}</span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  currentArray.includes(opt.code || opt.text) ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-200'
                }`}>
                  {currentArray.includes(opt.code || opt.text) && <div className="w-2 h-2 bg-white" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      );

    case 'likert':
    case 'nps':
    case 'rating':
      const isNps = question.type === 'nps';
      const points = isNps ? 11 : (question.points || 5);
      const startAt = isNps ? 0 : 1;
      return (
        <div className="space-y-8">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {Array.from({ length: points }).map((_, i) => {
              const val = startAt + i;
              const isSelected = String(currentVal) === String(val);
              return (
                <button
                  key={val}
                  onClick={() => onChange(val)}
                  className={`w-10 h-10 md:w-14 md:h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#1D9E75] bg-[#1D9E75] text-white font-bold scale-110'
                      : 'border-gray-100 hover:border-[#1D9E75]/30 text-[#2D1E6B]'
                  }`}
                >
                  {question.type === 'rating' ? <Star className={`h-5 w-5 ${isSelected ? 'fill-white' : ''}`} /> : val}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-[#64748B] uppercase tracking-widest px-4">
            <span>{isNps ? 'Nada provável' : 'Discordo totalmente'}</span>
            <span>{isNps ? 'Extremamente provável' : 'Concordo totalmente'}</span>
          </div>
          
          {isNps && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4"
            >
              <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">Por que você deu essa nota?</Label>
              <textarea
                value={verbatims[question.variableCode] || ''}
                onChange={(e) => onVerbatimChange(e.target.value)}
                placeholder="Conte-nos um pouco mais sobre sua experiência..."
                className="w-full h-24 p-4 rounded-xl border-2 border-gray-100 focus:border-[#1D9E75] focus:ring-0 outline-none transition-all resize-none text-[#2D1E6B]"
              />
            </motion.div>
          )}
        </div>
      );

    case 'matrix':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left"></th>
                {question.columns?.map((col: any) => (
                  <th key={col.id} className="p-4 text-center text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                    {col.text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.rows?.map((row: any) => (
                <tr key={row.id} className="border-t border-gray-50">
                  <td className="p-4 font-medium text-[#2D1E6B]">{row.text}</td>
                  {question.columns?.map((col: any) => {
                    const isSelected = answers[question.variableCode]?.[row.id] === (col.code || col.text);
                    return (
                      <td key={col.id} className="p-4 text-center">
                        <button
                          onClick={() => {
                            const currentMatrix = answers[question.variableCode] || {};
                            onChange({ ...currentMatrix, [row.id]: (col.code || col.text) });
                          }}
                          className={`w-6 h-6 rounded-full border-2 mx-auto transition-all ${
                            isSelected ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-200 hover:border-[#1D9E75]/30'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white mx-auto" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'text':
      return (
        <textarea
          value={currentVal || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite sua resposta aqui..."
          className="w-full h-40 p-5 rounded-xl border-2 border-gray-100 focus:border-[#1D9E75] focus:ring-0 outline-none transition-all resize-none text-[#2D1E6B] text-lg"
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={currentVal || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="h-16 text-2xl font-bold text-center rounded-xl border-2 border-gray-100 focus:border-[#1D9E75] text-[#2D1E6B]"
        />
      );

    case 'boolean':
      return (
        <div className="grid grid-cols-2 gap-4">
          {['Sim', 'Não'].map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`p-6 rounded-xl border-2 font-bold transition-all ${
                currentVal === opt
                  ? 'border-[#1D9E75] bg-[#1D9E75] text-white'
                  : 'border-gray-100 hover:border-[#1D9E75]/30 text-[#2D1E6B]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );

    default:
      return (
        <div className="p-10 text-center bg-[#F1EFE8] rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-[#64748B] mb-4">A interface para o tipo "{question.type}" está sendo otimizada.</p>
          <Button 
            variant="outline" 
            className="border-[#2D1E6B] text-[#2D1E6B] hover:bg-[#2D1E6B] hover:text-white transition-all" 
            onClick={() => onChange("exemplo")}
          >
            Simular Resposta para Continuar
          </Button>
        </div>
      );
  }
}
