import React, { memo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaxDiffQuestionProps {
  question: any;
  answer: any;
  onChange: (value: any) => void;
}

export const MaxDiffQuestion = memo(({ question, answer, onChange }: MaxDiffQuestionProps) => {
  const sets = question.sets || [];
  const items = question.items || [];
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [bestSelected, setBestSelected] = useState<string | null>(null);
  const [worstSelected, setWorstSelected] = useState<string | null>(null);

  if (sets.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-center">
        <p className="text-sm font-bold text-yellow-800">Nenhum conjunto gerado. Configure os itens e gere os conjuntos.</p>
      </div>
    );
  }

  const currentSet = sets[currentSetIndex];
  const setAnswerKey = `${question.variableCode}_set_${currentSetIndex}`;
  const setAnswer = answer[setAnswerKey];

  const handleSelectBest = (itemId: string) => {
    setBestSelected(itemId);
  };

  const handleSelectWorst = (itemId: string) => {
    setWorstSelected(itemId);
  };

  const handleConfirmSet = () => {
    if (bestSelected && worstSelected && bestSelected !== worstSelected) {
      onChange({
        ...answer,
        [setAnswerKey]: { best: bestSelected, worst: worstSelected },
      });
      setBestSelected(null);
      setWorstSelected(null);
      if (currentSetIndex < sets.length - 1) {
        setCurrentSetIndex(currentSetIndex + 1);
      }
    }
  };

  const setItems = currentSet.items || [];
  const setItemObjects = setItems.map((itemId: string) => items.find((i: any) => i.id === itemId)).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs font-bold text-[#1D9E75] uppercase tracking-widest">
        <span>Conjunto {currentSetIndex + 1} de {sets.length}</span>
        <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] transition-all"
            style={{ width: `${((currentSetIndex + 1) / sets.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-[#F1EFE8] p-4 rounded-xl text-center">
        <p className="text-sm font-bold text-[#2D1E6B]">
          Selecione o item MAIS importante e o MENOS importante
        </p>
      </div>

      <div className="space-y-3">
        {setItemObjects.map((item: any) => {
          const isBest = bestSelected === item.id;
          const isWorst = worstSelected === item.id;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-2xl hover:border-[#2D1E6B] transition-all"
            >
              <span className="font-medium text-[#2D1E6B] flex-1">{item.label}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectBest(item.id)}
                  className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                    isBest
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isBest ? '✓ Melhor' : 'Melhor'}
                </button>
                <button
                  onClick={() => handleSelectWorst(item.id)}
                  className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                    isWorst
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {isWorst ? '✓ Pior' : 'Pior'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentSetIndex(Math.max(0, currentSetIndex - 1))}
          disabled={currentSetIndex === 0}
          className="rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <span className="text-xs font-bold text-[#64748B]">
          {currentSetIndex + 1} / {sets.length}
        </span>
        <Button
          onClick={handleConfirmSet}
          disabled={!bestSelected || !worstSelected || bestSelected === worstSelected}
          className="flex-1 bg-[#1D9E75] text-white rounded-xl font-bold"
        >
          {currentSetIndex === sets.length - 1 ? 'Concluir' : 'Próximo'}
          {currentSetIndex < sets.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
});

MaxDiffQuestion.displayName = 'MaxDiffQuestion';
