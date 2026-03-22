import React, { memo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConjointQuestionProps {
  question: any;
  answer: any;
  onChange: (value: any) => void;
}

export const ConjointQuestion = memo(({ question, answer, onChange }: ConjointQuestionProps) => {
  const tasks = question.tasks || [];
  const attributes = question.attributes || [];
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  if (tasks.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-center">
        <p className="text-sm font-bold text-yellow-800">Nenhuma tarefa gerada. Configure os atributos e gere as tarefas.</p>
      </div>
    );
  }

  const currentTask = tasks[currentTaskIndex];
  const taskAnswerKey = `${question.variableCode}_task_${currentTaskIndex}`;
  const selectedOption = answer[taskAnswerKey];

  const handleSelectOption = (optionIndex: number) => {
    onChange({
      ...answer,
      [taskAnswerKey]: optionIndex,
    });
    if (currentTaskIndex < tasks.length - 1) {
      setTimeout(() => setCurrentTaskIndex(currentTaskIndex + 1), 300);
    }
  };

  const renderOption = (optionIndex: number) => {
    const option = currentTask.options?.[optionIndex];
    if (!option) return null;

    const attrId = option.attrId;
    const levelId = option.levelId;
    const attr = attributes.find((a: any) => a.id === attrId);
    const level = attr?.levels?.find((l: any) => l.id === levelId);

    return (
      <div
        key={optionIndex}
        onClick={() => handleSelectOption(optionIndex)}
        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
          selectedOption === optionIndex
            ? 'border-[#2D1E6B] bg-[#2D1E6B] text-white'
            : 'border-gray-200 bg-white hover:border-[#2D1E6B]'
        }`}
      >
        <p className="font-bold text-lg mb-3">Opção {optionIndex + 1}</p>
        <div className="space-y-2">
          {attributes.map((attr: any) => {
            const attrOption = currentTask.options?.[optionIndex];
            if (attrOption?.attrId !== attr.id) return null;
            const attrLevel = attr.levels?.find((l: any) => l.id === attrOption.levelId);
            return (
              <div key={attr.id} className="text-sm">
                <p className={`font-bold ${selectedOption === optionIndex ? 'text-white' : 'text-[#64748B]'}`}>
                  {attr.name}:
                </p>
                <p className={`text-xs ${selectedOption === optionIndex ? 'text-white/80' : 'text-[#2D1E6B]'}`}>
                  {attrLevel?.label || 'N/A'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs font-bold text-[#1D9E75] uppercase tracking-widest">
        <span>Tarefa {currentTaskIndex + 1} de {tasks.length}</span>
        <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] transition-all"
            style={{ width: `${((currentTaskIndex + 1) / tasks.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => renderOption(i))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentTaskIndex(Math.max(0, currentTaskIndex - 1))}
          disabled={currentTaskIndex === 0}
          className="rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <span className="text-xs font-bold text-[#64748B]">
          {currentTaskIndex + 1} / {tasks.length}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentTaskIndex(Math.min(tasks.length - 1, currentTaskIndex + 1))}
          disabled={currentTaskIndex === tasks.length - 1}
          className="rounded-xl"
        >
          Próxima <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
});

ConjointQuestion.displayName = 'ConjointQuestion';
