import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Menu, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MobileResponsiveSurveyProps {
  title: string;
  objective?: string;
  questions: Array<{
    id: string;
    question: string;
    type: string;
    options?: Array<{ id: string; code: string; text: string }>;
    required: boolean;
  }>; 
  onComplete: (answers: Record<string, any>) => void;
}

/**
 * ✅ FIX: Mobile-first survey component
 * - Optimized for small screens
 * - Touch-friendly buttons (min 44x44px)
 * - Full-screen mode on mobile
 */
export function MobileResponsiveSurvey({
  title,
  objective,
  questions,
  onComplete,
}: MobileResponsiveSurveyProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showMenu, setShowMenu] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // ✅ Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        handleNext();
      }
      if (e.key === 'ArrowUp') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, questions.length]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAnswer = (value: any) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  return (
    <div
      className={`flex flex-col ${isMobile ? 'h-screen' : 'min-h-screen'} bg-gradient-to-br from-[#F1EFE8] to-white`}
    >
      {/* Header */}
      <div className={`${isMobile ? 'sticky top-0' : 'relative'} z-40 bg-white/95 backdrop-blur border-b border-gray-200`}> 
        <div className={`${isSmallMobile ? 'px-3 py-3' : 'px-6 py-4'}`}> 
          <div className="flex justify-between items-center mb-3">
            <h1 className={`${isSmallMobile ? 'text-lg' : 'text-2xl'} font-bold text-[#2D1E6B]`}>
              {title}
            </h1>
            {isMobile && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {showMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>
                Pergunta {currentIndex + 1} de {questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex items-center justify-center ${isMobile ? 'p-3' : 'p-8'} overflow-auto`}> 
        <div className="w-full max-w-2xl"> 
          <AnimatePresence mode="wait"> 
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Question */}
              <div>
                <h2 className={`${isSmallMobile ? 'text-xl' : 'text-3xl'} font-bold text-[#2D1E6B] leading-tight`}> 
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-2"> 
                {currentQuestion.options?.map(option => (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option.code)}
                    className={`w-full p-4 md:p-5 rounded-xl border-2 transition text-left font-medium min-h-11 ${
                      answers[currentQuestion.id] === option.code
                        ? 'border-[#2D1E6B] bg-[#2D1E6B] text-white'
                        : 'border-gray-300 bg-white text-[#2D1E6B] active:bg-gray-100'
                    }`}
                  >
                    {option.text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className={`sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur ${isSmallMobile ? 'p-2' : 'p-4'}`}> 
        <div className="flex gap-2 max-w-2xl mx-auto"> 
          <Button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            variant="outline"
            size="sm"
            className="px-2 md:px-4 py-3 md:py-6 h-12 md:h-14 min-h-11"
          >
            <ChevronUp className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          <Button
            onClick={handleNext}
            size="sm"
            className="flex-1 bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white py-3 md:py-6 h-12 md:h-14 min-h-11 text-base md:text-lg font-semibold"
          >
            {currentIndex === questions.length - 1 ? 'Enviar' : 'Próximo'}
            <ChevronDown className="h-5 w-5 md:h-6 md:w-6 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}