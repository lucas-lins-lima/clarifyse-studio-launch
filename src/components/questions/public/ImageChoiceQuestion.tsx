import React, { memo } from 'react';
import { Check } from 'lucide-react';

interface ImageChoiceQuestionProps {
  question: any;
  answer: any;
  onChange: (value: any) => void;
}

export const ImageChoiceQuestion = memo(({ question, answer, onChange }: ImageChoiceQuestionProps) => {
  const options = question.options || [];
  const responseType = question.responseType || 'single';
  const columns = Math.min(question.columns || 3, 3);
  const selectedAnswers = answer[question.variableCode];

  const handleSelect = (optionId: string) => {
    if (responseType === 'single') {
      onChange({ ...answer, [question.variableCode]: optionId });
    } else {
      const current = Array.isArray(selectedAnswers) ? selectedAnswers : [];
      if (current.includes(optionId)) {
        onChange({ ...answer, [question.variableCode]: current.filter((id: string) => id !== optionId) });
      } else {
        onChange({ ...answer, [question.variableCode]: [...current, optionId] });
      }
    }
  };

  const isSelected = (optionId: string) => {
    if (responseType === 'single') {
      return selectedAnswers === optionId;
    }
    return Array.isArray(selectedAnswers) && selectedAnswers.includes(optionId);
  };

  const gridColsClass = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={`grid gap-4 ${gridColsClass}`}>
      {options.map((option: any) => (
        <div
          key={option.id}
          onClick={() => handleSelect(option.id)}
          className={`relative cursor-pointer rounded-2xl overflow-hidden border-4 transition-all ${
            isSelected(option.id)
              ? 'border-[#2D1E6B] shadow-lg shadow-purple-900/20'
              : 'border-gray-200 hover:border-[#2D1E6B]/50'
          }`}
        >
          {/* Imagem */}
          {option.imageUrl ? (
            <img
              src={option.imageUrl}
              alt={option.label}
              className="w-full aspect-square object-cover"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-xs text-gray-400">Sem imagem</p>
              </div>
            </div>
          )}

          {/* Overlay e checkbox */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all" />
          {isSelected(option.id) && (
            <div className="absolute inset-0 bg-[#2D1E6B]/20 flex items-center justify-center">
              <div className="bg-[#2D1E6B] rounded-full p-2">
                <Check className="h-6 w-6 text-white" />
              </div>
            </div>
          )}

          {/* Label */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white font-bold text-sm text-center">{option.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

ImageChoiceQuestion.displayName = 'ImageChoiceQuestion';
