import React, { memo, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadQuestionProps {
  question: any;
  answer: any;
  onChange: (value: any) => void;
}

export const FileUploadQuestion = memo(({ question, answer, onChange }: FileUploadQuestionProps) => {
  const [uploading, setUploading] = useState(false);
  const maxSizeMB = question.maxSizeMB || 5;
  const acceptedTypes = question.acceptedTypes || 'image/jpeg, image/png';
  const fileData = answer[question.variableCode];

  const handleFileSelect = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    if (acceptedTypes !== '*' && !acceptedTypes.split(',').some(type => {
      const trimmed = type.trim();
      if (trimmed.startsWith('.')) {
        return file.name.endsWith(trimmed);
      }
      return file.type === trimmed || file.type.startsWith(trimmed.split('/')[0]);
    })) {
      toast.error('Tipo de arquivo não aceito');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange({
        ...answer,
        [question.variableCode]: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: base64,
        },
      });
      setUploading(false);
      toast.success('Arquivo enviado com sucesso');
    };
    reader.onerror = () => {
      setUploading(false);
      toast.error('Erro ao ler arquivo');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {fileData ? (
        <div className="border-2 border-green-200 bg-green-50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {fileData.fileType?.startsWith('image/') ? (
                <img
                  src={fileData.fileData}
                  alt={fileData.fileName}
                  className="w-16 h-16 object-cover rounded-lg border border-green-300"
                />
              ) : (
                <div className="w-16 h-16 bg-green-200 rounded-lg flex items-center justify-center">
                  <Upload className="h-8 w-8 text-green-700" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#2D1E6B] truncate">{fileData.fileName}</p>
                <p className="text-xs text-[#64748B]">{(fileData.fileSize / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={() => onChange({ ...answer, [question.variableCode]: null })}
              className="ml-2 p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-red-600" />
            </button>
          </div>
        </div>
      ) : (
        <label className="block">
          <input
            type="file"
            accept={acceptedTypes === '*' ? undefined : acceptedTypes}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            disabled={uploading}
            className="hidden"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#2D1E6B] hover:bg-[#F1EFE8] transition-all">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold text-[#2D1E6B] mb-1">Clique para enviar arquivo</p>
            <p className="text-xs text-[#64748B]">
              Máximo {maxSizeMB}MB • {acceptedTypes === '*' ? 'Qualquer tipo' : 'Formatos aceitos'}
            </p>
            {uploading && <p className="text-xs text-[#1D9E75] font-bold mt-2">Enviando...</p>}
          </div>
        </label>
      )}
    </div>
  );
});

FileUploadQuestion.displayName = 'FileUploadQuestion';
