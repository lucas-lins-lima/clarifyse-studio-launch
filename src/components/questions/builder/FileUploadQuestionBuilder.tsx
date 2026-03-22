import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FileUploadQuestionBuilderProps {
  question: any;
  onUpdate: (updates: any) => void;
  isLocked: boolean;
}

const FILE_TYPE_PRESETS = [
  { label: 'Imagens (JPG, PNG)', value: 'image/jpeg, image/png' },
  { label: 'PDF', value: 'application/pdf' },
  { label: 'Documentos (Word, Excel)', value: '.doc, .docx, .xls, .xlsx' },
  { label: 'Todos os arquivos', value: '*' },
];

export const FileUploadQuestionBuilder: React.FC<FileUploadQuestionBuilderProps> = ({ question, onUpdate, isLocked }) => {
  const acceptedTypes = question.acceptedTypes || 'image/jpeg, image/png';
  const maxSizeMB = question.maxSizeMB || 5;

  return (
    <div className="space-y-4">
      {/* Tipos de arquivo aceitos */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-[#64748B]">TIPOS DE ARQUIVO ACEITOS</Label>
        <Select 
          value={acceptedTypes} 
          onValueChange={(v) => onUpdate({ acceptedTypes: v })}
          disabled={isLocked}
        >
          <SelectTrigger className="h-10 rounded-lg border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {FILE_TYPE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-[#64748B] mt-1">
          Valor: <code className="font-mono text-[10px] bg-gray-50 px-2 py-1 rounded">{acceptedTypes}</code>
        </p>
      </div>

      {/* Tamanho máximo */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-[#64748B]">TAMANHO MÁXIMO (MB)</Label>
        <Input
          type="number"
          min="1"
          max="100"
          value={maxSizeMB}
          onChange={(e) => onUpdate({ maxSizeMB: parseInt(e.target.value) || 5 })}
          className="h-10 rounded-lg border-gray-200"
          disabled={isLocked}
        />
        <p className="text-xs text-[#64748B]">Máximo recomendado: 50 MB</p>
      </div>
    </div>
  );
};
