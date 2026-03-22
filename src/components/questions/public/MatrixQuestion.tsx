import React, { memo } from 'react';

interface MatrixQuestionProps {
  question: any;
  answer: any;
  onChange: (value: any) => void;
}

export const MatrixQuestion = memo(({ question, answer, onChange }: MatrixQuestionProps) => {
  const rows = question.rows || [];
  const columns = question.columns || [];
  const responseType = question.responseType || 'radio';

  const handleChange = (rowCode: string, colValue: number) => {
    const key = `${question.variableCode}_${rowCode}`;
    if (responseType === 'radio') {
      onChange({ ...answer, [key]: colValue });
    } else {
      const current = answer[key] || [];
      if (Array.isArray(current) && current.includes(colValue)) {
        onChange({ ...answer, [key]: current.filter((v: number) => v !== colValue) });
      } else {
        onChange({ ...answer, [key]: [...(current || []), colValue] });
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left p-3 font-bold text-[#2D1E6B]">Atributo</th>
            {columns.map((col: any) => (
              <th key={col.id} className="text-center p-3 font-bold text-[#2D1E6B] text-xs">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any) => {
            const rowKey = `${question.variableCode}_${row.code}`;
            const rowAnswer = answer[rowKey];
            return (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-[#F1EFE8]/50">
                <td className="p-3 font-medium text-[#2D1E6B]">{row.label}</td>
                {columns.map((col: any) => (
                  <td key={col.id} className="text-center p-3">
                    {responseType === 'radio' ? (
                      <input
                        type="radio"
                        name={rowKey}
                        value={col.value}
                        checked={rowAnswer === col.value}
                        onChange={() => handleChange(row.code, col.value)}
                        className="w-5 h-5 cursor-pointer accent-[#2D1E6B]"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={Array.isArray(rowAnswer) && rowAnswer.includes(col.value)}
                        onChange={() => handleChange(row.code, col.value)}
                        className="w-5 h-5 cursor-pointer accent-[#2D1E6B]"
                      />
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

MatrixQuestion.displayName = 'MatrixQuestion';
