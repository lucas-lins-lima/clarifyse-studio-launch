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

  useEffect(() => {
    if (id) {
      const alreadySubmitted = localStorage.getItem(`survey_submitted_${id}`);
      if (alreadySubmitted) {
        setBlocked('already_submitted');
        setLoading(false);
        return;
      }

      // Adicionar pequeno delay para garantir que o localStorage esteja pronto (em alguns casos de navegação rápida)
      const timer = setTimeout(() => {
        const p = getProjectById(id);
        
        if (p) {
          // Verificar status do projeto
          if (p.status === 'Rascunho') {
            setBlocked('not_published');
            setProject(p); // Mantemos o projeto para mostrar o nome se necessário
          } else if (p.status === 'Encerrado') {
            setBlocked('closed');
            setProject(p);
          } else {
            // Verificar se a amostra já foi atingida
            const totalResponses = p.responses?.length || 0;
            if (p.sampleSize > 0 && totalResponses >= p.sampleSize) {
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

  const handleNext = () => {
    if (!project) return;
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

    // Recarregar projeto para ter dados atualizados de respostas
    const freshProject = getProjectById(project.id);
    if (!freshProject) {
      setSubmitting(false);
      return;
    }

    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
    let quotaGroup = "Geral";

    // Regra: Caso a amostra atinja a meta, bloquear
    const totalResponses = freshProject.responses?.length || 0;
    if (freshProject.sampleSize > 0 && totalResponses >= freshProject.sampleSize) {
      setBlocked('sample');
      setSubmitting(false);
      return;
    }

    // Verificar cotas usando variableCode das perguntas
    if (freshProject.quotas && freshProject.quotas.length > 0) {
      for (const quota of freshProject.quotas) {
        if (!quota.questionId) continue;
        // Encontrar a pergunta pela ID
        const question = freshProject.formQuestions?.find((q: any) => q.id === quota.questionId);
        if (!question) continue;
        // Obter resposta pelo variableCode da pergunta
        const answer = answers[question.variableCode];
        if (answer === undefined || answer === null) continue;

        const mapping = quota.mappings?.find((m: any) => String(m.code) === String(answer));
        if (mapping && mapping.groupId) {
          const group = quota.groups?.find((g: any) => g.id === mapping.groupId);
          if (group) {
            quotaGroup = group.name;
            // Verificar se a cota atingiu a meta
            const currentCount = freshProject.responses?.filter((r: any) => r.quotaGroup === group.name).length || 0;
            if (group.target > 0 && currentCount >= group.target) {
              setBlocked('quota');
              setSubmitting(false);
              return;
            }
          }
        }
      }
    }

    const finalAnswers = { ...answers };
    Object.keys(verbatims).forEach(key => { finalAnswers[`${key}_verbatim`] = verbatims[key]; });
    addResponse(project.id, { answers: finalAnswers, quotaGroup, timeSpentSeconds });
    localStorage.setItem(`survey_submitted_${project.id}`, 'true');
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 800);
  };

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
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
        <CheckCircle2 className="h-20 w-20 text-[#1D9E75] mx-auto" />
      </motion.div>
      <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4 mt-6">Obrigado!</h1>
      <p className="text-xl text-[#2D1E6B]/80 mb-2">Suas respostas foram registradas com sucesso.</p>
      <p className="text-[#64748B] max-w-md">Sua participação ajuda a Clarifyse a entregar insights ainda mais precisos.</p>
      <Button onClick={() => navigate('/')} className="mt-8 bg-[#2D1E6B] text-white px-8 h-12 rounded-xl">Voltar ao início</Button>
    </div>
  );

  if (blocked === 'quota') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <h1 className="font-display text-3xl font-bold text-[#2D1E6B] mb-4">Obrigado pela participação!</h1>
      <p className="text-xl text-[#2D1E6B]/80 mb-4">A cota para o seu perfil já foi completada.</p>
      <p className="text-[#64748B] max-w-md">Sua opinião é muito importante para nós.</p>
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
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Aguarde a publicação</h1>
        <p className="text-[#64748B] mb-8">Este formulário ainda não foi publicado. Aguarde o pesquisador liberar a pesquisa.</p>
        <Button onClick={() => navigate('/login')} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Voltar</Button>
      </div>
    </div>
  );

  if (blocked === 'closed') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F1EFE8] p-8 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <CheckCircle2 className="h-16 w-16 text-[#64748B] mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-[#2D1E6B] mb-4">Pesquisa Encerrada</h1>
        <p className="text-[#64748B] mb-8">Esta pesquisa foi encerrada. Obrigado pela participação!</p>
        <Button onClick={() => navigate('/login')} className="w-full bg-[#2D1E6B] text-white h-12 rounded-xl">Voltar</Button>
      </div>
    </div>
  );

  const currentQuestion = currentQuestionIndex === -1 ? null : project.formQuestions[currentQuestionIndex];
  const progress = project.formQuestions.length > 0
    ? Math.round(((currentQuestionIndex + 1) / project.formQuestions.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-[#1D9E75]/20">
      <header className="h-16 px-6 flex items-center justify-between border-b border-gray-100 fixed top-0 w-full bg-white z-50">
        <img src={logo} alt="Clarifyse" className="h-6 object-contain" />
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="flex justify-between text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">
            <span>Pergunta {currentQuestionIndex + 1} de {project.formQuestions.length}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1 bg-gray-100" />
        </div>
        <button className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1" onClick={() => navigate('/login')}>
          <span className="text-xs font-bold uppercase tracking-widest">Sair</span>
          <X className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 mt-16 mb-20 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {currentQuestionIndex === -1 ? (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl text-center space-y-6">
              <p className="text-[#1D9E75] text-xs font-bold tracking-[0.3em] uppercase">PESQUISA DE MERCADO</p>
              <h1 className="font-display text-5xl font-bold text-[#2D1E6B] leading-tight">{project.name}</h1>
              <p className="text-xl text-[#64748B] leading-relaxed">{project.objective}</p>
              <div className="pt-8">
                <Button onClick={handleNext} className="h-14 px-10 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white font-bold text-lg rounded-xl shadow-lg hover:opacity-90 transition-all">
                  Começar Pesquisa
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={currentQuestion?.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }} className="w-full max-w-3xl space-y-10">
              <div className="space-y-4 text-center">
                {currentQuestion?.required && <span className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">OBRIGATÓRIA</span>}
                <h2 className="font-display text-3xl md:text-4xl font-bold text-[#2D1E6B] leading-snug">{currentQuestion?.question}</h2>
                {currentQuestion?.helpText && <p className="text-[#64748B] text-sm">{currentQuestion.helpText}</p>}
              </div>
              <div className="space-y-6">
                {renderQuestionInput(
                  currentQuestion,
                  answers,
                  (val) => setAnswers(prev => ({ ...prev, [currentQuestion!.variableCode]: val })),
                  verbatims,
                  (val) => setVerbatims(prev => ({ ...prev, [currentQuestion!.variableCode]: val }))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-20 px-6 flex items-center justify-between border-t border-gray-100 fixed bottom-0 w-full bg-white z-50">
        <div className="w-1/3">
          {currentQuestionIndex > -1 && (
            <Button variant="ghost" onClick={handleBack} className="text-[#64748B] font-semibold flex items-center gap-2 hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
          )}
        </div>
        <div className="w-1/3 flex flex-col items-center text-center hidden md:flex">
          <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-medium">Suas respostas são anônimas e confidenciais</p>
        </div>
        <div className="w-1/3 flex justify-end">
          <Button onClick={handleNext} disabled={submitting} className="h-12 px-8 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white font-bold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <>{currentQuestionIndex === project.formQuestions.length - 1 ? 'Finalizar' : 'Próxima'} <ChevronRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </footer>
    </div>
  );
}

// ─── Componente de Upload (precisa de hooks, então é um componente separado) ─
function UploadInput({ currentVal, onChange }: { currentVal: any; onChange: (v: any) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onChange(file.name); toast.success(`Arquivo "${file.name}" selecionado.`); }
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <div onClick={() => fileRef.current?.click()} className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${currentVal ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-gray-200 hover:border-[#1D9E75]/40 bg-[#F1EFE8]'}`}>
        <Upload className={`h-10 w-10 ${currentVal ? 'text-[#1D9E75]' : 'text-gray-300'}`} />
        <p className="text-sm font-bold text-[#2D1E6B]">{currentVal ? `✓ ${currentVal}` : 'Clique para selecionar um arquivo'}</p>
        <p className="text-xs text-[#64748B]">PDF, JPG, PNG, XLSX — máx. 10MB</p>
      </div>
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

// ─── Renderizador de perguntas ──────────────────────────────────────────────
function renderQuestionInput(
  question: any,
  answers: any,
  onChange: (val: any) => void,
  verbatims: any,
  onVerbatimChange: (val: string) => void
) {
  if (!question) return null;
  const currentVal = answers[question.variableCode];

  switch (question.type) {
    case 'single':
    case 'radio':
      return (
        <div className="grid grid-cols-1 gap-3">
          {(question.options || []).map((opt: any) => (
            <button key={opt.id} onClick={() => onChange(opt.code || opt.text)}
              className={`p-5 rounded-xl border-2 text-left transition-all duration-200 group ${String(currentVal) === String(opt.code || opt.text) ? 'border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75] font-bold' : 'border-gray-100 hover:border-[#1D9E75]/30 text-[#2D1E6B]'}`}>
              <div className="flex items-center justify-between">
                <span>{opt.text}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${String(currentVal) === String(opt.code || opt.text) ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-200'}`}>
                  {String(currentVal) === String(opt.code || opt.text) && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      );

    case 'multiple':
    case 'checkbox': {
      const currentArray = Array.isArray(currentVal) ? currentVal : [];
      const toggle = (val: any) => {
        if (currentArray.includes(val)) onChange(currentArray.filter((v: any) => v !== val));
        else onChange([...currentArray, val]);
      };
      return (
        <div className="grid grid-cols-1 gap-3">
          {(question.options || []).map((opt: any) => (
            <button key={opt.id} onClick={() => toggle(opt.code || opt.text)}
              className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${currentArray.includes(opt.code || opt.text) ? 'border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75] font-bold' : 'border-gray-100 hover:border-[#1D9E75]/30 text-[#2D1E6B]'}`}>
              <div className="flex items-center justify-between">
                <span>{opt.text}</span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${currentArray.includes(opt.code || opt.text) ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-gray-200'}`}>
                  {currentArray.includes(opt.code || opt.text) && <div className="w-2 h-2 bg-white" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    case 'likert':
    case 'nps':
    case 'rating': {
      const isNps = question.type === 'nps';
      const isRating = question.type === 'rating';
      const max = isNps ? 10 : (question.scale || 5);
      const min = isNps ? 0 : 1;
      const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {values.map((val) => {
              const isSelected = String(currentVal) === String(val);
              return (
                <button key={val} onClick={() => onChange(val)}
                  className={`w-12 h-12 rounded-xl font-bold text-base transition-all duration-200 ${isSelected ? 'bg-[#1D9E75] text-white shadow-lg shadow-[#1D9E75]/30 scale-110' : 'bg-[#F1EFE8] text-[#2D1E6B] hover:bg-[#1D9E75]/10 hover:scale-105'}`}>
                  {isRating ? <Star className={`h-5 w-5 mx-auto ${isSelected ? 'fill-white' : ''}`} /> : val}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-[#64748B] uppercase tracking-widest px-4">
            <span>{isNps ? 'Nada provável' : 'Discordo totalmente'}</span>
            <span>{isNps ? 'Extremamente provável' : 'Concordo totalmente'}</span>
          </div>
          {isNps && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4">
              <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">Por que você deu essa nota?</Label>
              <textarea value={verbatims[question.variableCode] || ''} onChange={(e) => onVerbatimChange(e.target.value)}
                placeholder="Conte-nos um pouco mais sobre sua experiência..."
                className="w-full h-24 p-4 rounded-xl border-2 border-gray-100 focus:border-[#1D9E75] focus:ring-0 outline-none transition-all resize-none text-[#2D1E6B]" />
            </motion.div>
          )}
        </div>
      );
    }

    case 'ranking': {
      const opts: any[] = question.options || [];
      const ranked: string[] = Array.isArray(currentVal) ? currentVal : opts.map((o: any) => o.code || o.text);
      const moveUp = (idx: number) => {
        if (idx === 0) return;
        const next = [...ranked]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; onChange(next);
      };
      const moveDown = (idx: number) => {
        if (idx === ranked.length - 1) return;
        const next = [...ranked]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; onChange(next);
      };
      const getLabel = (code: string) => { const opt = opts.find((o: any) => (o.code || o.text) === code); return opt ? opt.text : code; };
      return (
        <div className="space-y-2">
          <p className="text-xs text-[#64748B] text-center mb-4">Ordene as opções da mais importante (1º) para a menos importante.</p>
          {ranked.map((code, idx) => (
            <div key={code} className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-[#1D9E75]/30 transition-all">
              <span className="w-7 h-7 rounded-full bg-[#2D1E6B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
              <span className="flex-1 font-medium text-[#2D1E6B]">{getLabel(code)}</span>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded hover:bg-[#F1EFE8] disabled:opacity-30 transition-all">
                  <ChevronLeft className="h-4 w-4 text-[#2D1E6B] rotate-90" />
                </button>
                <button onClick={() => moveDown(idx)} disabled={idx === ranked.length - 1} className="p-1 rounded hover:bg-[#F1EFE8] disabled:opacity-30 transition-all">
                  <ChevronRight className="h-4 w-4 text-[#2D1E6B] rotate-90" />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'matrix':
      return <MatrixQuestion question={question} answer={answers} onChange={(newAnswers) => Object.entries(newAnswers).forEach(([key, val]) => onChange(val))} />;

    case 'text':
      return (
        <textarea value={currentVal || ''} onChange={(e) => onChange(e.target.value)}
          placeholder="Digite sua resposta aqui..."
          className="w-full h-40 p-5 rounded-xl border-2 border-gray-100 focus:border-[#1D9E75] focus:ring-0 outline-none transition-all resize-none text-[#2D1E6B] text-lg" />
      );

    case 'number':
      return (
        <Input type="number" value={currentVal || ''} onChange={(e) => onChange(e.target.value)}
          placeholder="0" className="h-16 text-2xl font-bold text-center rounded-xl border-2 border-gray-100 focus:border-[#1D9E75] text-[#2D1E6B]" />
      );

    case 'date':
      return (
        <div className="flex justify-center">
          <input type={question.dateMode === 'month' ? 'month' : 'date'} value={currentVal || ''} onChange={(e) => onChange(e.target.value)}
            className="h-14 px-6 text-xl font-bold rounded-xl border-2 border-gray-100 focus:border-[#1D9E75] outline-none transition-all text-[#2D1E6B] bg-[#F1EFE8]" />
        </div>
      );

    case 'boolean':
      return (
        <div className="grid grid-cols-2 gap-4">
          {['Sim', 'Não'].map((opt) => (
            <button key={opt} onClick={() => onChange(opt)}
              className={`p-6 rounded-xl border-2 font-bold transition-all ${currentVal === opt ? 'border-[#1D9E75] bg-[#1D9E75] text-white' : 'border-gray-100 hover:border-[#1D9E75]/30 text-[#2D1E6B]'}`}>
              {opt}
            </button>
          ))}
        </div>
      );

    case 'upload':
    case 'file_upload':
      return <FileUploadQuestion question={question} answer={answers} onChange={(newAnswers) => { Object.entries(newAnswers).forEach(([key, val]) => { if (key === question.variableCode) onChange(val); }); }} />;

    case 'image_choice':
      return <ImageChoiceQuestion question={question} answer={answers} onChange={(newAnswers) => { Object.entries(newAnswers).forEach(([key, val]) => { if (key === question.variableCode) onChange(val); }); }} />;

    case 'maxdiff':
      return <MaxDiffQuestion question={question} answer={answers} onChange={(newAnswers) => { Object.entries(newAnswers).forEach(([key, val]) => { if (key === question.variableCode) onChange(val); }); }} />;

    case 'maxdiff_old': {
      const opts: any[] = question.options || [];
      const setSize = question.setSize || Math.min(5, opts.length);
      const sets: any[][] = [];
      for (let i = 0; i < opts.length; i += setSize) sets.push(opts.slice(i, i + setSize));
      const totalSets = sets.length;
      const currentSet = (currentVal?.currentSet ?? 0);
      const currentSetItems = sets[currentSet] || [];
      const selections = currentVal?.selections || {};
      const handleMaxDiff = (type: 'best' | 'worst', code: string) => {
        const newSel = { ...selections, [`set${currentSet}_${type}`]: code };
        const hasBoth = newSel[`set${currentSet}_best`] && newSel[`set${currentSet}_worst`];
        const nextSet = hasBoth && currentSet < totalSets - 1 ? currentSet + 1 : currentSet;
        onChange({ currentSet: nextSet, selections: newSel });
      };
      return (
        <div className="space-y-6">
          <div className="flex justify-between text-xs font-bold text-[#64748B] uppercase tracking-widest">
            <span>Conjunto {currentSet + 1} de {totalSets}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            <span className="text-red-500">PIOR</span><span>OPÇÃO</span><span className="text-[#1D9E75]">MELHOR</span>
          </div>
          {currentSetItems.map((opt: any) => {
            const code = opt.code || opt.text;
            const isBest = selections[`set${currentSet}_best`] === code;
            const isWorst = selections[`set${currentSet}_worst`] === code;
            return (
              <div key={opt.id} className="grid grid-cols-3 gap-2 items-center">
                <button onClick={() => handleMaxDiff('worst', code)}
                  className={`h-10 rounded-xl border-2 font-bold transition-all ${isWorst ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-100 hover:border-red-200'}`}>
                  {isWorst ? '✗' : '○'}
                </button>
                <div className="text-center text-sm font-medium text-[#2D1E6B] px-2">{opt.text}</div>
                <button onClick={() => handleMaxDiff('best', code)}
                  className={`h-10 rounded-xl border-2 font-bold transition-all ${isBest ? 'border-[#1D9E75] bg-[#1D9E75]/10 text-[#1D9E75]' : 'border-gray-100 hover:border-[#1D9E75]/30'}`}>
                  {isBest ? '✓' : '○'}
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    case 'cbc':
    case 'conjoint':
      return <ConjointQuestion question={question} answer={answers} onChange={(newAnswers) => { Object.entries(newAnswers).forEach(([key, val]) => { if (key === question.variableCode) onChange(val); }); }} />;

    case 'cbc_old': {
      const concepts: any[] = question.concepts || [];
      const selectedConcept = currentVal?.concept;
      return (
        <div className="space-y-4">
          <p className="text-xs text-[#64748B] text-center">Escolha o conceito que você prefere:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concepts.map((concept: any, idx: number) => {
              const isSelected = selectedConcept === (concept.id || idx);
              return (
                <button key={concept.id || idx} onClick={() => onChange({ concept: concept.id || idx })}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-[#1D9E75] bg-[#1D9E75]/5 shadow-lg' : 'border-gray-100 hover:border-[#1D9E75]/30'}`}>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-3">CONCEITO {idx + 1}</p>
                  {concept.attributes?.map((attr: any, aIdx: number) => (
                    <div key={aIdx} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                      <span className="text-[#64748B]">{attr.name}</span>
                      <span className="font-bold text-[#2D1E6B]">{attr.value}</span>
                    </div>
                  ))}
                  {!concept.attributes && <p className="text-sm text-[#2D1E6B] font-medium">{concept.description || concept.name || `Conceito ${idx + 1}`}</p>}
                </button>
              );
            })}
            <button onClick={() => onChange({ concept: 'none' })}
              className={`p-6 rounded-2xl border-2 text-center transition-all ${selectedConcept === 'none' ? 'border-gray-400 bg-gray-50' : 'border-dashed border-gray-200 hover:border-gray-300'}`}>
              <p className="text-sm font-bold text-[#64748B]">Nenhum destes</p>
            </button>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="p-10 text-center bg-[#F1EFE8] rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-[#64748B] mb-4">A interface para o tipo "{question.type}" está sendo otimizada.</p>
          <Button variant="outline" className="border-[#2D1E6B] text-[#2D1E6B] hover:bg-[#2D1E6B] hover:text-white transition-all" onClick={() => onChange("exemplo")}>
            Simular Resposta para Continuar
          </Button>
        </div>
      );
  }
}
