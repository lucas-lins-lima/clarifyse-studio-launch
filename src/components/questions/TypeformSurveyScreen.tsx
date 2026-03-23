import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text' | 'nps' | 'matrix' | 'scale';
  required: boolean;
  options?: { id: string; code: string; text: string }[];
  helpText?: string;
}

interface TypeformSurveyScreenProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * ✅ FIX: Typeform-style full-screen survey interface
 * - One question per screen
 * - Smooth animations
 * - Progress bar
 * - Keyboard navigation
 */
export function TypeformSurveyScreen({
  questions,
  currentIndex,
  answers,
  onAnswerChange,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
}: TypeformSurveyScreenProps) {
  const [isAnswered, setIsAnswered] = useState(false);
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // ✅ Check if current question is answered
  useEffect(() => {
    if (!currentQuestion) {
      setIsAnswered(true);
      return;
    }

    const answer = answers[currentQuestion.id];
    const answered =
      answer !== undefined &&
      answer !== null &&
      answer !== '' &&
      (!Array.isArray(answer) || answer.length > 0);

    setIsAnswered(answered || !currentQuestion.required);
  }, [currentQuestion, answers]);

  // ✅ Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isAnswered && !isSubmitting) {
        if (currentIndex === questions.length - 1) {
          onSubmit();
        } else {
          onNext();
        }
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onBack();
      }
      if (e.key === 'ArrowRight' && isAnswered && !isSubmitting) {
        if (currentIndex === questions.length - 1) {
          onSubmit();
        } else {
          onNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isAnswered, isSubmitting, questions.length, onNext, onBack, onSubmit]);

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1EFE8] via-white to-[#E8E4D8] flex flex-col">
      {/* ✅ Progress bar */}
      <div className="w-full px-4 pt-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Pergunta {currentIndex + 1} de {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className="h-1 bg-gray-200"
          />
        </div>
      </div>

      {/* ✅ Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Question text */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#2D1E6B] leading-tight">
                  {currentQuestion.question}
                </h1>
                {currentQuestion.helpText && (
                  <p className="mt-4 text-lg text-gray-600">
                    {currentQuestion.helpText}
                  </p>
                )}
              </div>

              {/* Question-specific UI */}
              <div>
                {currentQuestion.type === 'single' && (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option) => (
                      <motion.button
                        key={option.id}
                        whileHover={{ x: 8 }}
                        onClick={() => onAnswerChange(currentQuestion.id, option.code)}
                        className={`w-full text-left px-6 py-4 rounded-xl border-2 transition font-medium text-lg ${
                          answers[currentQuestion.id] === option.code
                            ? 'border-[#2D1E6B] bg-[#2D1E6B] text-white'
                            : 'border-gray-300 bg-white text-[#2D1E6B] hover:border-[#2D1E6B]'
                        }`}
                      >
                        {option.text}
                      </motion.button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'multiple' && (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option) => (
                      <motion.button
                        key={option.id}
                        whileHover={{ x: 8 }}
                        onClick={() => {
                          const current = answers[currentQuestion.id] || [];
                          const updated = current.includes(option.code)
                            ? current.filter((v: string) => v !== option.code)
                            : [...current, option.code];
                          onAnswerChange(currentQuestion.id, updated);
                        }}
                        className={`w-full text-left px-6 py-4 rounded-xl border-2 transition font-medium text-lg ${
                          (answers[currentQuestion.id] || []).includes(option.code)
                            ? 'border-[#2D1E6B] bg-[#2D1E6B] text-white'
                            : 'border-gray-300 bg-white text-[#2D1E6B] hover:border-[#2D1E6B]'
                        }`}
                      >
                        {option.text}
                      </motion.button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'text' && (
                  <input
                    autoFocus
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => onAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#2D1E6B] focus:ring-0"
                  />
                )}

                {currentQuestion.type === 'nps' && (
                  <div className="flex gap-3 flex-wrap justify-start">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => onAnswerChange(currentQuestion.id, i)}
                        className={`w-14 h-14 rounded-xl font-bold text-lg transition ${
                          answers[currentQuestion.id] === i
                            ? 'bg-[#2D1E6B] text-white scale-110'
                            : 'bg-gray-100 text-[#2D1E6B] hover:bg-gray-200'
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'scale' && (
                  <div className="flex gap-2 justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => onAnswerChange(currentQuestion.id, i + 1)}
                        className={`px-6 py-3 rounded-lg font-medium transition ${
                          answers[currentQuestion.id] === i + 1
                            ? 'bg-[#2D1E6B] text-white'
                            : 'bg-gray-100 text-[#2D1E6B] hover:bg-gray-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ✅ Bottom navigation */}
      <div className="border-t border-gray-200 bg-white/50 backdrop-blur-md px-4 py-6">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <Button
            onClick={
              currentIndex === questions.length - 1 ? onSubmit : onNext
            }
            disabled={!isAnswered || isSubmitting}
            className="flex-1 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin">⟳</div>
                Enviando...
              </>
            ) : currentIndex === questions.length - 1 ? (
              'Enviar'
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}